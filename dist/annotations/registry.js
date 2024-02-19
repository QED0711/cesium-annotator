import { ViewerInterface } from './viewerInterface';
import PointAnnotation from './subtypes/point';
import PolylineAnnotation from './subtypes/polyline';
/******************************************************************************
 * ***************************** REGISTRY *****************************
 *****************************************************************************/
export class Registry {
    constructor(init) {
        this.id = init.id;
        this.viewer = init.viewer;
        this.annotations = [];
        this.viewerInterface = new ViewerInterface(this.viewer);
    }
    getAnnotationByID(id) {
        return this.annotations.find(annotation => annotation.id === id);
    }
    deleteByID(id) {
        const annotation = this.annotations
            .find(annotation => annotation.id === id);
        if (!!annotation) {
            annotation.delete();
            this.annotations = this.annotations.filter(a => a !== annotation);
        }
    }
    activateByID(id) {
        for (let annotation of this.annotations) {
            annotation.id === id ? annotation.activate() : annotation.deactivate();
        }
    }
    // FACTORIES
    addPoint(options) {
        const annotation = new PointAnnotation(this, options);
        this.annotations.push(annotation);
        return annotation;
    }
    addPolyline(options) {
        const annotation = new PolylineAnnotation(this, options);
        this.annotations.push(annotation);
        return annotation;
    }
}
//# sourceMappingURL=registry.js.map