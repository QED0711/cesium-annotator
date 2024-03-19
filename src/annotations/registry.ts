import * as Cesium from 'cesium';
import { AltQueryType, AnnotationEventPayload, AnnotationType, EventListItem, EventType, FlyToOptions, GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonLoaderOptions, GeoJsonType, GroupInitOptions, GroupRecord, RegistryAddInitOptions, RegistryEventPayload, RegistryEventType, RegistryInit } from '../utils/types';
import { ViewerInterface } from './viewerInterface';
import { Annotation } from './core';
import { PointAnnotation, PointInitOptions } from './subtypes/point';
import { PolylineAnnotation, PolylineInitOptions } from './subtypes/polyline';

import { PolygonAnnotation, PolygonInitOptions } from './subtypes/polygon';
import { RectangleAnnotation, RectangleInitOptions } from './subtypes/rectangle';
import { RingAnnotation, RingInitOptions } from './subtypes/ring';
import { nanoid } from 'nanoid';
import { Coordinate } from './coordinate';



export class AnnotationGroup {
    registry: Registry
    id: string;
    name: string
    annotations: Set<Annotation>;

    constructor(registry: Registry, options: GroupInitOptions) {
        this.registry = registry;
        this.id = options.id ?? nanoid();
        this.name = options.name ?? "";
        this.annotations = new Set<Annotation>();
    }

    toRecord(): GroupRecord {
        return { id: this.id, name: this.name };
    }

    capture(annotation: Annotation): void {
        this.annotations.add(annotation);
        annotation.groups.add(this);
    }

    release(annotation: Annotation): void {
        this.annotations.delete(annotation);
        annotation.groups.delete(this);
    }

    releaseAll() {
        const annotations = Array.from(this.annotations);
        for (let annotation of annotations) {
            this.release(annotation);
        }
    }

    executeCallback(func: (annotation: Annotation) => {}) {
        for (let annotation of this.annotations) {
            annotation.executeCallback(func);
        }
    }

    show() {
        for (let annotation of this.annotations) {
            annotation.show()
        }
    }

    hide() {
        for (let annotation of this.annotations) {
            annotation.hide()
        }
    }

    deleteAll() {
        let annotations = Array.from(this.annotations);
        for (let annotation of annotations) {
            this.registry.deleteByID(annotation.id)
        }
    }

    flyTo(options?: FlyToOptions) {
        const entities = Array.from(this.annotations).map(annotation => annotation.entity).filter(entity => !!entity) as Cesium.Entity[];
        if (entities.length === 0) return;
        this.registry.viewer.flyTo(
            entities,
            {
                duration: 0,
                offset: new Cesium.HeadingPitchRange(0, -90),
                ...(options ?? {})
            }
        );
    }

    toGeoJson(): { [key: string]: any } {
        const features: {}[] = [];
        Array.from(this.annotations)
            .map(annotation => annotation.toGeoJson())
            .forEach(geoJson => {
                if (geoJson) {
                    features.push(geoJson.features[0])
                }
            });
        return { type: "FeatureCollection", features }
    }

    toWkt(): string[] {
        return Array.from(this.annotations)
            .map(annotation => annotation.toWkt())
            .filter(wkt => !!wkt) as string[];
    }
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

export class Registry {
    id: string;
    annotations: Annotation[];
    groups: AnnotationGroup[];
    viewer: Cesium.Viewer;
    viewerInterface: ViewerInterface

    events: { [eventName: string]: ((payload: AnnotationEventPayload) => void)[] }
    private registryEvents: { [eventName: string]: ((payload: RegistryEventPayload) => void)[] }
    loaders: { [key: string]: (geom: any) => Annotation | null }

    private useAltitude: AltQueryType;
    private terrainSampleLevel: number;
    private altQueryFallback: AltQueryType;


