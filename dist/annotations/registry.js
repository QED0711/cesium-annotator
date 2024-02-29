import * as Cesium from 'cesium';
import { AnnotationType, GeoJsonType } from '../utils/types';
import { ViewerInterface } from './viewerInterface';
import { PointAnnotation } from './subtypes/point';
import { PolylineAnnotation } from './subtypes/polyline';
import { PolygonAnnotation } from './subtypes/polygon';
import { RectangleAnnotation } from './subtypes/rectangle';
import { RingAnnotation } from './subtypes/ring';
import { nanoid } from 'nanoid';
import { Coordinate } from './coordinate';
/******************************************************************************
 * ***************************** GROUP *****************************
 *****************************************************************************/
export class AnnotationGroup {
    constructor(registry, options) {
        var _a, _b;
        this.registry = registry;
        this.id = (_a = options.id) !== null && _a !== void 0 ? _a : nanoid();
        this.name = (_b = options.name) !== null && _b !== void 0 ? _b : "";
        this.annotations = new Set();
    }
    toRecord() {
        return { id: this.id, name: this.name };
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
        this.events = {};
        this.loaders = {};
        this.viewerInterface = ViewerInterface.registerViewer(this.viewer, { useAltitude: this.useAltitude });
    }
    getActiveAnnotation() {
        var _a;
        return (_a = this.annotations.find(annotation => annotation.isActive)) !== null && _a !== void 0 ? _a : null;
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
    deactivateByID(id) {
        var _a, _b;
        (_b = (_a = this.annotations.find(annotation => annotation.id === id)) === null || _a === void 0 ? void 0 : _a.deactivate) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    registerEvent(event) {
        if (event.eventName in this.events) {
            this.events[event.eventName].push(event.callback);
        }
        else {
            this.events[event.eventName] = [event.callback];
        }
    }
    registerEvents(events) {
        for (let event of events) {
            this.registerEvent(event);
        }
    }
    applyEvents(annotation) {
        for (let eventName of Object.keys(this.events)) {
            for (let callback of this.events[eventName]) {
                annotation.on(eventName, callback);
            }
        }
    }
    getOrCreateGroup(options) {
        const existingGroup = this.groups.find(group => group.name === options.name || group.id === options.id);
        if (existingGroup)
            return existingGroup;
        const group = new AnnotationGroup(this, options);
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
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        return annotation;
    }
    addPolyline(options) {
        const annotation = new PolylineAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        return annotation;
    }
    addPolygon(options) {
        const annotation = new PolygonAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        return annotation;
    }
    addRectangle(options) {
        const annotation = new RectangleAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        return annotation;
    }
    addRing(options) {
        const annotation = new RingAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        return annotation;
    }
    // LOADERS
    loadFromGeoJson(geoJson, options) {
        if (geoJson.type === "Feature") {
            const annotation = this.loadFeatureFromGeoJson(geoJson, options);
            return annotation ? [annotation] : null;
        }
        if (geoJson.type === "FeatureCollection") {
            return this.loadFeatureCollectionFromGeoJson(geoJson, options);
        }
        return null;
    }
    loadFeatureFromGeoJson(geoJson, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
        options = options !== null && options !== void 0 ? options : {};
        options.propertiesInitKey = (_a = options.propertiesInitKey) !== null && _a !== void 0 ? _a : "initOptions";
        // callback is executed to change the geoJson prior to initializing annotation(s) from it.
        geoJson = (_c = (_b = options.preInitCallback) === null || _b === void 0 ? void 0 : _b.call(options, { geoJson })) !== null && _c !== void 0 ? _c : geoJson;
        let annotation = null;
        if (((_d = geoJson.geometry) === null || _d === void 0 ? void 0 : _d.type) === GeoJsonType.POINT) {
            annotation = this.addPoint((_g = (_e = geoJson.properties) === null || _e === void 0 ? void 0 : _e[(_f = options.propertiesInitKey) !== null && _f !== void 0 ? _f : ""]) !== null && _g !== void 0 ? _g : {});
            const gjCoords = geoJson.geometry.coordinates;
            const point = new Coordinate({ lng: gjCoords[0], lat: gjCoords[1], alt: ((_h = gjCoords[2]) !== null && _h !== void 0 ? _h : 0) });
            annotation.appendCoordinate(point);
        }
        if (((_j = geoJson.geometry) === null || _j === void 0 ? void 0 : _j.type) === GeoJsonType.POLYLINE) {
            annotation = this.addPolyline((_m = (_k = geoJson.properties) === null || _k === void 0 ? void 0 : _k[(_l = options.propertiesInitKey) !== null && _l !== void 0 ? _l : ""]) !== null && _m !== void 0 ? _m : {});
            const coords = geoJson.geometry.coordinates;
            for (let c of coords) {
                annotation.appendCoordinate(new Coordinate({ lng: c[0], lat: c[1], alt: (_o = c[2]) !== null && _o !== void 0 ? _o : 0.0 }));
            }
        }
        if (((_p = geoJson.geometry) === null || _p === void 0 ? void 0 : _p.type) === GeoJsonType.POLYGON) {
            // Rectangle 
            if (geoJson.properties.annotationType === AnnotationType.RECTANGLE) {
                annotation = this.addRectangle((_s = (_q = geoJson.properties) === null || _q === void 0 ? void 0 : _q[(_r = options.propertiesInitKey) !== null && _r !== void 0 ? _r : ""]) !== null && _s !== void 0 ? _s : {});
                annotation.appendCoordinate(new Coordinate(geoJson.properties.vert1));
                annotation.appendCoordinate(new Coordinate(geoJson.properties.vert2));
                annotation.draw();
                return annotation;
            }
            // Ring 
            else if (geoJson.properties.annotationType === AnnotationType.RING) {
                annotation = this.addRing((_v = (_t = geoJson.properties) === null || _t === void 0 ? void 0 : _t[(_u = options.propertiesInitKey) !== null && _u !== void 0 ? _u : ""]) !== null && _v !== void 0 ? _v : {});
                annotation.appendCoordinate(new Coordinate(geoJson.properties.center));
                annotation.appendCoordinate(new Coordinate(geoJson.properties.perimeterPoint));
                annotation.draw();
                return annotation;
            }
            // Polygon 
            else {
                annotation = this.addPolygon((_y = (_w = geoJson.properties) === null || _w === void 0 ? void 0 : _w[(_x = options.propertiesInitKey) !== null && _x !== void 0 ? _x : ""]) !== null && _y !== void 0 ? _y : {});
                const coords = (_z = geoJson.geometry.coordinates[0]) !== null && _z !== void 0 ? _z : [];
                for (let c of coords.slice(0, -1)) {
                    annotation.appendCoordinate(new Coordinate({ lng: c[0], lat: c[1], alt: (_0 = c[2]) !== null && _0 !== void 0 ? _0 : 0.0 }));
                }
            }
        }
        if (annotation) {
            annotation = (_2 = (_1 = options.preDrawCallback) === null || _1 === void 0 ? void 0 : _1.call(options, { annotation, geoJson })) !== null && _2 !== void 0 ? _2 : annotation;
            this.applyEvents(annotation);
            annotation.draw();
            return annotation;
        }
        return null;
    }
    loadFeatureCollectionFromGeoJson(geoJson, options) {
        const results = [];
        for (let feature of geoJson.features) {
            const annotation = this.loadFeatureFromGeoJson(feature, options);
            annotation && results.push(annotation);
        }
        return results;
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