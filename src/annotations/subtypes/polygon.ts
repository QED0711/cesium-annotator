import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType, MidPointHandleEntity } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from '../registry';


export type PolygonInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PolygonGraphics.ConstructorOptions | Cesium.PolylineGraphics.ConstructorOptions,
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions,
    drawAsLine?: boolean
    midpointMarkers?: boolean,
}

export default class Polygon extends Annotation {

    drawAsLine: boolean;
    entityProperties: Cesium.PolylineGraphics.ConstructorOptions;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    private midpointMarkers: boolean;
    private midPointHandles: Cesium.Entity[];

    constructor(registry: Registry, options: PolygonInitOptions) {
        super(registry, options);

        this.annotationType = AnnotationType.POLYGON;
        this.entityProperties = options.entityProperties ?? {};
        this.handleProperties = options.handleProperties ?? {};

        this.drawAsLine = options.drawAsLine ?? false;

        this.midpointMarkers = options.midpointMarkers ?? true;
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
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: {
                        positions: Coordinate.coordinateArrayToCartesian3([...this.points, this.points[0]]),
                        width: 2,
                        ...this.entityProperties as Cesium.PolylineGraphics.ConstructorOptions
                    }
                }) as AnnotationEntity;
            } else {
                if (this.points.length < 3) return;
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polygon: {
                        hierarchy: Coordinate.coordinateArrayToCartesian3(this.points),
                        ...this.entityProperties as Cesium.PolygonGraphics.ConstructorOptions,
                    }
                }) as AnnotationEntity;
            }
        } else if (!this.entity) {
            if (this.drawAsLine) { // POLYLINE
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: {
                        positions: new Cesium.CallbackProperty(() => {
                            return Coordinate.coordinateArrayToCartesian3([...this.points, this.points[0]])
                        }, false),
                        width: 2,
                        ...this.entityProperties as Cesium.PolylineGraphics.ConstructorOptions
                    }
                }) as AnnotationEntity;
            } else { // POLYGON
                if (this.points.length < 3) return;
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polygon: {
                        hierarchy: new Cesium.CallbackProperty(() => {
                            const positions = Coordinate.coordinateArrayToCartesian3(this.points);
                            return new Cesium.PolygonHierarchy(positions);
                        }, false),
                        ...this.entityProperties as Cesium.PolygonGraphics.ConstructorOptions
                    }
                }) as AnnotationEntity;
            }
        }

        if (entity) {
            entity._annotation = this;
            this.entity = entity;
        }
        this.emit("update", { annotation: this });
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
        if (this.points.length >= 3) {
            for (let i = 0; i < this.points.length; i++) {
                const point = this.points[i]
                const nextPoint = i === this.points.length - 1 ? this.points[0] : this.points[i+1]
                const midPoint = point.segmentDistance(nextPoint, 2)[0] as Coordinate;

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

}