import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType, DistanceUnit } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from '../registry';

export type RectangleInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PolylineGraphics.ConstructorOptions | Cesium.PolygonGraphics.ConstructorOptions,
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions,
    drawAsLine?: boolean,
}

export default class Rectangle extends Annotation {

    entityProperties: Cesium.PolylineGraphics.ConstructorOptions | Cesium.PolygonGraphics.ConstructorOptions
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions
    drawAsLine?: boolean

    constructor(registry: Registry, options: RectangleInitOptions) {
        super(registry, options);
        this.annotationType = AnnotationType.RECTANGLE;
        this.entityProperties = options.entityProperties ?? {};
        this.handleProperties = options.handleProperties ?? {};
        this.drawAsLine = options.drawAsLine ?? false
    }

    appendCoordinate(coordinate: Coordinate): void {
        if (this.points.length < 2) {
            this.points.push(coordinate);
        } else {
            this.points[1] = coordinate;
        }
    }

    draw(): void {
        let entity: AnnotationEntity | null = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            const bbox = Coordinate.getMinMaxBbox(this.points);
            const positions = [
                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMax),
                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMax),
                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMin),
                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
            ]
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: {
                        positions,
                        width: 2,
                        ...this.entityProperties as Cesium.PolylineGraphics.ConstructorOptions
                    }
                }) as AnnotationEntity
            } else if (this.points.length === 2) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polygon: {
                        hierarchy: positions,
                        ...this.entityProperties as Cesium.PolygonGraphics.ConstructorOptions
                    }
                }) as AnnotationEntity
            }
        } else if (!this.entity) {
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: {
                        positions: new Cesium.CallbackProperty(() => {
                            const bbox = Coordinate.getMinMaxBbox(this.points);
                            return [
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMin),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                            ]
                        }, false),
                        width: 2,
                        ...this.entityProperties as Cesium.PolylineGraphics.ConstructorOptions
                    }
                }) as AnnotationEntity
            } else if (this.points.length === 2) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polygon: {
                        hierarchy: new Cesium.CallbackProperty(() => {
                            const bbox = Coordinate.getMinMaxBbox(this.points);

                            return new Cesium.PolygonHierarchy([
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMin),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMin, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMax),
                                Cesium.Cartesian3.fromDegrees(bbox.lngMax, bbox.latMin),
                            ]);
                        }, false),
                        ...this.entityProperties as Cesium.PolygonGraphics.ConstructorOptions
                    }
                }) as AnnotationEntity
            }
        }

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

