import * as Cesium from 'cesium';
import { nanoid } from 'nanoid';
import { DistanceUnit, AnnotationType } from '../utils/types';
/*
    POINT CLASS
*/
export class Coordinate {
    constructor(init) {
        var _a;
        this.id = nanoid();
        this.lng = init.lng;
        this.lat = init.lat;
        this.alt = (_a = init.alt) !== null && _a !== void 0 ? _a : 0.0;
    }
    static fromDegrees(lng, lat, alt) {
        return new this({ lng, lat, alt });
    }
    static cloneCoordinateArray(coordinates) {
        return coordinates.map(c => c.clone());
    }
    static coordinateArrayToCartesian3(coordinates) {
        return coordinates.map(c => c.toCartesian3());
    }
    clone() {
        const coordinate = new Coordinate({ lng: this.lng, lat: this.lat, alt: this.alt });
        coordinate.id = this.id;
        return coordinate;
    }
    toCartesian3() {
        return Cesium.Cartesian3.fromDegrees(this.lng, this.lat, this.alt);
    }
    distanceTo(point2, unit) {
        unit !== null && unit !== void 0 ? unit : (unit = DistanceUnit.METERS);
        const p1Cartesian = this.toCartesian3();
        const p2Cartesian = point2.toCartesian3();
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
    headingTo(point2) {
        const cartographic1 = Cesium.Cartographic.fromDegrees(this.lng, this.lat, this.alt);
        const cartographic2 = Cesium.Cartographic.fromDegrees(point2.lng, point2.lat, point2.alt);
        const geodesic = new Cesium.EllipsoidGeodesic(cartographic1, cartographic2);
        let heading = Cesium.Math.toDegrees(geodesic.startHeading);
        heading += heading < 0 ? 260 : 0;
        return heading;
    }
}
/*
    ANNOTATION BASE CLASS
*/
export class Annotation {
    constructor(registry, init) {
        var _a, _b, _c;
        this.registry = registry;
        this.viewerInterface = registry.viewerInterface;
        this.id = (_a = init.id) !== null && _a !== void 0 ? _a : nanoid();
        this.annotationType = AnnotationType.BASE;
        this.points = [];
        this.undoHistory = [];
        this.redoHistory = [];
        this.liveUpdate = (_b = init.liveUpdate) !== null && _b !== void 0 ? _b : false;
        this.userInteractive = (_c = init.userInteractive) !== null && _c !== void 0 ? _c : true;
        this.entity = null;
        this.handles = {};
        this.isActive = false;
        // this.handleIdxFound = null;
        this.handleFound = null;
        this.pointerDownDetected = false;
        this.dragDetected = false;
        this.preDragHistoricalRecord = null;
        this.events = {};
    }
    get current() {
        return this.points;
    }
    on(eventName, callback) {
        if (eventName in this.events) {
            this.events.eventName.push(callback);
        }
        else {
            this.events[eventName] = [callback];
        }
    }
    emit(eventName, payload) {
        if (!(eventName in this.events))
            return;
        for (let handler of this.events[eventName]) {
            handler(payload);
        }
    }
    activate() {
        this.isActive = true;
        this.showHandles();
        this.viewerInterface.registerListener("pointerdown", this.handlePointerDown, this);
        this.viewerInterface.registerListener("pointermove", this.handlePointerMove, this);
        this.viewerInterface.registerListener("pointerup", this.handlePointerUp, this);
        this.emit("activate", { annotation: this });
    }
    deactivate() {
        this.isActive = false;
        this.hideHandles();
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
            this.viewerInterface.viewer.entities.remove(this.entity);
            this.entity = null;
        }
        this.emit("removeEntity", { annotation: this });
    }
    removeHandleByCoordinateID(id) {
        const handleEntity = this.handles[id];
        if (handleEntity) {
            this.viewerInterface.viewer.entities.remove(handleEntity);
            delete this.handles[id];
        }
    }
    showHandles() {
        for (let handle of Object.values(this.handles)) {
            handle.show = true;
        }
    }
    hideHandles() {
        for (let handle of Object.values(this.handles)) {
            handle.show = false;
        }
    }
    removePointAtIndex(index) {
        this.recordPointsToUndoHistory();
        this.points = this.points.filter((_, i) => i !== index);
        this.draw();
        this.syncHandles();
    }
    handlePointerDown(e) {
        this.dragDetected = false; // reset drag detection whenever user initiates a new click event cycle
        this.pointerDownDetected = true;
        const existingEntity = this.viewerInterface.queryEntityAtPixel();
        if ((existingEntity === null || existingEntity === void 0 ? void 0 : existingEntity._isHandle) && (existingEntity === null || existingEntity === void 0 ? void 0 : existingEntity._handleIdx) !== undefined && (existingEntity === null || existingEntity === void 0 ? void 0 : existingEntity._handleCoordinateID)) {
            console.log(existingEntity._handleCoordinateID, existingEntity._handleIdx);
            this.handleFound = { index: existingEntity._handleIdx, handleID: existingEntity._handleCoordinateID };
            this.viewerInterface.lock();
            this.preDragHistoricalRecord = Coordinate.cloneCoordinateArray(this.points);
        }
    }
    handlePointerMove(e) {
        if (this.pointerDownDetected) {
            // update the specified point as it is dragged
            if (this.handleFound !== null) {
                this.removeHandleByCoordinateID(this.handleFound.handleID);
                const coordinate = this.viewerInterface.getCoordinateAtPixel(e.offsetX, e.offsetY);
                if (coordinate)
                    this.points[this.handleFound.index] = coordinate;
            }
            this.dragDetected = true;
        }
    }
    handlePointerUp(e) {
        this.viewerInterface.unlock();
        this.pointerDownDetected = false;
        if (this.viewerInterface.longPressComplete) {
            this.handleFound = null;
            return;
        }
        if (this.handleFound !== null) {
            const coordinate = this.viewerInterface.getCoordinateAtPixel();
            if (coordinate)
                this.points[this.handleFound.index] = coordinate; // update an existing point
            if (this.preDragHistoricalRecord)
                this.manualAppendToUndoHistory(this.preDragHistoricalRecord); // record state prior to handle drag into undo history
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
            switch (this.annotationType) {
                case AnnotationType.POINT:
                    this.recordPointsToUndoHistory(); // important that this comes before the appendCoordinate call
                    this.appendCoordinate(coordinate);
                    this.clearRedoHistory();
                    break;
                case AnnotationType.POLYLINE:
                    this.recordPointsToUndoHistory(); // important that this comes before the appendCoordinate call
                    this.appendCoordinate(coordinate);
                    this.clearRedoHistory();
                    break;
                case AnnotationType.POLYGON:
                    this.recordPointsToUndoHistory(); // important that this comes before the appendCoordinate call
                    this.appendCoordinate(coordinate);
                    this.clearRedoHistory();
                    break;
                default:
                    return;
            }
            this.draw();
            this.syncHandles();
        }
    }
    undo() {
        if (this.points.length > 0) {
            // store current points array in the redo history
            this.redoHistory.push([...this.points]);
        }
        const prev = this.undoHistory.pop();
        // if there is nothing to undo, remove the entity
        if (!prev)
            this.removeEntity();
        this.points = prev !== null && prev !== void 0 ? prev : [];
        this.draw();
        this.syncHandles();
        this.emit("undo", { annotation: this });
    }
    redo() {
        const next = this.redoHistory.pop();
        if (!!next) {
            this.recordPointsToUndoHistory();
            this.points = next;
            this.draw();
            this.syncHandles();
        }
        this.emit("redo", { annotation: this });
    }
    recordPointsToUndoHistory() {
        if (this.points.length > 0) {
            this.undoHistory.push([...this.points]);
        }
    }
    manualAppendToUndoHistory(points) {
        this.undoHistory.push([...points]);
    }
    clearRedoHistory() {
        this.redoHistory = [];
    }
    updateHandleIdxs() {
        for (let i = 0; i < this.points.length; i++) {
            const handle = this.handles[this.points[i].id];
            handle._handleIdx = i;
        }
    }
    removeStaleHandles() {
        const pointIDs = {};
        for (let point of this.points) {
            pointIDs[point.id] = true;
        }
        const handleCoordinateIDs = Object.keys(this.handles);
        for (let handleCoordID of handleCoordinateIDs) {
            if (!pointIDs[handleCoordID]) {
                this.viewerInterface.viewer.entities.remove(this.handles[handleCoordID]);
                delete this.handles[handleCoordID];
            }
        }
    }
    // SUBCLASS IMPLEMENTATIONS
    appendCoordinate(coordinate) { }
    draw() { }
    syncHandles() { }
}
//# sourceMappingURL=core.js.map