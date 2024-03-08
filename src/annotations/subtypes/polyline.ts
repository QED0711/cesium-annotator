import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType, DistanceUnit, MidPointHandleEntity, EventType, GeoJsonFeatureCollection, HandleType, DrawOptions } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate, CoordinateCollection } from '../coordinate';
import { Registry } from '../registry';

export type PolylineInitOptions = AnnotationBaseInit & {
    polylineProperties?: Cesium.PolylineGraphics.ConstructorOptions,
    midpointHandles?: boolean,
    midpointHandleType?: HandleType,
    midpointHandleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions,
}

export class PolylineAnnotation extends Annotation {

    polylineProperties: Cesium.PolylineGraphics.ConstructorOptions;
    midpointHandles: boolean;
    midpointHandleType: HandleType;
    midpointHandleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions
    private mpHandles: Cesium.Entity[];

    constructor(registry: Registry, options: PolylineInitOptions) {
        super(registry, options);
        this.annotationType = AnnotationType.POLYLINE;
        this.polylineProperties = options.polylineProperties ?? {};
        this.entityProperties = options.entityProperties ?? {};

        this.midpointHandles = options.midpointHandles ?? true,
        this.midpointHandleType = options.midpointHandleType ?? HandleType.POINT,
        this.midpointHandleProperties = options.midpointHandleProperties ?? {};

        this.mpHandles = [];
    }

    appendCoordinate(coordinate: Coordinate): void {
        this.points.push(coordinate);
        this.emit(EventType.APPEND, { annotation: this });
    }

    draw(options?: DrawOptions): void {
        options = options ?? {};
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
        } else if (!this.entity || options.forceLiveRedraw) {
            this.removeEntity();
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

        if(!this.midpointHandles) return;

        for(let mph of this.mpHandles) {
            this.viewerInterface.viewer.entities.remove(mph);
        }
        this.mpHandles = [];
        if (this.points.length >= 2) {
            let point: Cesium.PointGraphics.ConstructorOptions | undefined;
            let billboard: Cesium.BillboardGraphics.ConstructorOptions | undefined;
            if(this.midpointHandleType === HandleType.POINT) {
                point = {pixelSize: 5, ...this.midpointHandleProperties} as Cesium.PointGraphics.ConstructorOptions;
            } else if (this.midpointHandleType === HandleType.BILLBOARD) {
                billboard = this.midpointHandleProperties as Cesium.BillboardGraphics.ConstructorOptions;
            }
            for (let i = 0; i < this.points.length - 1; i++) {
                const pnt = this.points.at(i) as Coordinate;
                const midPoint = pnt.segmentDistance(this.points.at(i+1) as Coordinate, 2)[0] as Coordinate;

                const mpHandle = this.viewerInterface.viewer.entities.add({
                    position: midPoint.cartesian3,
                    point, 
                    billboard
                }) as MidPointHandleEntity;

                mpHandle._isMidpointHandle = true;
                mpHandle._annotation = this;
                mpHandle._coordinate = midPoint;
                mpHandle._idxBookends = [i, i + 1];
                this.mpHandles.push(mpHandle)
            }
        }
    }

    hideHandles(): void {
        super.hideHandles();
        for (let handle of this.mpHandles) {
            handle.show = false;
        }
    }

    showHandles(): void {
        super.showHandles();
        for (let handle of this.mpHandles) {
            handle.show = true;
        }
    }

    removeHandles(): void {
        super.removeHandles();
        for (let mpHandle of this.mpHandles) {
            this.viewerInterface.viewer.entities.remove(mpHandle);
        }
        this.mpHandles = [];
    }

    setPolylineProperties(properties: Cesium.PolylineGraphics.ConstructorOptions): void {
        this.polylineProperties = properties;
        this.emit(EventType.PROPERTY, { annotation: this })
    }

    setPolylineProperty(propName: string, value: any) {
        this.polylineProperties[propName as keyof typeof this.polylineProperties] = value;
        this.emit(EventType.PROPERTY, { annotation: this })
    }

    deletePolylineProperty(propName: string) {
        delete this.polylineProperties[propName as keyof typeof this.polylineProperties]
        this.emit(EventType.PROPERTY, { annotation: this })
    }

    // OVERRIDES
    toGeoJson(): GeoJsonFeatureCollection | null {
        const geoJson = super.toGeoJson();
        if(geoJson) {
            const properties = geoJson.features[0].properties;
            properties.initOptions = {
                polylineProperties: this.polylineProperties,
                midpointHandles: this.midpointHandles,
                midpointHandleType: this.midpointHandleType,
                midpointHandleProperties: this.midpointHandleProperties,
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

    getPointsOnPath(distance: number, unit: DistanceUnit): CoordinateCollection | null {
        if(this.points.length < 2) return null;

        const collection = new CoordinateCollection([this.points.at(0) as Coordinate]);
        for(let i = 1; i < this.points.length; i++) {
            const p1 = this.points.at(i -1) as Coordinate;
            const p2 = this.points.at(i) as Coordinate;
            const segDist = p1.distanceTo(p2, unit);
            const segHeading = p1.headingTo(p2);
            const pointsInSeg = Math.floor(segDist / distance);
            for(let n = 0; n < pointsInSeg; n++) {
                const coord = p1.atHeadingDistance(segHeading, distance * n, unit);
                collection.push(coord);
            }
            collection.push(p2);
        }

        return collection;
    }
}