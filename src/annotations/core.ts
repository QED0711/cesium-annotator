import { nanoid } from 'nanoid';
import { AnnotationBaseInit, AnnotationType, AnnotationEntity, HandleFoundRecord, HandleType, HandleEntity, FlyToOptions, AnnotationEventPayload, EventListItem, EventType, GeoJsonFeature, GeoJsonFeatureCollection } from '../utils/types';
import { AnnotationGroup, Registry } from './registry';
import { Coordinate, CoordinateCollection } from './coordinate';
import { ViewerInterface } from './viewerInterface';
import * as Cesium from 'cesium';

/* 
    ANNOTATION BASE CLASS
*/
export class Annotation {
    registry: Registry;
    protected viewerInterface: ViewerInterface;
    protected annotationType: AnnotationType;

    id: string;
    points: CoordinateCollection;
    groups: Set<AnnotationGroup>;

    liveUpdate: boolean;
    userInteractive: boolean;
    entity: AnnotationEntity | HandleEntity | null;
    handles: { [coordinateID: string]: HandleEntity }
    handleType: HandleType;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    isActive: boolean;

    attributes: { [key: string]: any } | null;

    protected undoHistory: CoordinateCollection[];
    protected redoHistory: CoordinateCollection[];
    protected handleFound: HandleFoundRecord | null
    protected bypassPointerUp: boolean

    protected pointerDownDetected: boolean;
    protected dragDetected: boolean;
    protected preDragHistoricalRecord: CoordinateCollection | null;

    protected events: { [eventName: string]: ((payload: AnnotationEventPayload) => void)[] };

    constructor(registry: Registry, options: AnnotationBaseInit) {

        this.registry = registry;
        this.viewerInterface = registry.viewerInterface;
        this.id = options.id ?? nanoid();
        this.annotationType = AnnotationType.BASE;
        this.points = new CoordinateCollection();
        this.groups = new Set<AnnotationGroup>();
        this.undoHistory = [];
        this.redoHistory = [];
        this.liveUpdate = options.liveUpdate ?? false;
        this.userInteractive = options.userInteractive ?? true;

        this.entity = null;
        this.handles = {};
        this.handleType = options.handleType ?? HandleType.POINT;
        this.handleProperties = options.handleProperties ?? {};

        this.attributes = options.attributes ?? null;

        this.isActive = false;
        // this.handleIdxFound = null;
        this.handleFound = null;
        this.bypassPointerUp = false;
        this.pointerDownDetected = false
        this.dragDetected = false
        this.preDragHistoricalRecord = null

        this.events = {};
    }

    get current() {
        return this.points;
    }

    on(eventName: string, callback: (payload: AnnotationEventPayload) => void) {
        if (eventName in this.events) {
            this.events[eventName].push(callback);
        } else {
            this.events[eventName] = [callback];
        }
    }

    emit(eventName: string, payload: AnnotationEventPayload) {
        if (!(eventName in this.events)) return;
        for (let handler of this.events[eventName]) {
            handler(payload);
        }
    }

    executeCallback(func: (annotation: Annotation) => {}) {
        func(this);
    }

    activate() {
        if (!this.userInteractive) return;
        this.isActive = true;
        this.syncHandles();
        this.showHandles();

        this.viewerInterface.registerListener("pointerdown", this.handlePointerDown, this);
        this.viewerInterface.registerListener("pointermove", this.handlePointerMove, this);
        this.viewerInterface.registerListener("pointerup", this.handlePointerUp, this);

        this.emit(EventType.ACTIVATE, { annotation: this });
    }

    deactivate() {
        this.isActive = false;
        this.hideHandles();
        this.viewerInterface.unregisterListenersByAnnotationID(this.id);
        this.emit(EventType.DEACTIVATE, { annotation: this });
    }

    delete() {
        this.deactivate();
        this.removeEntity();
        this.leaveAllGroups();
        this.emit(EventType.DELETE, { annotation: this });
    }

    joinGroup(group: AnnotationGroup) {
        group.capture(this);
    }

