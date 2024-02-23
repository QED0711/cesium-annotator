import * as Cesium from 'cesium';
import { AnnotationType, DistanceUnit } from "../../utils/types";
import { Annotation } from "../core";
export default class Polyline extends Annotation {
    constructor(registry, options) {
        var _a, _b, _c;
        super(registry, options);
        this.annotationType = AnnotationType.POLYLINE;
        this.entityProperties = (_a = options.entityProperties) !== null && _a !== void 0 ? _a : {};
        this.handleProperties = (_b = options.handleProperties) !== null && _b !== void 0 ? _b : {};
        this.midpointMarkers = (_c = options.midpointMarkers) !== null && _c !== void 0 ? _c : true,
            this.midPointHandles = [];
    }
    appendCoordinate(coordinate) {
        this.points.push(coordinate);
        this.emit("append", { annotation: this });
    }
    draw() {
        let entity = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                polyline: Object.assign({ positions: this.points.toCartesian3Array(), width: 2 }, this.entityProperties)
            });
        }
        else if (!this.entity) {
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                polyline: Object.assign({ positions: new Cesium.CallbackProperty(() => {
                        return this.points.toCartesian3Array();
                    }, false), width: 2 }, this.entityProperties)
            });
        }
        if (entity) {
            entity._annotation = this;
            this.entity = entity;
        }
        this.emit("update", { annotation: this });
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
        if (this.points.length >= 2) {
            for (let i = 0; i < this.points.length - 1; i++) {
                const point = this.points.at(i);
                const midPoint = point.segmentDistance(this.points.at(i + 1), 2)[0];
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
}
//# sourceMappingURL=polyline.js.map