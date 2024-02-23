import * as Cesium from 'cesium';
import { AnnotationBaseInit, DistanceUnit } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';
export type RectangleInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PolylineGraphics.ConstructorOptions | Cesium.PolygonGraphics.ConstructorOptions;
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    drawAsLine?: boolean;
};
export default class Rectangle extends Annotation {
    entityProperties: Cesium.PolylineGraphics.ConstructorOptions | Cesium.PolygonGraphics.ConstructorOptions;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    drawAsLine?: boolean;
    constructor(registry: Registry, options: RectangleInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
    syncHandles(): void;
    getPerimeter(unit?: DistanceUnit): number | null;
    getArea(unit?: DistanceUnit): number;
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void;
}
