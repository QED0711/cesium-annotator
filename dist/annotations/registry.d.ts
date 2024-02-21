import * as Cesium from 'cesium';
import { RegistryInit } from '../utils/types';
import { ViewerInterface } from './viewerInterface';
import { Annotation } from './core';
import PointAnnotation, { PointInitOptions } from './subtypes/point';
import PolylineAnnotation, { PolylineInitOptions } from './subtypes/polyline';
import PolygonAnnotation, { PolygonInitOptions } from './subtypes/polygon';
import RectangleAnnotation, { RectangleInitOptions } from './subtypes/rectangle';
/******************************************************************************
 * ***************************** REGISTRY *****************************
 *****************************************************************************/
export declare class Registry {
    id: string;
    annotations: Annotation[];
    viewer: Cesium.Viewer;
    viewerInterface: ViewerInterface;
    useAltitude: boolean;
    constructor(init: RegistryInit);
    getAnnotationByID(id: string): Annotation | null | undefined;
    deleteByID(id: string): void;
    activateByID(id: string): void;
    addPoint(options: PointInitOptions): PointAnnotation;
    addPolyline(options: PolylineInitOptions): PolylineAnnotation;
    addPolygon(options: PolygonInitOptions): PolygonAnnotation;
    addRectangle(options: RectangleInitOptions): RectangleAnnotation;
}
