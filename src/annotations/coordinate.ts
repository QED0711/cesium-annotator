import * as Cesium from 'cesium';
import CheapRuler from 'cheap-ruler';
import { nanoid } from 'nanoid';
import { CoordinateInit, DistanceUnit, HandleEntity } from '../utils/types';

export class Coordinate {
    id: string;
    lng: number;
    lat: number;
    alt?: number;
    cartesian3: Cesium.Cartesian3;
    ruler: CheapRuler
    entity: HandleEntity | null;

    constructor(init: CoordinateInit) {
        this.id = nanoid();
        this.lng = init.lng;
        this.lat = init.lat;
        this.alt = init.alt ?? 0.0;
        this.cartesian3 = Cesium.Cartesian3.fromDegrees(this.lng, this.lat, this.alt);
        this.ruler = new CheapRuler(this.lat, "meters");
        this.entity = null;
    }

    static fromDegrees(lng: number, lat: number, alt?: number): Coordinate {
        return new this({ lng, lat, alt });
    }

    static cloneCoordinateArray(coordinates: Coordinate[]): Coordinate[] {
        return coordinates.map(c => c.clone());
    }

    static coordinateArrayToCartesian3(coordinates: Coordinate[]): Cesium.Cartesian3[] {
        return coordinates.map(c => c.cartesian3);
    }

    static getMinMaxBbox(coordinates: Coordinate[]) {
        let lngMin = Infinity,
            lngMax = -Infinity,
            latMin = Infinity,
            latMax = -Infinity;
        for (let coordinate of coordinates) {
            if (coordinate.lng < lngMin) lngMin = coordinate.lng;
            if (coordinate.lng > lngMax) lngMax = coordinate.lng;
            if (coordinate.lat < latMin) latMin = coordinate.lat;
            if (coordinate.lat > latMax) latMax = coordinate.lat;
        }
        return { lngMin, lngMax, latMin, latMax };
    }

    clone(): Coordinate {
        const coordinate = new Coordinate({ lng: this.lng, lat: this.lat, alt: this.alt });
        coordinate.id = this.id;
        return coordinate;
    }

    update(values: { lat?: number, lng?: number, alt?: number }) {
        if (values.lat !== undefined) {
            this.lat = values.lat;
            this.ruler = new CheapRuler(this.lat, "meters");
        }
        this.lng = values.lng ?? this.lng;
        this.alt = values.alt ?? this.alt;

        this.cartesian3 = Cesium.Cartesian3.fromDegrees(this.lng, this.lat, this.alt);
    }

    distanceTo(point2: Coordinate, unit?: DistanceUnit): number {
        const distance = this.ruler.distance([this.lng, this.lat], [point2.lng, point2.lat]);

        unit ??= DistanceUnit.METERS;
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

    headingTo(point2: Coordinate): number {
        const heading = this.ruler.bearing([this.lng, this.lat], [point2.lng, point2.lat]);
        return heading > 0 ? heading : 360 + heading;
    }

    atHeadingDistance(heading: number, distance: number, distanceUnit: DistanceUnit = DistanceUnit.METERS): Coordinate {

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

        const point = this.ruler.destination([this.lng, this.lat], distance, heading)
        return new Coordinate({ lng: point[0], lat: point[1], alt: this.alt })
    }

    segmentDistance(point2: Coordinate, segments: number): Coordinate[] {
        const dist = this.distanceTo(point2);
        const heading = this.headingTo(point2);

        let coords: Coordinate[] = []
        const segDist = dist / segments;
        for (let i = 1; i < segments; i++) {
            coords.push(this.atHeadingDistance(heading, segDist * i));
        }

        return coords;
    }

}

export class CoordinateCollection {
    coordinates: Coordinate[];

    constructor(coordsArray?: Coordinate[]) {
        this.coordinates = coordsArray ?? [];
    }

    get length(): number {
        return this.coordinates.length;
    }

    at(idx: number): Coordinate | null {
        return this.coordinates[idx] ?? null;
    }

    clone(): CoordinateCollection {
        const cloned = this.coordinates.map(c => c.clone());
        return new CoordinateCollection(cloned);
    }

    push(coord: Coordinate): void {
        this.coordinates.push(coord);
    }

    pop(): Coordinate | null {
        const coord = this.coordinates.pop();
        return coord ?? null;
    }

    filter(callback: (val: any, i: number) => {}): CoordinateCollection {
        return new CoordinateCollection(this.coordinates.filter(callback));
    }

    set(idx: number, coord: Coordinate): CoordinateCollection {
        this.coordinates[idx] = coord;
        return this
    }

    insertAtIndex(index: number, coordinate: Coordinate): CoordinateCollection {
        this.coordinates.splice(index, 0, coordinate);
        return this;
    }

    getMinMaxBbox(): { lngMin: number, lngMax: number, latMin: number, latMax: number } {
        let lngMin = Infinity,
            lngMax = -Infinity,
            latMin = Infinity,
            latMax = -Infinity;
        for (let coordinate of this.coordinates) {
            if (coordinate.lng < lngMin) lngMin = coordinate.lng;
            if (coordinate.lng > lngMax) lngMax = coordinate.lng;
            if (coordinate.lat < latMin) latMin = coordinate.lat;
            if (coordinate.lat > latMax) latMax = coordinate.lat;
        }
        return { lngMin, lngMax, latMin, latMax };
    }

    toCartesian3Array(): Cesium.Cartesian3[] {
        return this.coordinates.map(c => c.cartesian3);
    }

    [Symbol.iterator](): Iterator<Coordinate> {
        let idx = 0;
        let data = this.coordinates;

        return {
            next(){
                return idx < data.length 
                    ? {value: data[idx++], done: false}
                    : {done: true, value: null}
            }
        }
    }

}
