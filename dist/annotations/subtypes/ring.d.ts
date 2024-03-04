import * as Cesium from 'cesium';
import { AnnotationBaseInit, DrawOptions, GeoJsonFeatureCollection } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';
export type RingInitOptions = AnnotationBaseInit & {
    polygonProperties?: Cesium.PolylineGraphics.ConstructorOptions | Cesium.EllipseGraphics.ConstructorOptions;
    entityProperties?: Cesium.Entity.ConstructorOptions;
    drawAsLine?: boolean;
    nPoints?: number;
};
export declare class RingAnnotation extends Annotation {
    polygonProperties: Cesium.PolylineGraphics.ConstructorOptions | Cesium.EllipseGraphics.ConstructorOptions;
    entityProperties: Cesium.Entity.ConstructorOptions;
    drawAsLine: boolean;
    nPoints: number;
    private radius;
    constructor(registry: Registry, options: RingInitOptions);
    handlePointerMove(e: PointerEvent): void;
    appendCoordinate(coordinate: Coordinate): void;
    draw(options?: DrawOptions): void;
    syncHandles(): void;
    getArea(): number | null;
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void;
    toGeoJson(): GeoJsonFeatureCollection | null;
    toWkt(): string | null;
}
