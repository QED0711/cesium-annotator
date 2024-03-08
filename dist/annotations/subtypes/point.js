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
        var _a;
        super(registry, options);
        this.annotationType = AnnotationType.POINT;
        this.pointProperties = (_a = options.pointProperties) !== null && _a !== void 0 ? _a : {};
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
            billboard = Object.assign({ scale: 1.0 }, this.pointProperties);
        }
        else {
            point = Object.assign({ pixelSize: 10 }, this.pointProperties);
        }
        if (!this.liveUpdate) {
            this.removeEntity();
            if (this.points.length === 0)
                return;
            entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, position: (_a = this.points.at(0)) === null || _a === void 0 ? void 0 : _a.cartesian3, point: this.handleType === HandleType.POINT ? point : undefined, billboard: this.handleType === HandleType.BILLBOARD ? billboard : undefined }, this.entityProperties));
        }
        else if (!this.entity || options.forceLiveRedraw) {
            if (this.points.length === 0)
                return;
            this.removeEntity();
            entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, position: new Cesium.CallbackProperty(() => {
                    var _a;
                    return (_a = this.points.at(0)) === null || _a === void 0 ? void 0 : _a.cartesian3;
                }, false), point: this.handleType === HandleType.POINT ? point : undefined, billboard: this.handleType === HandleType.BILLBOARD ? billboard : undefined }, this.entityProperties));
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
    setPointProperties(properties, destructive = false) {
        if (!destructive)
            properties = Object.assign(Object.assign({}, this.pointProperties), properties);
        this.pointProperties = properties;
        this.emit(EventType.PROPERTY, { annotation: this });
    }
    setPointProperty(propName, value) {
        this.pointProperties[propName] = value;
        this.emit(EventType.PROPERTY, { annotation: this });
    }
    deletePointProperty(propName) {
        delete this.pointProperties[propName];
        this.emit(EventType.PROPERTY, { annotation: this });
    }
    // OVERRIDES
    toGeoJson() {
        var _a, _b;
        const geoJson = super.toGeoJson();
        if (geoJson) {
            const properties = (_b = (_a = geoJson.features) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.properties;
            if (properties) {
                properties.initOptions = Object.assign({ pointProperties: this.pointProperties }, properties.initOptions);
            }
            return geoJson;
        }
        return null;
    }
    syncHandles() { }
    insertCoordinateAtIndex(coordinate, idx) { }
}
//# sourceMappingURL=point.js.map