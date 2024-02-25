import * as Cesium from 'cesium';
import { AnnotationType, HandleType } from "../../utils/types";
import { Annotation } from "../core";
import { CoordinateCollection } from '../coordinate';
export default class PointAnnotation extends Annotation {
    constructor(registry, options) {
        var _a, _b, _c;
        super(registry, options);
        this.annotationType = AnnotationType.POINT;
        this.entityProperties = (_a = options.entityProperties) !== null && _a !== void 0 ? _a : {};
        this.pointProperties = (_b = options.pointProperties) !== null && _b !== void 0 ? _b : {};
        this.billboardProperties = (_c = options.billboardProperties) !== null && _c !== void 0 ? _c : {};
    }
    appendCoordinate(coordinate) {
        this.points = new CoordinateCollection([coordinate]);
        this.emit("append", { annotation: this });
    }
    draw() {
        var _a, _b;
        let entity = null;
        let point, billboard;
        if (this.handleType === HandleType.BILLBOARD) {
            billboard = Object.assign({ scale: 1.0 }, this.billboardProperties);
        }
        else {
            point = Object.assign({ pixelSize: 10 }, this.pointProperties);
        }
        if (!this.liveUpdate) {
            this.removeEntity();
            if (this.points.length === 0)
                return;
            entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, position: (_a = this.points.at(0)) === null || _a === void 0 ? void 0 : _a.cartesian3, point,
                billboard }, this.entityProperties));
        }
        else if (!this.entity) {
            if (this.points.length === 0)
                return;
            entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, position: new Cesium.CallbackProperty(() => {
                    var _a;
                    return (_a = this.points.at(0)) === null || _a === void 0 ? void 0 : _a.cartesian3;
                }, false), point,
                billboard }, this.entityProperties));
        }
        if (entity) {
            entity._canActivate = true;
            entity._parentAnnotation = this;
            entity._isHandle = true;
            entity._handleIdx = 0;
            entity._handleCoordinateID = (_b = this.points.at(0)) === null || _b === void 0 ? void 0 : _b.id;
            this.entity = entity;
        }
        this.emit("update", { annotation: this });
    }
    // OVERRIDES
    syncHandles() { }
    insertCoordinateAtIndex(coordinate, idx) { }
}
//# sourceMappingURL=point.js.map