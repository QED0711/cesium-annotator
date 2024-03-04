import * as Cesium from 'cesium';
import { AnnotationBaseInit, DistanceUnit, GeoJsonFeatureCollection, HandleType, DrawOptions } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate, CoordinateCollection } from '../coordinate';
import { Registry } from '../registry';
export type PolylineInitOptions = AnnotationBaseInit & {
    polylineProperties?: Cesium.PolylineGraphics.ConstructorOptions;
    entityProperties?: Cesium.Entity.ConstructorOptions;
    midpointHandles?: boolean;
    midpointHandleType?: HandleType;
    midpointHandleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
};
export declare class PolylineAnnotation extends Annotation {
    polylineProperties: Cesium.PolylineGraphics.ConstructorOptions;
    entityProperties?: Cesium.Entity.ConstructorOptions;
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
    toGeoJson(): GeoJsonFeatureCollection | null;
    getTotalDistance(unit?: DistanceUnit): number;
    getDistanceSegments(unit?: DistanceUnit): number[];
    getHeadingSegments(): number[];
    getPointsOnPath(distance: number, unit: DistanceUnit): CoordinateCollection | null;
}
