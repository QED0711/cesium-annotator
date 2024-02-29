import * as Cesium from 'cesium';
import { AnnotationBaseInit, GeoJsonFeatureCollection } from "../../utils/types";
import { Annotation } from "../core";
import { Registry } from "../registry";
import { Coordinate } from '../coordinate';
export type PointInitOptions = AnnotationBaseInit & {
    pointProperties?: Cesium.PointGraphics.ConstructorOptions;
    billboardProperties?: Cesium.BillboardGraphics.ConstructorOptions;
    entityProperties?: Cesium.Entity.ConstructorOptions;
};
export declare class PointAnnotation extends Annotation {
    entityProperties: Cesium.PointGraphics.ConstructorOptions;
    pointProperties: Cesium.PointGraphics.ConstructorOptions;
    billboardProperties: Cesium.BillboardGraphics.ConstructorOptions;
    constructor(registry: Registry, options: PointInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
    toGeoJson(): GeoJsonFeatureCollection | null;
    syncHandles(): void;
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void;
}
