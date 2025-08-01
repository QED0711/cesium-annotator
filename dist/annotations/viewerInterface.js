var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as Cesium from 'cesium';
import { Coordinate } from './coordinate';
import { AltQueryType } from '../utils/types';
export class ViewerInterface {
    constructor(viewer, options) {
        var _a, _b, _c, _d, _e, _f;
        this.viewer = viewer;
        this.canvas = viewer.canvas;
        this.events = {};
        this.overrideDefaultClickEvents = (_a = options.overrideDefaultClickEvents) !== null && _a !== void 0 ? _a : true;
        this.useAltitude = (_b = options.useAltitude) !== null && _b !== void 0 ? _b : AltQueryType.NONE;
        this.terrainSampleLevel = (_c = options.terrainSampleLevel) !== null && _c !== void 0 ? _c : 12;
        this.altQueryFallback = (_d = options.altQueryFallback) !== null && _d !== void 0 ? _d : AltQueryType.DEFAULT;
        this.longPressComplete = false;
        this.detectedPointerMove = false;
        this.lastPointerUpTime = 0;
        this.pointerMovementThreshold = (_e = options.pointerMovementThreshold) !== null && _e !== void 0 ? _e : 0;
        this.init();
        const constructor = this.constructor;
        constructor.interfaces = (_f = constructor.interfaces) !== null && _f !== void 0 ? _f : [];
        constructor.interfaces.push(this);
    }
    static registerViewer(viewer, options) {
        var _a, _b;
        const existingInterface = (_b = (_a = this.interfaces) === null || _a === void 0 ? void 0 : _a.find) === null || _b === void 0 ? void 0 : _b.call(_a, intfc => intfc.viewer === viewer);
        if (existingInterface)
            return existingInterface;
        return new ViewerInterface(viewer, options);
    }
    init() {
        // tracking long press initiation
        this.pointerDownHandler = (e) => {
            this.detectedPointerMove = false;
            this.longPressTimeout = setTimeout(() => {
                this.longPressComplete = true;
                let foundEntity = this.queryEntityAtPixel();
                if (foundEntity === null || foundEntity === void 0 ? void 0 : foundEntity._isHandle) {
                    foundEntity = foundEntity;
                    if (foundEntity._parentAnnotation.isLocked)
                        return; // if the annotation has a temp lock, don't allow removal of its handles
                    if (foundEntity._handleIdx !== undefined) {
                        foundEntity._parentAnnotation.removePointAtIndex(foundEntity._handleIdx);
                    }
                }
            }, 500);
        };
        // stop long press & track last known x, y coordinates
        this.pointerMoveHandler = (e) => {
            var _a, _b;
            clearTimeout(this.longPressTimeout);
            const originalX = (_a = this.cursorX) !== null && _a !== void 0 ? _a : e.offsetX;
            const originalY = (_b = this.cursorY) !== null && _b !== void 0 ? _b : e.offsetY;
            const newX = e.offsetX;
            const newY = e.offsetY;
            if (Math.abs(newX - originalX) >= this.pointerMovementThreshold ||
                Math.abs(newY - originalY) >= this.pointerMovementThreshold) {
                this.detectedPointerMove = true;
            }
            this.cursorX = newX;
            this.cursorY = newY;
        };
        // track long press exit
        this.pointerUpHandler = (e) => {
            clearTimeout(this.longPressTimeout);
            setTimeout(() => this.longPressComplete = false, 0);
            const now = Date.now();
            if (!this.detectedPointerMove && now - this.lastPointerUpTime > 200) {
                let foundEntity = this.queryEntityAtPixel();
                if (foundEntity !== null && (foundEntity === null || foundEntity === void 0 ? void 0 : foundEntity._canActivate)) {
                    if (foundEntity._annotation) {
                        foundEntity = foundEntity;
                        foundEntity._annotation.registry.activateByID(foundEntity._annotation.id);
                    }
                    // for point types
                    if (foundEntity._parentAnnotation) {
                        foundEntity = foundEntity;
                        foundEntity._parentAnnotation.registry.activateByID(foundEntity._parentAnnotation.id);
                    }
                }
            }
            this.detectedPointerMove = false;
            this.lastPointerUpTime = now;
        };
        this.canvas.addEventListener("pointermove", this.pointerMoveHandler);
        this.canvas.addEventListener("pointerdown", this.pointerDownHandler);
        this.canvas.addEventListener("pointerup", this.pointerUpHandler);
        // Override default screen space events
        if (this.overrideDefaultClickEvents) {
            this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        }
    }
    removeHandlers() {
        !!this.pointerDownHandler && this.canvas.removeEventListener("pointerdown", this.pointerDownHandler);
        !!this.pointerMoveHandler && this.canvas.removeEventListener("pointermove", this.pointerMoveHandler);
        !!this.pointerUpHandler && this.canvas.removeEventListener("pointermove", this.pointerUpHandler);
    }
    getCoordinateAtPixel(x, y, options = { bypassAlt: false }) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
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
            let alt = 0;
            if (!options.bypassAlt) {
                if (this.useAltitude === AltQueryType.DEFAULT)
                    alt = cartographicPosition.height;
                if (this.useAltitude === AltQueryType.TERRAIN) {
                    let cartWithHeight = [];
                    if (this.terrainSampleLevel === Infinity) {
                        cartWithHeight = yield Cesium.sampleTerrainMostDetailed(this.viewer.terrainProvider, [cartographicPosition]);
                    }
                    else {
                        cartWithHeight = yield Cesium.sampleTerrain(this.viewer.terrainProvider, this.terrainSampleLevel, [cartographicPosition]);
                    }
                    alt = (_b = (_a = cartWithHeight[0]) === null || _a === void 0 ? void 0 : _a.height) !== null && _b !== void 0 ? _b : 0;
                    // if the terrain sampling failed and the fallback is to use the default cartographic height, set the alt accordingly
                    if (alt === 0 && this.altQueryFallback === AltQueryType.DEFAULT) {
                        alt = cartographicPosition.height;
                    }
                    ;
                }
            }
            return new Coordinate({ lat, lng, alt });
        });
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
        var _a, _b;
        if (eventName in ((_a = this.events[annotation.id]) !== null && _a !== void 0 ? _a : {}))
            return;
        const func = callback.bind(annotation);
        this.canvas.addEventListener(eventName, func);
        this.events[annotation.id] = Object.assign(Object.assign({}, ((_b = this.events[annotation.id]) !== null && _b !== void 0 ? _b : {})), { [eventName]: func });
    }
    unregisterListenersByAnnotationID(id) {
        const listeners = this.events[id];
        if (!!listeners) {
            for (let [eventName, func] of Object.entries(listeners)) {
                this.viewer.canvas.removeEventListener(eventName, func);
            }
        }
        delete this.events[id];
    }
}
//# sourceMappingURL=viewerInterface.js.map