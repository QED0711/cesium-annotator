import * as Cesium from 'cesium';
import { Registry, ViewerInterface } from './registry';
export type CoordinateInit = {
    lng: number;
    lat: number;
    alt?: number;
};
export type AnnotationBaseInit = {
    registry: Registry;
    viewerInterface: ViewerInterface;
    id?: string;
    liveUpdate?: boolean;
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
