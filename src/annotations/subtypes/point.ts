import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType, DrawOptions, EventType, GeoJsonFeature, GeoJsonFeatureCollection, HandleEntity, HandleType } from "../../utils/types";
import { Annotation } from "../core";
import { Registry } from "../registry";
import { CoordinateCollection, Coordinate } from '../coordinate';

export type PointInitOptions = AnnotationBaseInit & {
    pointProperties?: Cesium.PointGraphics.ConstructorOptions,
    billboardProperties?: Cesium.BillboardGraphics.ConstructorOptions,
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

    pointProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;

    constructor(registry: Registry, options: PointInitOptions) {
        super(registry, options);
        this.annotationType = AnnotationType.POINT;
        this.pointProperties = options.pointProperties ?? {};
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
                ...this.pointProperties
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
                point: this.handleType === HandleType.POINT ? point : undefined,
                billboard: this.handleType === HandleType.BILLBOARD ? billboard : undefined,
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
                point: this.handleType === HandleType.POINT ? point : undefined,
                billboard: this.handleType === HandleType.BILLBOARD ? billboard : undefined,
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

    setPointProperties(properties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions): void {
        this.pointProperties = properties;
        this.emit(EventType.PROPERTY, { annotation: this })
    }

    setPointProperty(propName: string, value: any) {
        this.pointProperties[propName as keyof typeof this.pointProperties] = value;
        this.emit(EventType.PROPERTY, { annotation: this })
    }

    deletePointProperty(propName: string) {
        delete this.pointProperties[propName as keyof typeof this.pointProperties]
        this.emit(EventType.PROPERTY, { annotation: this })
    }

    // OVERRIDES

    toGeoJson(): GeoJsonFeatureCollection | null {
        const geoJson = super.toGeoJson()

        if (geoJson) {
            const properties = geoJson.features?.[0]?.properties;
            if (properties) {
                properties.initOptions = {
                    pointProperties: this.pointProperties,
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