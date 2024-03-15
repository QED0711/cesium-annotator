import * as Cesium from 'cesium';
import { Annotation } from '../annotations/core';
import { Coordinate } from '../annotations/coordinate';
import { Registry } from '../annotations/registry';
export type CoordinateInit = {
    lng: number;
    lat: number;
    alt?: number;
};
export type AnnotationBaseInit = {
    id?: string;
    liveUpdate?: boolean;
    userInteractive?: boolean;
    bypassTerrainSampleOnDrag?: boolean;
    entityProperties?: Cesium.Entity.ConstructorOptions;
    handleType?: HandleType;
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    groupRecords?: GroupRecord[];
    attributes?: {
        [key: string]: any;
    };
};
export type RegistryInit = {
    id: string;
    viewer: Cesium.Viewer;
    useAltitude?: AltQueryType;
    terrainSampleLevel?: number;
    altQueryFallback?: AltQueryType;
};
export type ViewerInterfaceInitOptions = {
    overrideDefaultClickEvents?: boolean;
    useAltitude?: AltQueryType;
    terrainSampleLevel?: number;
    altQueryFallback?: AltQueryType;
};
export type RegistryAddInitOptions = {
    replaceExisting?: boolean;
};
export type GroupInitOptions = {
    id?: string;
    name?: string;
};
export type DrawOptions = {
    forceLiveRedraw?: boolean;
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
export declare enum AltQueryType {
    NONE = "none",
    DEFAULT = "default",
    TERRAIN = "terrain"
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
export type GroupRecord = {
    id: string;
    name: string;
};
export declare enum EventType {
    UPDATE = "update",
    ACTIVATE = "activate",
    APPEND = "append",
    DEACTIVATE = "deactivate",
    REMOVE_ENTITY = "removeEntity",
    UNDO = "undo",
    REDO = "redo",
    DELETE = "delete",
    ATTRIBUTE = "attribute_update",
    PROPERTY = "property_update"
}
export declare enum RegistryEventType {
    ADD = "add",
    DELETE = "delete",
    UPDATE = "update"
}
export type AnnotationEventPayload = {
    annotation: Annotation;
};
export type RegistryEventPayload = {
    registry: Registry;
    annotations: Annotation[];
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
    shouldDraw?: boolean;
    preInitCallback?: (payload: {
        geoJson: GeoJsonFeature;
    }) => GeoJsonFeature | null | undefined | void;
    preDrawCallback?: (payload: {
        annotation: Annotation;
        geoJson: GeoJsonFeature | GeoJsonFeatureCollection;
    }) => Annotation | null | undefined | void;
    asyncPreInitCallback?: (payload: {
        geoJson: GeoJsonFeature;
    }) => Promise<GeoJsonFeature | null | undefined | void>;
    asyncPreDrawCallback?: (payload: {
        annotation: Annotation;
        geoJson: GeoJsonFeature | GeoJsonFeatureCollection;
    }) => Promise<Annotation | null | undefined | void>;
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
