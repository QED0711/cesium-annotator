import * as Cesium from 'cesium';
import { Annotation } from '../annotations/core';
import { Coordinate } from '../annotations/coordinate';

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
}

export type ViewerInterfaceInitOptions = {
    overrideDefaultClickEvents?: boolean,
    useAltitude?: AltQueryType,
    terrainSampleLevel?: number,
    altQueryFallback?: AltQueryType,
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
    DELETE = "delete",
    ATTRIBUTE = "attribute_update",
    PROPERTY = "property_update"
}

export type AnnotationEventPayload = {
    annotation: Annotation
}

export type EventListItem = {
    eventName: EventType,
    callback: (payload: AnnotationEventPayload) => void,
}

// CESIUM OPTIONS
export type FlyToOptions = {
    duration?: number,
    maximumHeight?: number,
    offset?: Cesium.HeadingPitchRange
}

// GEOJSON FORMATTING
export type GeoJsonLoaderOptions = {
    propertiesInitKey?: string,
    preInitCallback?: (payload: { geoJson: GeoJsonFeature }) => GeoJsonFeature | null | undefined | void,
    preDrawCallback?: (payload: { annotation: Annotation, geoJson: GeoJsonFeature | GeoJsonFeatureCollection }) => Annotation | null | undefined | void
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
