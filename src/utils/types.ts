import * as Cesium from 'cesium';
import { Annotation } from '../annotations/core';
import { Coordinate } from '../annotations/coordinate';
import { Registry } from '../annotations/registry';

/* INITIALIZATION OPTIONS */
export type CoordinateInit = {
    lng: number,
    lat: number,
    alt?: number
}

export type AnnotationBaseInit = {
    id?: string,
    liveUpdate?: boolean,
    userInteractive?: boolean,
    bypassTerrainSampleOnDrag?: boolean,
    entityProperties?: Cesium.Entity.ConstructorOptions,
    handleType?: HandleType
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions,
    groupRecords?: GroupRecord[],
    attributes?: { [key: string]: any }
}

export type RegistryInit = {
    id: string,
    viewer: Cesium.Viewer,
    useAltitude?: AltQueryType,
    terrainSampleLevel?: number,
    altQueryFallback?: AltQueryType,
    pointerMovementThreshold?: number,
}

export type ViewerInterfaceInitOptions = {
    overrideDefaultClickEvents?: boolean,
    useAltitude?: AltQueryType,
    terrainSampleLevel?: number,
    altQueryFallback?: AltQueryType,
    pointerMovementThreshold?: number
}

export type RegistryAddInitOptions = {
    replaceExisting?: boolean
}

export type GroupInitOptions = {
    id?: string,
    name?: string
}

export type DrawOptions = {
    forceLiveRedraw?: boolean,
}

// ENUMS
export enum DistanceUnit {
    METERS = "meters",
    KILOMETERS = "kilometers",
    FEET = "feet",
    MILES = "miles"
}

export enum AnnotationType {
    BASE = "base",
    POINT = "point",
    POLYLINE = "polyline",
    POLYGON = "polygon",
    RECTANGLE = "rectangle",
    RING = "ring",
}

export enum HandleType {
    POINT,
    BILLBOARD,
}

export enum AltQueryType {
    NONE = "none",
    DEFAULT = "default",
    TERRAIN = "terrain",
}

export type AnnotationEntity = Cesium.Entity & {
    _canActivate: boolean,
    _annotation: Annotation,
    // _isHandle?: boolean,
    // _handleIdx?: number,
    // _handleCoordinateID?:string
}

export type HandleEntity = Cesium.Entity & {
    _canActivate: boolean,
    _parentAnnotation: Annotation,
    _isHandle: boolean,
    _handleIdx: number,
    _handleCoordinateID?: string,
    // _handleCoordinate: Coordinate
}

export type HandleFoundRecord = {
    index: number,
    handleID: string,
}

export type MidPointHandleEntity = AnnotationEntity & {
    _isMidpointHandle: boolean,
    _coordinate: Coordinate,
    _idxBookends: number[]
}

export type GroupRecord = {
    id: string,
    name: string
}

// EVENTS 
export enum EventType {
    UPDATE = "update",
    ACTIVATE = "activate",
    APPEND = "append",
    DEACTIVATE = "deactivate",
    REMOVE_ENTITY = "removeEntity",
    UNDO = "undo",
    REDO = "redo",
    SHOW = "show",
    HIDE = "hide",
    PRE_DELETE = "pre_delete",
    DELETE = "delete",
    ATTRIBUTE = "attribute_update",
    PROPERTY = "property_update",
    ENTITY_PROPERTY = "entity_property_update",
    DOUBLE_CLICK = "double_click",
}

export enum RegistryEventType {
    ADD = "add",
    DELETE = "delete",
    UPDATE = "update",
}

export type AnnotationEventPayload = {
    annotation: Annotation
}

export type RegistryEventPayload = {
    registry: Registry,
    annotations: Annotation[]
}

export type EventListItem = {
    eventName: EventType,
    callback: (payload: AnnotationEventPayload) => void,
}

// CESIUM OPTIONS
export enum FlyToType {
    ENTITY = "entity",
    GEOSPATIAL_MEAN = "mean",
    BBOX = "bbox",
    FIRST = "first",
    LAST = "last",
}

export type FlyToOptions = {[key: string]: any} & {
    locationType?: FlyToType,
    duration?: number,
    maximumHeight?: number,
    offset?: Cesium.HeadingPitchRange
}

// GEOJSON FORMATTING
export type GeoJsonLoaderOptions = {
    propertiesInitKey?: string,
    shouldDraw?: boolean,
    preInitCallback?: (payload: { geoJson: GeoJsonFeature }) => GeoJsonFeature | null | undefined | void,
    preDrawCallback?: (payload: { annotation: Annotation, geoJson: GeoJsonFeature | GeoJsonFeatureCollection }) => Annotation | null | undefined | void
    asyncPreInitCallback?: (payload: { geoJson: GeoJsonFeature }) => Promise<GeoJsonFeature | null | undefined | void>,
    asyncPreDrawCallback?: (payload: { annotation: Annotation, geoJson: GeoJsonFeature | GeoJsonFeatureCollection }) => Promise<Annotation | null | undefined | void>
}

export enum GeoJsonType {
    POINT = "Point",
    POLYLINE = "LineString",
    POLYGON = "Polygon",
}

export type GeoJsonFeature = {
    type: string,
    properties: { [key: string]: any },
    geometry: {
        coordinates: number[] | number[][] | number[][][],
        type: GeoJsonType | string
    }
}

export type GeoJsonFeatureCollection = {
    type: string,
    features: GeoJsonFeature[]
}

export type GeoJsonGeometryCollection = GeoJsonFeatureCollection & {
    geometry: Record<string, any>,
}
