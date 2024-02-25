import * as Cesium from 'cesium';
import { ViewerInterface } from './viewerInterface';
import PointAnnotation from './subtypes/point';
import PolylineAnnotation from './subtypes/polyline';
import PolygonAnnotation from './subtypes/polygon';
import RectangleAnnotation from './subtypes/rectangle';
import RingAnnotation from './subtypes/ring';
import { nanoid } from 'nanoid';
/******************************************************************************
 * ***************************** GROUP *****************************
 *****************************************************************************/
export class AnnotationGroup {
    constructor(registry, name) {
        this.id = nanoid();
        this.registry = registry;
        this.name = name;
        this.annotations = new Set();
    }
    capture(annotation) {
        this.annotations.add(annotation);
        annotation.groups.add(this);
    }
    release(annotation) {
        this.annotations.delete(annotation);
        annotation.groups.delete(this);
    }
    releaseAll() {
        const annotations = Array.from(this.annotations);
        for (let annotation of annotations) {
            this.release(annotation);
        }
    }
    executeCallback(func) {
        for (let annotation of this.annotations) {
            annotation.executeCallback(func);
        }
    }
    show() {
        for (let annotation of this.annotations) {
            annotation.show();
        }
    }
    hide() {
        for (let annotation of this.annotations) {
            annotation.hide();
        }
    }
    deleteAll() {
        let annotations = Array.from(this.annotations);
        for (let annotation of annotations) {
            annotation.delete();
        }
    }
    flyTo(options) {
        const entities = Array.from(this.annotations).map(annotation => annotation.entity).filter(entity => !!entity);
        if (entities.length === 0)
            return;
        this.registry.viewer.flyTo(entities, Object.assign({ duration: 0, offset: new Cesium.HeadingPitchRange(0, -90) }, (options !== null && options !== void 0 ? options : {})));
    }
    toGeoJson() {
        const features = [];
        Array.from(this.annotations)
            .map(annotation => annotation.toGeoJson())
            .forEach(geoJson => {
            if (geoJson) {
                features.push(geoJson.features[0]);
            }
        });
        return { type: "FeatureCollection", features };
    }
    toWkt() {
        return Array.from(this.annotations)
            .map(annotation => annotation.toWkt())
            .filter(wkt => !!wkt);
    }
}
/******************************************************************************
 * ***************************** REGISTRY *****************************
 *****************************************************************************/
export class Registry {
    constructor(init) {
        var _a;
        this.id = init.id;
        this.viewer = init.viewer;
        this.annotations = [];
        this.groups = [];
        this.useAltitude = (_a = init.useAltitude) !== null && _a !== void 0 ? _a : true;
        // this.viewerInterface = new ViewerInterface(this.viewer, {useAltitude: this.useAltitude});
        this.viewerInterface = ViewerInterface.registerViewer(this.viewer, { useAltitude: this.useAltitude });
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
    createGroup(name) {
        const group = new AnnotationGroup(this, name);
        this.groups.push(group);
        return group;
    }
    getGroupByID(id) {
        var _a;
        return (_a = this.groups.find(g => g.id === id)) !== null && _a !== void 0 ? _a : null;
    }
    getGroupByName(name) {
        var _a;
        return (_a = this.groups.find(g => g.name === name)) !== null && _a !== void 0 ? _a : null;
    }
    deleteGroupByID(id, options) {
        const group = this.getGroupByID(id);
        if (group) {
            (options === null || options === void 0 ? void 0 : options.deleteAnnotations) && group.deleteAll();
            (options === null || options === void 0 ? void 0 : options.releaseAnnotations) && group.releaseAll();
        }
        this.groups = this.groups.filter(g => g.id !== id);
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
    addRectangle(options) {
        const annotation = new RectangleAnnotation(this, options);
        this.annotations.push(annotation);
        return annotation;
    }
    addRing(options) {
        const annotation = new RingAnnotation(this, options);
        this.annotations.push(annotation);
        return annotation;
    }
}
//# sourceMappingURL=registry.js.map