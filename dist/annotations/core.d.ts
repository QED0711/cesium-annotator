import * as Cesium from 'cesium';
import { CoordinateInit, DistanceUnit, AnnotationBaseInit, AnnotationType } from '../utils/types';
import { Registry } from './registry';
import { ViewerInterface } from './viewerInterface';
export declare class Coordinate {
    lng: number;
    lat: number;
    alt?: number;
    constructor(init: CoordinateInit);
    static fromDegrees(lng: number, lat: number, alt?: number): Coordinate;
    toCartesian3(): Cesium.Cartesian3;
    distanceTo(point2: Coordinate, unit?: DistanceUnit): number;
}
export declare class Annotation {
    protected viewerInterface: ViewerInterface;
    protected annotationType: AnnotationType;
    id: string;
    points: Coordinate[];
    protected history: Coordinate[][];
    isStatic: boolean;
    entity: Cesium.Entity | null;
    handles: Cesium.Entity[];
    isActive: boolean;
    protected registry: Registry;
    protected handleFound: boolean;
    protected dragDetected: boolean;
    constructor(registry: Registry, init: AnnotationBaseInit);
    get current(): Coordinate[];
    activate(): void;
    deactivate(): void;
    delete(): void;
    handlePointerDown(e: PointerEvent): void;
    handlePointerMove(e: PointerEvent): void;
    handlePointerUp(e: PointerEvent): void;
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
}
