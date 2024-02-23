import { AnnotationBaseInit, AnnotationType, AnnotationEntity, HandleFoundRecord, HandleType } from '../utils/types';
import { Registry } from './registry';
import { Coordinate, CoordinateCollection } from './coordinate';
import { ViewerInterface } from './viewerInterface';
export declare class Annotation {
    protected registry: Registry;
    protected viewerInterface: ViewerInterface;
    protected annotationType: AnnotationType;
    id: string;
    points: CoordinateCollection;
    liveUpdate: boolean;
    userInteractive: boolean;
    entity: AnnotationEntity | null;
    handles: {
        [coordinateID: string]: AnnotationEntity;
    };
    handleType: HandleType;
    isActive: boolean;
    protected undoHistory: CoordinateCollection[];
    protected redoHistory: CoordinateCollection[];
    protected handleFound: HandleFoundRecord | null;
    protected bypassPointerUp: boolean;
    protected pointerDownDetected: boolean;
    protected dragDetected: boolean;
    protected preDragHistoricalRecord: CoordinateCollection | null;
    protected events: {
        [eventName: string]: ((payload: {
            [key: string]: any;
        }) => void)[];
    };
    constructor(registry: Registry, options: AnnotationBaseInit);
    get current(): CoordinateCollection;
    on(eventName: string, callback: (payload: {
        [key: string]: any;
    }) => void): void;
    emit(eventName: string, payload: {
        [key: string]: any;
    }): void;
    activate(): void;
    deactivate(): void;
    delete(): void;
    removeEntity(): void;
    removeHandleByCoordinateID(id: string): void;
    showHandles(): void;
    hideHandles(): void;
    removePointAtIndex(index: number): void;
    handlePointerDown(e: PointerEvent): void;
    handlePointerMove(e: PointerEvent): void;
    handlePointerUp(e: PointerEvent): void;
    undo(): void;
    redo(): void;
    recordPointsToUndoHistory(): void;
    manualAppendToUndoHistory(points: CoordinateCollection): void;
    clearRedoHistory(): void;
    updateHandleIdxs(): void;
    removeStaleHandles(): void;
    syncHandles(): void;
    insertCoordinateAtIndex(coordinate: Coordinate, idx: number): void;
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
}
