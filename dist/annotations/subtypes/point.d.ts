import * as Cesium from 'cesium';
import { AnnotationBaseInit, DrawOptions, GeoJsonFeatureCollection } from "../../utils/types";
import { Annotation } from "../core";
import { Registry } from "../registry";
import { Coordinate } from '../coordinate';
export type PointInitOptions = AnnotationBaseInit & {
    pointProperties?: Cesium.PointGraphics.ConstructorOptions;
    billboardProperties?: Cesium.BillboardGraphics.ConstructorOptions;
};
/**
 * See {@link Registry} for registry creation;
 *
 * *PointAnnotation* should not be invoked directly. It should be created through a call to `addPoint` on a {@link Registry} instance.
 *
 * @example
 * ```ts
 * let point: PointAnnotation = registry.addPoint({});
 * ```
 */
export declare class PointAnnotation extends Annotation {
    pointProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    constructor(registry: Registry, options: PointInitOptions);
    appendCoordinate(coordinate: Coordinate): void;
    draw(options?: DrawOptions): void;
    setPointProperties(properties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions): void;
    setPointProperty(propName: string, value: any): void;
    deletePointProperty(propName: string): void;
    toGeoJson(): GeoJsonFeatureCollection | null;
    syncHandles(): void;
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void;
}
