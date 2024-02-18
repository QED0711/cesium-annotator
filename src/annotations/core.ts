import * as Cesium from 'cesium';
import { nanoid } from 'nanoid';
import { CoordinateInit, DistanceUnit, AnnotationBaseInit, AnnotationType, AnnotationEntity } from '../utils/types';
import { Registry } from './registry';
import { ViewerInterface } from './viewerInterface';


/* 
    POINT CLASS
*/
export class Coordinate {
    lng: number;
    lat: number;
    alt?: number;

    constructor(init: CoordinateInit) {
        this.lng = init.lng;
        this.lat = init.lat;
        this.alt = init.alt ?? 0.0;
    }

    static fromDegrees(lng: number, lat: number, alt?: number): Coordinate {
        return new this({ lng, lat, alt });
    }

    static cloneCoordinateArray(coordinates: Coordinate[]): Coordinate[] {
        return coordinates.map(c => c.clone());
    }

    clone(): Coordinate {
        return new Coordinate({ lng: this.lng, lat: this.lat, alt: this.alt });
    }

    toCartesian3(): Cesium.Cartesian3 {
        return Cesium.Cartesian3.fromDegrees(this.lng, this.lat, this.alt);
    }

    distanceTo(point2: Coordinate, unit?: DistanceUnit): number {
        unit ??= DistanceUnit.METERS;
        const p1Cartesian: Cesium.Cartesian3 = this.toCartesian3();
        const p2Cartesian: Cesium.Cartesian3 = point2.toCartesian3();

        const distance = Cesium.Cartesian3.distance(p1Cartesian, p2Cartesian);

        switch (unit) {
            case DistanceUnit.METERS:
                return distance;
            case DistanceUnit.KILOMETERS:
                return distance / 1000;
            case DistanceUnit.FEET:
                return distance * 3.281;
            case DistanceUnit.MILES:
                return distance / 1609;
        }
    }


}


/* 
    ANNOTATION BASE CLASS
*/
export class Annotation {
    protected registry: Registry;
    protected viewerInterface: ViewerInterface;
    protected annotationType: AnnotationType;

    id: string;
    points: Coordinate[];

    isStatic: boolean;
    entity: AnnotationEntity | null;
    handles: AnnotationEntity[];
    isActive: boolean;

    protected undoHistory: Coordinate[][];
    protected redoHistory: Coordinate[][];
    protected handleIdxFound: number | null;

    protected pointerDownDetected: boolean;
    protected dragDetected: boolean;
    protected preDragHistoricalRecord: Coordinate[] | null;

    protected events: { [eventName: string]: ((payload: { [key: string]: any }) => void)[] };

    constructor(registry: Registry, init: AnnotationBaseInit) {

        this.registry = registry;
        this.viewerInterface = registry.viewerInterface;
        this.id = init.id ?? nanoid();
        this.annotationType = AnnotationType.BASE;
        this.points = [];
        this.undoHistory = [];
        this.redoHistory = [];
        this.isStatic = init.static ?? true;

        this.entity = null;
        this.handles = [];

        this.isActive = false;
        this.handleIdxFound = null;
        this.pointerDownDetected = false
        this.dragDetected = false
        this.preDragHistoricalRecord = null

        this.events = {};
    }

    get current() {
        return this.points;
    }

    on(eventName: string, callback: (payload: { [key: string]: any }) => void) {
        if (eventName in this.events) {
            this.events.eventName.push(callback);
        } else {
            this.events[eventName] = [callback];
        }
    }

    emit(eventName: string, payload: { [key: string]: any }) {
        if (!(eventName in this.events)) return;
        for (let handler of this.events[eventName]) {
            handler(payload);
        }
    }

    activate() {
        this.isActive = true;

        this.viewerInterface.registerListener("pointerdown", this.handlePointerDown, this);
        this.viewerInterface.registerListener("pointermove", this.handlePointerMove, this);
        this.viewerInterface.registerListener("pointerup", this.handlePointerUp, this);

        this.emit("activate", { annotation: this });
    }

