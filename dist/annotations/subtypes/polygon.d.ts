import * as Cesium from 'cesium';
import { AnnotationBaseInit, GeoJsonFeatureCollection, HandleType } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';
export type PolygonInitOptions = AnnotationBaseInit & {
    polygonProperties?: Cesium.PolygonGraphics.ConstructorOptions | Cesium.PolylineGraphics.ConstructorOptions;
    entityProperties?: Cesium.Entity.ConstructorOptions;
    drawAsLine?: boolean;
    midpointHandles?: boolean;
    midpointHandleType?: HandleType;
    midpointHandleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
};
export default class Polygon extends Annotation {
    drawAsLine: boolean;
    polygonProperties: Cesium.PolylineGraphics.ConstructorOptions;
    entityProperties: Cesium.Entity.ConstructorOptions;
    midpointHandles: boolean;
    midpointHandleType: HandleType;
    midpointHandleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    private mpHandles;
    constructor(registry: Registry, options: PolygonInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
    handlePointerDown(e: PointerEvent): void;
    syncHandles(): void;
    hideHandles(): void;
    showHandles(): void;
    toGeoJson(): GeoJsonFeatureCollection | null;
}
