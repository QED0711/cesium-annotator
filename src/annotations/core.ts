import { nanoid } from 'nanoid';
import { AnnotationBaseInit, AnnotationType, AnnotationEntity, HandleFoundRecord, HandleType, HandleEntity, FlyToOptions, AnnotationEventPayload, EventListItem, EventType, GeoJsonFeature, GeoJsonFeatureCollection, GroupRecord, DrawOptions, FlyToType } from '../utils/types';
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
    entityProperties: Cesium.Entity.ConstructorOptions;
    handles: { [coordinateID: string]: HandleEntity }
    handleType: HandleType;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    isActive: boolean;
    protected isTempLocked: boolean
    bypassTerrainSampleOnDrags: boolean;

    attributes: { [key: string]: any };

    protected undoHistory: CoordinateCollection[];
    protected redoHistory: CoordinateCollection[];
    protected handleFound: HandleFoundRecord | null
    protected bypassPointerUp: boolean

    protected pointerDownDetected: boolean;
    protected lastPointerUpTime: number;
    protected movedDetected: boolean;
    protected dragDetected: boolean;
    protected preDragHistoricalRecord: CoordinateCollection | null;

    protected events: { [eventName: string]: ((payload: AnnotationEventPayload) => void)[] };
    protected mutedEvents: Set<EventType>;
    lastEventTime: number | null

    customMethods: Record<string, Function>

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
        this.entityProperties = options.entityProperties ?? {};
        this.handles = {};
        this.handleType = options.handleType ?? HandleType.POINT;
        this.handleProperties = options.handleProperties ?? {};

        this.attributes = options.attributes ?? {};

        this.isActive = false;
        this.isTempLocked = false;
        this.bypassTerrainSampleOnDrags = options.bypassTerrainSampleOnDrag ?? false;
        this.handleFound = null;
        this.bypassPointerUp = false;
        this.pointerDownDetected = false
        this.lastPointerUpTime = 0;
        this.movedDetected = false;
        this.dragDetected = false;
        this.preDragHistoricalRecord = null

        this.events = {};
        this.mutedEvents = new Set();
        this.lastEventTime = null;

        this.customMethods = {};

        this.initGroupRecords(options.groupRecords ?? []);
    }

    get type(): AnnotationType {
        return this.annotationType;
    }

    on(eventNames: EventType | EventType[], callback: (payload: AnnotationEventPayload) => void) {
        eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
        for (let eventName of eventNames) {
            if (eventName in this.events) {
                this.events[eventName].push(callback);
            } else {
                this.events[eventName] = [callback];
            }
        }
    }

    protected emit(eventName: EventType, payload: AnnotationEventPayload) {
        this.lastEventTime = Date.now();
        if (!(eventName in this.events) || this.mutedEvents.has(eventName)) return;
        for (let handler of this.events[eventName]) {
            handler(payload);
        }
    }

    muteEvents(eventNames: EventType | EventType[]): void {
        if (!Array.isArray(eventNames)) eventNames = [eventNames];
        for (let eventName of eventNames) {
            this.mutedEvents.add(eventName);
        }
    }

    unmuteEvents(eventNames: EventType | EventType[]): void {
        if (!Array.isArray(eventNames)) eventNames = [eventNames];
        for (let eventName of eventNames) {
            this.mutedEvents.delete(eventName);
        }
    }

    eventIsMuted(eventName: EventType): boolean {
        return this.mutedEvents.has(eventName)
    }

    executeCallback(func: (annotation: Annotation) => void) {
        func(this);
    }

    applyMethod(name: string, func: Function): boolean {
        if(name in this.customMethods) return false;
        this.customMethods[name] = func.bind(this);
        return true
    }

    removeMethod(name: string): boolean {
        if(name in this.customMethods) {
            delete this.customMethods[name];
            return true;
        }
        return false
    }

    setAttributes(attributes: { [key: string]: any }, destructive: boolean = false): void {
        if (!destructive) attributes = { ...this.attributes, ...attributes }
        this.attributes = attributes;
        this.emit(EventType.ATTRIBUTE, { annotation: this });
    }

    setAttribute(attrName: string, value: any): void {
        this.attributes[attrName] = value;
        this.emit(EventType.ATTRIBUTE, { annotation: this });
    }

    deleteAttribute(attrName: string): void {
        delete this.attributes[attrName];
        this.emit(EventType.ATTRIBUTE, { annotation: this });
    }

    activate() {
        if (!this.userInteractive) return;
        this.isActive = true;
        this.syncHandles();
        this.showHandles();

        // in the event this is called at the annotation level, this will ensure that all other annotations are deactivated;
        this.registry.deactivateAllExcept(this.id);

        this.viewerInterface.registerListener("pointerdown", this.handlePointerDown, this);
        this.viewerInterface.registerListener("pointermove", this.handlePointerMove, this);
        this.viewerInterface.registerListener("pointerup", this.handlePointerUp, this);

        this.emit(EventType.ACTIVATE, { annotation: this });
    }

    deactivate() {
        if (this.isActive) {
            this.isActive = false;
            this.hideHandles();
            this.viewerInterface.unregisterListenersByAnnotationID(this.id);

            this.emit(EventType.DEACTIVATE, { annotation: this });
        }
    }

    delete() {
        this.emit(EventType.PRE_DELETE, {annotation: this});
        this.deactivate();
        this.removeEntity();
        this.leaveAllGroups();
        this.emit(EventType.DELETE, { annotation: this });
    }

    lock() {
        this.isTempLocked = true;
    }

    unlock() {
        this.isTempLocked = false;
    }

    get isLocked() {
        return this.isTempLocked;
    }

    private initGroupRecords(records: GroupRecord[]) {
        for (let record of records) {
            this.joinGroupByRecord(record);
        }
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

    joinGroupByRecord(groupRecord: GroupRecord) {
        const group = this.registry.getOrCreateGroup(groupRecord);
        this.joinGroup(group);
    }

    isMemberOf(group: AnnotationGroup): boolean {
        return !!Array.from(this.groups).find(g => g.id === group.id);
    }

    protected groupsToRecords(): GroupRecord[] {
        return Array.from(this.groups).map(group => group.toRecord());
    }

    removeEntity() {
        if (!!this.entity) {
            this.viewerInterface.viewer.entities.remove(this.entity)
            this.entity = null;
            this.removeHandles();
        }
        this.emit(EventType.REMOVE_ENTITY, { annotation: this });
    }

    setEntityProperties(properties: Cesium.Entity.ConstructorOptions, destructive: boolean = false) {
        if (!destructive) properties = { ...this.entityProperties, ...properties };
        this.entityProperties = properties;
        this.emit(EventType.ENTITY_PROPERTY, { annotation: this });
    }

    setEntityProperty(propName: string, value: any): void {
        (this.entityProperties as any)[propName] = value;
        this.emit(EventType.ENTITY_PROPERTY, { annotation: this });
    }

    deleteEntityProperty(propName: string): void {
        delete (this.entityProperties as any)[propName];
        this.emit(EventType.ENTITY_PROPERTY, { annotation: this });
    }

    removeHandles() {
        for (let handle of Object.values(this.handles)) {
            this.viewerInterface.viewer.entities.remove(handle);
        }
        this.handles = {};
    }

    removeHandleByCoordinateID(id: string) {
        const handleEntity = this.handles[id];
        if (handleEntity) {
            this.viewerInterface.viewer.entities.remove(handleEntity);
            delete this.handles[id];
        }
    }

    setHandleProperties(properties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions, destructive: boolean = false): void {
        if (!destructive) properties = { ...this.handleProperties, ...properties };
        this.handleProperties = properties;
        this.emit(EventType.PROPERTY, { annotation: this });
    }

    setHandleProperty(propName: string, value: any) {
        this.handleProperties[propName as keyof typeof this.handleProperties] = value;
        this.emit(EventType.PROPERTY, { annotation: this });
    }

    deleteHandleProperty(propName: string) {
        delete this.handleProperties[propName as keyof typeof this.handleProperties];
        this.emit(EventType.PROPERTY, { annotation: this });
    }

    show() {
        this.setEntityProperty("show", true);
        if (this.entity) {
            this.entity.show = true;
            this.emit(EventType.SHOW, {annotation: this});
        }
    }

    hide() {
        this.setEntityProperty("show", false);
        if (this.entity) {
            this.entity.show = false;
            this.emit(EventType.HIDE, {annotation: this});
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

    protected handlePointerDown(e: PointerEvent) {
        this.dragDetected = false; // reset drag detection whenever user initiates a new click event cycle
        if(this.isTempLocked) return;

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

    protected async handlePointerMove(e: PointerEvent) {
        if(this.isTempLocked) return;
        this.movedDetected = true;
        if (this.pointerDownDetected) {
            // update the specified point as it is dragged
            if (this.handleFound !== null) {
                this.removeHandleByCoordinateID(this.handleFound.handleID);
                const coordinate = await this.viewerInterface.getCoordinateAtPixel(e.offsetX, e.offsetY, { bypassAlt: this.bypassTerrainSampleOnDrags }); // if don't want to make a sampleTerrain call on each mouse move, so we bypass the altitude calculation for this call of getCoordinateAtPixel
                if (coordinate) this.points.set(this.handleFound.index, coordinate);
            }
            this.dragDetected = true;
        }
    }

    protected async handlePointerUp(e: PointerEvent) {

        this.viewerInterface.unlock();
        this.pointerDownDetected = false;

        if (this.bypassPointerUp) {
            this.bypassPointerUp = false;
            this.movedDetected = false;
            return;
        }

        if(this.isTempLocked) return;

        // longpress logic
        if (this.viewerInterface.longPressComplete) {
            this.handleFound = null;
            this.movedDetected = false;
            return;
        }

        // double click logic
        const now = Date.now()
        if (now - this.lastPointerUpTime < 200 && this.movedDetected === false) {
            this.emit(EventType.DOUBLE_CLICK, {annotation: this});
            this.registry.deactivateByID(this.id);
            this.lastPointerUpTime = now;
            this.movedDetected = false;
            return;
        }
        this.lastPointerUpTime = now;
        this.movedDetected = false;


        if (this.handleFound !== null) {
            const coordinate = await this.viewerInterface.getCoordinateAtPixel();
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
        const coordinate = await this.viewerInterface.getCoordinateAtPixel();
        if (coordinate) {

            this.recordPointsToUndoHistory(); // important that this comes before the appendCoordinate call
            this.appendCoordinate(coordinate);
            this.clearRedoHistory();

            this.draw();
            this.syncHandles();
        }
    }

    undo() {
        if(this.isTempLocked) return;
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

    undoAll() {
        if(this.isTempLocked) return;
        const n = this.undoHistory.length;
        for(let i = 0; i < n; i++) {
            this.undo();
        }
    }

    redo() {
        if(this.isTempLocked) return;
        const next = this.redoHistory.pop();
        if (!!next) {
            this.recordPointsToUndoHistory();
            this.points = next;
            this.draw();
            this.syncHandles();
        }
        this.emit(EventType.REDO, { annotation: this });
    }

    protected recordPointsToUndoHistory() {
        if (this.points.length > 0) {
            this.undoHistory.push(this.points.clone());
        }
    }

    protected manualAppendToUndoHistory(points: CoordinateCollection) {
        this.undoHistory.push(points.clone());
    }

    protected clearRedoHistory() {
        this.redoHistory = [];
    }

    protected updateHandleIdxs(): void {
        for (let i = 0; i < this.points.length; i++) {
            const handleID = this.points.at(i)?.id ?? null;
            if (handleID !== null) {
                const handle = this.handles[handleID];
                if (handle) handle._handleIdx = i;
            }
        }
    }

    protected removeStaleHandles(): void {
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

    async flyTo(options?: FlyToOptions): Promise<void> {
        options ??= {};
        const locationType = options?.locationType ?? FlyToType.ENTITY
        
        if (locationType === FlyToType.ENTITY) {
            if (!this.entity) return;
            await this.viewerInterface.viewer.flyTo(
                this.entity,
                {
                    duration: 0,
                    offset: new Cesium.HeadingPitchRange(0, -90),
                    ...(options ?? {})
                }
            )
        }

        if (locationType === FlyToType.GEOSPATIAL_MEAN) {
            this.viewerInterface.viewer.camera.flyTo({ destination: this.points.mean()?.withAlt(options.alt)?.cartesian3 as Cesium.Cartesian3, ...options as any })
        }

        if(locationType === FlyToType.FIRST) {
            this.viewerInterface.viewer.camera.flyTo({ destination: this.points.first?.withAlt(options.alt)?.cartesian3 as Cesium.Cartesian3, ...options as any })
        }

        if(locationType === FlyToType.LAST) {
            this.viewerInterface.viewer.camera.flyTo({ destination: this.points.last?.withAlt(options.alt)?.cartesian3 as Cesium.Cartesian3, ...options as any })
        }

        if (locationType === FlyToType.BBOX) {
            const bbox = this.points.getMinMaxBbox();
            this.viewerInterface.viewer.camera.flyTo(
                {
                    destination: new Cesium.Rectangle(
                        Cesium.Math.toRadians(bbox.lngMin),
                        Cesium.Math.toRadians(bbox.latMin),
                        Cesium.Math.toRadians(bbox.lngMax),
                        Cesium.Math.toRadians(bbox.latMax)
                    ),
                    ...(options ?? {})
                }
            )
        }
    }

    toGeoJson(): GeoJsonFeatureCollection | null {
        const geoJson = this.points.toGeoJson(this.annotationType);
        if (geoJson) {
            const properties = geoJson.features[0].properties
            properties.initOptions = {
                id: this.id,
                annotationType: this.annotationType,
                liveUpdate: this.liveUpdate,
                userInteractive: this.userInteractive,
                entityProperties: this.entityProperties,
                handleType: this.handleType,
                handleProperties: this.handleProperties,
                groupRecords: this.groupsToRecords(),
                attributes: this.attributes,
                bypassTerrainSampleOnDrag: this.bypassTerrainSampleOnDrags,
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
    draw(options?: DrawOptions): void { }
}

