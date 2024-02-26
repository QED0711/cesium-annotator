import * as Cesium from 'cesium';
import { AnnotationType, FlyToOptions, GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonLoaderOptions, GeoJsonType, RegistryInit } from '../utils/types';
import { ViewerInterface } from './viewerInterface';
import { Annotation } from './core';
import PointAnnotation, { PointInitOptions } from './subtypes/point';
import PolylineAnnotation, { PolylineInitOptions } from './subtypes/polyline';

import PolygonAnnotation, { PolygonInitOptions } from './subtypes/polygon';
import RectangleAnnotation, { RectangleInitOptions } from './subtypes/rectangle';
import RingAnnotation, { RingInitOptions } from './subtypes/ring';
import { nanoid } from 'nanoid';
import { Coordinate, CoordinateCollection } from './coordinate';



/******************************************************************************
 * ***************************** GROUP ***************************** 
 *****************************************************************************/
export class AnnotationGroup {
    registry: Registry
    id: string;
    name?: string
    annotations: Set<Annotation>;

    constructor(registry: Registry, name?: string) {
        this.id = nanoid();
        this.registry = registry;
        this.name = name;
        this.annotations = new Set<Annotation>();
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
            annotation.delete();
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

/******************************************************************************
 * ***************************** REGISTRY ***************************** 
 *****************************************************************************/
export class Registry {
    id: string;
    annotations: Annotation[];
    groups: AnnotationGroup[];
    viewer: Cesium.Viewer;
    viewerInterface: ViewerInterface

    loaders: { [key: string]: (geom: any) => Annotation | null }

    useAltitude: boolean

    constructor(init: RegistryInit) {
        this.id = init.id;
        this.viewer = init.viewer;
        this.annotations = [];
        this.groups = [];
        this.useAltitude = init.useAltitude ?? true;

        this.loaders = {};

        // this.viewerInterface = new ViewerInterface(this.viewer, {useAltitude: this.useAltitude});
        this.viewerInterface = ViewerInterface.registerViewer(this.viewer, { useAltitude: this.useAltitude });
    }

    getAnnotationByID(id: string): Annotation | null | undefined {
        return this.annotations.find(annotation => annotation.id === id);
    }

    deleteByID(id: string) {
        const annotation = this.annotations
            .find(annotation => annotation.id === id)
        if (!!annotation) {
            annotation.delete();
            this.annotations = this.annotations.filter(a => a !== annotation);
        }
    }

    activateByID(id: string) {
        for (let annotation of this.annotations) {
            annotation.id === id ? annotation.activate() : annotation.deactivate()
        }
    }

    createGroup(name?: string): AnnotationGroup {
        const group = new AnnotationGroup(this, name);
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
    addPoint(options: PointInitOptions): PointAnnotation {
        const annotation = new PointAnnotation(this, options);
        this.annotations.push(annotation);
        return annotation
    }

    addPolyline(options: PolylineInitOptions): PolylineAnnotation {
        const annotation = new PolylineAnnotation(this, options);
        this.annotations.push(annotation);
        return annotation
    }

    addPolygon(options: PolygonInitOptions): PolygonAnnotation {
        const annotation = new PolygonAnnotation(this, options);
        this.annotations.push(annotation);
        return annotation;
    }

    addRectangle(options: RectangleInitOptions): RectangleAnnotation {
        const annotation = new RectangleAnnotation(this, options);
        this.annotations.push(annotation);
        return annotation;
    }

    addRing(options: RingInitOptions): RingAnnotation {
        const annotation = new RingAnnotation(this, options);
        this.annotations.push(annotation);
        return annotation;
    }

    // LOADERS
    loadFromGeoJson(geoJson: GeoJsonFeature | GeoJsonFeatureCollection, options?: GeoJsonLoaderOptions): Annotation | null {
        options = options ?? {};
        if (geoJson.type === "Feature") {
            geoJson = geoJson as GeoJsonFeature;
            if (geoJson.geometry?.type === GeoJsonType.POINT) {
                const annotation = this.addPoint(geoJson.properties?.[options.propertiesInitKey ?? ""] ?? {})
                const gjCoords = geoJson.geometry.coordinates
                const point = new Coordinate({ lng: gjCoords[0] as number, lat: gjCoords[1] as number, alt: (gjCoords[2] ?? 0) as number })
                annotation.appendCoordinate(point);
                annotation.draw();
                return annotation;
            }

            if (geoJson.geometry?.type === GeoJsonType.POLYLINE) {
                const annotation = this.addPolyline(geoJson.properties?.[options.propertiesInitKey ?? ""] ?? {})
                const coords = geoJson.geometry.coordinates;
                for (let c of coords) {
                    annotation.appendCoordinate(new Coordinate({ lng: (c as number[])[0], lat: (c as number[])[1], alt: (c as number[])[2] ?? 0.0 }))
                }
                annotation.draw();
                return annotation
            }

            if (geoJson.geometry?.type === GeoJsonType.POLYGON) {
                // Rectangle 
                if (geoJson.properties.annotationType === AnnotationType.RECTANGLE) {
                    const annotation = this.addRectangle(geoJson.properties?.[options.propertiesInitKey ?? ""] ?? {});
                    annotation.appendCoordinate(new Coordinate(geoJson.properties.vert1))
                    annotation.appendCoordinate(new Coordinate(geoJson.properties.vert2))
                    annotation.draw();
                    return annotation
                }

                // Ring 
                else if (geoJson.properties.annotationType === AnnotationType.RING) {
                    const annotation = this.addRing(geoJson.properties?.[options.propertiesInitKey ?? ""] ?? {});
                    annotation.appendCoordinate(new Coordinate(geoJson.properties.center))
                    annotation.appendCoordinate(new Coordinate(geoJson.properties.perimeterPoint))
                    annotation.draw()
                    return annotation;
                }

                // Polygon 
                else {
                    const annotation = this.addPolygon(geoJson.properties?.[options.propertiesInitKey ?? ""] ?? {});
                }

            }

        } else if (geoJson.type === "FeatureCollection") {

        }

        return null;
    }

    defineCustomLoader(loaderName: string, func: (geom: any) => Annotation | null) {
        this.loaders[loaderName] = func.bind(this);
    }

    loadWith(loaderName: string, geom: any): Annotation | null {
        return this.loaders[loaderName]?.(geom) ?? null;
    }




}


