import * as Cesium from 'cesium';
import { Annotation } from './core';
import { Coordinate } from './coordinate';
import { AnnotationEntity, HandleEntity, ViewerInterfaceInitOptions } from '../utils/types';
export declare class ViewerInterface {
    viewer: Cesium.Viewer;
    events: {
        [key: string]: {
            [eventName: string]: EventListener;
        };
    };
    private canvas;
    private cursorX?;
    private cursorY?;
    private pointerMoveHandler?;
    private pointerDownHandler?;
    private pointerUpHandler?;
    private longPressTimeout?;
    private detectedPointerMove;
    private lastPointerUpTime;
    longPressComplete: boolean;
    overrideDefaultClickEvents: boolean;
    private useAltitude;
    terrainSampleLevel: number;
    private altQueryFallback;
    private pointerMovementThreshold;
    static interfaces: ViewerInterface[];
    private constructor();
    static registerViewer(viewer: Cesium.Viewer, options: ViewerInterfaceInitOptions): ViewerInterface;
    init(): void;
    removeHandlers(): void;
    getCoordinateAtPixel(x?: number, y?: number, options?: {
        bypassAlt: boolean;
    }): Promise<Coordinate | null>;
    queryEntityAtPixel(x?: number, y?: number): AnnotationEntity | HandleEntity | null;
    lock(): void;
    unlock(): void;
    registerListener(eventName: string, callback: Function, annotation: Annotation): void;
    unregisterListenersByAnnotationID(id: string): void;
}
