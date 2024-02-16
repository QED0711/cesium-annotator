import * as Cesium from 'cesium';
import { nanoid } from 'nanoid';
import { CoordinateInit, DistanceUnit, AnnotationBaseInit, AnnotationType } from '../utils/types';
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
    protected viewerInterface: ViewerInterface;
    protected annotationType: AnnotationType;
    id: string;
    points: Coordinate[];
    protected history: Coordinate[][];
    isStatic: boolean;
    entity: Cesium.Entity | null;
    handles: Cesium.Entity[];
    isActive: boolean;
    protected registry: Registry;

    protected handleFound: boolean;
    protected dragDetected: boolean;

    constructor(registry: Registry, init: AnnotationBaseInit) {
        this.registry = registry;
        this.viewerInterface = registry.viewerInterface;
        this.id = init.id ?? nanoid();
        this.annotationType = AnnotationType.BASE;
        this.points = [];
        this.history = [];
        this.isStatic = init.isStatic ?? true;

        this.entity = null;
        this.handles = [];

        this.isActive = false;
        this.handleFound = false
        this.dragDetected = false
    }

    get current() {
        return this.points;
    }

    activate() {
        this.isActive = true;

        this.viewerInterface.registerListener("pointerdown", this.handlePointerDown, this);
        this.viewerInterface.registerListener("pointermove", this.handlePointerMove, this);
        this.viewerInterface.registerListener("pointerup", this.handlePointerUp, this);
    }

    deactivate() {
        this.isActive = false;
        this.viewerInterface.unregisterListenersByAnnotationID(this.id);
    }

    delete() {
        this.deactivate();
        if (!!this.entity) {
            this.viewerInterface.viewer.entities.remove(this.entity)
        }
    }

    handlePointerDown(e: PointerEvent) {
        // console.log("POINTER DOWN", e, this)
        this.dragDetected = false; // reset drag detection whenever user initiates a new click event cycle
        const handle = this.viewerInterface.queryEntityAtPixel();
        if (handle) {
            this.handleFound = true;
            this.viewerInterface.lock();
        }
    }

    handlePointerMove(e: PointerEvent) {
        // console.log("POINTER MOVE", e, this)
        this.dragDetected = true;
    }

    handlePointerUp(e: PointerEvent) {
        // console.log("POINTER UP", e, this)

        this.viewerInterface.unlock();

        if (this.handleFound) {
            this.handleFound = false;
            // TODO: when pointer comes up on a handle should update the current points and register a history record
            return;
        }

        if(this.dragDetected) {
            this.dragDetected = false;
            return;
        }

        const coordinate = this.viewerInterface.getCoordinateAtPixel();
        if (coordinate) {
            switch (this.annotationType) {
                case AnnotationType.POINT:
                    this.appendCoordinate(coordinate);
                    break;
                default:
                    return;
            }

            this.draw()
        }


    }

    // SUBCLASS IMPLEMENTATIONS
    appendCoordinate(coordinate: Coordinate){}
    draw(){} 
}

