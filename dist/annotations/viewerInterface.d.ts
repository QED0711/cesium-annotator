import * as Cesium from 'cesium';
import { Annotation } from './core';
import { Coordinate } from './coordinate';
import { AnnotationEntity, ViewerInterfaceInitOptions } from '../utils/types';
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
    private pointerDownHandler?;
    private pointerUpHandler?;
    private longPressTimeout?;
    longPressComplete: boolean;
    useAltitude: boolean;
    constructor(viewer: Cesium.Viewer, options: ViewerInterfaceInitOptions);
    init(): void;
    removeHandlers(): void;
    getCoordinateAtPixel(x?: number, y?: number): Coordinate | null;
    queryEntityAtPixel(x?: number, y?: number): AnnotationEntity | null;
    lock(): void;
    unlock(): void;
    registerListener(eventName: string, callback: Function, annotation: Annotation): void;
    unregisterListenersByAnnotationID(id: string): void;
}
