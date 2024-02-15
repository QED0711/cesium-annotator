import * as Cesium from 'cesium';
import {nanoid} from 'nanoid';

/* INITIALIZATION OPTIONS */
type CoordinateInit = {
    lng: number,
    lat: number,
    alt?: number
}

type AnnotationBaseInit = {
    viewerInterface: ViewerInterface,
    id?: string,
    isStatic?: boolean,
}

type RegistryInit = {
    id: string,
    viewer: Cesium.Viewer,
}

export enum DistanceUnit {
    METERS = "meters",
    KILOMETERS = "kilometers",
    FEET = "feet",
    MILES = "miles"
}


export enum AnnotationType {
    BASE = "base",
    POINT = "point",
    POLYLINE = "polyline",
    POLYGON = "polygon",
    RECTANGLE = "rectangle",
    RING = "ring",
}

/* 
    POINT CLASS
*/
export class Coordinate {
    lng: number;
    lat: number;
    alt?: number;

    constructor(init: CoordinateInit) {
        this.lng = init.lng;
        this.lat = init.lat;  
        this.alt = init.alt ?? 0.0;
    }

    static fromDegrees(lng: number, lat: number, alt?: number): Coordinate {
        return new this({lng, lat, alt});
    }

    toCartesian3(): Cesium.Cartesian3{
        return Cesium.Cartesian3.fromDegrees(this.lng, this.lat, this.alt);
    }    

    distanceTo(point2: Coordinate, unit?: DistanceUnit): number {
        unit ??= DistanceUnit.METERS;
        const p1Cartesian: Cesium.Cartesian3 = this.toCartesian3();
        const p2Cartesian: Cesium.Cartesian3 = point2.toCartesian3();
        
        const distance =  Cesium.Cartesian3.distance(p1Cartesian, p2Cartesian);

        switch(unit) {
            case DistanceUnit.METERS:
                return distance;
            case DistanceUnit.KILOMETERS:
                return distance / 1000;
            case DistanceUnit.FEET:
                return distance * 3.281;
            case DistanceUnit.MILES:
                return distance / 1609;
        }
    }


}


/* 
    ANNOTATION BASE CLASS
*/
export class Annotation {
    private viewerInterface: ViewerInterface;
    id: string;    
    points: Coordinate[];
    private history: Coordinate[][];
    isStatic: boolean;
    entity: Cesium.Entity | null;
    handles: Cesium.Entity[];
    isActive: boolean;
    
    constructor(init: AnnotationBaseInit){
        this.viewerInterface = init.viewerInterface;
        this.id = init.id ?? nanoid();
        this.points = [];
        this.history = [];
        this.isStatic = init.isStatic ?? true;

        this.entity = null;
        this.handles = [];

        this.isActive = false;
    }

    get current() {
        return this.points;
    }

    activate(){
        this.isActive = true;
    }

    delete() {
        if(!!this.entity) {
            this.viewerInterface.viewer.entities.remove(this.entity)
        }
    }
}


/******************************************************************************
 * ***************************** VIEWER INTERFACE ***************************** 
 *****************************************************************************/
export class ViewerInterface {

    viewer: Cesium.Viewer;
    events: { [key: string]: Function[] };
    private canvas: HTMLCanvasElement;
    private cursorX?: number
    private cursorY?: number
    private pointerMoveHandler?: ((e: PointerEvent) => void) | null;

    constructor(viewer: Cesium.Viewer) {
        this.viewer = viewer;
        this.canvas = viewer.canvas;
        this.events = {};

        this.init();
    }

    init() {
        this.pointerMoveHandler = (e: PointerEvent) => {
            this.cursorX = e.offsetX;
            this.cursorY = e.offsetY;
        }

        this.canvas.addEventListener("pointermove", this.pointerMoveHandler)
    }

    removeHandlers() {
        if(!!this.pointerMoveHandler) {
            this.canvas.removeEventListener("pointermove", this.pointerMoveHandler);
        }
    }

    addEventListener(eventName: string, callback: Function) {
        this.events[eventName] = eventName in this.events
            ? [...this.events[eventName], callback]
            : [callback]
    }

    removeEventListener(eventName: string, callback: Function) {
        if (eventName in this.events) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        }
    }

    getCoordinateAtPixel(x?: number | null, y?: number): Coordinate | null{
        x ??= this.cursorX;
        y ??= this.cursorY;
        const scene = this.viewer.scene;
        
        const pixelPosition = new Cesium.Cartesian2(x, y);

        let cartesianPosition: Cesium.Cartesian3 | undefined = scene.pickPosition(pixelPosition);

        if(!cartesianPosition) {
            const ray = this.viewer.camera.getPickRay(pixelPosition);
            if(!ray) return null;
            cartesianPosition = scene.globe.pick(ray, scene);
        }

        if(!cartesianPosition) return null

        const cartographicPosition = Cesium.Cartographic.fromCartesian(cartesianPosition);
        
        const lng = Cesium.Math.toDegrees(cartographicPosition.longitude);
        const lat = Cesium.Math.toDegrees(cartographicPosition.latitude);
        const alt = Cesium.Math.toDegrees(cartographicPosition.height);

        return new Coordinate({lat, lng, alt});

    }

    lock() {
        this.viewer.scene.screenSpaceCameraController.enableRotate = false;
        this.viewer.scene.screenSpaceCameraController.enableTilt = false;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
    }
    
    unlock() {
        this.viewer.scene.screenSpaceCameraController.enableRotate = true;
        this.viewer.scene.screenSpaceCameraController.enableTilt = true;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
    }
}

/******************************************************************************
 * ***************************** REGISTRY ***************************** 
 *****************************************************************************/
export class Registry {
    id: string;
    annotations: Annotation[];
    viewer: Cesium.Viewer;
    viewerInterface: ViewerInterface

    constructor(init: RegistryInit) {
        this.id = init.id;
        this.viewer = init.viewer;
        this.annotations = [];

        this.viewerInterface = new ViewerInterface(this.viewer);
    }

    getAnnotationByID(id: string): Annotation | null | undefined {
        return this.annotations.find(annotation => annotation.id === id);
    }

    deleteByID(id: string) {
        this.annotations
            .find(annotation => annotation.id === id)
            ?.delete()
    }

    add(subType: AnnotationType, id?: string): Annotation {
        let annotation;
        switch(subType) {
            case AnnotationType.BASE:
                annotation = new Annotation({viewerInterface: this.viewerInterface, id});
                break;
            default:
                annotation = new Annotation({viewerInterface: this.viewerInterface, id});
        }
        return annotation;
    }
}