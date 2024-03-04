import * as Cesium from 'cesium';
import { AnnotationType, EventType, HandleType } from "../../utils/types";
import { Annotation } from "../core";
import { CoordinateCollection } from '../coordinate';
/**
 * See {@link Registry} for registry creation;
 *
 * *PointAnnotation* should not be invoked directly. It should be created through a call to `addPoint` on a {@link Registry} instance.
 *
 * @example
 * ```ts
 * let point: PointAnnotation = registry.addPoint({});
 * ```
 */
export class PointAnnotation extends Annotation {
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
        this.emit(EventType.APPEND, { annotation: this });
    }
    draw(options) {
        var _a, _b;
        options = options !== null && options !== void 0 ? options : {};
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
        else if (!this.entity || options.forceLiveRedraw) {
            if (this.points.length === 0)
                return;
            this.removeEntity();
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
        this.emit(EventType.UPDATE, { annotation: this });
    }
    // OVERRIDES
    toGeoJson() {
        var _a, _b;
        const geoJson = super.toGeoJson();
        if (geoJson) {
            const properties = (_b = (_a = geoJson.features) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.properties;
            if (properties) {
                properties.initOptions = Object.assign({ pointProperties: this.pointProperties, billboardProperties: this.billboardProperties, entityProperties: this.entityProperties }, properties.initOptions);
            }
            return geoJson;
        }
        return null;
    }
    syncHandles() { }
    insertCoordinateAtIndex(coordinate, idx) { }
}
//# sourceMappingURL=point.js.map