import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationType } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from "../registry";

export type PointInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PointGraphics.ConstructorOptions,
}

export default class PointAnnotation extends Annotation {

    entityProperties: Cesium.PointGraphics.ConstructorOptions;

    constructor(registry: Registry, options: PointInitOptions) {
        super(registry, options);
        this.annotationType = AnnotationType.POINT;
        this.entityProperties = options.entityProperties ?? {};
    }

    appendCoordinate(coordinate: Coordinate) {
        this.points = [coordinate];
        this.emit("append", {annotation: this});
    }

    draw() {
        let entity = null;
        if (this.isStatic) {
            this.removeEntity();
            const position = this.points[0].toCartesian3();
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                position,
                point: {
                    pixelSize: 10,
                    ...this.entityProperties
                }
            })
        } else if (!this.entity) {
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                position: new Cesium.CallbackProperty(() => {
                    return this.points[0]?.toCartesian3?.();
                }, false) as unknown as Cesium.PositionProperty,
                point: {
                    pixelSize: 10,
                    ...this.entityProperties
                }
            })
        }
        this.entity = entity;
        this.emit("update", {annotation: this});
    }


}