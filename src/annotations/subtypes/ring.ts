import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType, DistanceUnit, DrawOptions, EventType, FlyToOptions, GeoJsonFeatureCollection } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate, CoordinateCollection } from '../coordinate';
import { Registry } from '../registry';

export type RingInitOptions = AnnotationBaseInit & {
    polygonProperties?: Cesium.PolylineGraphics.ConstructorOptions | Cesium.EllipseGraphics.ConstructorOptions,
    entityProperties?: Cesium.Entity.ConstructorOptions,
    drawAsLine?: boolean,
    nPoints?: number,
}

export class RingAnnotation extends Annotation {

    polygonProperties: Cesium.PolylineGraphics.ConstructorOptions | Cesium.EllipseGraphics.ConstructorOptions;
    entityProperties: Cesium.Entity.ConstructorOptions;
    drawAsLine: boolean
    nPoints: number
    private radius: number | null;

    constructor(registry: Registry, options: RingInitOptions) {
        super(registry, options);
        this.annotationType = AnnotationType.RING;
        this.polygonProperties = options.polygonProperties ?? {};
        this.entityProperties = options.entityProperties ?? {};
        this.drawAsLine = options.drawAsLine ?? false;
        this.nPoints = options.nPoints ?? 360
        this.radius = null;
    }

    // Note: This implementation is needed to set the radius property any time a handle is dragged
    handlePointerMove(e: PointerEvent) {
        if (this.pointerDownDetected) {
            // update the specified point as it is dragged
            if (this.handleFound !== null) {
                this.removeHandleByCoordinateID(this.handleFound.handleID);
                const coordinate = this.viewerInterface.getCoordinateAtPixel(e.offsetX, e.offsetY);
                // if (coordinate) this.points[this.handleFound.index] = coordinate;
                if (coordinate) this.points.set(this.handleFound.index, coordinate);
                this.radius = (this.points.at(0) as Coordinate).distanceTo(this.points.at(1) as Coordinate);
            }
            this.dragDetected = true;
        }
    }

    appendCoordinate(coordinate: Coordinate): void {
        if (this.points.length < 2) {
            this.points.push(coordinate);
        } else {
            this.points.set(1, coordinate)
        }
        if (this.points.length === 2) {
            this.radius = (this.points.at(0) as Coordinate).distanceTo(this.points.at(1) as Coordinate);
        }
    }

    draw(options?: DrawOptions): void {
        options = options || {};
        if (this.points.length < 2 || this.radius === null) return
        let entity: AnnotationEntity | null = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            if (this.drawAsLine) {
                const headingFactor = 360 / this.nPoints;
                const perimeterCoords: Cesium.Cartesian3[] = [];
                for (let i = 0; i < this.nPoints; i++) {
                    const heading = headingFactor * i;
                    perimeterCoords.push((this.points.at(0) as Coordinate).atHeadingDistance(heading, this.radius).cartesian3)
                }
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: {
                        positions: [...perimeterCoords, perimeterCoords[0]],
                        width: 2,
                        ...this.polygonProperties as Cesium.PolylineGraphics.ConstructorOptions
                    },
                    ...this.entityProperties
                }) as AnnotationEntity;
            } else {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    position: this.points.at(0)?.cartesian3,
                    ellipse: {
                        semiMajorAxis: this.radius,
                        semiMinorAxis: this.radius,
                        ...this.polygonProperties as Cesium.EllipseGraphics.ConstructorOptions
                    },
                    ...this.entityProperties
                }) as AnnotationEntity;
            }
        } else if (!this.entity || options.forceLiveRedraw) {
            this.removeEntity();
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: {
                        positions: new Cesium.CallbackProperty(() => {
                            const headingFactor = 360 / this.nPoints;
                            const perimeterCoords: Cesium.Cartesian3[] = [];
                            for (let i = 0; i < this.nPoints; i++) {
                                const heading = headingFactor * i;
                                perimeterCoords.push((this.points.at(0) as Coordinate).atHeadingDistance(heading, this.radius as number).cartesian3)
                            }
                            perimeterCoords.push(perimeterCoords[0]) // close the perimerter
                            return perimeterCoords;
                        }, false),
                        width: 2,
                        ...this.polygonProperties as Cesium.PolylineGraphics.ConstructorOptions
                    },
                    ...this.entityProperties
                }) as AnnotationEntity
            } else {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    position: new Cesium.CallbackProperty(() => {
                        return this.points.at(0)?.cartesian3;
                    }, false) as unknown as Cesium.PositionProperty,
                    ellipse: {
                        semiMajorAxis: new Cesium.CallbackProperty(() => {
                            return this.radius
                        }, false),
                        semiMinorAxis: new Cesium.CallbackProperty(() => {
                            return this.radius
                        }, false),
                        ...this.polygonProperties as Cesium.EllipseGraphics.ConstructorOptions
                    },
                    ...this.entityProperties
                }) as AnnotationEntity;
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

    getArea(): number | null {
        if (this.radius !== null) {
            return Math.PI * this.radius ** 2
        }
        return null;
    }


    // OVERRIDES
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void { }

    toGeoJson(): GeoJsonFeatureCollection | null {

        if (this.points.length < 2) return null
        const headingFactor = 360 / this.nPoints;
        const perimeterCoords: Coordinate[] = [];
        for (let i = 0; i < this.nPoints; i++) {
            const heading = headingFactor * i;
            perimeterCoords.push((this.points.at(0) as Coordinate).atHeadingDistance(heading, this.radius as number))
        }

        const collection = new CoordinateCollection(perimeterCoords)
        const geoJson = collection.toGeoJson(AnnotationType.POLYGON);
        if (geoJson) {
            const p1: Coordinate = this.points.at(0) as Coordinate;
            const p2: Coordinate = this.points.at(1) as Coordinate;
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
            }
        }
        return geoJson;
    }

    toWkt(): string | null {
        if (this.points.length < 2) return null
        const headingFactor = 360 / this.nPoints;
        const perimeterCoords: Coordinate[] = [];
        for (let i = 0; i < this.nPoints; i++) {
            const heading = headingFactor * i;
            perimeterCoords.push((this.points.at(0) as Coordinate).atHeadingDistance(heading, this.radius as number))
        }

        const collection = new CoordinateCollection(perimeterCoords)
        return collection.toWkt(AnnotationType.POLYGON);
    }

}