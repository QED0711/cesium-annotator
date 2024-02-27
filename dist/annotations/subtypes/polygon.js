import * as Cesium from 'cesium';
import { AnnotationType, EventType } from "../../utils/types";
import { Annotation } from "../core";
export default class Polygon extends Annotation {
    constructor(registry, options) {
        var _a, _b, _c, _d, _e;
        super(registry, options);
        this.annotationType = AnnotationType.POLYGON;
        this.polygonProperties = (_a = options.polygonProperties) !== null && _a !== void 0 ? _a : {};
        this.handleProperties = (_b = options.handleProperties) !== null && _b !== void 0 ? _b : {};
        this.entityProperties = (_c = options.entityProperties) !== null && _c !== void 0 ? _c : {};
        this.drawAsLine = (_d = options.drawAsLine) !== null && _d !== void 0 ? _d : false;
        this.midpointMarkers = (_e = options.midpointMarkers) !== null && _e !== void 0 ? _e : true;
        this.midPointHandles = [];
    }
    appendCoordinate(coordinate) {
        this.points.push(coordinate);
        this.emit(EventType.APPEND, { annotation: this });
    }
    draw() {
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
        else if (!this.entity) {
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
        if (!this.midpointMarkers)
            return;
        for (let mph of this.midPointHandles) {
            this.viewerInterface.viewer.entities.remove(mph);
        }
        this.midPointHandles = [];
        if (this.points.length >= 3) {
            for (let i = 0; i < this.points.length; i++) {
                const point = this.points.at(i);
                if (!point)
                    continue;
                const nextPoint = i === this.points.length - 1 ? this.points.at(0) : this.points.at(i + 1);
                const midPoint = point.segmentDistance(nextPoint, 2)[0];
                const mpHandle = this.viewerInterface.viewer.entities.add({
                    position: midPoint.cartesian3,
                    point: {
                        pixelSize: 5,
                        color: Cesium.Color.BLUE,
                    }
                });
                mpHandle._isMidpointHandle = true;
                mpHandle._annotation = this;
                mpHandle._coordinate = midPoint;
                mpHandle._idxBookends = [i, i + 1];
                this.midPointHandles.push(mpHandle);
            }
        }
    }
    hideHandles() {
        super.hideHandles();
        for (let handle of Object.values(this.midPointHandles)) {
            handle.show = false;
        }
    }
    showHandles() {
        super.showHandles();
        for (let handle of Object.values(this.midPointHandles)) {
            handle.show = true;
        }
    }
    toGeoJson() {
        const geoJson = super.toGeoJson();
        if (geoJson) {
            const properties = geoJson.features[0].properties;
            properties.initOptions = Object.assign({ polygonProperties: this.polygonProperties, handleProperties: this.handleProperties, entityProperties: this.entityProperties, drawAsLine: this.drawAsLine, midPointMarkers: this.midpointMarkers }, properties.initOptions);
            return geoJson;
        }
        return null;
    }
}
//# sourceMappingURL=polygon.js.map