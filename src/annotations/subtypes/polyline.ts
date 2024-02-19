import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType } from "../../utils/types";
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
        if (this.isStatic) {
            this.removeEntity();
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                polyline: {
                    positions: Coordinate.coordinateArrayToCartesian3(this.points),
                    width: 2,
                    ...this.entityProperties
                }
            })
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
            })
        }

        if (entity) this.entity = entity;
        this.emit("update", { annotation: this })
    }

    syncHandles(): void {
        // TODO: remove stale handles
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

                handle._isHandle = true;
                handle._handleCoordinateID = point.id
                handle._handleIdx = i;

                this.handles[point.id] = handle;
            }
        }
    }
}