    constructor(init: RegistryInit) {
        this.id = init.id;
        this.viewer = init.viewer;
        this.annotations = [];
        this.groups = [];

        this.useAltitude = init.useAltitude ?? AltQueryType.NONE;
        this.terrainSampleLevel = init.terrainSampleLevel ?? 12
        this.altQueryFallback = init.altQueryFallback ?? AltQueryType.DEFAULT

        this.events = {};
        this.registryEvents = {};

        this.loaders = {};

        this.viewerInterface = ViewerInterface.registerViewer(
            this.viewer,
            {
                useAltitude: this.useAltitude,
                terrainSampleLevel: this.terrainSampleLevel,
                altQueryFallback: this.altQueryFallback,
            }
        );
    }

    on(eventNames: RegistryEventType | RegistryEventType[], callback: (payload: RegistryEventPayload) => void): void {
        eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
        for (let eventName of eventNames) {
            if (eventName in this.registryEvents) {
                this.registryEvents[eventName].push(callback);
            } else {
                this.registryEvents[eventName] = [callback];
            }
        }
    }

    private emit(eventName: RegistryEventType, payload: RegistryEventPayload) {
        if (!(eventName in this.registryEvents)) return;
        for (let handler of this.registryEvents[eventName]) {
            handler(payload);
        }
    }

    getActiveAnnotation(): Annotation | null {
        return this.annotations.find(annotation => annotation.isActive) ?? null;
    }

    getAnnotationByID(id: string): Annotation | null | undefined {
        return this.annotations.find(annotation => annotation.id === id);
    }

    deleteByID(id: string) {
        const annotation = this.annotations.find(annotation => annotation.id === id)
        if (annotation) {
            annotation.delete();
            this.annotations = this.annotations.filter(a => a !== annotation);
        }
        this.emit(RegistryEventType.DELETE, {annotations: this.annotations, registry: this})
        this.emit(RegistryEventType.UPDATE, {annotations: this.annotations, registry: this})
    }

    activateByID(id: string): Annotation | null {
        const annotation = this.annotations.find(a => a.id === id);
        if (annotation && !annotation.isActive) {
            annotation.activate();
            return annotation;
        }
        return null
    }

    deactivateByID(id: string) {
        this.annotations.find(annotation => annotation.id === id)?.deactivate?.();
    }

    deactivateAllExcept(id: string) {
        for (let annotation of this.annotations) {
            if (annotation.id === id) continue;
            annotation.deactivate();
        }
    }

    registerEvent(event: EventListItem) {
        if (event.eventName in this.events) {
            this.events[event.eventName].push(event.callback);
        } else {
            this.events[event.eventName] = [event.callback];
        }
    }

    registerEvents(events: EventListItem[]) {
        for (let event of events) {
            this.registerEvent(event);
        }
    }

    applyEvents(annotation: Annotation): void {
        for (let eventName of Object.keys(this.events)) {
            for (let callback of this.events[eventName]) {
                annotation.on(eventName as EventType, callback);
            }
        }
    }

    getOrCreateGroup(options: GroupInitOptions): AnnotationGroup {
        const existingGroup = this.groups.find(group => group.name === options.name || group.id === options.id);
        if (existingGroup) return existingGroup;

        const group = new AnnotationGroup(this, options);
        this.groups.push(group)
        return group;
    }

    getGroupByID(id: string): AnnotationGroup | null {
        return this.groups.find(g => g.id === id) ?? null
    }

    getGroupByName(name: string): AnnotationGroup | null {
        return this.groups.find(g => g.name === name) ?? null
    }

    deleteGroupByID(id: string, options: { deleteAnnotations?: boolean, releaseAnnotations?: boolean } | undefined) {
        const group = this.getGroupByID(id);
        if (group) {
            options?.deleteAnnotations && group.deleteAll();
            options?.releaseAnnotations && group.releaseAll();
        }
        this.groups = this.groups.filter(g => g.id !== id)
    }

