import * as Cesium from 'cesium';
import { AnnotationType, DistanceUnit, EventType, HandleType } from "../../utils/types";
import { Annotation } from "../core";
import { CoordinateCollection } from '../coordinate';
export class PolylineAnnotation extends Annotation {
    constructor(registry, options) {
        var _a, _b, _c, _d, _e;
        super(registry, options);
        this.annotationType = AnnotationType.POLYLINE;
        this.polylineProperties = (_a = options.polylineProperties) !== null && _a !== void 0 ? _a : {};
        this.entityProperties = (_b = options.entityProperties) !== null && _b !== void 0 ? _b : {};
        this.midpointHandles = (_c = options.midpointHandles) !== null && _c !== void 0 ? _c : true,
            this.midpointHandleType = (_d = options.midpointHandleType) !== null && _d !== void 0 ? _d : HandleType.POINT,
            this.midpointHandleProperties = (_e = options.midpointHandleProperties) !== null && _e !== void 0 ? _e : {};
        this.mpHandles = [];
    }
    appendCoordinate(coordinate) {
        this.points.push(coordinate);
        this.emit(EventType.APPEND, { annotation: this });
    }
    draw(options) {
        options = options !== null && options !== void 0 ? options : {};
        let entity = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, polyline: Object.assign({ positions: this.points.toCartesian3Array(), width: 2 }, this.polylineProperties) }, this.entityProperties));
        }
        else if (!this.entity || options.forceLiveRedraw) {
            this.removeEntity();
            entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, polyline: Object.assign({ positions: new Cesium.CallbackProperty(() => {
                        return this.points.toCartesian3Array();
                    }, false), width: 2 }, this.polylineProperties) }, this.entityProperties));
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
        if (this.points.length >= 2) {
            let point;
            let billboard;
            if (this.midpointHandleType === HandleType.POINT) {
                point = Object.assign({ pixelSize: 5 }, this.midpointHandleProperties);
            }
            else if (this.midpointHandleType === HandleType.BILLBOARD) {
                billboard = this.midpointHandleProperties;
            }
            for (let i = 0; i < this.points.length - 1; i++) {
                const pnt = this.points.at(i);
                const midPoint = pnt.segmentDistance(this.points.at(i + 1), 2)[0];
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
        for (let handle of this.mpHandles) {
            handle.show = false;
        }
    }
    showHandles() {
        super.showHandles();
        for (let handle of this.mpHandles) {
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
    setPolylineProperties(properties) {
        this.polylineProperties = properties;
        this.emit(EventType.PROPERTY, { annotation: this });
    }
    setPolylineProperty(propName, value) {
        this.polylineProperties[propName] = value;
        this.emit(EventType.PROPERTY, { annotation: this });
    }
    deletePolylineProperty(propName) {
        delete this.polylineProperties[propName];
        this.emit(EventType.PROPERTY, { annotation: this });
    }
    // OVERRIDES
    toGeoJson() {
        const geoJson = super.toGeoJson();
        if (geoJson) {
            const properties = geoJson.features[0].properties;
            properties.initOptions = Object.assign({ polylineProperties: this.polylineProperties, midpointHandles: this.midpointHandles, midpointHandleType: this.midpointHandleType, midpointHandleProperties: this.midpointHandleProperties }, properties.initOptions);
            return geoJson;
        }
        return null;
    }
    // SUBCLASS SPECIFIC METHODS
    getTotalDistance(unit = DistanceUnit.METERS) {
        let dist = 0;
        for (let i = 1; i < this.points.length; i++) {
            dist += this.points.at(i).distanceTo(this.points.at(i - 1), unit);
        }
        return dist;
    }
    getDistanceSegments(unit = DistanceUnit.METERS) {
        let distArr = [];
        for (let i = 1; i < this.points.length; i++) {
            distArr.push(this.points.at(i).distanceTo(this.points.at(i - 1), unit));
        }
        return distArr;
    }
    getHeadingSegments() {
        const headingArr = [];
        for (let i = 1; i < this.points.length; i++) {
            headingArr.push(this.points.at(i - 1).headingTo(this.points.at(i)));
        }
        return headingArr;
    }
    getPointsOnPath(distance, unit) {
        if (this.points.length < 2)
            return null;
        const collection = new CoordinateCollection([this.points.at(0)]);
        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points.at(i - 1);
            const p2 = this.points.at(i);
            const segDist = p1.distanceTo(p2, unit);
            const segHeading = p1.headingTo(p2);
            const pointsInSeg = Math.floor(segDist / distance);
            for (let n = 0; n < pointsInSeg; n++) {
                const coord = p1.atHeadingDistance(segHeading, distance * n, unit);
                collection.push(coord);
            }
            collection.push(p2);
        }
        return collection;
    }
}
//# sourceMappingURL=polyline.js.map