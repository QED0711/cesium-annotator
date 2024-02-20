import * as Cesium from 'cesium';
import { Annotation } from '../annotations/core';
export type CoordinateInit = {
    lng: number;
    lat: number;
    alt?: number;
};
export type AnnotationBaseInit = {
    id?: string;
    liveUpdate?: boolean;
    userInteractive?: boolean;
};
export type RegistryInit = {
    id: string;
    viewer: Cesium.Viewer;
};
export declare enum DistanceUnit {
    METERS = "meters",
    KILOMETERS = "kilometers",
    FEET = "feet",
    MILES = "miles"
}
export declare enum AnnotationType {
    BASE = "base",
    POINT = "point",
    POLYLINE = "polyline",
    POLYGON = "polygon",
    RECTANGLE = "rectangle",
    RING = "ring"
}
export type AnnotationEntity = Cesium.Entity & {
    _annotation: Annotation;
    _isHandle?: boolean;
    _handleIdx?: number;
    _handleCoordinateID?: string;
};
export type HandleFoundRecord = {
    index: number;
    handleID: string;
};