    // FACTORIES
    addPoint(options: PointInitOptions, initConfig: RegistryAddInitOptions = {replaceExisting: false}): PointAnnotation {
        if(this.getAnnotationByID(options?.id ?? "")) {
            if(initConfig.replaceExisting) {
                this.deleteByID(options.id as string);
            } else {
                return this.getAnnotationByID(options.id as string) as PointAnnotation;
            }
        }
        const annotation = new PointAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        this.emit(RegistryEventType.ADD, {annotations: this.annotations, registry: this})
        this.emit(RegistryEventType.UPDATE, {annotations: this.annotations, registry: this})
        return annotation
    }

    addPolyline(options: PolylineInitOptions, initConfig: RegistryAddInitOptions = {replaceExisting: false}): PolylineAnnotation {
        if(this.getAnnotationByID(options?.id ?? "")) {
            if(initConfig.replaceExisting) {
                this.deleteByID(options.id as string);
            } else {
                return this.getAnnotationByID(options.id as string) as PolylineAnnotation;
            }
        }
        const annotation = new PolylineAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        this.emit(RegistryEventType.ADD, {annotations: this.annotations, registry: this})
        this.emit(RegistryEventType.UPDATE, {annotations: this.annotations, registry: this})
        return annotation
    }

    addPolygon(options: PolygonInitOptions, initConfig: RegistryAddInitOptions = {replaceExisting: false}): PolygonAnnotation {
        if(this.getAnnotationByID(options?.id ?? "")) {
            if(initConfig.replaceExisting) {
                this.deleteByID(options.id as string);
            } else {
                return this.getAnnotationByID(options.id as string) as PolygonAnnotation;
            }
        }
        const annotation = new PolygonAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        this.emit(RegistryEventType.ADD, {annotations: this.annotations, registry: this})
        this.emit(RegistryEventType.UPDATE, {annotations: this.annotations, registry: this})
        return annotation;
    }

    addRectangle(options: RectangleInitOptions, initConfig: RegistryAddInitOptions = {replaceExisting: false}): RectangleAnnotation {
        if(this.getAnnotationByID(options?.id ?? "")) {
            if(initConfig.replaceExisting) {
                this.deleteByID(options.id as string);
            } else {
                return this.getAnnotationByID(options.id as string) as RectangleAnnotation;
            }
        }
        const annotation = new RectangleAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        this.emit(RegistryEventType.ADD, {annotations: this.annotations, registry: this})
        this.emit(RegistryEventType.UPDATE, {annotations: this.annotations, registry: this})
        return annotation;
    }

    addRing(options: RingInitOptions, initConfig: RegistryAddInitOptions = {replaceExisting: false}): RingAnnotation {
        if(this.getAnnotationByID(options?.id ?? "")) {
            if(initConfig.replaceExisting) {
                this.deleteByID(options.id as string);
            } else {
                return this.getAnnotationByID(options.id as string) as RingAnnotation;
            }
        }
        const annotation = new RingAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        this.emit(RegistryEventType.ADD, {annotations: this.annotations, registry: this})
        this.emit(RegistryEventType.UPDATE, {annotations: this.annotations, registry: this})
        return annotation;
    }

    // LOADERS
    async loadFromGeoJson(geoJson: GeoJsonFeature | GeoJsonFeatureCollection, options?: GeoJsonLoaderOptions): Promise<Annotation[] | null> {
        if (geoJson.type === "Feature") {
            const annotation = await this.loadFeatureFromGeoJson(geoJson as GeoJsonFeature, options);
            return annotation ? [annotation] : null;
        }
        if (geoJson.type === "FeatureCollection") {
            return this.loadFeatureCollectionFromGeoJson(geoJson as GeoJsonFeatureCollection, options);
        }
        return null;
    }

