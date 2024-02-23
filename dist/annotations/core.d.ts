import * as Cesium from 'cesium';
import CheapRuler from 'cheap-ruler';
import { CoordinateInit, DistanceUnit, AnnotationBaseInit, AnnotationType, AnnotationEntity, HandleFoundRecord, HandleType } from '../utils/types';
import { Registry } from './registry';
import { ViewerInterface } from './viewerInterface';
export declare class Coordinate {
    id: string;
    lng: number;
    lat: number;
    alt?: number;
    cartesian3: Cesium.Cartesian3;
    ruler: CheapRuler;
    constructor(init: CoordinateInit);
    static fromDegrees(lng: number, lat: number, alt?: number): Coordinate;
    static cloneCoordinateArray(coordinates: Coordinate[]): Coordinate[];
    static coordinateArrayToCartesian3(coordinates: Coordinate[]): Cesium.Cartesian3[];
    static getMinMaxBbox(coordinates: Coordinate[]): {
        lngMin: number;
        lngMax: number;
        latMin: number;
        latMax: number;
    };
    clone(): Coordinate;
    update(values: {
        lat?: number;
        lng?: number;
        alt?: number;
    }): void;
    distanceTo(point2: Coordinate, unit?: DistanceUnit): number;
    headingTo(point2: Coordinate): number;
    atHeadingDistance(heading: number, distance: number, distanceUnit?: DistanceUnit): Coordinate;
    segmentDistance(point2: Coordinate, segments: number): Coordinate[];
}
export declare class Annotation {
    protected registry: Registry;
    protected viewerInterface: ViewerInterface;
    protected annotationType: AnnotationType;
    id: string;
    points: Coordinate[];
    liveUpdate: boolean;
    userInteractive: boolean;
    entity: AnnotationEntity | null;
    handles: {
        [coordinateID: string]: AnnotationEntity;
    };
    handleType: HandleType;
    isActive: boolean;
    protected undoHistory: Coordinate[][];
    protected redoHistory: Coordinate[][];
    protected handleFound: HandleFoundRecord | null;
    protected bypassPointerUp: boolean;
    protected pointerDownDetected: boolean;
    protected dragDetected: boolean;
    protected preDragHistoricalRecord: Coordinate[] | null;
    protected events: {
        [eventName: string]: ((payload: {
            [key: string]: any;
        }) => void)[];
    };
    constructor(registry: Registry, options: AnnotationBaseInit);
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
    showHandles(): void;
    hideHandles(): void;
    removePointAtIndex(index: number): void;
    handlePointerDown(e: PointerEvent): void;
    handlePointerMove(e: PointerEvent): void;
    handlePointerUp(e: PointerEvent): void;
    undo(): void;
    redo(): void;
    recordPointsToUndoHistory(): void;
    manualAppendToUndoHistory(points: Coordinate[]): void;
    clearRedoHistory(): void;
    updateHandleIdxs(): void;
    removeStaleHandles(): void;
    syncHandles(): void;
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void;
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
}
