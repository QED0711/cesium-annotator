import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType, DistanceUnit, MidPointHandleEntity, EventType, GeoJsonFeatureCollection } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';

export type PolylineInitOptions = AnnotationBaseInit & {
    polylineProperties?: Cesium.PolylineGraphics.ConstructorOptions,
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions,
    entityProperties?: Cesium.Entity.ConstructorOptions,
    midpointMarkers?: boolean,
}

export default class Polyline extends Annotation {

    polylineProperties: Cesium.PolylineGraphics.ConstructorOptions;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    entityProperties?: Cesium.Entity.ConstructorOptions;
    private midpointMarkers: boolean;
    private midPointHandles: Cesium.Entity[];

    constructor(registry: Registry, options: PolylineInitOptions) {
        super(registry, options);
        this.annotationType = AnnotationType.POLYLINE;
        this.polylineProperties = options.polylineProperties ?? {};
        this.handleProperties = options.handleProperties ?? {};
        this.entityProperties = options.entityProperties ?? {};

        this.midpointMarkers = options.midpointMarkers ?? true,

        this.midPointHandles = [];
    }

    appendCoordinate(coordinate: Coordinate): void {
        this.points.push(coordinate);
        this.emit(EventType.APPEND, { annotation: this });
    }

    draw(): void {
        let entity: AnnotationEntity | null = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                polyline: {
                    positions: this.points.toCartesian3Array(),
                    width: 2,
                    ...this.polylineProperties
                },
                ...this.entityProperties
            }) as AnnotationEntity
        } else if (!this.entity) {
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                polyline: {
                    positions: new Cesium.CallbackProperty(() => {
                        return this.points.toCartesian3Array();
                    }, false),
                    width: 2,
                    ...this.polylineProperties
                },
                ...this.entityProperties
            }) as AnnotationEntity
        }

        if (entity) {
            entity._canActivate = true 
            entity._annotation = this;
            this.entity = entity
        }
        this.emit(EventType.UPDATE, { annotation: this });
    }

    handlePointerDown(e: PointerEvent): void {
        super.handlePointerDown(e); 
        const existingEntity = this.viewerInterface.queryEntityAtPixel() as MidPointHandleEntity | null;
        if(existingEntity?._isMidpointHandle) {
            this.insertCoordinateAtIndex(existingEntity._coordinate, existingEntity._idxBookends[1])
            this.bypassPointerUp = true;
        }
    }

    syncHandles(): void {
        super.syncHandles();

        if(!this.midpointMarkers) return;

        for(let mph of this.midPointHandles) {
            this.viewerInterface.viewer.entities.remove(mph);
        }
        this.midPointHandles = [];
        if (this.points.length >= 2) {
            for (let i = 0; i < this.points.length - 1; i++) {
                const point = this.points.at(i) as Coordinate;
                const midPoint = point.segmentDistance(this.points.at(i+1) as Coordinate, 2)[0] as Coordinate;

                const mpHandle = this.viewerInterface.viewer.entities.add({
                    position: midPoint.cartesian3,
                    point: {
                        pixelSize: 5,
                        color: Cesium.Color.BLUE, 
                    } as Cesium.PointGraphics.ConstructorOptions
                }) as MidPointHandleEntity;

                mpHandle._isMidpointHandle = true;
                mpHandle._annotation = this;
                mpHandle._coordinate = midPoint;
                mpHandle._idxBookends = [i, i + 1];
                this.midPointHandles.push(mpHandle)
            }
        }
    }

    hideHandles(): void {
        super.hideHandles();
        for (let handle of Object.values(this.midPointHandles)) {
            handle.show = false;
        }
    }

    showHandles(): void {
        super.showHandles();
        for (let handle of Object.values(this.midPointHandles)) {
            handle.show = true;
        }
    }

    // OVERRIDES
    toGeoJson(): GeoJsonFeatureCollection | null {
        const geoJson = super.toGeoJson();
        if(geoJson) {
            const properties = geoJson.features[0].properties;
            properties.initOptions = {
                polylineProperties: this.polylineProperties,
                handleProperties: this.handleProperties,
                entityProperties: this.entityProperties,
                midPointMarkers: this.midpointMarkers,
                ...properties.initOptions,
            }
            return geoJson;
        }
        return null
    }

    // SUBCLASS SPECIFIC METHODS
    getTotalDistance(unit: DistanceUnit = DistanceUnit.METERS): number {
        let dist = 0;
        for (let i = 1; i < this.points.length; i++) {
            dist += (this.points.at(i) as Coordinate).distanceTo(this.points.at(i - 1) as Coordinate, unit);
        }
        return dist;
    }

    getDistanceSegments(unit: DistanceUnit = DistanceUnit.METERS): number[] {
        let distArr: number[] = [];
        for (let i = 1; i < this.points.length; i++) {
            distArr.push((this.points.at(i) as Coordinate).distanceTo(this.points.at(i - 1) as Coordinate, unit));
        }
        return distArr;
    }

    getHeadingSegments(): number[] {
        const headingArr: number[] = [];
        for (let i = 1; i < this.points.length; i++) {
            headingArr.push((this.points.at(i - 1) as Coordinate).headingTo(this.points.at(i) as Coordinate));
        }
        return headingArr;

    }
}