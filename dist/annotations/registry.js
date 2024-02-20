import { ViewerInterface } from './viewerInterface';
import PointAnnotation from './subtypes/point';
import PolylineAnnotation from './subtypes/polyline';
import PolygonAnnotation from './subtypes/polygon';
/******************************************************************************
 * ***************************** REGISTRY *****************************
 *****************************************************************************/
export class Registry {
    constructor(init) {
        var _a;
        this.id = init.id;
        this.viewer = init.viewer;
        this.annotations = [];
        this.useAltitude = (_a = init.useAltitude) !== null && _a !== void 0 ? _a : true;
        this.viewerInterface = new ViewerInterface(this.viewer, { useAltitude: this.useAltitude });
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
    addPolygon(options) {
        const annotation = new PolygonAnnotation(this, options);
        this.annotations.push(annotation);
        return annotation;
    }
}
//# sourceMappingURL=registry.js.map