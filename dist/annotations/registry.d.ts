import * as Cesium from 'cesium';
import { RegistryInit } from '../utils/types';
import { ViewerInterface } from './viewerInterface';
import { Annotation } from './core';
import PointAnnotation, { PointInitOptions } from './subtypes/point';
import PolylineAnnotation, { PolylineInitOptions } from './subtypes/polyline';
import PolygonAnnotation, { PolygonInitOptions } from './subtypes/polygon';
import RectangleAnnotation, { RectangleInitOptions } from './subtypes/rectangle';
import RingAnnotation, { RingInitOptions } from './subtypes/ring';
/******************************************************************************
 * ***************************** GROUP *****************************
 *****************************************************************************/
export declare class AnnotationGroup {
    id: string;
    name?: string;
    annotations: Set<Annotation>;
    constructor(name?: string);
    capture(annotation: Annotation): void;
    release(annotation: Annotation): void;
    releaseAll(): void;
    executeCallback(func: (annotation: Annotation) => {}): void;
    show(): void;
    hide(): void;
    deleteAll(): void;
}
/******************************************************************************
 * ***************************** REGISTRY *****************************
 *****************************************************************************/
export declare class Registry {
    id: string;
    annotations: Annotation[];
    groups: AnnotationGroup[];
    viewer: Cesium.Viewer;
    viewerInterface: ViewerInterface;
    useAltitude: boolean;
    constructor(init: RegistryInit);
    getAnnotationByID(id: string): Annotation | null | undefined;
    deleteByID(id: string): void;
    activateByID(id: string): void;
    createGroup(name?: string): AnnotationGroup;
    getGroupByID(id: string): AnnotationGroup | null;
    getGroupByName(name: string): AnnotationGroup | null;
    deleteGroupByID(id: string, options: {
        deleteAnnotations?: boolean;
        releaseAnnotations?: boolean;
    } | undefined): void;
    addPoint(options: PointInitOptions): PointAnnotation;
    addPolyline(options: PolylineInitOptions): PolylineAnnotation;
    addPolygon(options: PolygonInitOptions): PolygonAnnotation;
    addRectangle(options: RectangleInitOptions): RectangleAnnotation;
    addRing(options: RingInitOptions): RingAnnotation;
}
