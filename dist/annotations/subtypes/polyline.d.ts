import * as Cesium from 'cesium';
import { AnnotationBaseInit, DistanceUnit } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from '../registry';
export type PolylineInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PolylineGraphics.ConstructorOptions;
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
};
export default class Polyline extends Annotation {
    entityProperties: Cesium.PolylineGraphics.ConstructorOptions;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    constructor(registry: Registry, options: PolylineInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
    syncHandles(): void;
    getTotalDistance(unit?: DistanceUnit): number;
    getDistanceSegments(unit?: DistanceUnit): number[];
    getHeadingSegments(): number[];
}
