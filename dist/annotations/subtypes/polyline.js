import * as Cesium from 'cesium';
import { AnnotationType } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
export default class PolyLine extends Annotation {
    constructor(registry, options) {
        var _a;
        super(registry, options);
        this.annotationType = AnnotationType.POLYLINE;
        this.entityProperties = (_a = options.entityProperties) !== null && _a !== void 0 ? _a : {};
    }
    appendCoordinate(coordinate) {
        this.points.push(coordinate);
        this.emit("append", { annotation: this });
    }
    draw() {
        let entity = null;
        if (this.isStatic) {
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
        if (entity)
            this.entity = entity;
        this.emit("update", { annotation: this });
    }
}
//# sourceMappingURL=polyline.js.map