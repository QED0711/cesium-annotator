import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from '../registry';


export type PolygonInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PolygonGraphics.ConstructorOptions | Cesium.PolylineGraphics.ConstructorOptions,
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions,
    drawAsLine?: boolean
}

export default class Polygon extends Annotation {

    drawAsLine: boolean;
    entityProperties: Cesium.PolylineGraphics.ConstructorOptions;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;

    constructor(registry: Registry, options: PolygonInitOptions) {
        super(registry, options);

        this.annotationType = AnnotationType.POLYGON;
        this.entityProperties = options.entityProperties ?? {};
        this.handleProperties = options.handleProperties ?? {};

        this.drawAsLine = options.drawAsLine ?? false;
    }

    appendCoordinate(coordinate: Coordinate): void {
        this.points.push(coordinate);
        this.emit("append", { annotation: this });
    }

    draw(): void {
        let entity: AnnotationEntity | null = null;
        if (!this.liveUpdate) {
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

        console.log(entity);

        if (entity) {
            entity._annotation = this;
            this.entity = entity;
        }
        this.emit("update", { annotation: this });
    }

    syncHandles(): void {
        if (this.isActive) {
            for (let i = 0; i < this.points.length; i++) {
                const point = this.points[i];
                if (point.id in this.handles) continue;

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

}