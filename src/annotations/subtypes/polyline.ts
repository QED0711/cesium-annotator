import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from '../registry';

export type PolyLineInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PolylineGraphics.ConstructorOptions
}

export default class PolyLine extends Annotation {

    entityProperties: Cesium.PolylineGraphics.ConstructorOptions;

    constructor(registry: Registry, options: PolyLineInitOptions) {
        super(registry, options);
        this.annotationType = AnnotationType.POLYLINE;
        this.entityProperties = options.entityProperties ?? {};
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
}