import * as Cesium from 'cesium';
import { AnnotationBaseInit } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from "../registry";
export type PointInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PointGraphics.ConstructorOptions;
};
export default class PointAnnotation extends Annotation {
    entityProperties: Cesium.PointGraphics.ConstructorOptions;
    constructor(registry: Registry, options: PointInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
    syncHandles(): void;
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void;
}
