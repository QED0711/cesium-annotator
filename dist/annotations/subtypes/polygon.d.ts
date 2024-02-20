import * as Cesium from 'cesium';
import { AnnotationBaseInit } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from '../registry';
export type PolygonInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PolygonGraphics.ConstructorOptions | Cesium.PolylineGraphics.ConstructorOptions;
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    drawAsLine?: boolean;
};
export default class Polygon extends Annotation {
    drawAsLine: boolean;
    entityProperties: Cesium.PolylineGraphics.ConstructorOptions;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    constructor(registry: Registry, options: PolygonInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
    syncHandles(): void;
}
