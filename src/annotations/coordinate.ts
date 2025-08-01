import * as Cesium from 'cesium';
import CheapRuler from 'cheap-ruler';
import { nanoid } from 'nanoid';
import { AnnotationType, CoordinateInit, DistanceUnit, GeoJsonFeature, GeoJsonFeatureCollection, HandleEntity } from '../utils/types';

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

    toCartographicPosition(): Cesium.Cartographic {
        return Cesium.Cartographic.fromCartesian(this.cartesian3);
    }

    withAlt(alt?: number): Coordinate {
        const coord = this.clone();
        coord.update({ alt: alt ?? this.alt });
        return coord;
    }

    async queryAlt(terrainProvider: Cesium.TerrainProvider, terrainSampleLevel: number = 12): Promise<number | null> {
        let cartWithHeight: Cesium.Cartographic[] = [];
        const cartographicPosition = this.toCartographicPosition();
        if (terrainSampleLevel === Infinity) {
            cartWithHeight = await Cesium.sampleTerrainMostDetailed(
                terrainProvider,
                [cartographicPosition]
            )
        } else {
            cartWithHeight = await Cesium.sampleTerrain(
                terrainProvider,
                terrainSampleLevel,
                [cartographicPosition]
            )
        }
        return cartWithHeight[0]?.height
    }

    distanceTo(point2: Coordinate, unit: DistanceUnit = DistanceUnit.METERS): number {
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

    static toDMS(degree: number, isLatitude: boolean): string {
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

    toLatLngString(includeAlt: boolean = false) {
        return `${this.lat}, ${this.lng}${includeAlt ? `, ${this.alt}` : ""}`
    }

    toLngLatString(includeAlt: boolean = false) {
        return `${this.lng}, ${this.lat}${includeAlt ? `, ${this.alt}` : ""}`
    }

    toLatLngDMS(includeAlt: boolean = false) {
        const latDMS = Coordinate.toDMS(this.lat, true);
        const lngDMS = Coordinate.toDMS(this.lng, false);
        return `${latDMS}, ${lngDMS}${includeAlt ? `, ${this.alt}m` : ''}`;
    }

    toLngLatDMS(includeAlt: boolean = false) {
        const lngDMS = Coordinate.toDMS(this.lng, false);
        const latDMS = Coordinate.toDMS(this.lat, true);
        return `${lngDMS}, ${latDMS}${includeAlt ? `, ${this.alt}m` : ''}`;
    }

    static fromLatLngString(s: string, alt: number = 0): Coordinate | null {
        const strNums = s.match(/-?\d+(\.\d+)?/g)
        if (strNums && strNums.length === 2) {
            const [lat, lng] = strNums.map(n => parseFloat(n))
            if (isNaN(lat) || isNaN(lng)) return null;
            return new Coordinate({ lat, lng, alt });
        }
        return null;
    }

    static fromLngLatString(s: string, alt: number = 0): Coordinate | null {
        const strNums = s.match(/-?\d+(\.\d+)?/g)
        if (strNums && strNums.length === 2) {
            const [lng, lat] = strNums.map(n => parseFloat(n))
            if (isNaN(lat) || isNaN(lng)) return null;
            return new Coordinate({ lat, lng, alt });
        }
        return null;
    }

    static dmsToDecimal(degrees: number, minutes: number, seconds: number, direction: string): number {
        let decimal = degrees + minutes / 60 + seconds / 3600;
        if (direction === 'S' || direction === 'W') {
            decimal = -decimal;
        }
        return decimal;
    }

    static fromDMSString(s: string, alt: number = 0): Coordinate | null {
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
            } else {
                lng = this.dmsToDecimal(firstPart.degrees, firstPart.minutes, firstPart.seconds, firstPart.direction);
                lat = this.dmsToDecimal(secondPart.degrees, secondPart.minutes, secondPart.seconds, secondPart.direction);
            }

            // Create and return the new Coordinate instance
            return new Coordinate({ lat, lng, alt });
        }

        return null;
    }

    toScreenPosition(viewer: Cesium.Viewer): Cesium.Cartesian2{
        return Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, this.cartesian3)
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

    get first(): Coordinate | null {
        return this.at(0);
    }

    get last(): Coordinate | null {
        return this.at(this.length - 1);
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

    map(callback: (val: any, i: number) => any): CoordinateCollection | any[] {
        return new CoordinateCollection(this.coordinates.map(callback))
    }

    filter(callback: (val: any, i: number) => boolean): CoordinateCollection {
        return new CoordinateCollection(this.coordinates.filter(callback));
    }

    mean(): Coordinate | null {
        const length = this.coordinates.length;
        if (length === 0) return null;
        let lngSum = 0, latSum = 0, altSum = 0;
        for (let coord of this.coordinates) {
            lngSum += coord.lng;
            latSum += coord.lat;
            altSum += coord.alt ?? 0;
        }
        return new Coordinate({ lng: lngSum / length, lat: latSum / length, alt: altSum / length });
    }

    async queryAlt(terrainProvider: Cesium.TerrainProvider, terrainSampleLevel: number = 12): Promise<number[]> {
        const cartographicPositions = this.coordinates.map(coordinate => coordinate.toCartographicPosition());
        let cartsWithHeight: Cesium.Cartographic[];
        if (terrainSampleLevel === Infinity) {
            cartsWithHeight = await Cesium.sampleTerrainMostDetailed(
                terrainProvider,
                cartographicPositions
            )
        } else {
            cartsWithHeight = await Cesium.sampleTerrain(
                terrainProvider,
                terrainSampleLevel,
                cartographicPositions
            )
        }
        return cartsWithHeight.map(cart => cart.height);
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
            next() {
                return idx < data.length
                    ? { value: data[idx++], done: false }
                    : { done: true, value: null }
            }
        }
    }

    toGeoJson(annotationType: AnnotationType): GeoJsonFeatureCollection | null {
        let coords: number[] | number[][] | number[][][] | null = null,
            geomType: string = "",
            properties: { [key: string]: any } = { initOptions: {} }

        if (annotationType === AnnotationType.POINT) {
            if (this.coordinates.length === 0) return null
            geomType = "Point"
            const { lat, lng, alt } = this.coordinates[0];
            coords = [lng, lat, alt ?? 0.0];
        }

        if (annotationType === AnnotationType.POLYLINE) {
            if (this.coordinates.length < 2) return null;
            geomType = "LineString"
            coords = this.coordinates.map(({ lng, lat, alt }) => [lng, lat, alt ?? 0.0])
        }

        if (annotationType === AnnotationType.POLYGON) {
            if (this.coordinates.length < 3) return null;
            geomType = "Polygon"
            coords = this.coordinates.map(({ lng, lat, alt }) => [lng, lat, alt ?? 0.0])
            coords.push(coords[0])
            coords = [coords];
        }

        if (annotationType === AnnotationType.RECTANGLE) {
            if (this.coordinates.length < 2) return null;
            geomType = "Polygon"
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

        if (!coords || coords.length === 0) return null

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
        }
        return result
    }

    toWkt(annotationType: AnnotationType): string | null {
        let coords: number[] | number[][] | number[][][] | null = null;

        if (annotationType === AnnotationType.POINT) {
            if (this.coordinates.length === 0) return null
            const { lat, lng } = this.coordinates[0];
            return `POINT (${lng} ${lat})`
        }

        if (annotationType === AnnotationType.POLYLINE) {
            if (this.coordinates.length < 2) return null;
            return `LINESTRING (${this.coordinates.map(({ lng, lat }) => `${lng} ${lat}`).join(", ")})`
        }

        if (annotationType === AnnotationType.POLYGON) {
            if (this.coordinates.length < 3) return null;
            return `POLYGON ((${this.coordinates.map(({ lng, lat }) => `${lng} ${lat}`).join(", ")}, ${this.coordinates[0].lng} ${this.coordinates[0].lat}))`;
        }

        if (annotationType === AnnotationType.RECTANGLE) {
            if (this.coordinates.length < 2) return null;
            const bbox = this.getMinMaxBbox();
            return `POLYGON ((${bbox.lngMin} ${bbox.latMin}, ${bbox.lngMin} ${bbox.latMax}, ${bbox.lngMax} ${bbox.latMax}, ${bbox.lngMax} ${bbox.latMin}, ${bbox.lngMin} ${bbox.latMin}))`;
        }

        // Note: RING type handled in ring annotation

        return null;
    }


}
