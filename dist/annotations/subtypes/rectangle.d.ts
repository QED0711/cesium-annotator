import * as Cesium from 'cesium';
import { AnnotationBaseInit, DistanceUnit, DrawOptions, GeoJsonFeatureCollection } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';
export type RectangleInitOptions = AnnotationBaseInit & {
    polygonProperties?: Cesium.PolylineGraphics.ConstructorOptions | Cesium.PolygonGraphics.ConstructorOptions;
    drawAsLine?: boolean;
};
export declare class RectangleAnnotation extends Annotation {
    polygonProperties: Cesium.PolylineGraphics.ConstructorOptions | Cesium.PolygonGraphics.ConstructorOptions;
    drawAsLine?: boolean;
    constructor(registry: Registry, options: RectangleInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(options?: DrawOptions): void;
    syncHandles(): void;
    getPerimeter(unit?: DistanceUnit): number | null;
    getArea(unit?: DistanceUnit): number | null;
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void;
    setPolygonProperties(properties: Cesium.PolygonGraphics.ConstructorOptions | Cesium.PolylineGraphics.ConstructorOptions): void;
    setPolygonProperty(propName: string, value: any): void;
    deletePolygonProperty(propName: string): void;
    toGeoJson(): GeoJsonFeatureCollection | null;
}
