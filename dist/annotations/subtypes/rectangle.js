import * as Cesium from 'cesium';
import { AnnotationType, DistanceUnit, EventType } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
export class RectangleAnnotation extends Annotation {
    constructor(registry, options) {
        var _a, _b;
        super(registry, options);
        this.annotationType = AnnotationType.RECTANGLE;
        this.polygonProperties = (_a = options.polygonProperties) !== null && _a !== void 0 ? _a : {};
        this.drawAsLine = (_b = options.drawAsLine) !== null && _b !== void 0 ? _b : false;
    }
    appendCoordinate(coordinate) {
        if (this.points.length < 2) {
            this.points.push(coordinate);
        }
        else {
            this.points.set(1, coordinate);
        }
    }
    draw(options) {
        options = options || {};
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
        else if (!this.entity || options.forceLiveRedraw) {
            this.removeEntity();
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
        if (this.points.length < 2)
            return null;
        const bbox = this.points.getMinMaxBbox();
        const bl = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMin });
        const br = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMax });
        const tl = new Coordinate({ lat: bbox.latMax, lng: bbox.lngMax });
        const width = bl.distanceTo(br, unit);
        const height = bl.distanceTo(tl, unit);
        return (width * 2) + (height * 2);
    }
    getArea(unit = DistanceUnit.METERS) {
        if (this.points.length < 2)
            return null;
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
    setPolygonProperties(properties, destructive = false) {
        if (!destructive)
            properties = Object.assign(Object.assign({}, this.polygonProperties), properties);
        this.polygonProperties = properties;
        this.emit(EventType.PROPERTY, { annotation: this });
    }
    setPolygonProperty(propName, value) {
        this.polygonProperties[propName] = value;
        this.emit(EventType.PROPERTY, { annotation: this });
    }
    deletePolygonProperty(propName) {
        delete this.polygonProperties[propName];
        this.emit(EventType.PROPERTY, { annotation: this });
    }
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
                    annotationType: this.annotationType,
                    liveUpdate: this.liveUpdate,
                    userInteractive: this.userInteractive,
                    handleType: this.handleType,
                    groupRecords: this.groupsToRecords(),
                    attributes: this.attributes,
                    polygonProperties: this.polygonProperties,
                    handleProperties: this.handleProperties,
                    entityProperties: this.entityProperties,
                    drawAsLine: this.drawAsLine,
                    bypassTerrainSampleOnDrag: this.bypassTerrainSampleOnDrags,
                },
            };
        }
        return geoJson;
    }
}
//# sourceMappingURL=rectangle.js.map