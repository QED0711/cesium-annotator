import * as Cesium from 'cesium';
import { AnnotationBaseInit, DistanceUnit, GeoJsonFeatureCollection, HandleType, DrawOptions, DistanceOptions } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate, CoordinateCollection } from '../coordinate';
import { Registry } from '../registry';
export type PolylineInitOptions = AnnotationBaseInit & {
    polylineProperties?: Cesium.PolylineGraphics.ConstructorOptions;
    midpointHandles?: boolean;
    midpointHandleType?: HandleType;
    midpointHandleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
};
export declare class PolylineAnnotation extends Annotation {
    polylineProperties: Cesium.PolylineGraphics.ConstructorOptions;
    midpointHandles: boolean;
    midpointHandleType: HandleType;
    midpointHandleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    private mpHandles;
    constructor(registry: Registry, options: PolylineInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(options?: DrawOptions): void;
    handlePointerDown(e: PointerEvent): void;
    syncHandles(): void;
    hideHandles(): void;
    showHandles(): void;
    removeHandles(): void;
    setPolylineProperties(properties: Cesium.PolylineGraphics.ConstructorOptions, destructive?: boolean): void;
    setPolylineProperty(propName: string, value: any): void;
    deletePolylineProperty(propName: string): void;
    toGeoJson(): GeoJsonFeatureCollection | null;
    getTotalDistance(options?: DistanceOptions): number;
    getDistanceSegments(options?: DistanceOptions): number[];
    getHeadingSegments(): number[];
    getPointsOnPath(distance: number, unit: DistanceUnit): CoordinateCollection | null;
}
