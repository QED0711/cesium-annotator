import { AnnotationBaseInit } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from "../registry";
export type PointInitOptions = AnnotationBaseInit & {};
export default class PointAnnotation extends Annotation {
    constructor(registry: Registry, options: PointInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
}
