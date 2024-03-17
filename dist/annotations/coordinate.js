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
import CheapRuler from 'cheap-ruler';
import { nanoid } from 'nanoid';
import { AnnotationType, DistanceUnit } from '../utils/types';
export class Coordinate {
    constructor(init) {
        var _a;
        this.id = nanoid();
        this.lng = init.lng;
        this.lat = init.lat;
        this.alt = (_a = init.alt) !== null && _a !== void 0 ? _a : 0.0;
        this.cartesian3 = Cesium.Cartesian3.fromDegrees(this.lng, this.lat, this.alt);
        this.ruler = new CheapRuler(this.lat, "meters");
        this.entity = null;
    }
    static fromDegrees(lng, lat, alt) {
        return new this({ lng, lat, alt });
    }
    clone() {
        const coordinate = new Coordinate({ lng: this.lng, lat: this.lat, alt: this.alt });
        coordinate.id = this.id;
        return coordinate;
    }
    update(values) {
        var _a, _b;
        if (values.lat !== undefined) {
            this.lat = values.lat;
            this.ruler = new CheapRuler(this.lat, "meters");
        }
        this.lng = (_a = values.lng) !== null && _a !== void 0 ? _a : this.lng;
        this.alt = (_b = values.alt) !== null && _b !== void 0 ? _b : this.alt;
        this.cartesian3 = Cesium.Cartesian3.fromDegrees(this.lng, this.lat, this.alt);
    }
    toCartographicPosition() {
        return Cesium.Cartographic.fromCartesian(this.cartesian3);
    }
    withAlt(alt) {
        const coord = this.clone();
        coord.update({ alt: alt !== null && alt !== void 0 ? alt : this.alt });
        return coord;
    }
    queryAlt(terrainProvider, terrainSampleLevel = 12) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let cartWithHeight = [];
            const cartographicPosition = this.toCartographicPosition();
            if (terrainSampleLevel === Infinity) {
                cartWithHeight = yield Cesium.sampleTerrainMostDetailed(terrainProvider, [cartographicPosition]);
            }
            else {
                cartWithHeight = yield Cesium.sampleTerrain(terrainProvider, terrainSampleLevel, [cartographicPosition]);
            }
            return (_a = cartWithHeight[0]) === null || _a === void 0 ? void 0 : _a.height;
        });
    }
    distanceTo(point2, unit = DistanceUnit.METERS) {
        const distance = this.ruler.distance([this.lng, this.lat], [point2.lng, point2.lat]);
        unit !== null && unit !== void 0 ? unit : (unit = DistanceUnit.METERS);
        switch (unit) {
            case DistanceUnit.METERS:
                return distance;
            case DistanceUnit.KILOMETERS:
                return distance / 1000;
            case DistanceUnit.FEET:
                return distance * 3.281;
            case DistanceUnit.MILES:
                return distance / 1609;
        }
    }
    headingTo(point2) {
        const heading = this.ruler.bearing([this.lng, this.lat], [point2.lng, point2.lat]);
        return heading > 0 ? heading : 360 + heading;
    }
    atHeadingDistance(heading, distance, distanceUnit = DistanceUnit.METERS) {
        // Convert distance to meters
        switch (distanceUnit) {
            case DistanceUnit.KILOMETERS:
                distance /= 1000;
                break;
            case DistanceUnit.FEET:
                distance *= 3.281;
                break;
            case DistanceUnit.MILES:
                distance /= 1609;
                break;
        }
        const point = this.ruler.destination([this.lng, this.lat], distance, heading);
        return new Coordinate({ lng: point[0], lat: point[1], alt: this.alt });
    }
    segmentDistance(point2, segments) {
        const dist = this.distanceTo(point2);
        const heading = this.headingTo(point2);
        let coords = [];
        const segDist = dist / segments;
        for (let i = 1; i < segments; i++) {
            coords.push(this.atHeadingDistance(heading, segDist * i));
        }
        return coords;
    }
    static toDMS(degree, isLatitude) {
        const direction = isLatitude
            ? degree >= 0 ? "N" : "S"
            : degree >= 0 ? "E" : "W";
        const absDegree = Math.abs(degree);
        const d = Math.floor(absDegree);
        const minFloat = (absDegree - d) * 60;
        const m = Math.floor(minFloat);
        const secFloat = (minFloat - m) * 60;
        const s = Math.round(secFloat);
        return `${d}°${m}'${s}"${direction}`;
    }
    toLatLngString(includeAlt = false) {
        return `${this.lat}, ${this.lng}${includeAlt ? `, ${this.alt}` : ""}`;
    }
    toLngLatString(includeAlt = false) {
        return `${this.lng}, ${this.lat}${includeAlt ? `, ${this.alt}` : ""}`;
    }
    toLatLngDMS(includeAlt = false) {
        const latDMS = Coordinate.toDMS(this.lat, true);
        const lngDMS = Coordinate.toDMS(this.lng, false);
        return `${latDMS}, ${lngDMS}${includeAlt ? `, ${this.alt}m` : ''}`;
    }
    toLngLatDMS(includeAlt = false) {
        const lngDMS = Coordinate.toDMS(this.lng, false);
        const latDMS = Coordinate.toDMS(this.lat, true);
        return `${lngDMS}, ${latDMS}${includeAlt ? `, ${this.alt}m` : ''}`;
    }
    static fromLatLngString(s, alt = 0) {
        const strNums = s.match(/-?\d+(\.\d+)?/g);
        if (strNums && strNums.length === 2) {
            const [lat, lng] = strNums.map(n => parseFloat(n));
            if (isNaN(lat) || isNaN(lng))
                return null;
            return new Coordinate({ lat, lng, alt });
        }
        return null;
    }
    static fromLngLatString(s, alt = 0) {
        const strNums = s.match(/-?\d+(\.\d+)?/g);
        if (strNums && strNums.length === 2) {
            const [lng, lat] = strNums.map(n => parseFloat(n));
            if (isNaN(lat) || isNaN(lng))
                return null;
            return new Coordinate({ lat, lng, alt });
        }
        return null;
    }
    static dmsToDecimal(degrees, minutes, seconds, direction) {
        let decimal = degrees + minutes / 60 + seconds / 3600;
        if (direction === 'S' || direction === 'W') {
            decimal = -decimal;
        }
        return decimal;
    }
    static fromDMSString(s, alt = 0) {
        const regex = /(\d+)°(\d+)'(\d+)"([NSEW])/g;
        const matches = [...s.matchAll(regex)];
        if (matches.length === 2) {
            const parts = matches.map(match => ({
                degrees: parseInt(match[1], 10),
                minutes: parseInt(match[2], 10),
                seconds: parseInt(match[3], 10),
                direction: match[4]
            }));
            // Convert DMS to decimal for each part
            const [firstPart, secondPart] = parts;
            let lat, lng;
            // Determine which part is latitude and which is longitude
            if (firstPart.direction === 'N' || firstPart.direction === 'S') {
                lat = this.dmsToDecimal(firstPart.degrees, firstPart.minutes, firstPart.seconds, firstPart.direction);
                lng = this.dmsToDecimal(secondPart.degrees, secondPart.minutes, secondPart.seconds, secondPart.direction);
            }
            else {
                lng = this.dmsToDecimal(firstPart.degrees, firstPart.minutes, firstPart.seconds, firstPart.direction);
                lat = this.dmsToDecimal(secondPart.degrees, secondPart.minutes, secondPart.seconds, secondPart.direction);
            }
            // Create and return the new Coordinate instance
            return new Coordinate({ lat, lng, alt });
        }
        return null;
    }
}
export class CoordinateCollection {
    constructor(coordsArray) {
        this.coordinates = coordsArray !== null && coordsArray !== void 0 ? coordsArray : [];
    }
    get length() {
        return this.coordinates.length;
    }
    at(idx) {
        var _a;
        return (_a = this.coordinates[idx]) !== null && _a !== void 0 ? _a : null;
    }
    get first() {
        return this.at(0);
    }
    get last() {
        return this.at(this.length - 1);
    }
    clone() {
        const cloned = this.coordinates.map(c => c.clone());
        return new CoordinateCollection(cloned);
    }
    push(coord) {
        this.coordinates.push(coord);
    }
    pop() {
        const coord = this.coordinates.pop();
        return coord !== null && coord !== void 0 ? coord : null;
    }
    map(callback) {
        return new CoordinateCollection(this.coordinates.map(callback));
    }
    filter(callback) {
        return new CoordinateCollection(this.coordinates.filter(callback));
    }
    mean() {
        var _a;
        const length = this.coordinates.length;
        if (length === 0)
            return null;
        let lngSum = 0, latSum = 0, altSum = 0;
        for (let coord of this.coordinates) {
            lngSum += coord.lng;
            latSum += coord.lat;
            altSum += (_a = coord.alt) !== null && _a !== void 0 ? _a : 0;
        }
        return new Coordinate({ lng: lngSum / length, lat: latSum / length, alt: altSum / length });
    }
    queryAlt(terrainProvider, terrainSampleLevel = 12) {
        return __awaiter(this, void 0, void 0, function* () {
            const cartographicPositions = this.coordinates.map(coordinate => coordinate.toCartographicPosition());
            let cartsWithHeight;
            if (terrainSampleLevel === Infinity) {
                cartsWithHeight = yield Cesium.sampleTerrainMostDetailed(terrainProvider, cartographicPositions);
            }
            else {
                cartsWithHeight = yield Cesium.sampleTerrain(terrainProvider, terrainSampleLevel, cartographicPositions);
            }
            return cartsWithHeight.map(cart => cart.height);
        });
    }
    set(idx, coord) {
        this.coordinates[idx] = coord;
        return this;
    }
    insertAtIndex(index, coordinate) {
        this.coordinates.splice(index, 0, coordinate);
        return this;
    }
    getMinMaxBbox() {
        let lngMin = Infinity, lngMax = -Infinity, latMin = Infinity, latMax = -Infinity;
        for (let coordinate of this.coordinates) {
            if (coordinate.lng < lngMin)
                lngMin = coordinate.lng;
            if (coordinate.lng > lngMax)
                lngMax = coordinate.lng;
            if (coordinate.lat < latMin)
                latMin = coordinate.lat;
            if (coordinate.lat > latMax)
                latMax = coordinate.lat;
        }
        return { lngMin, lngMax, latMin, latMax };
    }
    toCartesian3Array() {
        return this.coordinates.map(c => c.cartesian3);
    }
    [Symbol.iterator]() {
        let idx = 0;
        let data = this.coordinates;
        return {
            next() {
                return idx < data.length
                    ? { value: data[idx++], done: false }
                    : { done: true, value: null };
            }
        };
    }
    toGeoJson(annotationType) {
        let coords = null, geomType = "", properties = { initOptions: {} };
        if (annotationType === AnnotationType.POINT) {
            if (this.coordinates.length === 0)
                return null;
            geomType = "Point";
            const { lat, lng, alt } = this.coordinates[0];
            coords = [lng, lat, alt !== null && alt !== void 0 ? alt : 0.0];
        }
        if (annotationType === AnnotationType.POLYLINE) {
            if (this.coordinates.length < 2)
                return null;
            geomType = "LineString";
            coords = this.coordinates.map(({ lng, lat, alt }) => [lng, lat, alt !== null && alt !== void 0 ? alt : 0.0]);
        }
        if (annotationType === AnnotationType.POLYGON) {
            if (this.coordinates.length < 3)
                return null;
            geomType = "Polygon";
            coords = this.coordinates.map(({ lng, lat, alt }) => [lng, lat, alt !== null && alt !== void 0 ? alt : 0.0]);
            coords.push(coords[0]);
            coords = [coords];
        }
        if (annotationType === AnnotationType.RECTANGLE) {
            if (this.coordinates.length < 2)
                return null;
            geomType = "Polygon";
            const bbox = this.getMinMaxBbox();
            coords = [[
                    [bbox.lngMin, bbox.latMin],
                    [bbox.lngMin, bbox.latMax],
                    [bbox.lngMax, bbox.latMax],
                    [bbox.lngMax, bbox.latMin],
                    [bbox.lngMin, bbox.latMin],
                ]];
        }
        // Note: RING type handled in ring annotation
        if (!coords || coords.length === 0)
            return null;
        const result = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties,
                    geometry: {
                        type: geomType,
                        coordinates: coords,
                    }
                }
            ]
        };
        return result;
    }
    toWkt(annotationType) {
        let coords = null;
        if (annotationType === AnnotationType.POINT) {
            if (this.coordinates.length === 0)
                return null;
            const { lat, lng } = this.coordinates[0];
            return `POINT (${lng} ${lat})`;
        }
        if (annotationType === AnnotationType.POLYLINE) {
            if (this.coordinates.length < 2)
                return null;
            return `LINESTRING (${this.coordinates.map(({ lng, lat }) => `${lng} ${lat}`).join(", ")})`;
        }
        if (annotationType === AnnotationType.POLYGON) {
            if (this.coordinates.length < 3)
                return null;
            return `POLYGON ((${this.coordinates.map(({ lng, lat }) => `${lng} ${lat}`).join(", ")}, ${this.coordinates[0].lng} ${this.coordinates[0].lat}))`;
        }
        if (annotationType === AnnotationType.RECTANGLE) {
            if (this.coordinates.length < 2)
                return null;
            const bbox = this.getMinMaxBbox();
            return `POLYGON ((${bbox.lngMin} ${bbox.latMin}, ${bbox.lngMin} ${bbox.latMax}, ${bbox.lngMax} ${bbox.latMax}, ${bbox.lngMax} ${bbox.latMin}, ${bbox.lngMin} ${bbox.latMin}))`;
        }
        // Note: RING type handled in ring annotation
        return null;
    }
}
//# sourceMappingURL=coordinate.js.map