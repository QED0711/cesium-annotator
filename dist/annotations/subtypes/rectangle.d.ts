import * as Cesium from 'cesium';
import { AnnotationBaseInit, DistanceUnit, DrawOptions, GeoJsonFeatureCollection } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';
export type RectangleInitOptions = AnnotationBaseInit & {
    polygonProperties?: Cesium.PolylineGraphics.ConstructorOptions | Cesium.PolygonGraphics.ConstructorOptions;
    entityProperties?: Cesium.Entity.ConstructorOptions;
    drawAsLine?: boolean;
};
export declare class RectangleAnnotation extends Annotation {
    polygonProperties: Cesium.PolylineGraphics.ConstructorOptions | Cesium.PolygonGraphics.ConstructorOptions;
    entityProperties: Cesium.Entity.ConstructorOptions;
    drawAsLine?: boolean;
    constructor(registry: Registry, options: RectangleInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(options?: DrawOptions): void;
    syncHandles(): void;
    getPerimeter(unit?: DistanceUnit): number | null;
    getArea(unit?: DistanceUnit): number | null;
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void;
    toGeoJson(): GeoJsonFeatureCollection | null;
}
