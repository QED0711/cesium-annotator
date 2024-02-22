import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType } from "../../utils/types";
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
        this.emit("append", { annotation: this });
    }

    draw() {
        let entity: AnnotationEntity | null = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            if(this.points.length === 0) return;
            const position = this.points[0].cartesian3;
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                position,
                point: {
                    pixelSize: 10,
                    ...this.entityProperties
                }
            }) as AnnotationEntity
        } else if (!this.entity) {
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                position: new Cesium.CallbackProperty(() => {
                    return this.points[0]?.cartesian3;
                }, false) as unknown as Cesium.PositionProperty,
                point: {
                    pixelSize: 10,
                    ...this.entityProperties
                }
            }) as AnnotationEntity
        }
        if (entity) {
            entity._annotation = this;
            entity._handleIdx = 0;
        }
        this.entity = entity;
        this.emit("update", { annotation: this });
    }

    // OVERRIDES
    syncHandles(): void {}
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void {}

}