    private async loadFeatureFromGeoJson(geoJson: GeoJsonFeature, options?: GeoJsonLoaderOptions): Promise<Annotation | null> {
        options = options ?? {};
        options.propertiesInitKey = options.propertiesInitKey ?? "initOptions";
        options.shouldDraw = options.shouldDraw ?? true;
        // callback is executed to change the geoJson prior to initializing annotation(s) from it.
        geoJson = (await options.asyncPreInitCallback?.({geoJson})) ?? geoJson;
        geoJson = options.preInitCallback?.({ geoJson }) ?? geoJson;
        let annotation: Annotation | null = null;

        if (geoJson.geometry?.type === GeoJsonType.POINT) {
            annotation = this.addPoint(geoJson.properties?.[options.propertiesInitKey ?? ""] ?? {})
            const gjCoords = geoJson.geometry.coordinates
            const point = new Coordinate({ lng: gjCoords[0] as number, lat: gjCoords[1] as number, alt: (gjCoords[2] ?? 0) as number })
            annotation.appendCoordinate(point);
        }

        if (geoJson.geometry?.type === GeoJsonType.POLYLINE) {
            annotation = this.addPolyline(geoJson.properties?.[options.propertiesInitKey ?? ""] ?? {})
            const coords = geoJson.geometry.coordinates;
            for (let c of coords) {
                annotation.appendCoordinate(new Coordinate({ lng: (c as number[])[0], lat: (c as number[])[1], alt: (c as number[])[2] ?? 0.0 }))
            }
        }

        if (geoJson.geometry?.type === GeoJsonType.POLYGON) {
            // Rectangle 
            if (geoJson.properties.annotationType === AnnotationType.RECTANGLE) {
                annotation = this.addRectangle(geoJson.properties?.[options.propertiesInitKey ?? ""] ?? {});
                annotation.appendCoordinate(new Coordinate(geoJson.properties.vert1))
                annotation.appendCoordinate(new Coordinate(geoJson.properties.vert2))
                annotation.draw();
                return annotation
            }
            // Ring 
            else if (geoJson.properties.annotationType === AnnotationType.RING) {
                annotation = this.addRing(geoJson.properties?.[options.propertiesInitKey ?? ""] ?? {});
                annotation.appendCoordinate(new Coordinate(geoJson.properties.center))
                annotation.appendCoordinate(new Coordinate(geoJson.properties.perimeterPoint))
                annotation.draw()
                return annotation;
            }
            // Polygon 
            else {
                annotation = this.addPolygon(geoJson.properties?.[options.propertiesInitKey ?? ""] ?? {});
                const coords = geoJson.geometry.coordinates[0] as number[][] ?? [];
                for (let c of coords.slice(0, -1)) {
                    annotation.appendCoordinate(new Coordinate({ lng: (c as number[])[0], lat: (c as number[])[1], alt: (c as number[])[2] ?? 0.0 }))
                }
            }
        }

        if (annotation && !options.shouldDraw) return annotation;

        if (annotation) {
            if("asyncPreDrawCallback" in options) {
                annotation = (await options.asyncPreDrawCallback?.({annotation, geoJson})) ?? annotation;
            }
            annotation = options.preDrawCallback?.({ annotation, geoJson }) ?? annotation;
            this.applyEvents(annotation);
            annotation.draw();
            return annotation;
        }

        return null;
    }

    private async loadFeatureCollectionFromGeoJson(geoJson: GeoJsonFeatureCollection, options?: GeoJsonLoaderOptions): Promise<Annotation[]> {
        const results: Annotation[] = [];
        for (let feature of geoJson.features) {
            const annotation = await this.loadFeatureFromGeoJson(feature, options);
            annotation && results.push(annotation);
        }
        return results;
    }

    defineCustomLoader(loaderName: string, func: (geom: any) => Annotation | null) {
        this.loaders[loaderName] = func.bind(this);
    }

    loadWith(loaderName: string, geom: any): Annotation | null {
        return this.loaders[loaderName]?.(geom) ?? null;
    }
}


