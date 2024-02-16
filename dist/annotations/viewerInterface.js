import * as Cesium from 'cesium';
import { Coordinate } from './core';
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
    // addEventListener(eventName: string, callback: Function) {
    //     this.events[eventName] = eventName in this.events
    //         ? [...this.events[eventName], callback]
    //         : [callback]
    // }
    // removeEventListener(eventName: string, callback: Function) {
    //     if (eventName in this.events) {
    //         this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    //     }
    // }
    getCoordinateAtPixel(x, y) {
        x !== null && x !== void 0 ? x : (x = this.cursorX);
        y !== null && y !== void 0 ? y : (y = this.cursorY);
        const scene = this.viewer.scene;
        const pixelPosition = new Cesium.Cartesian2(x, y);
        const ray = this.viewer.camera.getPickRay(pixelPosition);
        if (!ray)
            return null;
        const cartesianPosition = scene.globe.pick(ray, scene);
        if (!cartesianPosition)
            return null;
        const cartographicPosition = Cesium.Cartographic.fromCartesian(cartesianPosition);
        const lng = Cesium.Math.toDegrees(cartographicPosition.longitude);
        const lat = Cesium.Math.toDegrees(cartographicPosition.latitude);
        const alt = Cesium.Math.toDegrees(cartographicPosition.height);
        return new Coordinate({ lat, lng, alt });
    }
    queryEntityAtPixel(x, y) {
        x !== null && x !== void 0 ? x : (x = this.cursorX);
        y !== null && y !== void 0 ? y : (y = this.cursorY);
        const scene = this.viewer.scene;
        const pixelPosition = new Cesium.Cartesian2(x, y);
        const pickedObject = scene.pick(pixelPosition);
        if (Cesium.defined(pickedObject)) {
            return pickedObject.id;
        }
        return null;
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
    registerListener(eventName, callback, annotation) {
        var _a;
        const func = callback.bind(annotation);
        this.canvas.addEventListener(eventName, func);
        this.events[annotation.id] = Object.assign(Object.assign({}, ((_a = this.events[annotation.id]) !== null && _a !== void 0 ? _a : {})), { [eventName]: func });
    }
    unregisterListenersByAnnotationID(id) {
        const listeners = this.events[id];
        if (!!listeners) {
            for (let [eventName, func] of Object.entries(listeners)) {
                this.canvas.removeEventListener(eventName, func);
            }
        }
    }
}
//# sourceMappingURL=viewerInterface.js.map