import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType, MidPointHandleEntity, EventType, GeoJsonFeatureCollection, HandleType, DrawOptions } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';


export type PolygonInitOptions = AnnotationBaseInit & {
    polygonProperties?: Cesium.PolygonGraphics.ConstructorOptions | Cesium.PolylineGraphics.ConstructorOptions,
    entityProperties?: Cesium.Entity.ConstructorOptions,
    drawAsLine?: boolean
    midpointHandles?: boolean,
    midpointHandleType?: HandleType,
    midpointHandleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions
}

export class PolygonAnnotation extends Annotation {

    drawAsLine: boolean;
    polygonProperties: Cesium.PolygonGraphics.ConstructorOptions | Cesium.PolylineGraphics.ConstructorOptions;
    entityProperties: Cesium.Entity.ConstructorOptions;
    midpointHandles: boolean;
    midpointHandleType: HandleType;
    midpointHandleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions
    private mpHandles: Cesium.Entity[];

    constructor(registry: Registry, options: PolygonInitOptions) {
        super(registry, options);

        this.annotationType = AnnotationType.POLYGON;
        this.polygonProperties = options.polygonProperties ?? {};
        this.entityProperties = options.entityProperties ?? {};

        this.drawAsLine = options.drawAsLine ?? false;

        this.midpointHandles = options.midpointHandles ?? true;
        this.midpointHandleType = options.midpointHandleType ?? HandleType.POINT,
        this.midpointHandleProperties = options.midpointHandleProperties ?? {};
        this.mpHandles = [];
    }

    appendCoordinate(coordinate: Coordinate): void {
        this.points.push(coordinate);
        this.emit(EventType.APPEND, { annotation: this });
    }

    draw(options?: DrawOptions): void {
        options = options || {};
        let entity: AnnotationEntity | null = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: {
                        positions: [...this.points.coordinates.map(c => c.cartesian3), (this.points.at(0) as Coordinate).cartesian3],
                        width: 2,
                        ...this.polygonProperties as Cesium.PolylineGraphics.ConstructorOptions
                    },
                    ...this.entityProperties
                }) as AnnotationEntity;
            } else {
                if (this.points.length < 3) return;
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polygon: {
                        hierarchy: this.points.toCartesian3Array(),
                        ...this.polygonProperties as Cesium.PolygonGraphics.ConstructorOptions,
                    },
                    ...this.entityProperties
                }) as AnnotationEntity;
            }
        } else if (!this.entity || options.forceLiveRedraw) {
            this.removeEntity();
            if (this.drawAsLine) { // POLYLINE
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: {
                        positions: new Cesium.CallbackProperty(() => {
                            return [...this.points.coordinates.map(c => c.cartesian3), (this.points.at(0) as Coordinate).cartesian3]
                        }, false),
                        width: 2,
                        ...this.polygonProperties as Cesium.PolylineGraphics.ConstructorOptions
                    },
                    ...this.entityProperties
                }) as AnnotationEntity;
            } else { // POLYGON
                if (this.points.length < 3) return;
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polygon: {
                        hierarchy: new Cesium.CallbackProperty(() => {
                            const positions = this.points.toCartesian3Array();
                            return new Cesium.PolygonHierarchy(positions);
                        }, false),
                        ...this.polygonProperties as Cesium.PolygonGraphics.ConstructorOptions
                    },
                    ...this.entityProperties
                }) as AnnotationEntity;
            }
        }

        if (entity) {
            entity._canActivate = true;
            entity._annotation = this;
            this.entity = entity;
        }
        this.emit(EventType.UPDATE, { annotation: this });
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

        if(!this.midpointHandles) return;

        for(let mph of this.mpHandles) {
            this.viewerInterface.viewer.entities.remove(mph);
        }
        this.mpHandles = [];
        if (this.points.length >= 3) {
            let point: Cesium.PointGraphics.ConstructorOptions | undefined;
            let billboard: Cesium.BillboardGraphics.ConstructorOptions | undefined;
            if(this.midpointHandleType === HandleType.POINT) {
                point = {pixelSize: 5, ...this.midpointHandleProperties} as Cesium.PointGraphics.ConstructorOptions;
            } else if (this.midpointHandleType === HandleType.BILLBOARD) {
                billboard = this.midpointHandleProperties as Cesium.BillboardGraphics.ConstructorOptions;
            }
            for (let i = 0; i < this.points.length; i++) {
                const pnt = this.points.at(i);
                if(!pnt) continue;
                const nextPoint = i === this.points.length - 1 ? this.points.at(0) : this.points.at(i+1);
                const midPoint = pnt.segmentDistance(nextPoint as Coordinate, 2)[0] as Coordinate;

                const mpHandle = this.viewerInterface.viewer.entities.add({
                    position: midPoint.cartesian3,
                    point,
                    billboard
                }) as MidPointHandleEntity;

                mpHandle._isMidpointHandle = true;
                mpHandle._annotation = this;
                mpHandle._coordinate = midPoint;
                mpHandle._idxBookends = [i, i + 1];
                this.mpHandles.push(mpHandle)
            }
        }
    }

    hideHandles(): void {
        super.hideHandles();
        for (let handle of Object.values(this.mpHandles)) {
            handle.show = false;
        }
    }

    showHandles(): void {
        super.showHandles();
        for (let handle of Object.values(this.mpHandles)) {
            handle.show = true;
        }
    }

    removeHandles(): void {
        super.removeHandles();
        for (let mpHandle of this.mpHandles) {
            this.viewerInterface.viewer.entities.remove(mpHandle);
        }
        this.mpHandles = [];
    }

    toGeoJson(): GeoJsonFeatureCollection | null {
        const geoJson = super.toGeoJson();
        if(geoJson) {
            const properties = geoJson.features[0].properties;
            properties.initOptions = {
                polygonProperties: this.polygonProperties,
                entityProperties: this.entityProperties,
                drawAsLine: this.drawAsLine,
                midPointMarkers: this.midpointHandles,
                ...properties.initOptions,
            }
            return geoJson;
        }
        return null
    }

}