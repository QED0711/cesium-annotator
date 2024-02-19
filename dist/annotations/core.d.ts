import * as Cesium from 'cesium';
import { CoordinateInit, DistanceUnit, AnnotationBaseInit, AnnotationType, AnnotationEntity, HandleFoundRecord } from '../utils/types';
import { Registry } from './registry';
import { ViewerInterface } from './viewerInterface';
export declare class Coordinate {
    id: string;
    lng: number;
    lat: number;
    alt?: number;
    constructor(init: CoordinateInit);
    static fromDegrees(lng: number, lat: number, alt?: number): Coordinate;
    static cloneCoordinateArray(coordinates: Coordinate[]): Coordinate[];
    static coordinateArrayToCartesian3(coordinates: Coordinate[]): Cesium.Cartesian3[];
    clone(): Coordinate;
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
    userInteractive: boolean;
    entity: AnnotationEntity | null;
    handles: {
        [coordinateID: string]: AnnotationEntity;
    };
    isActive: boolean;
    protected undoHistory: Coordinate[][];
    protected redoHistory: Coordinate[][];
    protected handleFound: HandleFoundRecord | null;
    protected pointerDownDetected: boolean;
    protected dragDetected: boolean;
    protected preDragHistoricalRecord: Coordinate[] | null;
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
    removeHandleByCoordinateID(id: string): void;
    handlePointerDown(e: PointerEvent): void;
    handlePointerMove(e: PointerEvent): void;
    handlePointerUp(e: PointerEvent): void;
    undo(): void;
    redo(): void;
    recordPointsToUndoHistory(): void;
    manualAppendToUndoHistory(points: Coordinate[]): void;
    clearRedoHistory(): void;
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
    syncHandles(): void;
}
