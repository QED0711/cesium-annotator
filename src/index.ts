/**
 * Installation: npm install cesium-annotator
 */
export * from './annotations/core';
export * from './annotations/coordinate';
export * from './annotations/registry';

export * from "./annotations/subtypes/point";
export * from "./annotations/subtypes/polyline";
export * from "./annotations/subtypes/polygon";
export * from "./annotations/subtypes/rectangle";
export * from "./annotations/subtypes/ring";

export {
    CoordinateInit,
    AnnotationBaseInit,
    RegistryInit,
    RegistryAddInitOptions,
    GroupInitOptions,

    DistanceUnit,
    AnnotationType,
    HandleType,
    AltQueryType,

    EventType,
    AnnotationEventPayload,
    EventListItem,
    RegistryEventType,
    RegistryEventPayload,

    FlyToType,
    FlyToOptions,
    GeoJsonLoaderOptions,
    GeoJsonType,
    GeoJsonFeature,
    GeoJsonFeatureCollection,
    GeoJsonGeometryCollection,
} from './utils/types'