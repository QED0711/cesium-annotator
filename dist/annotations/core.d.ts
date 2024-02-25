import { AnnotationBaseInit, AnnotationType, AnnotationEntity, HandleFoundRecord, HandleType, HandleEntity, FlyToOptions } from '../utils/types';
import { AnnotationGroup, Registry } from './registry';
import { Coordinate, CoordinateCollection } from './coordinate';
import { ViewerInterface } from './viewerInterface';
export declare class Annotation {
    registry: Registry;
    protected viewerInterface: ViewerInterface;
    protected annotationType: AnnotationType;
    id: string;
    points: CoordinateCollection;
    groups: Set<AnnotationGroup>;
    liveUpdate: boolean;
    userInteractive: boolean;
    entity: AnnotationEntity | HandleEntity | null;
    handles: {
        [coordinateID: string]: HandleEntity;
    };
    handleType: HandleType;
    isActive: boolean;
    attributes: {
        [key: string]: any;
    } | null;
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
    executeCallback(func: (annotation: Annotation) => {}): void;
    activate(): void;
    deactivate(): void;
    delete(): void;
    joinGroup(group: AnnotationGroup): void;
    leaveGroup(group: AnnotationGroup): void;
    leaveAllGroups(): void;
    removeEntity(): void;
    removeHandleByCoordinateID(id: string): void;
    show(): void;
    hide(): void;
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
    flyTo(options?: FlyToOptions): void;
    toGeoJson(): {
        [key: string]: any;
    } | null;
    toWkt(): string | null;
    appendCoordinate(coordinate: Coordinate): void;
    draw(): void;
}
