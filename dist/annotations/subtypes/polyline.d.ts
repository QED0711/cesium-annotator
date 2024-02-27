import * as Cesium from 'cesium';
import { AnnotationBaseInit, DistanceUnit, GeoJsonFeatureCollection } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';
export type PolylineInitOptions = AnnotationBaseInit & {
    polylineProperties?: Cesium.PolylineGraphics.ConstructorOptions;
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    entityProperties?: Cesium.Entity.ConstructorOptions;
    midpointMarkers?: boolean;
};
export default class Polyline extends Annotation {
    polylineProperties: Cesium.PolylineGraphics.ConstructorOptions;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    entityProperties?: Cesium.Entity.ConstructorOptions;
    private midpointMarkers;
    private midPointHandles;
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
