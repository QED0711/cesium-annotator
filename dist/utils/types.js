// ENUMS
export var DistanceUnit;
(function (DistanceUnit) {
    DistanceUnit["METERS"] = "meters";
    DistanceUnit["KILOMETERS"] = "kilometers";
    DistanceUnit["FEET"] = "feet";
    DistanceUnit["MILES"] = "miles";
})(DistanceUnit || (DistanceUnit = {}));
export var AnnotationType;
(function (AnnotationType) {
    AnnotationType["BASE"] = "base";
    AnnotationType["POINT"] = "point";
    AnnotationType["POLYLINE"] = "polyline";
    AnnotationType["POLYGON"] = "polygon";
    AnnotationType["RECTANGLE"] = "rectangle";
    AnnotationType["RING"] = "ring";
})(AnnotationType || (AnnotationType = {}));
export var HandleType;
(function (HandleType) {
    HandleType[HandleType["POINT"] = 0] = "POINT";
    HandleType[HandleType["BILLBOARD"] = 1] = "BILLBOARD";
})(HandleType || (HandleType = {}));
export var AltQueryType;
(function (AltQueryType) {
    AltQueryType["NONE"] = "none";
    AltQueryType["DEFAULT"] = "default";
    AltQueryType["TERRAIN"] = "terrain";
})(AltQueryType || (AltQueryType = {}));
// EVENTS 
export var EventType;
(function (EventType) {
    EventType["UPDATE"] = "update";
    EventType["ACTIVATE"] = "activate";
    EventType["APPEND"] = "append";
    EventType["DEACTIVATE"] = "deactivate";
    EventType["REMOVE_ENTITY"] = "removeEntity";
    EventType["UNDO"] = "undo";
    EventType["REDO"] = "redo";
    EventType["SHOW"] = "show";
    EventType["HIDE"] = "hide";
    EventType["PRE_DELETE"] = "pre_delete";
    EventType["DELETE"] = "delete";
    EventType["ATTRIBUTE"] = "attribute_update";
    EventType["PROPERTY"] = "property_update";
    EventType["ENTITY_PROPERTY"] = "entity_property_update";
})(EventType || (EventType = {}));
export var RegistryEventType;
(function (RegistryEventType) {
    RegistryEventType["ADD"] = "add";
    RegistryEventType["DELETE"] = "delete";
    RegistryEventType["UPDATE"] = "update";
})(RegistryEventType || (RegistryEventType = {}));
// CESIUM OPTIONS
export var FlyToType;
(function (FlyToType) {
    FlyToType["ENTITY"] = "entity";
    FlyToType["GEOSPATIAL_MEAN"] = "mean";
    FlyToType["BBOX"] = "bbox";
    FlyToType["FIRST"] = "first";
    FlyToType["LAST"] = "last";
})(FlyToType || (FlyToType = {}));
export var GeoJsonType;
(function (GeoJsonType) {
    GeoJsonType["POINT"] = "Point";
    GeoJsonType["POLYLINE"] = "LineString";
    GeoJsonType["POLYGON"] = "Polygon";
})(GeoJsonType || (GeoJsonType = {}));
//# sourceMappingURL=types.js.map