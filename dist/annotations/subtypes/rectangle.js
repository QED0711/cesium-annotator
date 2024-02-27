import * as Cesium from 'cesium';
import { AnnotationType, DistanceUnit, EventType } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
export default class Rectangle extends Annotation {
    constructor(registry, options) {
        var _a, _b, _c, _d;
        super(registry, options);
        this.annotationType = AnnotationType.RECTANGLE;
        this.polygonProperties = (_a = options.polygonProperties) !== null && _a !== void 0 ? _a : {};
        this.handleProperties = (_b = options.handleProperties) !== null && _b !== void 0 ? _b : {};
        this.entityProperties = (_c = options.entityProperties) !== null && _c !== void 0 ? _c : {};
        this.drawAsLine = (_d = options.drawAsLine) !== null && _d !== void 0 ? _d : false;
    }
    appendCoordinate(coordinate) {
        if (this.points.length < 2) {
            this.points.push(coordinate);
        }
        else {
            this.points.set(1, coordinate);
        }
    }
    draw() {
        let entity = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            const bbox = this.points.getMinMaxBbox();
            const positions = [
                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMax),
                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMax),
                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMin),
                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
            ];
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, polyline: Object.assign({ positions, width: 2 }, this.polygonProperties) }, this.entityProperties));
            }
            else if (this.points.length === 2) {
                entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, polygon: Object.assign({ hierarchy: positions }, this.polygonProperties) }, this.entityProperties));
            }
        }
        else if (!this.entity) {
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, polyline: Object.assign({ positions: new Cesium.CallbackProperty(() => {
                            const bbox = this.points.getMinMaxBbox();
                            return [
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMin),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                            ];
                        }, false), width: 2 }, this.polygonProperties) }, this.entityProperties));
            }
            else if (this.points.length === 2) {
                entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, polygon: Object.assign({ hierarchy: new Cesium.CallbackProperty(() => {
                            const bbox = this.points.getMinMaxBbox();
                            return new Cesium.PolygonHierarchy([
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMin),
                            ]);
                        }, false) }, this.polygonProperties) }, this.entityProperties));
            }
        }
        if (entity) {
            entity._canActivate = true;
            entity._annotation = this;
            this.entity = entity;
        }
        this.emit(EventType.UPDATE, { annotation: this });
    }
    syncHandles() {
        super.syncHandles();
    }
    getPerimeter(unit = DistanceUnit.METERS) {
        const bbox = this.points.getMinMaxBbox();
        const bl = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMin });
        const br = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMax });
        const tl = new Coordinate({ lat: bbox.latMax, lng: bbox.lngMax });
        const width = bl.distanceTo(br, unit);
        const height = bl.distanceTo(tl, unit);
        return (width * 2) + (height * 2);
    }
    getArea(unit = DistanceUnit.METERS) {
        const bbox = this.points.getMinMaxBbox();
        const bl = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMin });
        const br = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMax });
        const tl = new Coordinate({ lat: bbox.latMax, lng: bbox.lngMax });
        const width = bl.distanceTo(br, unit);
        const height = bl.distanceTo(tl, unit);
        return width * height;
    }
    // OVERRIDES
    insertCoordinateAtIndex(coordinate, idx) { }
    toGeoJson() {
        const geoJson = super.toGeoJson();
        if (geoJson) {
            const { lng: lng1, lat: lat1, alt: alt1 } = this.points.at(0);
            const { lng: lng2, lat: lat2, alt: alt2 } = this.points.at(1);
            geoJson.features[0].properties = {
                annotationType: AnnotationType.RECTANGLE,
                vert1: { lng: lng1, lat: lat1, alt: alt1 },
                vert2: { lng: lng2, lat: lat2, alt: alt2 },
                initOptions: {
                    id: this.id,
                    liveUpdate: this.liveUpdate,
                    userInteractive: this.userInteractive,
                    handleType: this.handleType,
                    attributes: this.attributes,
                    polygonProperties: this.polygonProperties,
                    handleProperties: this.handleProperties,
                    entityProperties: this.entityProperties,
                    drawAsLine: this.drawAsLine,
                },
            };
        }
        return geoJson;
    }
}
//# sourceMappingURL=rectangle.js.map