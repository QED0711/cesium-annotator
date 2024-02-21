import * as Cesium from 'cesium';
import { AnnotationType, DistanceUnit } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
export default class Rectangle extends Annotation {
    constructor(registry, options) {
        var _a, _b, _c;
        super(registry, options);
        this.annotationType = AnnotationType.RECTANGLE;
        this.entityProperties = (_a = options.entityProperties) !== null && _a !== void 0 ? _a : {};
        this.handleProperties = (_b = options.handleProperties) !== null && _b !== void 0 ? _b : {};
        this.drawAsLine = (_c = options.drawAsLine) !== null && _c !== void 0 ? _c : false;
    }
    appendCoordinate(coordinate) {
        if (this.points.length < 2) {
            this.points.push(coordinate);
        }
        else {
            this.points[1] = coordinate;
        }
    }
    draw() {
        let entity = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            const bbox = Coordinate.getMinMaxBbox(this.points);
            const positions = [
                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMax),
                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMax),
                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMin),
                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
            ];
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: Object.assign({ positions, width: 2 }, this.entityProperties)
                });
            }
            else if (this.points.length === 2) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polygon: Object.assign({ hierarchy: positions }, this.entityProperties)
                });
            }
        }
        else if (!this.entity) {
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: Object.assign({ positions: new Cesium.CallbackProperty(() => {
                            const bbox = Coordinate.getMinMaxBbox(this.points);
                            return [
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMin),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                            ];
                        }, false), width: 2 }, this.entityProperties)
                });
            }
            else if (this.points.length === 2) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polygon: Object.assign({ hierarchy: new Cesium.CallbackProperty(() => {
                            const bbox = Coordinate.getMinMaxBbox(this.points);
                            return new Cesium.PolygonHierarchy([
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMin),
                            ]);
                        }, false) }, this.entityProperties)
                });
            }
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
    getPerimeter(unit = DistanceUnit.METERS) {
        const bbox = Coordinate.getMinMaxBbox(this.points);
        const bl = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMin });
        const br = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMax });
        const tl = new Coordinate({ lat: bbox.latMax, lng: bbox.lngMax });
        const width = bl.distanceTo(br, unit);
        const height = bl.distanceTo(tl, unit);
        return (width * 2) + (height * 2);
    }
    getArea(unit = DistanceUnit.METERS) {
        const bbox = Coordinate.getMinMaxBbox(this.points);
        const bl = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMin });
        const br = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMax });
        const tl = new Coordinate({ lat: bbox.latMax, lng: bbox.lngMax });
        const width = bl.distanceTo(br, unit);
        const height = bl.distanceTo(tl, unit);
        return width * height;
    }
}
//# sourceMappingURL=rectangle.js.map