import * as Cesium from 'cesium';
import { AnnotationBaseInit, GeoJsonFeatureCollection } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';
export type PolygonInitOptions = AnnotationBaseInit & {
    polygonProperties?: Cesium.PolygonGraphics.ConstructorOptions | Cesium.PolylineGraphics.ConstructorOptions;
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    entityProperties?: Cesium.Entity.ConstructorOptions;
    drawAsLine?: boolean;
    midpointMarkers?: boolean;
};
export default class Polygon extends Annotation {
    drawAsLine: boolean;
    polygonProperties: Cesium.PolylineGraphics.ConstructorOptions;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    entityProperties: Cesium.Entity.ConstructorOptions;
    private midpointMarkers;
    private midPointHandles;
    constructor(registry: Registry, options: PolygonInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
    handlePointerDown(e: PointerEvent): void;
    syncHandles(): void;
    hideHandles(): void;
    showHandles(): void;
    toGeoJson(): GeoJsonFeatureCollection | null;
}
