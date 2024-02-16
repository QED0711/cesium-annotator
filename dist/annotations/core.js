import * as Cesium from 'cesium';
import { nanoid } from 'nanoid';
import { DistanceUnit, AnnotationType } from '../utils/types';
/*
    POINT CLASS
*/
export class Coordinate {
    constructor(init) {
        var _a;
        this.lng = init.lng;
        this.lat = init.lat;
        this.alt = (_a = init.alt) !== null && _a !== void 0 ? _a : 0.0;
    }
    static fromDegrees(lng, lat, alt) {
        return new this({ lng, lat, alt });
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
}
/*
    ANNOTATION BASE CLASS
*/
export class Annotation {
    constructor(registry, init) {
        var _a, _b;
        this.registry = registry;
        this.viewerInterface = registry.viewerInterface;
        this.id = (_a = init.id) !== null && _a !== void 0 ? _a : nanoid();
        this.annotationType = AnnotationType.BASE;
        this.points = [];
        this.history = [];
        this.isStatic = (_b = init.isStatic) !== null && _b !== void 0 ? _b : true;
        this.entity = null;
        this.handles = [];
        this.isActive = false;
        this.handleFound = false;
        this.dragDetected = false;
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
            this.viewerInterface.viewer.entities.remove(this.entity);
        }
    }
    handlePointerDown(e) {
        // console.log("POINTER DOWN", e, this)
        this.dragDetected = false; // reset drag detection whenever user initiates a new click event cycle
        const handle = this.viewerInterface.queryEntityAtPixel();
        if (handle) {
            this.handleFound = true;
            this.viewerInterface.lock();
        }
    }
    handlePointerMove(e) {
        // console.log("POINTER MOVE", e, this)
        this.dragDetected = true;
    }
    handlePointerUp(e) {
        // console.log("POINTER UP", e, this)
        this.viewerInterface.unlock();
        if (this.handleFound) {
            this.handleFound = false;
            // TODO: when pointer comes up on a handle should update the current points and register a history record
            return;
        }
        if (this.dragDetected) {
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
            this.draw();
        }
    }
    // SUBCLASS IMPLEMENTATIONS
    appendCoordinate(coordinate) { }
    draw() { }
}
//# sourceMappingURL=core.js.map