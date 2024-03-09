var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as Cesium from 'cesium';
import { AnnotationType, EventType } from "../../utils/types";
import { Annotation } from "../core";
import { CoordinateCollection } from '../coordinate';
export class RingAnnotation extends Annotation {
    constructor(registry, options) {
        var _a, _b, _c;
        super(registry, options);
        this.annotationType = AnnotationType.RING;
        this.polygonProperties = (_a = options.polygonProperties) !== null && _a !== void 0 ? _a : {};
        this.drawAsLine = (_b = options.drawAsLine) !== null && _b !== void 0 ? _b : false;
        this.nPoints = (_c = options.nPoints) !== null && _c !== void 0 ? _c : 360;
        this.radius = null;
    }
    // Note: This implementation is needed to set the radius property any time a handle is dragged
    handlePointerMove(e) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pointerDownDetected) {
                // update the specified point as it is dragged
                if (this.handleFound !== null) {
                    this.removeHandleByCoordinateID(this.handleFound.handleID);
                    const coordinate = yield this.viewerInterface.getCoordinateAtPixel(e.offsetX, e.offsetY);
                    if (coordinate)
                        this.points.set(this.handleFound.index, coordinate);
                    this.radius = this.points.at(0).distanceTo(this.points.at(1));
                }
                this.dragDetected = true;
            }
        });
    }
    appendCoordinate(coordinate) {
        if (this.points.length < 2) {
            this.points.push(coordinate);
        }
        else {
            this.points.set(1, coordinate);
        }
        if (this.points.length === 2) {
            this.radius = this.points.at(0).distanceTo(this.points.at(1));
        }
    }
    draw(options) {
        var _a;
        options = options || {};
        if (this.points.length < 2 || this.radius === null)
            return;
        let entity = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            if (this.drawAsLine) {
                const headingFactor = 360 / this.nPoints;
                const perimeterCoords = [];
                for (let i = 0; i < this.nPoints; i++) {
                    const heading = headingFactor * i;
                    perimeterCoords.push(this.points.at(0).atHeadingDistance(heading, this.radius).cartesian3);
                }
                entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, polyline: Object.assign({ positions: [...perimeterCoords, perimeterCoords[0]], width: 2 }, this.polygonProperties) }, this.entityProperties));
            }
            else {
                entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, position: (_a = this.points.at(0)) === null || _a === void 0 ? void 0 : _a.cartesian3, ellipse: Object.assign({ semiMajorAxis: this.radius, semiMinorAxis: this.radius }, this.polygonProperties) }, this.entityProperties));
            }
        }
        else if (!this.entity || options.forceLiveRedraw) {
            this.removeEntity();
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, polyline: Object.assign({ positions: new Cesium.CallbackProperty(() => {
                            const headingFactor = 360 / this.nPoints;
                            const perimeterCoords = [];
                            for (let i = 0; i < this.nPoints; i++) {
                                const heading = headingFactor * i;
                                perimeterCoords.push(this.points.at(0).atHeadingDistance(heading, this.radius).cartesian3);
                            }
                            perimeterCoords.push(perimeterCoords[0]); // close the perimerter
                            return perimeterCoords;
                        }, false), width: 2 }, this.polygonProperties) }, this.entityProperties));
            }
            else {
                entity = this.viewerInterface.viewer.entities.add(Object.assign({ id: this.id, position: new Cesium.CallbackProperty(() => {
                        var _a;
                        return (_a = this.points.at(0)) === null || _a === void 0 ? void 0 : _a.cartesian3;
                    }, false), ellipse: Object.assign({ semiMajorAxis: new Cesium.CallbackProperty(() => {
                            return this.radius;
                        }, false), semiMinorAxis: new Cesium.CallbackProperty(() => {
                            return this.radius;
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
    getArea() {
        if (this.radius !== null) {
            return Math.PI * Math.pow(this.radius, 2);
        }
        return null;
    }
    getCircumference() {
        if (this.radius !== null) {
            return Math.PI * this.radius * 2;
        }
        return null;
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
        if (this.points.length < 2)
            return null;
        const headingFactor = 360 / this.nPoints;
        const perimeterCoords = [];
        for (let i = 0; i < this.nPoints; i++) {
            const heading = headingFactor * i;
            perimeterCoords.push(this.points.at(0).atHeadingDistance(heading, this.radius));
        }
        const collection = new CoordinateCollection(perimeterCoords);
        const geoJson = collection.toGeoJson(AnnotationType.POLYGON);
        if (geoJson) {
            const p1 = this.points.at(0);
            const p2 = this.points.at(1);
            geoJson.features[0].properties = {
                annotationType: AnnotationType.RING,
                center: { lng: p1.lng, lat: p1.lat, alt: p1.alt },
                perimeterPoint: { lng: p2.lng, lat: p2.lat, alt: p2.alt },
                initOptions: {
                    id: this.id,
                    liveUpdate: this.liveUpdate,
                    userInteractive: this.userInteractive,
                    handleType: this.handleType,
                    groupRecords: this.groupsToRecords(),
                    attributes: this.attributes,
                    polygonProperties: this.polygonProperties,
                    handleProperties: this.handleProperties,
                    entityProperties: this.entityProperties,
                    drawAsLine: this.drawAsLine,
                    nPoints: this.nPoints,
                }
            };
        }
        return geoJson;
    }
    toWkt() {
        if (this.points.length < 2)
            return null;
        const headingFactor = 360 / this.nPoints;
        const perimeterCoords = [];
        for (let i = 0; i < this.nPoints; i++) {
            const heading = headingFactor * i;
            perimeterCoords.push(this.points.at(0).atHeadingDistance(heading, this.radius));
        }
        const collection = new CoordinateCollection(perimeterCoords);
        return collection.toWkt(AnnotationType.POLYGON);
    }
}
//# sourceMappingURL=ring.js.map