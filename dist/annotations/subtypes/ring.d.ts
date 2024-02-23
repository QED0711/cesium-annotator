import * as Cesium from 'cesium';
import { AnnotationBaseInit } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';
export type RingInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PolylineGraphics.ConstructorOptions | Cesium.EllipseGraphics.ConstructorOptions;
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    drawAsLine?: boolean;
    nPoints?: number;
};
export default class Ring extends Annotation {
    entityProperties: Cesium.PolylineGraphics.ConstructorOptions | Cesium.EllipseGraphics.ConstructorOptions;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    drawAsLine: boolean;
    nPoints: number;
    private radius;
    constructor(registry: Registry, options: RingInitOptions);
    handlePointerMove(e: PointerEvent): void;
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
    syncHandles(): void;
    getArea(): number | null;
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void;
}
