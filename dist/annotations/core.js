import { nanoid } from 'nanoid';
import { AnnotationType, HandleType } from '../utils/types';
import { CoordinateCollection } from './coordinate';
import * as Cesium from 'cesium';
/*
    ANNOTATION BASE CLASS
*/
export class Annotation {
    constructor(registry, options) {
        var _a, _b, _c, _d, _e;
        this.registry = registry;
        this.viewerInterface = registry.viewerInterface;
        this.id = (_a = options.id) !== null && _a !== void 0 ? _a : nanoid();
        this.annotationType = AnnotationType.BASE;
        this.points = new CoordinateCollection();
        this.groups = new Set();
        this.undoHistory = [];
        this.redoHistory = [];
        this.liveUpdate = (_b = options.liveUpdate) !== null && _b !== void 0 ? _b : false;
        this.userInteractive = (_c = options.userInteractive) !== null && _c !== void 0 ? _c : true;
        this.entity = null;
        this.handles = {};
        this.handleType = (_d = options.handleType) !== null && _d !== void 0 ? _d : HandleType.POINT;
        this.attributes = (_e = options.attributes) !== null && _e !== void 0 ? _e : null;
        this.isActive = false;
        // this.handleIdxFound = null;
        this.handleFound = null;
        this.bypassPointerUp = false;
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
    executeCallback(func) {
        func(this);
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
        this.leaveAllGroups();
        this.emit("delete", { annotation: this });
    }
    joinGroup(group) {
        group.capture(this);
    }
    leaveGroup(group) {
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
        let existingEntity = this.viewerInterface.queryEntityAtPixel();
        if (existingEntity === null || existingEntity === void 0 ? void 0 : existingEntity._isHandle) {
            existingEntity = existingEntity;
            if ((existingEntity === null || existingEntity === void 0 ? void 0 : existingEntity._handleIdx) !== undefined && (existingEntity === null || existingEntity === void 0 ? void 0 : existingEntity._handleCoordinateID)) {
                this.handleFound = { index: existingEntity._handleIdx, handleID: existingEntity._handleCoordinateID };
                this.viewerInterface.lock();
                this.preDragHistoricalRecord = this.points.clone();
            }
        }
    }
    handlePointerMove(e) {
        if (this.pointerDownDetected) {
            // update the specified point as it is dragged
            if (this.handleFound !== null) {
                this.removeHandleByCoordinateID(this.handleFound.handleID);
                const coordinate = this.viewerInterface.getCoordinateAtPixel(e.offsetX, e.offsetY);
                if (coordinate)
                    this.points.set(this.handleFound.index, coordinate);
            }
            this.dragDetected = true;
        }
    }
    handlePointerUp(e) {
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
            if (coordinate)
                this.points.set(this.handleFound.index, coordinate); // update an existing point
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
            this.redoHistory.push(this.points.clone());
        }
        const prev = this.undoHistory.pop();
        // if there is nothing to undo, remove the entity
        if (!prev)
            this.removeEntity();
        this.points = prev !== null && prev !== void 0 ? prev : new CoordinateCollection();
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
            this.undoHistory.push(this.points.clone());
        }
    }
    manualAppendToUndoHistory(points) {
        this.undoHistory.push(points.clone());
    }
    clearRedoHistory() {
        this.redoHistory = [];
    }
    updateHandleIdxs() {
        var _a, _b;
        for (let i = 0; i < this.points.length; i++) {
            const handleID = (_b = (_a = this.points.at(i)) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
            if (handleID !== null) {
                const handle = this.handles[handleID];
                handle._handleIdx = i;
            }
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
    syncHandles() {
        if (this.isActive) {
            for (let i = 0; i < this.points.length; i++) {
                const point = this.points.at(i);
                if (!point)
                    continue;
                if (point.id in this.handles)
                    continue;
                const handle = this.viewerInterface.viewer.entities.add({
                    position: point.cartesian3,
                    point: {
                        pixelSize: 10,
                    }
                });
                handle._parentAnnotation = this;
                handle._isHandle = true;
                handle._handleCoordinateID = point.id;
                handle._handleIdx = i;
                this.handles[point.id] = handle;
            }
        }
        this.updateHandleIdxs();
        this.removeStaleHandles();
    }
    insertCoordinateAtIndex(coordinate, idx) {
        this.recordPointsToUndoHistory();
        this.points = this.points.clone();
        this.points.insertAtIndex(idx, coordinate);
        this.clearRedoHistory();
        this.draw();
        this.syncHandles();
    }
    flyTo(options) {
        if (!this.entity)
            return;
        this.viewerInterface.viewer.flyTo(this.entity, Object.assign({ duration: 0, offset: new Cesium.HeadingPitchRange(0, -90) }, (options !== null && options !== void 0 ? options : {})));
    }
    toGeoJson() {
        return this.points.toGeoJson(this.annotationType);
    }
    // SUBCLASS IMPLEMENTATIONS
    appendCoordinate(coordinate) { }
    draw() { }
}
//# sourceMappingURL=core.js.map