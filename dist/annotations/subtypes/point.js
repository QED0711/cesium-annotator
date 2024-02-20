import * as Cesium from 'cesium';
import { AnnotationType } from "../../utils/types";
import { Annotation } from "../core";
export default class PointAnnotation extends Annotation {
    constructor(registry, options) {
        var _a;
        super(registry, options);
        this.annotationType = AnnotationType.POINT;
        this.entityProperties = (_a = options.entityProperties) !== null && _a !== void 0 ? _a : {};
    }
    appendCoordinate(coordinate) {
        this.points = [coordinate];
        this.emit("append", { annotation: this });
    }
    draw() {
        let entity = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            if (this.points.length === 0)
                return;
            const position = this.points[0].toCartesian3();
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                position,
                point: Object.assign({ pixelSize: 10 }, this.entityProperties)
            });
        }
        else if (!this.entity) {
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                position: new Cesium.CallbackProperty(() => {
                    var _a, _b;
                    return (_b = (_a = this.points[0]) === null || _a === void 0 ? void 0 : _a.toCartesian3) === null || _b === void 0 ? void 0 : _b.call(_a);
                }, false),
                point: Object.assign({ pixelSize: 10 }, this.entityProperties)
            });
        }
        if (entity) {
            entity._annotation = this;
            entity._handleIdx = 0;
        }
        this.entity = entity;
        this.emit("update", { annotation: this });
    }
}
//# sourceMappingURL=point.js.map