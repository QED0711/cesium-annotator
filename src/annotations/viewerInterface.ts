import * as Cesium from 'cesium';
import { Annotation } from './core';
import { Coordinate } from './coordinate';
import { AltQueryType, AnnotationEntity, HandleEntity, ViewerInterfaceInitOptions } from '../utils/types';

/******************************************************************************
 * ***************************** VIEWER INTERFACE ***************************** 
 *****************************************************************************/

interface ViewerInterfaceConstructor {
    interfaces: ViewerInterface[],
}

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
    private detectedPointerMove: boolean
    private lastPointerUpTime: number;
    longPressComplete: boolean;
    overrideDefaultClickEvents: boolean;

    private useAltitude: AltQueryType;
    private terrainSampleLevel: number;
    private altQueryFallback: AltQueryType;

    static interfaces: ViewerInterface[];

    private constructor(viewer: Cesium.Viewer, options: ViewerInterfaceInitOptions) {
        this.viewer = viewer;
        this.canvas = viewer.canvas;
        this.events = {};

        this.overrideDefaultClickEvents = options.overrideDefaultClickEvents ?? true;

        this.useAltitude = options.useAltitude ?? AltQueryType.NONE;
        this.terrainSampleLevel = options.terrainSampleLevel ?? 12;
        this.altQueryFallback = options.altQueryFallback ?? AltQueryType.DEFAULT

        this.longPressComplete = false;
        this.detectedPointerMove = false;
        this.lastPointerUpTime = 0;

        this.init();

        const constructor = this.constructor as unknown as ViewerInterfaceConstructor;
        constructor.interfaces = constructor.interfaces ?? [];
        constructor.interfaces.push(this);
    }

    static registerViewer(viewer: Cesium.Viewer, options: ViewerInterfaceInitOptions): ViewerInterface {
        const existingInterface = this.interfaces?.find?.(intfc => intfc.viewer === viewer)
        if (existingInterface) return existingInterface;

        return new ViewerInterface(viewer, options);
    }

    init() {
        // tracking long press initiation
        this.pointerDownHandler = (e: PointerEvent) => {
            this.detectedPointerMove = false
            this.longPressTimeout = setTimeout(() => {
                this.longPressComplete = true;
                let foundEntity = this.queryEntityAtPixel();
                if ((foundEntity as HandleEntity)?._isHandle) {
                    foundEntity = foundEntity as HandleEntity;
                    if (foundEntity._handleIdx !== undefined) {
                        foundEntity._parentAnnotation.removePointAtIndex(foundEntity._handleIdx);
                    }
                }
            }, 500)
        }

        // stop long press & track last known x, y coordinates
        this.pointerMoveHandler = (e: PointerEvent) => {
            clearTimeout(this.longPressTimeout);
            this.cursorX = e.offsetX;
            this.cursorY = e.offsetY;
            this.detectedPointerMove = true;
        }

        // track long press exit
        this.pointerUpHandler = (e: PointerEvent) => {
            clearTimeout(this.longPressTimeout);
            setTimeout(() => this.longPressComplete = false, 0);

            const now = Date.now();
            if(!this.detectedPointerMove && now - this.lastPointerUpTime > 200) {
                let foundEntity = this.queryEntityAtPixel();
                if (foundEntity !== null && (foundEntity as AnnotationEntity | HandleEntity)?._canActivate) {
                    if ((foundEntity as AnnotationEntity)._annotation) {
                        foundEntity = foundEntity as AnnotationEntity;
                        foundEntity._annotation.registry.activateByID(foundEntity._annotation.id);
                    }
                    // for point types
                    if ((foundEntity as HandleEntity)._parentAnnotation) {
                        foundEntity = foundEntity as HandleEntity;
                        foundEntity._parentAnnotation.registry.activateByID(foundEntity._parentAnnotation.id);
                    }
                }
            }
            this.detectedPointerMove = false;
            this.lastPointerUpTime = now;
        }

        this.canvas.addEventListener("pointermove", this.pointerMoveHandler);
        this.canvas.addEventListener("pointerdown", this.pointerDownHandler);
        this.canvas.addEventListener("pointerup", this.pointerUpHandler);

        // Override default screen space events
        if(this.overrideDefaultClickEvents) {
            this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        }
    }

    removeHandlers() {
        !!this.pointerDownHandler && this.canvas.removeEventListener("pointerdown", this.pointerDownHandler);
        !!this.pointerMoveHandler && this.canvas.removeEventListener("pointermove", this.pointerMoveHandler);
        !!this.pointerUpHandler && this.canvas.removeEventListener("pointermove", this.pointerUpHandler);
    }

    async getCoordinateAtPixel(x?: number, y?: number, options: {bypassAlt: boolean} = {bypassAlt: false}): Promise<Coordinate | null> {
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

        let alt: number = 0;
        if(!options.bypassAlt) {
            if(this.useAltitude === AltQueryType.DEFAULT) alt = cartographicPosition.height;
            if(this.useAltitude === AltQueryType.TERRAIN) {
                let cartWithHeight: Cesium.Cartographic[] = [];
                if(this.terrainSampleLevel === Infinity) {
                    cartWithHeight = await Cesium.sampleTerrainMostDetailed(
                        this.viewer.terrainProvider,
                        [cartographicPosition]
                    )
                } else {
                    cartWithHeight = await Cesium.sampleTerrain(
                        this.viewer.terrainProvider,
                        this.terrainSampleLevel,
                        [cartographicPosition]
                    )
                }
                alt = cartWithHeight[0]?.height ?? 0;
                // if the terrain sampling failed and the fallback is to use the default cartographic height, set the alt accordingly
                if(alt === 0 && this.altQueryFallback === AltQueryType.DEFAULT) {
                    alt = cartographicPosition.height
                };
            } 
        }
        
        return new Coordinate({ lat, lng, alt });
    }

    queryEntityAtPixel(x?: number, y?: number): AnnotationEntity | HandleEntity | null {
        x ??= this.cursorX;
        y ??= this.cursorY;
        const scene = this.viewer.scene;

        const pixelPosition = new Cesium.Cartesian2(x, y);
        const pickedObject = scene.pick(pixelPosition)

        if (Cesium.defined(pickedObject)) {
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
        if(eventName in (this.events[annotation.id] ?? {})) return;
        const func = callback.bind(annotation);
        this.canvas.addEventListener(eventName, func)
        this.events[annotation.id] = { ...(this.events[annotation.id] ?? {}), [eventName]: func }
    }

    unregisterListenersByAnnotationID(id: string) {
        const listeners = this.events[id];
        if (!!listeners) {
            for (let [eventName, func] of Object.entries(listeners)) {
                this.viewer.canvas.removeEventListener(eventName, func);
            }
        }
        delete this.events[id];
    }
}