import * as Cesium from 'cesium';
import { AnnotationType, DistanceUnit } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
export default class Polyline extends Annotation {
    constructor(registry, options) {
        var _a, _b;
        super(registry, options);
        this.annotationType = AnnotationType.POLYLINE;
        this.entityProperties = (_a = options.entityProperties) !== null && _a !== void 0 ? _a : {};
        this.handleProperties = (_b = options.handleProperties) !== null && _b !== void 0 ? _b : {};
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
                polyline: Object.assign({ positions: Coordinate.coordinateArrayToCartesian3(this.points), width: 2 }, this.entityProperties)
            });
        }
        else if (!this.entity) {
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                polyline: Object.assign({ positions: new Cesium.CallbackProperty(() => {
                        return Coordinate.coordinateArrayToCartesian3(this.points);
                    }, false), width: 2 }, this.entityProperties)
            });
        }
        if (entity) {
            entity._annotation = this;
            this.entity = entity;
        }
        this.emit("update", { annotation: this });
    }
    syncHandles() {
        if (this.isActive) {
            for (let i = 0; i < this.points.length; i++) {
                const point = this.points[i];
                if (point.id in this.handles)
                    continue;
                const handle = this.viewerInterface.viewer.entities.add({
                    position: point.toCartesian3(),
                    point: {
                        pixelSize: 10,
                    }
                });
                handle._annotation = this;
                handle._isHandle = true;
                handle._handleCoordinateID = point.id;
                handle._handleIdx = i;
                this.handles[point.id] = handle;
            }
        }
        this.updateHandleIdxs();
        this.removeStaleHandles();
    }
    // SUBCLASS SPECIFIC METHODS
    getTotalDistance(unit = DistanceUnit.METERS) {
        let dist = 0;
        for (let i = 1; i < this.points.length; i++) {
            dist += this.points[i].distanceTo(this.points[i - 1], unit);
        }
        return dist;
    }
    getDistanceSegments(unit = DistanceUnit.METERS) {
        let distArr = [];
        for (let i = 1; i < this.points.length; i++) {
            distArr.push(this.points[i].distanceTo(this.points[i - 1], unit));
        }
        return distArr;
    }
    getHeadingSegments() {
        const headingArr = [];
        for (let i = 1; i < this.points.length; i++) {
            headingArr.push(this.points[i - 1].headingTo(this.points[i]));
        }
        return headingArr;
    }
}
//# sourceMappingURL=polyline.js.map