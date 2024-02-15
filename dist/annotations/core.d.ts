import * as Cesium from 'cesium';
type CoordinateInit = {
    lng: number;
    lat: number;
    alt?: number;
};
type AnnotationBaseInit = {
    viewerInterface: ViewerInterface;
    id?: string;
    isStatic?: boolean;
};
type RegistryInit = {
    id: string;
    viewer: Cesium.Viewer;
};
export declare enum DistanceUnit {
    METERS = "meters",
    KILOMETERS = "kilometers",
    FEET = "feet",
    MILES = "miles"
}
export declare enum AnnotationType {
    BASE = "base",
    POINT = "point",
    POLYLINE = "polyline",
    POLYGON = "polygon",
    RECTANGLE = "rectangle",
    RING = "ring"
}
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
    private viewerInterface;
    id: string;
    points: Coordinate[];
    private history;
    isStatic: boolean;
    entity: Cesium.Entity | null;
    handles: Cesium.Entity[];
    isActive: boolean;
    constructor(init: AnnotationBaseInit);
    get current(): Coordinate[];
    activate(): void;
    delete(): void;
}
/******************************************************************************
 * ***************************** VIEWER INTERFACE *****************************
 *****************************************************************************/
export declare class ViewerInterface {
    viewer: Cesium.Viewer;
    events: {
        [key: string]: Function[];
    };
    private canvas;
    private cursorX?;
    private cursorY?;
    private pointerMoveHandler?;
    constructor(viewer: Cesium.Viewer);
    init(): void;
    removeHandlers(): void;
    addEventListener(eventName: string, callback: Function): void;
    removeEventListener(eventName: string, callback: Function): void;
    getCoordinateAtPixel(x?: number | null, y?: number): Coordinate | null;
    lock(): void;
    unlock(): void;
}
/******************************************************************************
 * ***************************** REGISTRY *****************************
 *****************************************************************************/
export declare class Registry {
    id: string;
    annotations: Annotation[];
    viewer: Cesium.Viewer;
    viewerInterface: ViewerInterface;
    constructor(init: RegistryInit);
    getAnnotationByID(id: string): Annotation | null | undefined;
    deleteByID(id: string): void;
    add(subType: AnnotationType, id?: string): Annotation;
}
export {};
