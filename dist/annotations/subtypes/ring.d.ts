import * as Cesium from 'cesium';
import { AnnotationBaseInit, DrawOptions, GeoJsonFeatureCollection } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';
export type RingInitOptions = AnnotationBaseInit & {
    polygonProperties?: Cesium.PolylineGraphics.ConstructorOptions | Cesium.EllipseGraphics.ConstructorOptions;
    drawAsLine?: boolean;
    nPoints?: number;
};
export declare class RingAnnotation extends Annotation {
    polygonProperties: Cesium.PolylineGraphics.ConstructorOptions | Cesium.EllipseGraphics.ConstructorOptions;
    drawAsLine: boolean;
    nPoints: number;
    private radius;
    constructor(registry: Registry, options: RingInitOptions);
    get center(): Coordinate | null;
    handlePointerMove(e: PointerEvent): Promise<void>;
    appendCoordinate(coordinate: Coordinate): void;
    draw(options?: DrawOptions): void;
    syncHandles(): void;
    getArea(): number | null;
    getCircumference(): number | null;
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void;
    setPolygonProperties(properties: Cesium.PolygonGraphics.ConstructorOptions | Cesium.PolylineGraphics.ConstructorOptions, destructive?: boolean): void;
    setPolygonProperty(propName: string, value: any): void;
    deletePolygonProperty(propName: string): void;
    toGeoJson(): GeoJsonFeatureCollection | null;
    toWkt(): string | null;
}
