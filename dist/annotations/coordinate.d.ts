import * as Cesium from 'cesium';
import CheapRuler from 'cheap-ruler';
import { AnnotationType, CoordinateInit, DistanceUnit, GeoJsonFeatureCollection, HandleEntity } from '../utils/types';
export declare class Coordinate {
    id: string;
    lng: number;
    lat: number;
    alt?: number;
    cartesian3: Cesium.Cartesian3;
    ruler: CheapRuler;
    entity: HandleEntity | null;
    constructor(init: CoordinateInit);
    static fromDegrees(lng: number, lat: number, alt?: number): Coordinate;
    clone(): Coordinate;
    update(values: {
        lat?: number;
        lng?: number;
        alt?: number;
    }): void;
    toCartographicPosition(): Cesium.Cartographic;
    withAlt(alt?: number): Coordinate;
    queryAlt(terrainProvider: Cesium.TerrainProvider, terrainSampleLevel?: number): Promise<number | null>;
    distanceTo(point2: Coordinate, unit?: DistanceUnit): number;
    headingTo(point2: Coordinate): number;
    atHeadingDistance(heading: number, distance: number, distanceUnit?: DistanceUnit): Coordinate;
    segmentDistance(point2: Coordinate, segments: number): Coordinate[];
    static toDMS(degree: number, isLatitude: boolean): string;
    toLatLngString(includeAlt?: boolean): string;
    toLngLatString(includeAlt?: boolean): string;
    toLatLngDMS(includeAlt?: boolean): string;
    toLngLatDMS(includeAlt?: boolean): string;
    static fromLatLngString(s: string, alt?: number): Coordinate | null;
    static fromLngLatString(s: string, alt?: number): Coordinate | null;
    static dmsToDecimal(degrees: number, minutes: number, seconds: number, direction: string): number;
    static fromDMSString(s: string, alt?: number): Coordinate | null;
    toScreenPosition(viewer: Cesium.Viewer): Cesium.Cartesian2;
}
export declare class CoordinateCollection {
    coordinates: Coordinate[];
    constructor(coordsArray?: Coordinate[]);
    get length(): number;
    at(idx: number): Coordinate | null;
    get first(): Coordinate | null;
    get last(): Coordinate | null;
    clone(): CoordinateCollection;
    push(coord: Coordinate): void;
    pop(): Coordinate | null;
    map(callback: (val: any, i: number) => any): CoordinateCollection | any[];
    filter(callback: (val: any, i: number) => boolean): CoordinateCollection;
    mean(): Coordinate | null;
    queryAlt(terrainProvider: Cesium.TerrainProvider, terrainSampleLevel?: number): Promise<number[]>;
    set(idx: number, coord: Coordinate): CoordinateCollection;
    insertAtIndex(index: number, coordinate: Coordinate): CoordinateCollection;
    getMinMaxBbox(): {
        lngMin: number;
        lngMax: number;
        latMin: number;
        latMax: number;
    };
    toCartesian3Array(): Cesium.Cartesian3[];
    [Symbol.iterator](): Iterator<Coordinate>;
    toGeoJson(annotationType: AnnotationType): GeoJsonFeatureCollection | null;
    toWkt(annotationType: AnnotationType): string | null;
}
