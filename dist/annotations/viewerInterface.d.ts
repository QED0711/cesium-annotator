import * as Cesium from 'cesium';
import { Annotation, Coordinate } from './core';
/******************************************************************************
 * ***************************** VIEWER INTERFACE *****************************
 *****************************************************************************/
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
    constructor(viewer: Cesium.Viewer);
    init(): void;
    removeHandlers(): void;
    getCoordinateAtPixel(x?: number, y?: number): Coordinate | null;
    queryEntityAtPixel(x?: number, y?: number): Cesium.Entity | null;
    lock(): void;
    unlock(): void;
    registerListener(eventName: string, callback: Function, annotation: Annotation): void;
    unregisterListenersByAnnotationID(id: string): void;
}
