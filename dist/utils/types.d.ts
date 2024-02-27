import * as Cesium from 'cesium';
import { Annotation } from '../annotations/core';
import { Coordinate } from '../annotations/coordinate';
export type CoordinateInit = {
    lng: number;
    lat: number;
    alt?: number;
};
export type AnnotationBaseInit = {
    id?: string;
    liveUpdate?: boolean;
    userInteractive?: boolean;
    handleType?: HandleType;
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    attributes?: {
        [key: string]: any;
    };
};
export type RegistryInit = {
    id: string;
    viewer: Cesium.Viewer;
    useAltitude?: boolean;
};
export type ViewerInterfaceInitOptions = {
    useAltitude?: boolean;
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
export declare enum HandleType {
    POINT = 0,
    BILLBOARD = 1
}
export type AnnotationEntity = Cesium.Entity & {
    _canActivate: boolean;
    _annotation: Annotation;
};
export type HandleEntity = Cesium.Entity & {
    _canActivate: boolean;
    _parentAnnotation: Annotation;
    _isHandle: boolean;
    _handleIdx: number;
    _handleCoordinateID?: string;
};
export type HandleFoundRecord = {
    index: number;
    handleID: string;
};
export type MidPointHandleEntity = AnnotationEntity & {
    _isMidpointHandle: boolean;
    _coordinate: Coordinate;
    _idxBookends: number[];
};
export declare enum EventType {
    UPDATE = "update",
    ACTIVATE = "activate",
    APPEND = "append",
    DEACTIVATE = "deactivate",
    REMOVE_ENTITY = "removeEntity",
    UNDO = "undo",
    REDO = "redo",
    DELETE = "delete"
}
export type AnnotationEventPayload = {
    annotation: Annotation;
};
export type EventListItem = {
    eventName: EventType;
    callback: (payload: AnnotationEventPayload) => void;
};
export type FlyToOptions = {
    duration?: number;
    maximumHeight?: number;
    offset?: Cesium.HeadingPitchRange;
};
export type GeoJsonLoaderOptions = {
    propertiesInitKey?: string;
    preInitCallback?: (payload: {
        geoJson: GeoJsonFeature;
    }) => GeoJsonFeature | null | undefined | void;
    preDrawCallback?: (payload: {
        annotation: Annotation;
        geoJson: GeoJsonFeature | GeoJsonFeatureCollection;
    }) => Annotation | null | undefined | void;
};
export declare enum GeoJsonType {
    POINT = "Point",
    POLYLINE = "LineString",
    POLYGON = "Polygon"
}
export type GeoJsonFeature = {
    type: string;
    properties: {
        [key: string]: any;
    };
    geometry: {
        coordinates: number[] | number[][] | number[][][];
        type: GeoJsonType | string;
    };
};
export type GeoJsonFeatureCollection = {
    type: string;
    features: GeoJsonFeature[];
};
