import * as Cesium from 'cesium';
import { AnnotationType } from "../../utils/types";
import { Annotation } from "../core";
export default class PointAnnotation extends Annotation {
    constructor(registry, options) {
        super(registry, options);
        this.annotationType = AnnotationType.POINT;
    }
    appendCoordinate(coordinate) {
        this.history.push(this.points);
        this.points = [coordinate];
    }
    draw() {
        console.log("POINT DRAW", this.points);
        if (!this.entity) {
            const entity = this.viewerInterface.viewer.entities.add({
                id: this.id,
                position: new Cesium.CallbackProperty(() => {
                    const currentCoord = this.points[0];
                    return Cesium.Cartesian3.fromDegrees(currentCoord.lng, currentCoord.lat); // TODO: figure out if alt should be included
                }, false),
                point: {
                    pixelSize: 25,
                }
            });
            this.entity = entity;
        }
    }
}
//# sourceMappingURL=point.js.map