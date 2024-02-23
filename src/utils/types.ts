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
    handleType?: HandleType
    attributes?: {[key: string]: any}
}

export type RegistryInit = {
    id: string,
    viewer: Cesium.Viewer,
    useAltitude?: boolean,
}

export type ViewerInterfaceInitOptions = {
    useAltitude?: boolean
}

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

export type AnnotationEntity = Cesium.Entity & {
    _annotation: Annotation,
    _isHandle?: boolean,
    _handleIdx?: number,
    _handleCoordinateID?:string
}

export type HandleEntity = Cesium.Entity & {
    _isHandle: boolean,
    _handleIdx: number,
    _handleCoordinate: Coordinate
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