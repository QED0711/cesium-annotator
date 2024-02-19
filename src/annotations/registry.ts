import * as Cesium from 'cesium';
import { RegistryInit } from '../utils/types';
import { ViewerInterface } from './viewerInterface';
import { Annotation, Coordinate } from './core';
import PointAnnotation, { PointInitOptions } from './subtypes/point';
import PolylineAnnotation, {PolylineInitOptions} from './subtypes/polyline';



/******************************************************************************
 * ***************************** REGISTRY ***************************** 
 *****************************************************************************/
export class Registry {
    id: string;
    annotations: Annotation[];
    viewer: Cesium.Viewer;
    viewerInterface: ViewerInterface

    constructor(init: RegistryInit) {
        this.id = init.id;
        this.viewer = init.viewer;
        this.annotations = [];

        this.viewerInterface = new ViewerInterface(this.viewer);
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
}


