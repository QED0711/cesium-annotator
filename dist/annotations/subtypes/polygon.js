import * as Cesium from 'cesium';
import { AnnotationType, EventType, HandleType } from "../../utils/types";
import { Annotation } from "../core";
export class PolygonAnnotation extends Annotation {
    constructor(registry, options) {
        var _a, _b, _c, _d, _e;
        super(registry, options);
        this.annotationType = AnnotationType.POLYGON;
        this.polygonProperties = (_a = options.polygonProperties) !== null && _a !== void 0 ? _a : {};
        this.drawAsLine = (_b = options.drawAsLine) !== null && _b !== void 0 ? _b : false;
        this.midpointHandles = (_c = options.midpointHandles) !== null && _c !== void 0 ? _c : true;
        this.midpointHandleType = (_d = options.midpointHandleType) !== null && _d !== void 0 ? _d : HandleType.POINT,
            this.midpointHandleProperties = (_e = options.midpointHandleProperties) !== null && _e !== void 0 ? _e : {};
        this.mpHandles = [];
    }
    appendCoordinate(coordinate) {
        this.points.push(coordinate);
        this.emit(EventType.APPEND, { annotation: this });
    }
    draw(options) {
        options = options || {};
        let entity = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, polyline: Object.assign({ positions: [...this.points.coordinates.map(c => c.cartesian3), this.points.at(0).cartesian3], width: 2 }, this.polygonProperties) }, this.entityProperties));
            }
            else {
                if (this.points.length < 3)
                    return;
                entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, polygon: Object.assign({ hierarchy: this.points.toCartesian3Array() }, this.polygonProperties) }, this.entityProperties));
            }
        }
        else if (!this.entity || options.forceLiveRedraw) {
            this.removeEntity();
            if (this.drawAsLine) { // POLYLINE
                entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, polyline: Object.assign({ positions: new Cesium.CallbackProperty(() => {
                            return [...this.points.coordinates.map(c => c.cartesian3), this.points.at(0).cartesian3];
                        }, false), width: 2 }, this.polygonProperties) }, this.entityProperties));
            }
            else { // POLYGON
                if (this.points.length < 3)
                    return;
                entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, polygon: Object.assign({ hierarchy: new Cesium.CallbackProperty(() => {
                            const positions = this.points.toCartesian3Array();
                            return new Cesium.PolygonHierarchy(positions);
                        }, false) }, this.polygonProperties) }, this.entityProperties));
            }
        }
        if (entity) {
            entity._canActivate = true;
            entity._annotation = this;
            this.entity = entity;
        }
        this.emit(EventType.UPDATE, { annotation: this });
    }
    handlePointerDown(e) {
        super.handlePointerDown(e);
        const existingEntity = this.viewerInterface.queryEntityAtPixel();
        if (existingEntity === null || existingEntity === void 0 ? void 0 : existingEntity._isMidpointHandle) {
            this.insertCoordinateAtIndex(existingEntity._coordinate, existingEntity._idxBookends[1]);
            this.bypassPointerUp = true;
        }
    }
    syncHandles() {
        super.syncHandles();
        if (!this.midpointHandles)
            return;
        for (let mph of this.mpHandles) {
            this.viewerInterface.viewer.entities.remove(mph);
        }
        this.mpHandles = [];
        if (this.points.length >= 3) {
            let point;
            let billboard;
            if (this.midpointHandleType === HandleType.POINT) {
                point = Object.assign({ pixelSize: 5 }, this.midpointHandleProperties);
            }
            else if (this.midpointHandleType === HandleType.BILLBOARD) {
                billboard = this.midpointHandleProperties;
            }
            for (let i = 0; i < this.points.length; i++) {
                const pnt = this.points.at(i);
                if (!pnt)
                    continue;
                const nextPoint = i === this.points.length - 1 ? this.points.at(0) : this.points.at(i + 1);
                const midPoint = pnt.segmentDistance(nextPoint, 2)[0];
                const mpHandle = this.viewerInterface.viewer.entities.add({
                    position: midPoint.cartesian3,
                    point,
                    billboard
                });
                mpHandle._isMidpointHandle = true;
                mpHandle._annotation = this;
                mpHandle._coordinate = midPoint;
                mpHandle._idxBookends = [i, i + 1];
                this.mpHandles.push(mpHandle);
            }
        }
    }
    hideHandles() {
        super.hideHandles();
        for (let handle of Object.values(this.mpHandles)) {
            handle.show = false;
        }
    }
    showHandles() {
        super.showHandles();
        for (let handle of Object.values(this.mpHandles)) {
            handle.show = true;
        }
    }
    removeHandles() {
        super.removeHandles();
        for (let mpHandle of this.mpHandles) {
            this.viewerInterface.viewer.entities.remove(mpHandle);
        }
        this.mpHandles = [];
    }
    setPolygonProperties(properties) {
        this.polygonProperties = properties;
        this.emit(EventType.PROPERTY, { annotation: this });
    }
    setPolygonProperty(propName, value) {
        this.polygonProperties[propName] = value;
        this.emit(EventType.PROPERTY, { annotation: this });
    }
    deletePolygonProperty(propName) {
        delete this.polygonProperties[propName];
        this.emit(EventType.PROPERTY, { annotation: this });
    }
    toGeoJson() {
        const geoJson = super.toGeoJson();
        if (geoJson) {
            const properties = geoJson.features[0].properties;
            properties.initOptions = Object.assign({ polygonProperties: this.polygonProperties, drawAsLine: this.drawAsLine, midPointMarkers: this.midpointHandles }, properties.initOptions);
            return geoJson;
        }
        return null;
    }
}
//# sourceMappingURL=polygon.js.map