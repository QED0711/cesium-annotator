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
export var GeoJsonType;
(function (GeoJsonType) {
    GeoJsonType["POINT"] = "Point";
    GeoJsonType["POLYLINE"] = "LineString";
    GeoJsonType["POLYGON"] = "Polygon";
})(GeoJsonType || (GeoJsonType = {}));
//# sourceMappingURL=types.js.map