    leaveGroup(group: AnnotationGroup) {
        group.release(this);
    }

    leaveAllGroups() {
        const groups = Array.from(this.groups);
        for (let group of groups) {
            this.leaveGroup(group);
        }
    }

    removeEntity() {
        if (!!this.entity) {
            this.viewerInterface.viewer.entities.remove(this.entity)
            this.entity = null;
        }
        this.emit(EventType.REMOVE_ENTITY, { annotation: this });
    }

    removeHandleByCoordinateID(id: string) {
        const handleEntity = this.handles[id];
        if (handleEntity) {
            this.viewerInterface.viewer.entities.remove(handleEntity);
            delete this.handles[id];
        }
    }

    show() {
        if (this.entity) {
            this.entity.show = true;
        }
    }

    hide() {
        if (this.entity) {
            this.entity.show = false;
        }
    }

    showHandles(): void {
        for (let handle of Object.values(this.handles)) {
            handle.show = true;
        }
    }

    hideHandles(): void {
        for (let handle of Object.values(this.handles)) {
            handle.show = false;
        }
    }

    removePointAtIndex(index: number): void {
        this.recordPointsToUndoHistory();
        this.points = this.points.filter((_, i) => i !== index);
        this.draw();
        this.syncHandles();
    }

    handlePointerDown(e: PointerEvent) {
        this.dragDetected = false; // reset drag detection whenever user initiates a new click event cycle
        this.pointerDownDetected = true;
        let existingEntity = this.viewerInterface.queryEntityAtPixel();

        if ((existingEntity as HandleEntity)?._isHandle) {
            existingEntity = existingEntity as HandleEntity;
            if (existingEntity?._handleIdx !== undefined && existingEntity?._handleCoordinateID) {
                this.handleFound = { index: existingEntity._handleIdx, handleID: existingEntity._handleCoordinateID }
                this.viewerInterface.lock();
                this.preDragHistoricalRecord = this.points.clone();
            }
        }
    }

    handlePointerMove(e: PointerEvent) {
        if (this.pointerDownDetected) {
            // update the specified point as it is dragged
            if (this.handleFound !== null) {
                this.removeHandleByCoordinateID(this.handleFound.handleID);
                const coordinate = this.viewerInterface.getCoordinateAtPixel(e.offsetX, e.offsetY);
                if (coordinate) this.points.set(this.handleFound.index, coordinate);
            }
            this.dragDetected = true;
        }
    }

    handlePointerUp(e: PointerEvent) {

        this.viewerInterface.unlock();
        this.pointerDownDetected = false;

        if (this.bypassPointerUp) {
            this.bypassPointerUp = false;
            return;
        }

        if (this.viewerInterface.longPressComplete) {
            this.handleFound = null;
            return;
        }

        if (this.handleFound !== null) {
            const coordinate = this.viewerInterface.getCoordinateAtPixel();
            if (coordinate) this.points.set(this.handleFound.index, coordinate); // update an existing point
            if (this.preDragHistoricalRecord) this.manualAppendToUndoHistory(this.preDragHistoricalRecord); // record state prior to handle drag into undo history
            this.draw();
            this.handleFound = null;
            this.preDragHistoricalRecord = null;
            this.syncHandles();
            return;
        }

        if (this.dragDetected) {
            this.dragDetected = false;
            return;
        }

        // ADD NEW POINT
        const coordinate = this.viewerInterface.getCoordinateAtPixel();
        if (coordinate) {

            this.recordPointsToUndoHistory(); // important that this comes before the appendCoordinate call
            this.appendCoordinate(coordinate);
            this.clearRedoHistory();

            this.draw();
            this.syncHandles();
        }
    }

    undo() {
        if (this.points.length > 0) {
            // store current points array in the redo history
            this.redoHistory.push(this.points.clone())
        }
        const prev = this.undoHistory.pop()
        // if there is nothing to undo, remove the entity
        if (!prev) this.removeEntity();
        this.points = prev ?? new CoordinateCollection();
        this.draw();
        this.syncHandles();
        this.emit(EventType.UNDO, { annotation: this })
    }


