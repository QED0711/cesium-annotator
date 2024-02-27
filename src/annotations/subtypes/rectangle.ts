import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType, DistanceUnit, EventType, GeoJsonFeatureCollection } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';

export type RectangleInitOptions = AnnotationBaseInit & {
    polygonProperties?: Cesium.PolylineGraphics.ConstructorOptions | Cesium.PolygonGraphics.ConstructorOptions,
    entityProperties?: Cesium.Entity.ConstructorOptions,
    drawAsLine?: boolean,
}

export default class Rectangle extends Annotation {

    polygonProperties: Cesium.PolylineGraphics.ConstructorOptions | Cesium.PolygonGraphics.ConstructorOptions
    entityProperties: Cesium.Entity.ConstructorOptions;
    drawAsLine?: boolean

    constructor(registry: Registry, options: RectangleInitOptions) {
        super(registry, options);
        this.annotationType = AnnotationType.RECTANGLE;
        this.polygonProperties = options.polygonProperties ?? {};
        this.entityProperties = options.entityProperties ?? {};
        this.drawAsLine = options.drawAsLine ?? false
    }

    appendCoordinate(coordinate: Coordinate): void {
        if (this.points.length < 2) {
            this.points.push(coordinate);
        } else {
            this.points.set(1, coordinate);
        }
    }

    draw(): void {
        let entity: AnnotationEntity | null = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            const bbox = this.points.getMinMaxBbox();
            const positions = [
                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMax),
                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMax),
                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMin),
                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
            ]
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: {
                        positions,
                        width: 2,
                        ...this.polygonProperties as Cesium.PolylineGraphics.ConstructorOptions
                    },
                    ...this.entityProperties
                }) as AnnotationEntity
            } else if (this.points.length === 2) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polygon: {
                        hierarchy: positions,
                        ...this.polygonProperties as Cesium.PolygonGraphics.ConstructorOptions
                    },
                    ...this.entityProperties
                }) as AnnotationEntity
            }
        } else if (!this.entity) {
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: {
                        positions: new Cesium.CallbackProperty(() => {
                            const bbox = this.points.getMinMaxBbox();
                            return [
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMin),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                            ]
                        }, false),
                        width: 2,
                        ...this.polygonProperties as Cesium.PolylineGraphics.ConstructorOptions
                    },
                    ...this.entityProperties
                }) as AnnotationEntity
            } else if (this.points.length === 2) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polygon: {
                        hierarchy: new Cesium.CallbackProperty(() => {
                            const bbox = this.points.getMinMaxBbox();
                            return new Cesium.PolygonHierarchy([
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMin),
                            ]);
                        }, false),
                        ...this.polygonProperties as Cesium.PolygonGraphics.ConstructorOptions
                    },
                    ...this.entityProperties
                }) as AnnotationEntity
            }
        }

        if (entity) {
            entity._canActivate = true;
            entity._annotation = this;
            this.entity = entity;
        }
        this.emit(EventType.UPDATE, { annotation: this });
    }

    syncHandles(): void {
        super.syncHandles();
    }

    getPerimeter(unit: DistanceUnit = DistanceUnit.METERS): number | null {
        const bbox = this.points.getMinMaxBbox();
        const bl = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMin });
        const br = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMax });
        const tl = new Coordinate({ lat: bbox.latMax, lng: bbox.lngMax });

        const width = bl.distanceTo(br, unit);
        const height = bl.distanceTo(tl, unit);

        return (width * 2) + (height * 2);
    }

    getArea(unit: DistanceUnit = DistanceUnit.METERS): number {
        const bbox = this.points.getMinMaxBbox();
        const bl = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMin });
        const br = new Coordinate({ lat: bbox.latMin, lng: bbox.lngMax });
        const tl = new Coordinate({ lat: bbox.latMax, lng: bbox.lngMax });

        const width = bl.distanceTo(br, unit);
        const height = bl.distanceTo(tl, unit);

        return width * height;
    }

    // OVERRIDES
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void { }

    toGeoJson(): GeoJsonFeatureCollection | null {
        const geoJson = super.toGeoJson();

        if (geoJson) {
            const { lng: lng1, lat: lat1, alt: alt1 } = this.points.at(0) as Coordinate;
            const { lng: lng2, lat: lat2, alt: alt2 } = this.points.at(1) as Coordinate;
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
            }
        }
        return geoJson;
    }

}

