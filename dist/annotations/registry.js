var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as Cesium from 'cesium';
import { AltQueryType, AnnotationType, GeoJsonType, RegistryEventType } from '../utils/types';
import { ViewerInterface } from './viewerInterface';
import { PointAnnotation } from './subtypes/point';
import { PolylineAnnotation } from './subtypes/polyline';
import { PolygonAnnotation } from './subtypes/polygon';
import { RectangleAnnotation } from './subtypes/rectangle';
import { RingAnnotation } from './subtypes/ring';
import { nanoid } from 'nanoid';
import { Coordinate } from './coordinate';
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
            this.registry.deleteByID(annotation.id);
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
    constructor(init) {
        var _a, _b, _c;
        this.id = init.id;
        this.viewer = init.viewer;
        this.annotations = [];
        this.groups = [];
        this.useAltitude = (_a = init.useAltitude) !== null && _a !== void 0 ? _a : AltQueryType.NONE;
        this.terrainSampleLevel = (_b = init.terrainSampleLevel) !== null && _b !== void 0 ? _b : 12;
        this.altQueryFallback = (_c = init.altQueryFallback) !== null && _c !== void 0 ? _c : AltQueryType.DEFAULT;
        this.events = {};
        this.registryEvents = {};
        this.loaders = {};
        this.viewerInterface = ViewerInterface.registerViewer(this.viewer, {
            useAltitude: this.useAltitude,
            terrainSampleLevel: this.terrainSampleLevel,
            altQueryFallback: this.altQueryFallback,
        });
    }
    on(eventNames, callback) {
        eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
        for (let eventName of eventNames) {
            if (eventName in this.registryEvents) {
                this.registryEvents[eventName].push(callback);
            }
            else {
                this.registryEvents[eventName] = [callback];
            }
        }
    }
    emit(eventName, payload) {
        if (!(eventName in this.registryEvents))
            return;
        for (let handler of this.registryEvents[eventName]) {
            handler(payload);
        }
    }
    getActiveAnnotation() {
        var _a;
        return (_a = this.annotations.find(annotation => annotation.isActive)) !== null && _a !== void 0 ? _a : null;
    }
    getAnnotationByID(id) {
        return this.annotations.find(annotation => annotation.id === id);
    }
    deleteByID(id) {
        const annotation = this.annotations.find(annotation => annotation.id === id);
        if (annotation) {
            annotation.delete();
            this.annotations = this.annotations.filter(a => a !== annotation);
        }
        this.emit(RegistryEventType.DELETE, { annotations: this.annotations, registry: this });
        this.emit(RegistryEventType.UPDATE, { annotations: this.annotations, registry: this });
    }
    deleteAllAnnotations() {
        for (let annotation of this.annotations) {
            annotation.delete();
        }
        this.annotations = [];
        this.emit(RegistryEventType.DELETE, { annotations: this.annotations, registry: this });
        this.emit(RegistryEventType.UPDATE, { annotations: this.annotations, registry: this });
    }
    activateByID(id) {
        const annotation = this.annotations.find(a => a.id === id);
        if (annotation && !annotation.isActive) {
            annotation.activate();
            return annotation;
        }
        return null;
    }
    deactivateByID(id) {
        var _a, _b;
        (_b = (_a = this.annotations.find(annotation => annotation.id === id)) === null || _a === void 0 ? void 0 : _a.deactivate) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    deactivateAllExcept(id) {
        for (let annotation of this.annotations) {
            if (annotation.id === id)
                continue;
            annotation.deactivate();
        }
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
    addPoint(options, initConfig = { replaceExisting: false }) {
        var _a;
        if (this.getAnnotationByID((_a = options === null || options === void 0 ? void 0 : options.id) !== null && _a !== void 0 ? _a : "")) {
            if (initConfig.replaceExisting) {
                this.deleteByID(options.id);
            }
            else {
                return this.getAnnotationByID(options.id);
            }
        }
        const annotation = new PointAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        this.emit(RegistryEventType.ADD, { annotations: this.annotations, registry: this });
        this.emit(RegistryEventType.UPDATE, { annotations: this.annotations, registry: this });
        return annotation;
    }
    addPolyline(options, initConfig = { replaceExisting: false }) {
        var _a;
        if (this.getAnnotationByID((_a = options === null || options === void 0 ? void 0 : options.id) !== null && _a !== void 0 ? _a : "")) {
            if (initConfig.replaceExisting) {
                this.deleteByID(options.id);
            }
            else {
                return this.getAnnotationByID(options.id);
            }
        }
        const annotation = new PolylineAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        this.emit(RegistryEventType.ADD, { annotations: this.annotations, registry: this });
        this.emit(RegistryEventType.UPDATE, { annotations: this.annotations, registry: this });
        return annotation;
    }
    addPolygon(options, initConfig = { replaceExisting: false }) {
        var _a;
        if (this.getAnnotationByID((_a = options === null || options === void 0 ? void 0 : options.id) !== null && _a !== void 0 ? _a : "")) {
            if (initConfig.replaceExisting) {
                this.deleteByID(options.id);
            }
            else {
                return this.getAnnotationByID(options.id);
            }
        }
        const annotation = new PolygonAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        this.emit(RegistryEventType.ADD, { annotations: this.annotations, registry: this });
        this.emit(RegistryEventType.UPDATE, { annotations: this.annotations, registry: this });
        return annotation;
    }
    addRectangle(options, initConfig = { replaceExisting: false }) {
        var _a;
        if (this.getAnnotationByID((_a = options === null || options === void 0 ? void 0 : options.id) !== null && _a !== void 0 ? _a : "")) {
            if (initConfig.replaceExisting) {
                this.deleteByID(options.id);
            }
            else {
                return this.getAnnotationByID(options.id);
            }
        }
        const annotation = new RectangleAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        this.emit(RegistryEventType.ADD, { annotations: this.annotations, registry: this });
        this.emit(RegistryEventType.UPDATE, { annotations: this.annotations, registry: this });
        return annotation;
    }
    addRing(options, initConfig = { replaceExisting: false }) {
        var _a;
        if (this.getAnnotationByID((_a = options === null || options === void 0 ? void 0 : options.id) !== null && _a !== void 0 ? _a : "")) {
            if (initConfig.replaceExisting) {
                this.deleteByID(options.id);
            }
            else {
                return this.getAnnotationByID(options.id);
            }
        }
        const annotation = new RingAnnotation(this, options);
        this.applyEvents(annotation);
        this.annotations.push(annotation);
        this.emit(RegistryEventType.ADD, { annotations: this.annotations, registry: this });
        this.emit(RegistryEventType.UPDATE, { annotations: this.annotations, registry: this });
        return annotation;
    }
    // LOADERS
    loadFromGeoJson(geoJson, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (geoJson.type === "Feature") {
                const annotation = yield this.loadFeatureFromGeoJson(geoJson, options);
                return annotation ? [annotation] : null;
            }
            if (geoJson.type === "FeatureCollection") {
                return this.loadFeatureCollectionFromGeoJson(geoJson, options);
            }
            return null;
        });
    }
    loadFeatureFromGeoJson(geoJson, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7;
        return __awaiter(this, void 0, void 0, function* () {
            options = options !== null && options !== void 0 ? options : {};
            options.propertiesInitKey = (_a = options.propertiesInitKey) !== null && _a !== void 0 ? _a : "initOptions";
            options.shouldDraw = (_b = options.shouldDraw) !== null && _b !== void 0 ? _b : true;
            // callback is executed to change the geoJson prior to initializing annotation(s) from it.
            geoJson = (_d = (yield ((_c = options.asyncPreInitCallback) === null || _c === void 0 ? void 0 : _c.call(options, { geoJson })))) !== null && _d !== void 0 ? _d : geoJson;
            geoJson = (_f = (_e = options.preInitCallback) === null || _e === void 0 ? void 0 : _e.call(options, { geoJson })) !== null && _f !== void 0 ? _f : geoJson;
            let annotation = null;
            if (((_g = geoJson.geometry) === null || _g === void 0 ? void 0 : _g.type) === GeoJsonType.POINT) {
                annotation = this.addPoint((_k = (_h = geoJson.properties) === null || _h === void 0 ? void 0 : _h[(_j = options.propertiesInitKey) !== null && _j !== void 0 ? _j : ""]) !== null && _k !== void 0 ? _k : {});
                const gjCoords = geoJson.geometry.coordinates;
                const point = new Coordinate({ lng: gjCoords[0], lat: gjCoords[1], alt: ((_l = gjCoords[2]) !== null && _l !== void 0 ? _l : 0) });
                annotation.appendCoordinate(point);
            }
            if (((_m = geoJson.geometry) === null || _m === void 0 ? void 0 : _m.type) === GeoJsonType.POLYLINE) {
                annotation = this.addPolyline((_q = (_o = geoJson.properties) === null || _o === void 0 ? void 0 : _o[(_p = options.propertiesInitKey) !== null && _p !== void 0 ? _p : ""]) !== null && _q !== void 0 ? _q : {});
                const coords = geoJson.geometry.coordinates;
                for (let c of coords) {
                    annotation.appendCoordinate(new Coordinate({ lng: c[0], lat: c[1], alt: (_r = c[2]) !== null && _r !== void 0 ? _r : 0.0 }));
                }
            }
            if (((_s = geoJson.geometry) === null || _s === void 0 ? void 0 : _s.type) === GeoJsonType.POLYGON) {
                // Rectangle 
                if (geoJson.properties.annotationType === AnnotationType.RECTANGLE) {
                    annotation = this.addRectangle((_v = (_t = geoJson.properties) === null || _t === void 0 ? void 0 : _t[(_u = options.propertiesInitKey) !== null && _u !== void 0 ? _u : ""]) !== null && _v !== void 0 ? _v : {});
                    annotation.appendCoordinate(new Coordinate(geoJson.properties.vert1));
                    annotation.appendCoordinate(new Coordinate(geoJson.properties.vert2));
                    annotation.draw();
                    return annotation;
                }
                // Ring 
                else if (geoJson.properties.annotationType === AnnotationType.RING) {
                    annotation = this.addRing((_y = (_w = geoJson.properties) === null || _w === void 0 ? void 0 : _w[(_x = options.propertiesInitKey) !== null && _x !== void 0 ? _x : ""]) !== null && _y !== void 0 ? _y : {});
                    annotation.appendCoordinate(new Coordinate(geoJson.properties.center));
                    annotation.appendCoordinate(new Coordinate(geoJson.properties.perimeterPoint));
                    annotation.draw();
                    return annotation;
                }
                // Polygon 
                else {
                    annotation = this.addPolygon((_1 = (_z = geoJson.properties) === null || _z === void 0 ? void 0 : _z[(_0 = options.propertiesInitKey) !== null && _0 !== void 0 ? _0 : ""]) !== null && _1 !== void 0 ? _1 : {});
                    const coords = (_2 = geoJson.geometry.coordinates[0]) !== null && _2 !== void 0 ? _2 : [];
                    for (let c of coords.slice(0, -1)) {
                        annotation.appendCoordinate(new Coordinate({ lng: c[0], lat: c[1], alt: (_3 = c[2]) !== null && _3 !== void 0 ? _3 : 0.0 }));
                    }
                }
            }
            if (annotation && !options.shouldDraw)
                return annotation;
            if (annotation) {
                if ("asyncPreDrawCallback" in options) {
                    annotation = (_5 = (yield ((_4 = options.asyncPreDrawCallback) === null || _4 === void 0 ? void 0 : _4.call(options, { annotation, geoJson })))) !== null && _5 !== void 0 ? _5 : annotation;
                }
                annotation = (_7 = (_6 = options.preDrawCallback) === null || _6 === void 0 ? void 0 : _6.call(options, { annotation, geoJson })) !== null && _7 !== void 0 ? _7 : annotation;
                this.applyEvents(annotation);
                annotation.draw();
                return annotation;
            }
            return null;
        });
    }
    loadFeatureCollectionFromGeoJson(geoJson, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = [];
            for (let feature of geoJson.features) {
                const annotation = yield this.loadFeatureFromGeoJson(feature, options);
                annotation && results.push(annotation);
            }
            return results;
        });
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