import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationEntity, AnnotationType, DistanceUnit } from "../../utils/types";
import { Annotation } from "../core";
import { Coordinate } from '../coordinate';
import { Registry } from '../registry';

export type RingInitOptions = AnnotationBaseInit & {
    entityProperties?: Cesium.PolylineGraphics.ConstructorOptions | Cesium.EllipseGraphics.ConstructorOptions,
    handleProperties?: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions,
    drawAsLine?: boolean,
    nPoints?: number,
}

export default class Ring extends Annotation {

    entityProperties: Cesium.PolylineGraphics.ConstructorOptions | Cesium.EllipseGraphics.ConstructorOptions;
    handleProperties: Cesium.PointGraphics.ConstructorOptions | Cesium.BillboardGraphics.ConstructorOptions;
    drawAsLine: boolean
    nPoints: number
    private radius: number | null;

    constructor(registry: Registry, options: RingInitOptions) {
        super(registry, options);
        this.annotationType = AnnotationType.RING;
        this.entityProperties = options.entityProperties ?? {};
        this.handleProperties = options.handleProperties ?? {};
        this.drawAsLine = options.drawAsLine ?? false;
        this.nPoints = options.nPoints ?? 360
        this.radius = null;
    }

    // Note: This implementation is needed to set the radius property any time a handle is dragged
    handlePointerMove(e: PointerEvent) {
        if (this.pointerDownDetected) {
            // update the specified point as it is dragged
            if (this.handleFound !== null) {
                this.removeHandleByCoordinateID(this.handleFound.handleID);
                const coordinate = this.viewerInterface.getCoordinateAtPixel(e.offsetX, e.offsetY);
                // if (coordinate) this.points[this.handleFound.index] = coordinate;
                if (coordinate) this.points.set(this.handleFound.index, coordinate);
                this.radius = (this.points.at(0) as Coordinate).distanceTo(this.points.at(1) as Coordinate);
            }
            this.dragDetected = true;
        }
    }

    appendCoordinate(coordinate: Coordinate): void {
        if (this.points.length < 2) {
            this.points.push(coordinate);
        } else {
            this.points.set(1, coordinate)
        }
        if(this.points.length === 2) {
            this.radius = (this.points.at(0) as Coordinate).distanceTo(this.points.at(1) as Coordinate);
        }
    }

    draw(): void {
        if(this.points.length < 2 || this.radius === null) return
        let entity: AnnotationEntity | null = null;
        if (!this.liveUpdate) {
            this.removeEntity();
            if (this.drawAsLine) {
                const headingFactor = 360 / this.nPoints;
                const perimeterCoords: Cesium.Cartesian3[] = [];
                for (let i = 0; i < this.nPoints; i++) {
                    const heading = headingFactor * i;
                    perimeterCoords.push((this.points.at(0) as Coordinate).atHeadingDistance(heading, this.radius).cartesian3)
                }
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: {
                        positions: [...perimeterCoords, perimeterCoords[0]],
                        width: 2,
                        ...this.entityProperties as Cesium.PolylineGraphics.ConstructorOptions
                    }
                }) as AnnotationEntity;
            } else {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    position: this.points.at(0)?.cartesian3,
                    ellipse: {
                        semiMajorAxis: this.radius,
                        semiMinorAxis: this.radius,
                        ...this.entityProperties as Cesium.EllipseGraphics.ConstructorOptions
                    }
                }) as AnnotationEntity;
            }
        } else if (!this.entity) {
            if (this.drawAsLine) {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    polyline: {
                        positions: new Cesium.CallbackProperty(() => {
                            const headingFactor = 360 / this.nPoints;
                            const perimeterCoords: Cesium.Cartesian3[] = [];
                            for (let i = 0; i < this.nPoints; i++) {
                                const heading = headingFactor * i;
                                perimeterCoords.push((this.points.at(0) as Coordinate).atHeadingDistance(heading, this.radius as number).cartesian3)
                            }
                            perimeterCoords.push(perimeterCoords[0]) // close the perimerter
                            return perimeterCoords;
                        }, false),
                        width: 2,
                        ...this.entityProperties as Cesium.PolylineGraphics.ConstructorOptions
                    }
                }) as AnnotationEntity
            } else {
                entity = this.viewerInterface.viewer.entities.add({
                    id: this.id,
                    position: new Cesium.CallbackProperty(() => {
                        return this.points.at(0)?.cartesian3;
                    }, false) as unknown as Cesium.PositionProperty,
                    ellipse: {
                        semiMajorAxis: new Cesium.CallbackProperty(() => {
                            return this.radius
                        }, false),
                        semiMinorAxis: new Cesium.CallbackProperty(() => {
                            return this.radius
                        }, false),
                        ...this.entityProperties as Cesium.EllipseGraphics.ConstructorOptions
                    }
                }) as AnnotationEntity;
            }
        }

        if (entity) {
            entity._annotation = this;
            this.entity = entity;
        }
        this.emit("update", { annotation: this });
    }


    syncHandles(): void {
        super.syncHandles();
    }

    getArea(): number | null {
        if(this.radius !== null) {
            return Math.PI * this.radius ** 2
        }
        return null;
    }

    // OVERRIDES
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void {}

}