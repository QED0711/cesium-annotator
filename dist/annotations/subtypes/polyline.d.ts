import * as Cesium from 'cesium';
import { AnnotationBaseInit } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from '../registry';
export type PolyLineInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PolylineGraphics.ConstructorOptions;
};
export default class PolyLine extends Annotation {
    entityProperties: Cesium.PolylineGraphics.ConstructorOptions;
    constructor(registry: Registry, options: PolyLineInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
}
