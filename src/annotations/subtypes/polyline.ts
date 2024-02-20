import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType, DistanceUnit } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from '../registry';

export type PolylineInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PolylineGraphics.ConstructorOptions,
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions,
}

export default class Polyline extends Annotation {

    entityProperties: Cesium.PolylineGraphics.ConstructorOptions;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;

    constructor(registry: Registry, options: PolylineInitOptions) {
        super(registry, options);
        this.annotationType = AnnotationType.POLYLINE;
        this.entityProperties = options.entityProperties ?? {};
        this.handleProperties = options.handleProperties ?? {};
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

    syncHandles(): void {
        if(this.isActive) {
            for(let i = 0; i < this.points.length; i++) {
                const point = this.points[i];
                if(point.id in this.handles) continue;

                const handle = this.viewerInterface.viewer.entities.add({
                    position: point.toCartesian3(),
                    point: {
                        pixelSize: 10,
                    }
                }) as AnnotationEntity

                handle._annotation = this;
                handle._isHandle = true;
                handle._handleCoordinateID = point.id
                handle._handleIdx = i;

                this.handles[point.id] = handle;
            }
        }

        this.updateHandleIdxs();
        this.removeStaleHandles();
    }

    // SUBCLASS SPECIFIC METHODS
    getTotalDistance(unit: DistanceUnit = DistanceUnit.METERS): number {
        let dist = 0;
        for(let i = 1; i < this.points.length; i++) {
            dist += this.points[i].distanceTo(this.points[i-1], unit);
        }
        return dist;
    }

    getDistanceSegments(unit: DistanceUnit = DistanceUnit.METERS): number[] {
        let distArr: number[] = [];
        for(let i = 1; i < this.points.length; i++) {
            distArr.push(this.points[i].distanceTo(this.points[i-1], unit));
        }
        return distArr;
    }

    getHeadingSegments(): number[] {
        // TODO: there is a bug here when points are moved the headings aren't correct anymore
        const headingArr: number[] = [];
        for(let i = 1; i < this.points.length; i++) {
            headingArr.push(this.points[i-1].headingTo(this.points[i]));
        }
        return headingArr;

    }
}