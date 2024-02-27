import * as Cesium from 'cesium';
import { AnnotationBaseInit, DistanceUnit, GeoJsonFeatureCollection, HandleType } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';
export type PolylineInitOptions = AnnotationBaseInit & {
    polylineProperties?: Cesium.PolylineGraphics.ConstructorOptions;
    entityProperties?: Cesium.Entity.ConstructorOptions;
    midpointHandles?: boolean;
    midpointHandleType?: HandleType;
    midpointHandleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
};
export default class Polyline extends Annotation {
    polylineProperties: Cesium.PolylineGraphics.ConstructorOptions;
    entityProperties?: Cesium.Entity.ConstructorOptions;
    private midpointHandles;
    midpointHandleType: HandleType;
    midpointHandleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    private mpHandles;
    constructor(registry: Registry, options: PolylineInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
    handlePointerDown(e: PointerEvent): void;
    syncHandles(): void;
    hideHandles(): void;
    showHandles(): void;
    toGeoJson(): GeoJsonFeatureCollection | null;
    getTotalDistance(unit?: DistanceUnit): number;
    getDistanceSegments(unit?: DistanceUnit): number[];
    getHeadingSegments(): number[];
}
