import * as Cesium from 'cesium';
import { AnnotationBaseInit, GeoJsonFeatureCollection, HandleType, DrawOptions } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';
export type PolygonInitOptions = AnnotationBaseInit & {
    polygonProperties?: Cesium.PolygonGraphics.ConstructorOptions | Cesium.PolylineGraphics.ConstructorOptions;
    drawAsLine?: boolean;
    midpointHandles?: boolean;
    midpointHandleType?: HandleType;
    midpointHandleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
};
export declare class PolygonAnnotation extends Annotation {
    drawAsLine: boolean;
    polygonProperties: Cesium.PolygonGraphics.ConstructorOptions | Cesium.PolylineGraphics.ConstructorOptions;
    midpointHandles: boolean;
    midpointHandleType: HandleType;
    midpointHandleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    private mpHandles;
    constructor(registry: Registry, options: PolygonInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(options?: DrawOptions): void;
    handlePointerDown(e: PointerEvent): void;
    syncHandles(): void;
    hideHandles(): void;
    showHandles(): void;
    removeHandles(): void;
    setPolygonProperties(properties: Cesium.PolygonGraphics.ConstructorOptions | Cesium.PolylineGraphics.ConstructorOptions): void;
    setPolygonProperty(propName: string, value: any): void;
    deletePolygonProperty(propName: string): void;
    toGeoJson(): GeoJsonFeatureCollection | null;
}
