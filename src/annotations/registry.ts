import * as Cesium from 'cesium';
import { RegistryInit } from '../utils/types';
import { ViewerInterface } from './viewerInterface';
import { Annotation } from './core';
import PointAnnotation, { PointInitOptions } from './subtypes/point';
import PolylineAnnotation, {PolylineInitOptions} from './subtypes/polyline';

import PolygonAnnotation, { PolygonInitOptions } from './subtypes/polygon';
import RectangleAnnotation, { RectangleInitOptions } from './subtypes/rectangle';
import RingAnnotation, { RingInitOptions } from './subtypes/ring';
import { nanoid } from 'nanoid';



/******************************************************************************
 * ***************************** GROUP ***************************** 
 *****************************************************************************/
export class AnnotationGroup {
    id: string;
    name?: string
    annotations: Set<Annotation>;

    constructor(name?: string) {
        this.id = nanoid();
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
        for(let annotation of annotations) {
            this.release(annotation);
        }
    }

    executeCallback(func: (annotation: Annotation) => {}) {
        for(let annotation of this.annotations) {
            annotation.executeCallback(func);
        }
    }

    show() {
        for(let annotation of this.annotations) {
            annotation.show()
        }
    }
    
    hide() {
        for(let annotation of this.annotations) {
            annotation.hide()
        }
    }

    deleteAll(){
        let annotations = Array.from(this.annotations);
        for(let annotation of annotations) {
            annotation.delete();
        }
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

    useAltitude: boolean

    constructor(init: RegistryInit) {
        this.id = init.id;
        this.viewer = init.viewer;
        this.annotations = [];
        this.groups = [];
        this.useAltitude = init.useAltitude ?? true;

        this.viewerInterface = new ViewerInterface(this.viewer, {useAltitude: this.useAltitude});
    }

    getAnnotationByID(id: string): Annotation | null | undefined {
        return this.annotations.find(annotation => annotation.id === id);
    }

    deleteByID(id: string) {
        const annotation = this.annotations
            .find(annotation => annotation.id === id)
        if(!!annotation) {
            annotation.delete();
            this.annotations = this.annotations.filter(a => a !== annotation);
        }
    }

    activateByID(id: string) {
        for(let annotation of this.annotations) {
            annotation.id === id ? annotation.activate() : annotation.deactivate()
        }
    }

    createGroup(name?: string): AnnotationGroup {
        const group = new AnnotationGroup(name);
        this.groups.push(group)
        return group;
    }

    getGroupByID(id: string): AnnotationGroup | null {
        return this.groups.find(g => g.id === id) ?? null
    }

    getGroupByName(name: string): AnnotationGroup | null {
        return this.groups.find(g => g.name === name) ?? null
    }

    deleteGroupByID(id: string, options: {deleteAnnotations?: boolean, releaseAnnotations?: boolean} | undefined) {
        const group = this.getGroupByID(id);
        if(group) {
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


}


