import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType, DrawOptions, EventType, GeoJsonFeature, GeoJsonFeatureCollection, HandleEntity, HandleType } from "../../utils/types";
import { Annotation } from "../core";
import { Registry } from "../registry";
import { CoordinateCollection, Coordinate } from '../coordinate';

export type PointInitOptions = AnnotationBaseInit & {
    pointProperties?: Cesium.PointGraphics.ConstructorOptions,
    billboardProperties?: Cesium.BillboardGraphics.ConstructorOptions,
    entityProperties?: Cesium.Entity.ConstructorOptions,
}

/**
 * See {@link Registry} for registry creation;
 * 
 * *PointAnnotation* should not be invoked directly. It should be created through a call to `addPoint` on a {@link Registry} instance.
 * 
 * @example
 * ```ts
 * let point: PointAnnotation = registry.addPoint({});
 * ```
 */

export class PointAnnotation extends Annotation {

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
        this.points = new CoordinateCollection([coordinate]);
        this.emit(EventType.APPEND, { annotation: this });
    }

    draw(options?: DrawOptions) {
        options = options ?? {};
        let entity: HandleEntity | null = null;

        let point, billboard;
        if (this.handleType === HandleType.BILLBOARD) {
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
            if (this.points.length === 0) return;

            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                position: this.points.at(0)?.cartesian3,
                point,
                billboard,
                ...this.entityProperties as Cesium.Entity.ConstructorOptions
            }) as HandleEntity
        } else if (!this.entity || options.forceLiveRedraw) {
            if (this.points.length === 0) return;
            this.removeEntity();
            entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                position: new Cesium.CallbackProperty(() => {
                    return this.points.at(0)?.cartesian3;
                }, false) as unknown as Cesium.PositionProperty,
                point,
                billboard,
                ...this.entityProperties as Cesium.Entity.ConstructorOptions
            }) as HandleEntity
        }

        if (entity) {
            entity._canActivate = true;
            entity._parentAnnotation = this;
            entity._isHandle = true;
            entity._handleIdx = 0;
            entity._handleCoordinateID = this.points.at(0)?.id;
            this.entity = entity;
        }

        this.emit(EventType.UPDATE, { annotation: this });
    }

    // OVERRIDES

    toGeoJson(): GeoJsonFeatureCollection | null {
        const geoJson = super.toGeoJson()

        if (geoJson) {
            const properties = geoJson.features?.[0]?.properties;
            if(properties) {
                properties.initOptions = {
                    pointProperties: this.pointProperties,
                    billboardProperties: this.billboardProperties,
                    entityProperties: this.entityProperties,
                    ...properties.initOptions
                }
            }
            return geoJson
        }
        return null;
    }

    syncHandles(): void { }
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void { }

}