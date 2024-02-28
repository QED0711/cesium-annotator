import * as Cesium from 'cesium';
import { AnnotationEventPayload, EventListItem, FlyToOptions, GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonLoaderOptions, RegistryInit } from '../utils/types';
import { ViewerInterface } from './viewerInterface';
import { Annotation } from './core';
import PointAnnotation, { PointInitOptions } from './subtypes/point';
import PolylineAnnotation, { PolylineInitOptions } from './subtypes/polyline';
import PolygonAnnotation, { PolygonInitOptions } from './subtypes/polygon';
import RectangleAnnotation, { RectangleInitOptions } from './subtypes/rectangle';
import RingAnnotation, { RingInitOptions } from './subtypes/ring';
/******************************************************************************
 * ***************************** GROUP *****************************
 *****************************************************************************/
export declare class AnnotationGroup {
    registry: Registry;
    id: string;
    name?: string;
    annotations: Set<Annotation>;
    constructor(registry: Registry, name?: string);
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
/******************************************************************************
 * ***************************** REGISTRY *****************************
 *****************************************************************************/
export declare class Registry {
    id: string;
    annotations: Annotation[];
    groups: AnnotationGroup[];
    viewer: Cesium.Viewer;
    viewerInterface: ViewerInterface;
    events: {
        [eventName: string]: ((payload: AnnotationEventPayload) => void)[];
    };
    loaders: {
        [key: string]: (geom: any) => Annotation | null;
    };
    useAltitude: boolean;
    constructor(init: RegistryInit);
    getActiveAnnotation(): Annotation | null;
    getAnnotationByID(id: string): Annotation | null | undefined;
    deleteByID(id: string): void;
    activateByID(id: string): void;
    deactivateByID(id: string): void;
    registerEvent(event: EventListItem): void;
    registerEvents(events: EventListItem[]): void;
    applyEvents(annotation: Annotation): void;
    createGroup(name?: string): AnnotationGroup;
    getGroupByID(id: string): AnnotationGroup | null;
    getGroupByName(name: string): AnnotationGroup | null;
    deleteGroupByID(id: string, options: {
        deleteAnnotations?: boolean;
        releaseAnnotations?: boolean;
    } | undefined): void;
    addPoint(options: PointInitOptions): PointAnnotation;
    addPolyline(options: PolylineInitOptions): PolylineAnnotation;
    addPolygon(options: PolygonInitOptions): PolygonAnnotation;
    addRectangle(options: RectangleInitOptions): RectangleAnnotation;
    addRing(options: RingInitOptions): RingAnnotation;
    loadFromGeoJson(geoJson: GeoJsonFeature | GeoJsonFeatureCollection, options?: GeoJsonLoaderOptions): Annotation[] | null;
    private loadFeatureFromGeoJson;
    private loadFeatureCollectionFromGeoJson;
    defineCustomLoader(loaderName: string, func: (geom: any) => Annotation | null): void;
    loadWith(loaderName: string, geom: any): Annotation | null;
}