    deactivate() {
        this.isActive = false;
        this.viewerInterface.unregisterListenersByAnnotationID(this.id);
        this.emit("deactivate", { annotation: this });
    }

    delete() {
        this.deactivate();
        this.removeEntity();
        this.emit("delete", { annotation: this });
    }

    removeEntity() {
        if (!!this.entity) {
            this.viewerInterface.viewer.entities.remove(this.entity)
        }
        this.emit("removeEntity", { annotation: this });
    }

    handlePointerDown(e: PointerEvent) {
        this.dragDetected = false; // reset drag detection whenever user initiates a new click event cycle
        this.pointerDownDetected = true;
        const existingEntity = this.viewerInterface.queryEntityAtPixel();

        if (existingEntity?._handleIdx !== undefined) {
            this.handleIdxFound = existingEntity._handleIdx;
            this.viewerInterface.lock();
            this.preDragHistoricalRecord = Coordinate.cloneCoordinateArray(this.points);
        }
    }

    handlePointerMove(e: PointerEvent) {
        if (this.pointerDownDetected) {
            // update the specified point as it is dragged
            if(this.handleIdxFound !== null) {
                const coordinate = this.viewerInterface.getCoordinateAtPixel(e.offsetX, e.offsetY);
                if(coordinate) this.points[this.handleIdxFound] = coordinate;
            }
            this.dragDetected = true;
        }
    }

    handlePointerUp(e: PointerEvent) {

        this.viewerInterface.unlock();
        this.pointerDownDetected = false;

        if (this.handleIdxFound !== null) {
            // TODO: when pointer comes up on a handle should update the current points and register a history record
            const coordinate = this.viewerInterface.getCoordinateAtPixel();
            if(coordinate) this.points[this.handleIdxFound] = coordinate; // update an existing point
            if(this.preDragHistoricalRecord) this.manualAppendToUndoHistory(this.preDragHistoricalRecord); // record state prior to handle drag into undo history
            this.draw();
            this.handleIdxFound = null;
            this.preDragHistoricalRecord = null;
            this.updateHandles();
            return;
        }

        if (this.dragDetected) {
            this.dragDetected = false;
            return;
        }

        // ADD NEW POINT
        const coordinate = this.viewerInterface.getCoordinateAtPixel();
        if (coordinate) {
            switch (this.annotationType) {
                case AnnotationType.POINT:
                    this.recordPointsToUndoHistory(); // important that this comes before the appendCoordinate call
                    this.appendCoordinate(coordinate);
                    this.clearRedoHistory();
                    break;
                default:
                    return;
            }

            this.draw();
            this.updateHandles();
        }


    }

    undo() {
        if (this.points.length > 0) {
            // store current points array in the redo history
            this.redoHistory.push(this.points)
        }
        const prev = this.undoHistory.pop()
        // if there is nothing to undo, remove the entity
        // console.log("PREV", prev);
        if (!prev) this.removeEntity();
        this.points = prev ?? [];
        this.draw();
        this.updateHandles();
        this.emit("undo", { annotation: this })
    }


    redo() {
        const next = this.redoHistory.pop();
        if (!!next) {
            this.recordPointsToUndoHistory();
            this.points = next;
            this.draw();
            this.updateHandles();
        }
        this.emit("redo", { annotation: this });
    }

    recordPointsToUndoHistory() {
        this.undoHistory.push(this.points);
    }

    manualAppendToUndoHistory(points: Coordinate[]) {
        this.undoHistory.push(points);
    }

    clearRedoHistory() {
        this.redoHistory = [];
    }

    // SUBCLASS IMPLEMENTATIONS
    appendCoordinate(coordinate: Coordinate) { }
    draw() { }
    updateHandles() { }
}

