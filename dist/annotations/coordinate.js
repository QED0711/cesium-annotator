import * as Cesium from 'cesium';
import CheapRuler from 'cheap-ruler';
import { nanoid } from 'nanoid';
import { DistanceUnit } from '../utils/types';
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
    static cloneCoordinateArray(coordinates) {
        return coordinates.map(c => c.clone());
    }
    static coordinateArrayToCartesian3(coordinates) {
        return coordinates.map(c => c.cartesian3);
    }
    static getMinMaxBbox(coordinates) {
        let lngMin = Infinity, lngMax = -Infinity, latMin = Infinity, latMax = -Infinity;
        for (let coordinate of coordinates) {
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
    distanceTo(point2, unit) {
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
    filter(callback) {
        return new CoordinateCollection(this.coordinates.filter(callback));
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
}
//# sourceMappingURL=coordinate.js.map