    redo() {
        const next = this.redoHistory.pop();
        if (!!next) {
            this.recordPointsToUndoHistory();
            this.points = next;
            this.draw();
            this.syncHandles();
        }
        this.emit(EventType.REDO, { annotation: this });
    }

    recordPointsToUndoHistory() {
        if (this.points.length > 0) {
            this.undoHistory.push(this.points.clone());
        }
    }

    manualAppendToUndoHistory(points: CoordinateCollection) {
        this.undoHistory.push(points.clone());
    }

    clearRedoHistory() {
        this.redoHistory = [];
    }

    updateHandleIdxs(): void {
        for (let i = 0; i < this.points.length; i++) {
            const handleID = this.points.at(i)?.id ?? null;
            if (handleID !== null) {
                const handle = this.handles[handleID];
                if (handle) handle._handleIdx = i;
            }
        }
    }

    removeStaleHandles(): void {
        const pointIDs: { [coordinateID: string]: boolean } = {};
        for (let point of this.points) {
            pointIDs[point.id] = true;
        }
        const handleCoordinateIDs = Object.keys(this.handles);
        for (let handleCoordID of handleCoordinateIDs) {
            if (!pointIDs[handleCoordID]) {
                this.viewerInterface.viewer.entities.remove(this.handles[handleCoordID])
                delete this.handles[handleCoordID];
            }
        }
    }

    syncHandles(): void {
        if (this.isActive) {
            for (let i = 0; i < this.points.length; i++) {
                const point = this.points.at(i);
                if (!point) continue
                if (point.id in this.handles) continue;
                // TODO: handle when handle type is billboard vs point
                let handle;
                if (this.handleType === HandleType.POINT) {
                    handle = this.viewerInterface.viewer.entities.add({
                        position: point.cartesian3,
                        point: {
                            pixelSize: 10,
                            ...this.handleProperties as Cesium.PointGraphics.ConstructorOptions
                        }
                    }) as HandleEntity
                } else if (this.handleType === HandleType.BILLBOARD) {
                    handle = this.viewerInterface.viewer.entities.add({
                        position: point.cartesian3,
                        billboard: {
                            scale: 1.0,
                            ...this.handleProperties as Cesium.BillboardGraphics.ConstructorOptions
                        }
                    }) as HandleEntity;
                }

                if (handle) {
                    handle._parentAnnotation = this;
                    handle._isHandle = true;
                    handle._handleCoordinateID = point.id
                    handle._handleIdx = i;

                    this.handles[point.id] = handle;
                }
            }
        }

        this.updateHandleIdxs();
        this.removeStaleHandles();
    }

    insertCoordinateAtIndex(coordinate: Coordinate, idx: number) {
        this.recordPointsToUndoHistory();
        this.points = this.points.clone()
        this.points.insertAtIndex(idx, coordinate);
        this.clearRedoHistory();

        this.draw();
        this.syncHandles();

    }

    flyTo(options?: FlyToOptions) {
        if (!this.entity) return;
        this.viewerInterface.viewer.flyTo(
            this.entity,
            {
                duration: 0,
                offset: new Cesium.HeadingPitchRange(0, -90),
                ...(options ?? {})
            }
        )
    }

    toGeoJson(): GeoJsonFeatureCollection | null {
        const geoJson = this.points.toGeoJson(this.annotationType);
        if (geoJson) {
            const properties = geoJson.features[0].properties
            properties.initOptions = {
                id: this.id,
                liveUpdate: this.liveUpdate,
                userInteractive: this.userInteractive,
                handleType: this.handleType,
                attributes: this.attributes,
                ...properties.initOptions
            }
        }
        return geoJson
    }

    toWkt(): string | null {
        return this.points.toWkt(this.annotationType);
    }

    // SUBCLASS IMPLEMENTATIONS
    appendCoordinate(coordinate: Coordinate) { }
    draw() { }
}

