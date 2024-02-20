import * as Cesium from 'cesium';
import { Annotation, Coordinate } from './core';
import { AnnotationEntity } from '../utils/types';

/******************************************************************************
 * ***************************** VIEWER INTERFACE ***************************** 
 *****************************************************************************/
export class ViewerInterface {

    viewer: Cesium.Viewer;
    events: { [key: string]: { [eventName: string]: EventListener } };
    private canvas: HTMLCanvasElement;
    private cursorX?: number
    private cursorY?: number

    private pointerMoveHandler?: ((e: PointerEvent) => void) | null;
    private pointerDownHandler?: ((e: PointerEvent) => void) | null;
    private pointerUpHandler?: ((e: PointerEvent) => void) | null;

    private longPressTimeout?: number | NodeJS.Timeout;
    longPressComplete: boolean;

    constructor(viewer: Cesium.Viewer) {
        this.viewer = viewer;
        this.canvas = viewer.canvas;
        this.events = {};

        this.longPressComplete = false;

        this.init();
    }

    init() {
        // tracking long press initiation
        this.pointerDownHandler = (e: PointerEvent) => {
            this.longPressTimeout = setTimeout(() => {
                this.longPressComplete = true;
                const foundEntity = this.queryEntityAtPixel();
                if(foundEntity?._isHandle && foundEntity._handleIdx !== undefined) {
                    foundEntity._annotation.removePointAtIndex(foundEntity._handleIdx);
                }
            }, 500)
        }

        // stop long press & track last known x, y coordinates
        this.pointerMoveHandler = (e: PointerEvent) => {
            clearTimeout(this.longPressTimeout);
            this.cursorX = e.offsetX;
            this.cursorY = e.offsetY;
        }

        // track long press exit
        this.pointerUpHandler = (e: PointerEvent) => {
            clearTimeout(this.longPressTimeout);
            setTimeout(() => this.longPressComplete = false, 0);
        }

        this.canvas.addEventListener("pointermove", this.pointerMoveHandler)
        this.canvas.addEventListener("pointerdown", this.pointerDownHandler)
        this.canvas.addEventListener("pointerup", this.pointerUpHandler);
    }

    removeHandlers() {
        !!this.pointerDownHandler && this.canvas.removeEventListener("pointerdown", this.pointerDownHandler);
        !!this.pointerMoveHandler && this.canvas.removeEventListener("pointermove", this.pointerMoveHandler);
        !!this.pointerUpHandler && this.canvas.removeEventListener("pointermove", this.pointerUpHandler);
    }

    getCoordinateAtPixel(x?: number, y?: number): Coordinate | null {
        x ??= this.cursorX;
        y ??= this.cursorY;
        const scene = this.viewer.scene;

        const pixelPosition = new Cesium.Cartesian2(x, y);

        const ray = this.viewer.camera.getPickRay(pixelPosition);
        if (!ray) return null;

        const cartesianPosition = scene.globe.pick(ray, scene);
        if (!cartesianPosition) return null

        const cartographicPosition = Cesium.Cartographic.fromCartesian(cartesianPosition);

        const lng = Cesium.Math.toDegrees(cartographicPosition.longitude);
        const lat = Cesium.Math.toDegrees(cartographicPosition.latitude);
        const alt = Cesium.Math.toDegrees(cartographicPosition.height);

        return new Coordinate({ lat, lng, alt });
    }

    queryEntityAtPixel(x?: number, y?: number): AnnotationEntity | null {
        x ??= this.cursorX;
        y ??= this.cursorY;
        const scene = this.viewer.scene;

        const pixelPosition = new Cesium.Cartesian2(x, y);
        const pickedObject = scene.pick(pixelPosition)

        if(Cesium.defined(pickedObject)) {
            return pickedObject.id
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

    registerListener(eventName: string, callback: Function, annotation: Annotation) {
        const func = callback.bind(annotation);
        this.canvas.addEventListener(eventName, func)
        
        this.events[annotation.id] = {...(this.events[annotation.id] ?? {}), [eventName]: func}
    }

    unregisterListenersByAnnotationID(id: string) {
        const listeners = this.events[id];
        if(!!listeners) {
            for(let [eventName, func] of Object.entries(listeners)) {
                this.canvas.removeEventListener(eventName, func);
            }
        }
    }
}