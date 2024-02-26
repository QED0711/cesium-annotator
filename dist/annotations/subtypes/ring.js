import * as Cesium from 'cesium';
import { AnnotationType } from "../../utils/types";
import { Annotation } from "../core";
import { CoordinateCollection } from '../coordinate';
export default class Ring extends Annotation {
    constructor(registry, options) {
        var _a, _b, _c, _d;
        super(registry, options);
        this.annotationType = AnnotationType.RING;
        this.entityProperties = (_a = options.entityProperties) !== null && _a !== void 0 ? _a : {};
        this.handleProperties = (_b = options.handleProperties) !== null && _b !== void 0 ? _b : {};
        this.drawAsLine = (_c = options.drawAsLine) !== null && _c !== void 0 ? _c : false;
        this.nPoints = (_d = options.nPoints) !== null && _d !== void 0 ? _d : 360;
        this.radius = null;
    }
    // Note: This implementation is needed to set the radius property any time a handle is dragged
    handlePointerMove(e) {
        if (this.pointerDownDetected) {
            // update the specified point as it is dragged
            if (this.handleFound !== null) {
                this.removeHandleByCoordinateID(this.handleFound.handleID);
                const coordinate = this.viewerInterface.getCoordinateAtPixel(e.offsetX, e.offsetY);
                // if (coordinate) this.points[this.handleFound.index] = coordinate;
                if (coordinate)
                    this.points.set(this.handleFound.index, coordinate);
                this.radius = this.points.at(0).distanceTo(this.points.at(1));
            }
            this.dragDetected = true;
        }
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
    draw() {
        var _a;
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
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: Object.assign({ positions: [...perimeterCoords, perimeterCoords[0]], width: 2 }, this.entityProperties)
                });
            }
            else {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    position: (_a = this.points.at(0)) === null || _a === void 0 ? void 0 : _a.cartesian3,
                    ellipse: Object.assign({ semiMajorAxis: this.radius, semiMinorAxis: this.radius }, this.entityProperties)
                });
            }
        }
        else if (!this.entity) {
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: Object.assign({ positions: new Cesium.CallbackProperty(() => {
                            const headingFactor = 360 / this.nPoints;
                            const perimeterCoords = [];
                            for (let i = 0; i < this.nPoints; i++) {
                                const heading = headingFactor * i;
                                perimeterCoords.push(this.points.at(0).atHeadingDistance(heading, this.radius).cartesian3);
                            }
                            perimeterCoords.push(perimeterCoords[0]); // close the perimerter
                            return perimeterCoords;
                        }, false), width: 2 }, this.entityProperties)
                });
            }
            else {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    position: new Cesium.CallbackProperty(() => {
                        var _a;
                        return (_a = this.points.at(0)) === null || _a === void 0 ? void 0 : _a.cartesian3;
                    }, false),
                    ellipse: Object.assign({ semiMajorAxis: new Cesium.CallbackProperty(() => {
                            return this.radius;
                        }, false), semiMinorAxis: new Cesium.CallbackProperty(() => {
                            return this.radius;
                        }, false) }, this.entityProperties)
                });
            }
        }
        if (entity) {
            entity._canActivate = true;
            entity._annotation = this;
            this.entity = entity;
        }
        this.emit("update", { annotation: this });
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
    // OVERRIDES
    insertCoordinateAtIndex(coordinate, idx) { }
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