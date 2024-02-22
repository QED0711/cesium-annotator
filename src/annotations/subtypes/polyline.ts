import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType, DistanceUnit, MidPointHandleEntity } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from '../registry';

export type PolylineInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PolylineGraphics.ConstructorOptions,
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions,
    midpointMarkers?: boolean,
}

export default class Polyline extends Annotation {

    entityProperties: Cesium.PolylineGraphics.ConstructorOptions;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    private midpointMarkers: boolean;
    private midPointHandles: Cesium.Entity[];

    constructor(registry: Registry, options: PolylineInitOptions) {
        super(registry, options);
        this.annotationType = AnnotationType.POLYLINE;
        this.entityProperties = options.entityProperties ?? {};
        this.handleProperties = options.handleProperties ?? {};

        this.midpointMarkers = options.midpointMarkers ?? true,

        this.midPointHandles = [];
    }

    appendCoordinate(coordinate: Coordinate): void {
        this.points.push(coordinate);
        this.emit("append", { annotation: this });
    }

    draw(): void {
        let entity: AnnotationEntity | null = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                polyline: {
                    positions: Coordinate.coordinateArrayToCartesian3(this.points),
                    width: 2,
                    ...this.entityProperties
                }
            }) as AnnotationEntity
        } else if (!this.entity) {
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                polyline: {
                    positions: new Cesium.CallbackProperty(() => {
                        return Coordinate.coordinateArrayToCartesian3(this.points);
                    }, false),
                    width: 2,
                    ...this.entityProperties
                }
            }) as AnnotationEntity
        }

        if (entity) {
            entity._annotation = this;
            this.entity = entity
        }
        this.emit("update", { annotation: this })
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
                const point = this.points[i]
                const midPoint = point.segmentDistance(this.points[i+1], 2)[0] as Coordinate;

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

    // SUBCLASS SPECIFIC METHODS
    getTotalDistance(unit: DistanceUnit = DistanceUnit.METERS): number {
        let dist = 0;
        for (let i = 1; i < this.points.length; i++) {
            dist += this.points[i].distanceTo(this.points[i - 1], unit);
        }
        return dist;
    }

    getDistanceSegments(unit: DistanceUnit = DistanceUnit.METERS): number[] {
        let distArr: number[] = [];
        for (let i = 1; i < this.points.length; i++) {
            distArr.push(this.points[i].distanceTo(this.points[i - 1], unit));
        }
        return distArr;
    }

    getHeadingSegments(): number[] {
        // TODO: there is a bug here when points are moved the headings aren't correct anymore
        const headingArr: number[] = [];
        for (let i = 1; i < this.points.length; i++) {
            headingArr.push(this.points[i - 1].headingTo(this.points[i]));
        }
        return headingArr;

    }
}