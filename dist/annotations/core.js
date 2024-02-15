import * as Cesium from 'cesium';
import { nanoid } from 'nanoid';
export var DistanceUnit;
(function (DistanceUnit) {
    DistanceUnit["METERS"] = "meters";
    DistanceUnit["KILOMETERS"] = "kilometers";
    DistanceUnit["FEET"] = "feet";
    DistanceUnit["MILES"] = "miles";
})(DistanceUnit || (DistanceUnit = {}));
export var AnnotationType;
(function (AnnotationType) {
    AnnotationType["BASE"] = "base";
    AnnotationType["POINT"] = "point";
    AnnotationType["POLYLINE"] = "polyline";
    AnnotationType["POLYGON"] = "polygon";
    AnnotationType["RECTANGLE"] = "rectangle";
    AnnotationType["RING"] = "ring";
})(AnnotationType || (AnnotationType = {}));
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
    constructor(init) {
        var _a, _b;
        this.viewerInterface = init.viewerInterface;
        this.id = (_a = init.id) !== null && _a !== void 0 ? _a : nanoid();
        this.points = [];
        this.history = [];
        this.isStatic = (_b = init.isStatic) !== null && _b !== void 0 ? _b : true;
        this.entity = null;
        this.handles = [];
        this.isActive = false;
    }
    get current() {
        return this.points;
    }
    activate() {
        this.isActive = true;
    }
    delete() {
        if (!!this.entity) {
            this.viewerInterface.viewer.entities.remove(this.entity);
        }
    }
}
/******************************************************************************
 * ***************************** VIEWER INTERFACE *****************************
 *****************************************************************************/
export class ViewerInterface {
    constructor(viewer) {
        this.viewer = viewer;
        this.canvas = viewer.canvas;
        this.events = {};
        this.init();
    }
    init() {
        this.pointerMoveHandler = (e) => {
            this.cursorX = e.offsetX;
            this.cursorY = e.offsetY;
        };
        this.canvas.addEventListener("pointermove", this.pointerMoveHandler);
    }
    removeHandlers() {
        if (!!this.pointerMoveHandler) {
            this.canvas.removeEventListener("pointermove", this.pointerMoveHandler);
        }
    }
    addEventListener(eventName, callback) {
        this.events[eventName] = eventName in this.events
            ? [...this.events[eventName], callback]
            : [callback];
    }
    removeEventListener(eventName, callback) {
        if (eventName in this.events) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        }
    }
    getCoordinateAtPixel(x, y) {
        x !== null && x !== void 0 ? x : (x = this.cursorX);
        y !== null && y !== void 0 ? y : (y = this.cursorY);
        const scene = this.viewer.scene;
        const pixelPosition = new Cesium.Cartesian2(x, y);
        let cartesianPosition = scene.pickPosition(pixelPosition);
        if (!cartesianPosition) {
            const ray = this.viewer.camera.getPickRay(pixelPosition);
            if (!ray)
                return null;
            cartesianPosition = scene.globe.pick(ray, scene);
        }
        if (!cartesianPosition)
            return null;
        const cartographicPosition = Cesium.Cartographic.fromCartesian(cartesianPosition);
        const lng = Cesium.Math.toDegrees(cartographicPosition.longitude);
        const lat = Cesium.Math.toDegrees(cartographicPosition.latitude);
        const alt = Cesium.Math.toDegrees(cartographicPosition.height);
        return new Coordinate({ lat, lng, alt });
    }
    lock() {
        this.viewer.scene.screenSpaceCameraController.enableRotate = false;
        this.viewer.scene.screenSpaceCameraController.enableTilt = false;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
    }
    unlock() {
        this.viewer.scene.screenSpaceCameraController.enableRotate = true;
        this.viewer.scene.screenSpaceCameraController.enableTilt = true;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
    }
}
/******************************************************************************
 * ***************************** REGISTRY *****************************
 *****************************************************************************/
export class Registry {
    constructor(init) {
        this.id = init.id;
        this.viewer = init.viewer;
        this.annotations = [];
        this.viewerInterface = new ViewerInterface(this.viewer);
    }
    getAnnotationByID(id) {
        return this.annotations.find(annotation => annotation.id === id);
    }
    deleteByID(id) {
        var _a;
        (_a = this.annotations
            .find(annotation => annotation.id === id)) === null || _a === void 0 ? void 0 : _a.delete();
    }
    add(subType, id) {
        let annotation;
        switch (subType) {
            case AnnotationType.BASE:
                annotation = new Annotation({ viewerInterface: this.viewerInterface, id });
                break;
            default:
                annotation = new Annotation({ viewerInterface: this.viewerInterface, id });
        }
        return annotation;
    }
}
//# sourceMappingURL=core.js.map