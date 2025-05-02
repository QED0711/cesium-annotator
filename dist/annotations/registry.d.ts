import * as Cesium from 'cesium';
import { AnnotationEventPayload, EventListItem, FlyToOptions, GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonGeometryCollection, GeoJsonLoaderOptions, GroupInitOptions, GroupRecord, RegistryAddInitOptions, RegistryEventPayload, RegistryEventType, RegistryInit } from '../utils/types';
import { ViewerInterface } from './viewerInterface';
import { Annotation } from './core';
import { PointAnnotation, PointInitOptions } from './subtypes/point';
import { PolylineAnnotation, PolylineInitOptions } from './subtypes/polyline';
import { PolygonAnnotation, PolygonInitOptions } from './subtypes/polygon';
import { RectangleAnnotation, RectangleInitOptions } from './subtypes/rectangle';
import { RingAnnotation, RingInitOptions } from './subtypes/ring';
export declare class AnnotationGroup {
    registry: Registry;
    id: string;
    name: string;
    annotations: Set<Annotation>;
    constructor(registry: Registry, options: GroupInitOptions);
    toRecord(): GroupRecord;
    capture(annotation: Annotation): void;
    release(annotation: Annotation): void;
    releaseAll(): void;
    executeCallback(func: (annotation: Annotation) => {}): void;
    show(): void;
    hide(): void;
    deleteAll(): void;
    flyTo(options?: FlyToOptions): void;
    toGeoJson(): {
        [key: string]: any;
    };
    toWkt(): string[];
}
/**
 *
 * @example
 * ```ts
 * import { Registry } from 'cesium-annotator';
 * const viewer = new Cesium.Viewer("map-id", {...});
 * const registry = new Registry({
 *      id: "myRegistry",
 *      viewer,
 * })
 *
 * // add annotations to the registry
 *
 * const point: PointAnnotation = registry.addPoint({});
 * const line: PolylineAnnotation = registry.addPolyline({});
 * const polygon: PolygonAnnotation = registry.addPolygon({});
 * const rect: RectangleAnnotation = registry.addRectangle({});
 * const ring: RingAnnotation = registry.addRing({});
 * ```
 */
export declare class Registry {
    id: string;
    annotations: Annotation[];
    groups: AnnotationGroup[];
    viewer: Cesium.Viewer;
    viewerInterface: ViewerInterface;
    events: {
        [eventName: string]: ((payload: AnnotationEventPayload) => void)[];
    };
    private registryEvents;
    loaders: {
        [key: string]: (geom: any) => Annotation | null;
    };
    private useAltitude;
    private terrainSampleLevel;
    private altQueryFallback;
    pointerMovementThreshold: number;
    constructor(init: RegistryInit);
    setTerrainSampleLevel(level: number): void;
    on(eventNames: RegistryEventType | RegistryEventType[], callback: (payload: RegistryEventPayload) => void): void;
    private emit;
    getActiveAnnotation(): Annotation | null;
    getAnnotationByID(id: string): Annotation | null | undefined;
    deleteByID(id: string): void;
    deleteAll(): void;
    activateByID(id: string): Annotation | null;
    deactivateByID(id: string): void;
    deactivateAllExcept(id: string): void;
    showAll(): void;
    hideAll(): void;
    every(callback: (annotation: Annotation) => boolean): boolean;
    some(callback: (annotation: Annotation) => boolean): boolean;
    registerEvent(event: EventListItem): void;
    registerEvents(events: EventListItem[]): void;
    applyEvents(annotation: Annotation): void;
    getOrCreateGroup(options: GroupInitOptions): AnnotationGroup;
    getGroupByID(id: string): AnnotationGroup | null;
    getGroupByName(name: string): AnnotationGroup | null;
    deleteGroupByID(id: string, options: {
        deleteAnnotations?: boolean;
        releaseAnnotations?: boolean;
    } | undefined): void;
    addPoint(options: PointInitOptions, initConfig?: RegistryAddInitOptions): PointAnnotation;
    addPolyline(options: PolylineInitOptions, initConfig?: RegistryAddInitOptions): PolylineAnnotation;
    addPolygon(options: PolygonInitOptions, initConfig?: RegistryAddInitOptions): PolygonAnnotation;
    addRectangle(options: RectangleInitOptions, initConfig?: RegistryAddInitOptions): RectangleAnnotation;
    addRing(options: RingInitOptions, initConfig?: RegistryAddInitOptions): RingAnnotation;
    loadFromGeoJson(geoJson: GeoJsonFeature | GeoJsonFeatureCollection | GeoJsonGeometryCollection, options?: GeoJsonLoaderOptions): Promise<Annotation[] | null>;
    private loadFeatureFromGeoJson;
    private loadFeatureCollectionFromGeoJson;
    defineCustomLoader(loaderName: string, func: (geom: any) => Annotation | null): void;
    loadWith(loaderName: string, geom: any): Annotation | null;
}
