import * as Cesium from 'cesium';
import { AnnotationBaseInit, AnnotationType } from "../../utils/types";
import { Annotation, Coordinate } from "../core";
import { Registry } from "../registry";

export type PointInitOptions = AnnotationBaseInit & {

}

export default class PointAnnotation extends Annotation {

    constructor(registry: Registry, options: PointInitOptions){
        super(registry, options);
        this.annotationType = AnnotationType.POINT;
    }

    appendCoordinate(coordinate: Coordinate) {
        this.history.push(this.points);
        this.points = [coordinate];
    }

    draw(){
        console.log("POINT DRAW", this.points);
        if(!this.entity) {
            const entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                position: new Cesium.CallbackProperty(() => {
                    const currentCoord = this.points[0]
                    return Cesium.Cartesian3.fromDegrees(currentCoord.lng, currentCoord.lat); // TODO: figure out if alt should be included
                }, false) as unknown as Cesium.PositionProperty,
                point: {
                    pixelSize: 25,
                }
            })
            this.entity = entity;
        }
    }


}