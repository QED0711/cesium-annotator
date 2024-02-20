import * as Cesium from 'cesium';
import { AnnotationType } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
export default class Polygon extends Annotation {
    constructor(registry, options) {
        var _a, _b, _c;
        super(registry, options);
        this.annotationType = AnnotationType.POLYGON;
        this.entityProperties = (_a = options.entityProperties) !== null && _a !== void 0 ? _a : {};
        this.handleProperties = (_b = options.handleProperties) !== null && _b !== void 0 ? _b : {};
        this.drawAsLine = (_c = options.drawAsLine) !== null && _c !== void 0 ? _c : false;
    }
    appendCoordinate(coordinate) {
        this.points.push(coordinate);
        this.emit("append", { annotation: this });
    }
    draw() {
        let entity = null;
        if (!this.liveUpdate) {
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: Object.assign({ positions: Coordinate.coordinateArrayToCartesian3([...this.points, this.points[0]]), width: 2 }, this.entityProperties)
                });
            }
            else {
                if (this.points.length < 3)
                    return;
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polygon: Object.assign({ hierarchy: Coordinate.coordinateArrayToCartesian3(this.points) }, this.entityProperties)
                });
            }
        }
        else if (!this.entity) {
            if (this.drawAsLine) { // POLYLINE
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: Object.assign({ positions: new Cesium.CallbackProperty(() => {
                            return Coordinate.coordinateArrayToCartesian3([...this.points, this.points[0]]);
                        }, false), width: 2 }, this.entityProperties)
                });
            }
            else { // POLYGON
                if (this.points.length < 3)
                    return;
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polygon: Object.assign({ hierarchy: new Cesium.CallbackProperty(() => {
                            const positions = Coordinate.coordinateArrayToCartesian3(this.points);
                            return new Cesium.PolygonHierarchy(positions);
                        }, false) }, this.entityProperties)
                });
            }
        }
        console.log(entity);
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
}
//# sourceMappingURL=polygon.js.map