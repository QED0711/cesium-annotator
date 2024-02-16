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
    protected registry: Registry;
    protected viewerInterface: ViewerInterface;
    protected annotationType: AnnotationType;
    id: string;
    points: Coordinate[];
    isStatic: boolean;
    entity: Cesium.Entity | null;
    handles: Cesium.Entity[];
    isActive: boolean;
    protected undoHistory: Coordinate[][];
    protected redoHistory: Coordinate[][];
    protected handleFound: boolean;
    protected dragDetected: boolean;
    protected events: {
        [eventName: string]: ((payload: {
            [key: string]: any;
        }) => void)[];
    };
    constructor(registry: Registry, init: AnnotationBaseInit);
    get current(): Coordinate[];
    on(eventName: string, callback: (payload: {
        [key: string]: any;
    }) => void): void;
    emit(eventName: string, payload: {
        [key: string]: any;
    }): void;
    activate(): void;
    deactivate(): void;
    delete(): void;
    removeEntity(): void;
    handlePointerDown(e: PointerEvent): void;
    handlePointerMove(e: PointerEvent): void;
    handlePointerUp(e: PointerEvent): void;
    undo(): void;
    redo(): void;
    recordPointsToUndoHistory(): void;
    clearRedoHistory(): void;
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
}
