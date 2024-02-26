import * as Cesium from 'cesium';
import { AnnotationType, GeoJsonType } from '../utils/types';
import { ViewerInterface } from './viewerInterface';
import PointAnnotation from './subtypes/point';
import PolylineAnnotation from './subtypes/polyline';
import PolygonAnnotation from './subtypes/polygon';
import RectangleAnnotation from './subtypes/rectangle';
import RingAnnotation from './subtypes/ring';
import { nanoid } from 'nanoid';
import { Coordinate } from './coordinate';
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
        this.loaders = {};
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
    // LOADERS
    loadFromGeoJson(geoJson, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
        options = options !== null && options !== void 0 ? options : {};
        if (geoJson.type === "Feature") {
            geoJson = geoJson;
            if (((_a = geoJson.geometry) === null || _a === void 0 ? void 0 : _a.type) === GeoJsonType.POINT) {
                const annotation = this.addPoint((_d = (_b = geoJson.properties) === null || _b === void 0 ? void 0 : _b[(_c = options.propertiesInitKey) !== null && _c !== void 0 ? _c : ""]) !== null && _d !== void 0 ? _d : {});
                const gjCoords = geoJson.geometry.coordinates;
                const point = new Coordinate({ lng: gjCoords[0], lat: gjCoords[1], alt: ((_e = gjCoords[2]) !== null && _e !== void 0 ? _e : 0) });
                annotation.appendCoordinate(point);
                annotation.draw();
                return annotation;
            }
            if (((_f = geoJson.geometry) === null || _f === void 0 ? void 0 : _f.type) === GeoJsonType.POLYLINE) {
                const annotation = this.addPolyline((_j = (_g = geoJson.properties) === null || _g === void 0 ? void 0 : _g[(_h = options.propertiesInitKey) !== null && _h !== void 0 ? _h : ""]) !== null && _j !== void 0 ? _j : {});
                const coords = geoJson.geometry.coordinates;
                for (let c of coords) {
                    annotation.appendCoordinate(new Coordinate({ lng: c[0], lat: c[1], alt: (_k = c[2]) !== null && _k !== void 0 ? _k : 0.0 }));
                }
                annotation.draw();
                return annotation;
            }
            if (((_l = geoJson.geometry) === null || _l === void 0 ? void 0 : _l.type) === GeoJsonType.POLYGON) {
                // Rectangle 
                if (geoJson.properties.annotationType === AnnotationType.RECTANGLE) {
                    const annotation = this.addRectangle((_p = (_m = geoJson.properties) === null || _m === void 0 ? void 0 : _m[(_o = options.propertiesInitKey) !== null && _o !== void 0 ? _o : ""]) !== null && _p !== void 0 ? _p : {});
                    annotation.appendCoordinate(new Coordinate(geoJson.properties.vert1));
                    annotation.appendCoordinate(new Coordinate(geoJson.properties.vert2));
                    annotation.draw();
                    return annotation;
                }
                // Ring 
                else if (geoJson.properties.annotationType === AnnotationType.RING) {
                    const annotation = this.addRing((_s = (_q = geoJson.properties) === null || _q === void 0 ? void 0 : _q[(_r = options.propertiesInitKey) !== null && _r !== void 0 ? _r : ""]) !== null && _s !== void 0 ? _s : {});
                    annotation.appendCoordinate(new Coordinate(geoJson.properties.center));
                    annotation.appendCoordinate(new Coordinate(geoJson.properties.perimeterPoint));
                    annotation.draw();
                    return annotation;
                }
                // Polygon 
                else {
                    const annotation = this.addPolygon((_v = (_t = geoJson.properties) === null || _t === void 0 ? void 0 : _t[(_u = options.propertiesInitKey) !== null && _u !== void 0 ? _u : ""]) !== null && _v !== void 0 ? _v : {});
                }
            }
        }
        else if (geoJson.type === "FeatureCollection") {
        }
        return null;
    }
    defineCustomLoader(loaderName, func) {
        this.loaders[loaderName] = func.bind(this);
    }
    loadWith(loaderName, geom) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.loaders)[loaderName]) === null || _b === void 0 ? void 0 : _b.call(_a, geom)) !== null && _c !== void 0 ? _c : null;
    }
}
//# sourceMappingURL=registry.js.map