import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType, HandleType } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from "../registry";

export type PointInitOptions = AnnotationBaseInit & {
    pointProperties?: Cesium.PointGraphics.ConstructorOptions,
    billboardProperties?: Cesium.BillboardGraphics.ConstructorOptions,
    entityProperties?: Cesium.Entity.ConstructorOptions,
}

export default class PointAnnotation extends Annotation {

    entityProperties: Cesium.PointGraphics.ConstructorOptions;
    pointProperties: Cesium.PointGraphics.ConstructorOptions;
    billboardProperties: Cesium.BillboardGraphics.ConstructorOptions;

    constructor(registry: Registry, options: PointInitOptions) {
        super(registry, options);
        this.annotationType = AnnotationType.POINT;
        this.entityProperties = options.entityProperties ?? {};
        this.pointProperties = options.pointProperties ?? {};
        this.billboardProperties = options.billboardProperties ?? {};
    }

    appendCoordinate(coordinate: Coordinate) {
        this.points = [coordinate];
        this.emit("append", { annotation: this });
    }

    draw() {
        let entity: AnnotationEntity | null = null;

        let point, billboard;
        if(this.handleType === HandleType.BILLBOARD) {
            billboard = {
                scale: 1.0,
                ...this.billboardProperties
            } as Cesium.BillboardGraphics.ConstructorOptions
        } else {
            point = {
                pixelSize: 10,
                ...this.pointProperties
            } as Cesium.PointGraphics.ConstructorOptions
        }
        
        if (!this.liveUpdate) {
            this.removeEntity();
            if(this.points.length === 0) return;

            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                position: this.points[0].cartesian3,
                point,
                billboard,
                ...this.entityProperties as Cesium.Entity.ConstructorOptions
            }) as AnnotationEntity
        } else if (!this.entity) {
            if(this.points.length === 0) return;
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                position: new Cesium.CallbackProperty(() => {
                    return this.points[0]?.cartesian3;
                }, false) as unknown as Cesium.PositionProperty,
                point,
                billboard,
                ...this.entityProperties as Cesium.Entity.ConstructorOptions
            }) as AnnotationEntity
        }

        if (entity) {
            entity._annotation = this;
            entity._isHandle = true;
            entity._handleIdx = 0;
            entity._handleCoordinateID = this.points[0]?.id;
            this.entity = entity;
        }
        
        this.emit("update", { annotation: this });
    }

    // OVERRIDES
    syncHandles(): void {}
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void {}

}