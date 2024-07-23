(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
typeof define === 'function' && define.amd ? define(factory) :
(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.MapboxDraw = factory());
})(this, (function () { 'use strict';

var ModeHandler = function(mode, DrawContext) {

  var handlers = {
    drag: [],
    click: [],
    mousemove: [],
    mousedown: [],
    mouseup: [],
    mouseout: [],
    keydown: [],
    keyup: [],
    touchstart: [],
    touchmove: [],
    touchend: [],
    tap: []
  };

  var ctx = {
    on: function on(event, selector, fn) {
      if (handlers[event] === undefined) {
        throw new Error(("Invalid event type: " + event));
      }
      handlers[event].push({
        selector: selector,
        fn: fn
      });
    },
    render: function render(id) {
      DrawContext.store.featureChanged(id);
    }
  };

  var delegate = function (eventName, event) {
    var handles = handlers[eventName];
    var iHandle = handles.length;
    while (iHandle--) {
      var handle = handles[iHandle];
      if (handle.selector(event)) {
        var skipRender = handle.fn.call(ctx, event);
        if (!skipRender) {
          DrawContext.store.render();
        }
        DrawContext.ui.updateMapClasses();

        // ensure an event is only handled once
        // we do this to let modes have multiple overlapping selectors
        // and relay on order of oppertations to filter
        break;
      }
    }
  };

  mode.start.call(ctx);

  return {
    render: mode.render,
    stop: function stop() {
      if (mode.stop) { mode.stop(); }
    },
    trash: function trash() {
      if (mode.trash) {
        mode.trash();
        DrawContext.store.render();
      }
    },
    combineFeatures: function combineFeatures() {
      if (mode.combineFeatures) {
        mode.combineFeatures();
      }
    },
    uncombineFeatures: function uncombineFeatures() {
      if (mode.uncombineFeatures) {
        mode.uncombineFeatures();
      }
    },
    drag: function drag(event) {
      delegate('drag', event);
    },
    click: function click(event) {
      delegate('click', event);
    },
    mousemove: function mousemove(event) {
      delegate('mousemove', event);
    },
    mousedown: function mousedown(event) {
      delegate('mousedown', event);
    },
    mouseup: function mouseup(event) {
      delegate('mouseup', event);
    },
    mouseout: function mouseout(event) {
      delegate('mouseout', event);
    },
    keydown: function keydown(event) {
      delegate('keydown', event);
    },
    keyup: function keyup(event) {
      delegate('keyup', event);
    },
    touchstart: function touchstart(event) {
      delegate('touchstart', event);
    },
    touchmove: function touchmove(event) {
      delegate('touchmove', event);
    },
    touchend: function touchend(event) {
      delegate('touchend', event);
    },
    tap: function tap(event) {
      delegate('tap', event);
    }
  };
};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getAugmentedNamespace(n) {
  if (n.__esModule) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			if (this instanceof a) {
				var args = [null];
				args.push.apply(args, arguments);
				var Ctor = Function.bind.apply(f, args);
				return new Ctor();
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var geojsonArea = {};

var wgs84$1 = {};

wgs84$1.RADIUS = 6378137;
wgs84$1.FLATTENING = 1/298.257223563;
wgs84$1.POLAR_RADIUS = 6356752.3142;

var wgs84 = wgs84$1;

geojsonArea.geometry = geometry;
geojsonArea.ring = ringArea;

function geometry(_) {
    var area = 0, i;
    switch (_.type) {
        case 'Polygon':
            return polygonArea(_.coordinates);
        case 'MultiPolygon':
            for (i = 0; i < _.coordinates.length; i++) {
                area += polygonArea(_.coordinates[i]);
            }
            return area;
        case 'Point':
        case 'MultiPoint':
        case 'LineString':
        case 'MultiLineString':
            return 0;
        case 'GeometryCollection':
            for (i = 0; i < _.geometries.length; i++) {
                area += geometry(_.geometries[i]);
            }
            return area;
    }
}

function polygonArea(coords) {
    var area = 0;
    if (coords && coords.length > 0) {
        area += Math.abs(ringArea(coords[0]));
        for (var i = 1; i < coords.length; i++) {
            area -= Math.abs(ringArea(coords[i]));
        }
    }
    return area;
}

/**
 * Calculate the approximate area of the polygon were it projected onto
 *     the earth.  Note that this area will be positive if ring is oriented
 *     clockwise, otherwise it will be negative.
 *
 * Reference:
 * Robert. G. Chamberlain and William H. Duquette, "Some Algorithms for
 *     Polygons on a Sphere", JPL Publication 07-03, Jet Propulsion
 *     Laboratory, Pasadena, CA, June 2007 http://trs-new.jpl.nasa.gov/dspace/handle/2014/40409
 *
 * Returns:
 * {float} The approximate signed geodesic area of the polygon in square
 *     meters.
 */

function ringArea(coords) {
    var p1, p2, p3, lowerIndex, middleIndex, upperIndex, i,
    area = 0,
    coordsLength = coords.length;

    if (coordsLength > 2) {
        for (i = 0; i < coordsLength; i++) {
            if (i === coordsLength - 2) {// i = N-2
                lowerIndex = coordsLength - 2;
                middleIndex = coordsLength -1;
                upperIndex = 0;
            } else if (i === coordsLength - 1) {// i = N-1
                lowerIndex = coordsLength - 1;
                middleIndex = 0;
                upperIndex = 1;
            } else { // i = 0 to N-3
                lowerIndex = i;
                middleIndex = i+1;
                upperIndex = i+2;
            }
            p1 = coords[lowerIndex];
            p2 = coords[middleIndex];
            p3 = coords[upperIndex];
            area += ( rad(p3[0]) - rad(p1[0]) ) * Math.sin( rad(p2[1]));
        }

        area = area * wgs84.RADIUS * wgs84.RADIUS / 2;
    }

    return area;
}

function rad(_) {
    return _ * Math.PI / 180;
}

var classes = {
  CONTROL_BASE: 'mapboxgl-ctrl',
  CONTROL_PREFIX: 'mapboxgl-ctrl-',
  CONTROL_BUTTON: 'mapbox-gl-draw_ctrl-draw-btn',
  CONTROL_BUTTON_LINE: 'mapbox-gl-draw_line',
  CONTROL_BUTTON_POLYGON: 'mapbox-gl-draw_polygon',
  CONTROL_BUTTON_POINT: 'mapbox-gl-draw_point',
  CONTROL_BUTTON_TRASH: 'mapbox-gl-draw_trash',
  CONTROL_BUTTON_COMBINE_FEATURES: 'mapbox-gl-draw_combine',
  CONTROL_BUTTON_UNCOMBINE_FEATURES: 'mapbox-gl-draw_uncombine',
  CONTROL_GROUP: 'mapboxgl-ctrl-group',
  ATTRIBUTION: 'mapboxgl-ctrl-attrib',
  ACTIVE_BUTTON: 'active',
  BOX_SELECT: 'mapbox-gl-draw_boxselect'
};

var sources = {
  HOT: 'mapbox-gl-draw-hot',
  COLD: 'mapbox-gl-draw-cold'
};

var cursors = {
  ADD: 'add',
  MOVE: 'move',
  DRAG: 'drag',
  POINTER: 'pointer',
  NONE: 'none'
};

var types$1 = {
  POLYGON: 'polygon',
  LINE: 'line_string',
  POINT: 'point'
};

var geojsonTypes = {
  FEATURE: 'Feature',
  POLYGON: 'Polygon',
  LINE_STRING: 'LineString',
  POINT: 'Point',
  FEATURE_COLLECTION: 'FeatureCollection',
  MULTI_PREFIX: 'Multi',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon'
};

var modes$1 = {
  DRAW_LINE_STRING: 'draw_line_string',
  DRAW_POLYGON: 'draw_polygon',
  DRAW_POINT: 'draw_point',
  SIMPLE_SELECT: 'simple_select',
  DIRECT_SELECT: 'direct_select',
  STATIC: 'static'
};

var events$1 = {
  CREATE: 'draw.create',
  DELETE: 'draw.delete',
  UPDATE: 'draw.update',
  SELECTION_CHANGE: 'draw.selectionchange',
  MODE_CHANGE: 'draw.modechange',
  ACTIONABLE: 'draw.actionable',
  RENDER: 'draw.render',
  COMBINE_FEATURES: 'draw.combine',
  UNCOMBINE_FEATURES: 'draw.uncombine'
};

var updateActions = {
  MOVE: 'move',
  CHANGE_COORDINATES: 'change_coordinates'
};

var meta = {
  FEATURE: 'feature',
  MIDPOINT: 'midpoint',
  VERTEX: 'vertex'
};

var activeStates = {
  ACTIVE: 'true',
  INACTIVE: 'false'
};

var interactions = [
  'scrollZoom',
  'boxZoom',
  'dragRotate',
  'dragPan',
  'keyboard',
  'doubleClickZoom',
  'touchZoomRotate'
];

var LAT_MIN$1 = -90;
var LAT_RENDERED_MIN$1 = -85;
var LAT_MAX$1 = 90;
var LAT_RENDERED_MAX$1 = 85;
var LNG_MIN$1 = -270;
var LNG_MAX$1 = 270;

var Constants = /*#__PURE__*/Object.freeze({
__proto__: null,
classes: classes,
sources: sources,
cursors: cursors,
types: types$1,
geojsonTypes: geojsonTypes,
modes: modes$1,
events: events$1,
updateActions: updateActions,
meta: meta,
activeStates: activeStates,
interactions: interactions,
LAT_MIN: LAT_MIN$1,
LAT_RENDERED_MIN: LAT_RENDERED_MIN$1,
LAT_MAX: LAT_MAX$1,
LAT_RENDERED_MAX: LAT_RENDERED_MAX$1,
LNG_MIN: LNG_MIN$1,
LNG_MAX: LNG_MAX$1
});

var FEATURE_SORT_RANKS = {
  Point: 0,
  LineString: 1,
  MultiLineString: 1,
  Polygon: 2
};

function comparator(a, b) {
  var score = FEATURE_SORT_RANKS[a.geometry.type] - FEATURE_SORT_RANKS[b.geometry.type];

  if (score === 0 && a.geometry.type === geojsonTypes.POLYGON) {
    return a.area - b.area;
  }

  return score;
}

// Sort in the order above, then sort polygons by area ascending.
function sortFeatures(features) {
  return features.map(function (feature) {
    if (feature.geometry.type === geojsonTypes.POLYGON) {
      feature.area = geojsonArea.geometry({
        type: geojsonTypes.FEATURE,
        property: {},
        geometry: feature.geometry
      });
    }
    return feature;
  }).sort(comparator).map(function (feature) {
    delete feature.area;
    return feature;
  });
}

/**
 * Returns a bounding box representing the event's location.
 *
 * @param {Event} mapEvent - Mapbox GL JS map event, with a point properties.
 * @return {Array<Array<number>>} Bounding box.
 */
function mapEventToBoundingBox(mapEvent, buffer) {
  if ( buffer === void 0 ) buffer = 0;

  return [
    [mapEvent.point.x - buffer, mapEvent.point.y - buffer],
    [mapEvent.point.x + buffer, mapEvent.point.y + buffer]
  ];
}

function StringSet(items) {
  this._items = {};
  this._nums = {};
  this._length = items ? items.length : 0;
  if (!items) { return; }
  for (var i = 0, l = items.length; i < l; i++) {
    this.add(items[i]);
    if (items[i] === undefined) { continue; }
    if (typeof items[i] === 'string') { this._items[items[i]] = i; }
    else { this._nums[items[i]] = i; }

  }
}

StringSet.prototype.add = function(x) {
  if (this.has(x)) { return this; }
  this._length++;
  if (typeof x === 'string') { this._items[x] = this._length; }
  else { this._nums[x] = this._length; }
  return this;
};

StringSet.prototype.delete = function(x) {
  if (this.has(x) === false) { return this; }
  this._length--;
  delete this._items[x];
  delete this._nums[x];
  return this;
};

StringSet.prototype.has = function(x) {
  if (typeof x !== 'string' && typeof x !== 'number') { return false; }
  return this._items[x] !== undefined || this._nums[x] !== undefined;
};

StringSet.prototype.values = function() {
  var this$1$1 = this;

  var values = [];
  Object.keys(this._items).forEach(function (k) {
    values.push({ k: k, v: this$1$1._items[k] });
  });
  Object.keys(this._nums).forEach(function (k) {
    values.push({ k: JSON.parse(k), v: this$1$1._nums[k] });
  });

  return values.sort(function (a, b) { return a.v - b.v; }).map(function (a) { return a.k; });
};

StringSet.prototype.clear = function() {
  this._length = 0;
  this._items = {};
  this._nums = {};
  return this;
};

var META_TYPES = [
  meta.FEATURE,
  meta.MIDPOINT,
  meta.VERTEX
];

// Requires either event or bbox
var featuresAt = {
  click: featuresAtClick,
  touch: featuresAtTouch
};

function featuresAtClick(event, bbox, ctx) {
  return featuresAt$1(event, bbox, ctx, ctx.options.clickBuffer);
}

function featuresAtTouch(event, bbox, ctx) {
  return featuresAt$1(event, bbox, ctx, ctx.options.touchBuffer);
}

function featuresAt$1(event, bbox, ctx, buffer) {
  if (ctx.map === null) { return []; }

  var box = (event) ? mapEventToBoundingBox(event, buffer) : bbox;

  var queryParams = {};

  if (ctx.options.styles) { queryParams.layers = ctx.options.styles.map(function (s) { return s.id; }).filter(function (id) { return ctx.map.getLayer(id) != null; }).concat( (ctx.options.existingFeatureLayerIds || []) ); }

  var features = ctx.map.queryRenderedFeatures(box, queryParams)
    .filter(function (feature) { return META_TYPES.indexOf(feature.properties.meta) !== -1; });

  var featureIds = new StringSet();
  var uniqueFeatures = [];
  features.forEach(function (feature) {
    var featureId = feature.properties.id;
    if (featureIds.has(featureId)) { return; }
    featureIds.add(featureId);
    uniqueFeatures.push(feature);
  });

  return sortFeatures(uniqueFeatures);
}

function getFeatureAtAndSetCursors(event, ctx) {
  var features = featuresAt.click(event, null, ctx);
  var classes = { mouse: cursors.NONE };

  if (features[0]) {
    classes.mouse = (features[0].properties.active === activeStates.ACTIVE) ?
      cursors.MOVE : cursors.POINTER;
    classes.feature = features[0].properties.meta;
  }

  if (ctx.events.currentModeName().indexOf('draw') !== -1) {
    classes.mouse = cursors.ADD;
  }

  ctx.ui.queueMapClasses(classes);
  ctx.ui.updateMapClasses();

  return features[0];
}

function euclideanDistance(a, b) {
  var x = a.x - b.x;
  var y = a.y - b.y;
  return Math.sqrt((x * x) + (y * y));
}

var FINE_TOLERANCE = 4;
var GROSS_TOLERANCE = 12;
var INTERVAL = 500;

function isClick(start, end, options) {
  if ( options === void 0 ) options = {};

  var fineTolerance = (options.fineTolerance != null) ? options.fineTolerance : FINE_TOLERANCE;
  var grossTolerance = (options.grossTolerance != null) ? options.grossTolerance : GROSS_TOLERANCE;
  var interval = (options.interval != null) ? options.interval : INTERVAL;

  start.point = start.point || end.point;
  start.time = start.time || end.time;
  var moveDistance = euclideanDistance(start.point, end.point);

  return moveDistance < fineTolerance ||
    (moveDistance < grossTolerance && (end.time - start.time) < interval);
}

var TAP_TOLERANCE = 25;
var TAP_INTERVAL = 250;

function isTap(start, end, options) {
  if ( options === void 0 ) options = {};

  var tolerance = (options.tolerance != null) ? options.tolerance : TAP_TOLERANCE;
  var interval = (options.interval != null) ? options.interval : TAP_INTERVAL;

  start.point = start.point || end.point;
  start.time = start.time || end.time;
  var moveDistance = euclideanDistance(start.point, end.point);

  return moveDistance < tolerance && (end.time - start.time) < interval;
}

var hat$2 = {exports: {}};

var hat = hat$2.exports = function (bits, base) {
    if (!base) { base = 16; }
    if (bits === undefined) { bits = 128; }
    if (bits <= 0) { return '0'; }
    
    var digits = Math.log(Math.pow(2, bits)) / Math.log(base);
    for (var i = 2; digits === Infinity; i *= 2) {
        digits = Math.log(Math.pow(2, bits / i)) / Math.log(base) * i;
    }
    
    var rem = digits - Math.floor(digits);
    
    var res = '';
    
    for (var i = 0; i < Math.floor(digits); i++) {
        var x = Math.floor(Math.random() * base).toString(base);
        res = x + res;
    }
    
    if (rem) {
        var b = Math.pow(base, rem);
        var x = Math.floor(Math.random() * b).toString(base);
        res = x + res;
    }
    
    var parsed = parseInt(res, base);
    if (parsed !== Infinity && parsed >= Math.pow(2, bits)) {
        return hat(bits, base)
    }
    else { return res; }
};

hat.rack = function (bits, base, expandBy) {
    var fn = function (data) {
        var iters = 0;
        do {
            if (iters ++ > 10) {
                if (expandBy) { bits += expandBy; }
                else { throw new Error('too many ID collisions, use more bits') }
            }
            
            var id = hat(bits, base);
        } while (Object.hasOwnProperty.call(hats, id));
        
        hats[id] = data;
        return id;
    };
    var hats = fn.hats = {};
    
    fn.get = function (id) {
        return fn.hats[id];
    };
    
    fn.set = function (id, value) {
        fn.hats[id] = value;
        return fn;
    };
    
    fn.bits = bits || 128;
    fn.base = base || 16;
    return fn;
};

var hatExports = hat$2.exports;
var hat$1 = /*@__PURE__*/getDefaultExportFromCjs(hatExports);

var Feature = function(ctx, geojson) {
  this.ctx = ctx;
  this.properties = geojson.properties || {};
  this.coordinates = geojson.geometry.coordinates;
  this.id = geojson.id || hat$1();
  this.type = geojson.geometry.type;
};

Feature.prototype.changed = function() {
  this.ctx.store.featureChanged(this.id);
};

Feature.prototype.incomingCoords = function(coords) {
  this.setCoordinates(coords);
};

Feature.prototype.setCoordinates = function(coords) {
  this.coordinates = coords;
  this.changed();
};

Feature.prototype.getCoordinates = function() {
  return JSON.parse(JSON.stringify(this.coordinates));
};

Feature.prototype.setProperty = function(property, value) {
  this.properties[property] = value;
};

Feature.prototype.toGeoJSON = function() {
  return JSON.parse(JSON.stringify({
    id: this.id,
    type: geojsonTypes.FEATURE,
    properties: this.properties,
    geometry: {
      coordinates: this.getCoordinates(),
      type: this.type
    }
  }));
};

Feature.prototype.internal = function(mode) {
  var properties = {
    id: this.id,
    meta: meta.FEATURE,
    'meta:type': this.type,
    active: activeStates.INACTIVE,
    mode: mode
  };

  if (this.ctx.options.userProperties) {
    for (var name in this.properties) {
      properties[("user_" + name)] = this.properties[name];
    }
  }

  // Biarri: Make sure required fields for styling make it onto the display feature
  // TODO - can we do this from FOND not here?
  var fields = ["Demand", "Type", "Tier", "Size", "layerId", "CostFactor"];
  for (var i = 0, list = fields; i < list.length; i += 1) {
    var field = list[i];

    if (this.properties[field] != null) {
      properties[field] = this.properties[field];
    }
  }

  return {
    id: this.id,
    type: geojsonTypes.FEATURE,
    properties: properties,
    geometry: {
      coordinates: this.getCoordinates(),
      type: this.type
    }
  };
};

var Point$2 = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
};

Point$2.prototype = Object.create(Feature.prototype);

Point$2.prototype.isValid = function() {
  return typeof this.coordinates[0] === 'number' &&
    typeof this.coordinates[1] === 'number';
};

Point$2.prototype.updateCoordinate = function(pathOrLng, lngOrLat, lat) {
  if (arguments.length === 3) {
    this.coordinates = [lngOrLat, lat];
  } else {
    this.coordinates = [pathOrLng, lngOrLat];
  }
  this.changed();
};

Point$2.prototype.getCoordinate = function() {
  return this.getCoordinates();
};

var LineString = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
};

LineString.prototype = Object.create(Feature.prototype);

LineString.prototype.isValid = function() {
  return this.coordinates.length > 1;
};

LineString.prototype.addCoordinate = function(path, lng, lat) {
  this.changed();
  var id = parseInt(path, 10);
  this.coordinates.splice(id, 0, [lng, lat]);
};

LineString.prototype.getCoordinate = function(path) {
  var id = parseInt(path, 10);
  return JSON.parse(JSON.stringify(this.coordinates[id]));
};

LineString.prototype.removeCoordinate = function(path) {
  this.changed();
  this.coordinates.splice(parseInt(path, 10), 1);
};

LineString.prototype.updateCoordinate = function(path, lng, lat) {
  var id = parseInt(path, 10);
  this.coordinates[id] = [lng, lat];
  this.changed();
};

var Polygon = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
  this.coordinates = this.coordinates.map(function (ring) { return ring.slice(0, -1); });
};

Polygon.prototype = Object.create(Feature.prototype);

Polygon.prototype.isValid = function() {
  if (this.coordinates.length === 0) { return false; }
  return this.coordinates.every(function (ring) { return ring.length > 2; });
};

// Expects valid geoJSON polygon geometry: first and last positions must be equivalent.
Polygon.prototype.incomingCoords = function(coords) {
  this.coordinates = coords.map(function (ring) { return ring.slice(0, -1); });
  this.changed();
};

// Does NOT expect valid geoJSON polygon geometry: first and last positions should not be equivalent.
Polygon.prototype.setCoordinates = function(coords) {
  this.coordinates = coords;
  this.changed();
};

Polygon.prototype.addCoordinate = function(path, lng, lat) {
  this.changed();
  var ids = path.split('.').map(function (x) { return parseInt(x, 10); });

  var ring = this.coordinates[ids[0]];

  ring.splice(ids[1], 0, [lng, lat]);
};

Polygon.prototype.removeCoordinate = function(path) {
  this.changed();
  var ids = path.split('.').map(function (x) { return parseInt(x, 10); });
  var ring = this.coordinates[ids[0]];
  if (ring) {
    ring.splice(ids[1], 1);
    if (ring.length < 3) {
      this.coordinates.splice(ids[0], 1);
    }
  }
};

Polygon.prototype.getCoordinate = function(path) {
  var ids = path.split('.').map(function (x) { return parseInt(x, 10); });
  var ring = this.coordinates[ids[0]];
  return JSON.parse(JSON.stringify(ring[ids[1]]));
};

Polygon.prototype.getCoordinates = function() {
  return this.coordinates.map(function (coords) { return coords.concat([coords[0]]); });
};

Polygon.prototype.updateCoordinate = function(path, lng, lat) {
  this.changed();
  var parts = path.split('.');
  var ringId = parseInt(parts[0], 10);
  var coordId = parseInt(parts[1], 10);

  if (this.coordinates[ringId] === undefined) {
    this.coordinates[ringId] = [];
  }

  this.coordinates[ringId][coordId] = [lng, lat];
};

var models = {
  MultiPoint: Point$2,
  MultiLineString: LineString,
  MultiPolygon: Polygon
};

var takeAction = function (features, action, path, lng, lat) {
  var parts = path.split('.');
  var idx = parseInt(parts[0], 10);
  var tail = (!parts[1]) ? null : parts.slice(1).join('.');
  return features[idx][action](tail, lng, lat);
};

var MultiFeature = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);

  delete this.coordinates;
  this.model = models[geojson.geometry.type];
  if (this.model === undefined) { throw new TypeError(((geojson.geometry.type) + " is not a valid type")); }
  this.features = this._coordinatesToFeatures(geojson.geometry.coordinates);
};

MultiFeature.prototype = Object.create(Feature.prototype);

MultiFeature.prototype._coordinatesToFeatures = function(coordinates) {
  var this$1$1 = this;

  var Model = this.model.bind(this);
  return coordinates.map(function (coords) { return new Model(this$1$1.ctx, {
    id: hat$1(),
    type: geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      coordinates: coords,
      type: this$1$1.type.replace('Multi', '')
    }
  }); });
};

MultiFeature.prototype.isValid = function() {
  return this.features.every(function (f) { return f.isValid(); });
};

MultiFeature.prototype.setCoordinates = function(coords) {
  this.features = this._coordinatesToFeatures(coords);
  this.changed();
};

MultiFeature.prototype.getCoordinate = function(path) {
  return takeAction(this.features, 'getCoordinate', path);
};

MultiFeature.prototype.getCoordinates = function() {
  return JSON.parse(JSON.stringify(this.features.map(function (f) {
    if (f.type === geojsonTypes.POLYGON) { return f.getCoordinates(); }
    return f.coordinates;
  })));
};

MultiFeature.prototype.updateCoordinate = function(path, lng, lat) {
  takeAction(this.features, 'updateCoordinate', path, lng, lat);
  this.changed();
};

MultiFeature.prototype.addCoordinate = function(path, lng, lat) {
  takeAction(this.features, 'addCoordinate', path, lng, lat);
  this.changed();
};

MultiFeature.prototype.removeCoordinate = function(path) {
  takeAction(this.features, 'removeCoordinate', path);
  this.changed();
};

MultiFeature.prototype.getFeatures = function() {
  return this.features;
};

function ModeInterface(ctx) {
  this.map = ctx.map;
  this.drawConfig = JSON.parse(JSON.stringify(ctx.options || {}));
  this._ctx = ctx;
}

/**
 * Sets Draw's interal selected state
 * @name this.setSelected
 * @param {DrawFeature[]} - whats selected as a [DrawFeature](https://github.com/mapbox/mapbox-gl-draw/blob/main/src/feature_types/feature.js)
 */
ModeInterface.prototype.setSelected = function(features) {
  return this._ctx.store.setSelected(features);
};

/**
 * Sets Draw's internal selected coordinate state
 * @name this.setSelectedCoordinates
 * @param {Object[]} coords - a array of {coord_path: 'string', feature_id: 'string'}
 */
ModeInterface.prototype.setSelectedCoordinates = function(coords) {
  var this$1$1 = this;

  this._ctx.store.setSelectedCoordinates(coords);
  coords.reduce(function (m, c) {
    if (m[c.feature_id] === undefined) {
      m[c.feature_id] = true;
      this$1$1._ctx.store.get(c.feature_id).changed();
    }
    return m;
  }, {});
};

/**
 * Get all selected features as a [DrawFeature](https://github.com/mapbox/mapbox-gl-draw/blob/main/src/feature_types/feature.js)
 * @name this.getSelected
 * @returns {DrawFeature[]}
 */
ModeInterface.prototype.getSelected = function() {
  return this._ctx.store.getSelected();
};

/**
 * Get the ids of all currently selected features
 * @name this.getSelectedIds
 * @returns {String[]}
 */
ModeInterface.prototype.getSelectedIds = function() {
  return this._ctx.store.getSelectedIds();
};

/**
 * Check if a feature is selected
 * @name this.isSelected
 * @param {String} id - a feature id
 * @returns {Boolean}
 */
ModeInterface.prototype.isSelected = function(id) {
  return this._ctx.store.isSelected(id);
};

/**
 * Get a [DrawFeature](https://github.com/mapbox/mapbox-gl-draw/blob/main/src/feature_types/feature.js) by its id
 * @name this.getFeature
 * @param {String} id - a feature id
 * @returns {DrawFeature}
 */
ModeInterface.prototype.getFeature = function(id) {
  return this._ctx.store.get(id);
};

/**
 * Add a feature to draw's internal selected state
 * @name this.select
 * @param {String} id
 */
ModeInterface.prototype.select = function(id) {
  return this._ctx.store.select(id);
};

/**
 * Remove a feature from draw's internal selected state
 * @name this.delete
 * @param {String} id
 */
ModeInterface.prototype.deselect = function(id) {
  return this._ctx.store.deselect(id);
};

/**
 * Delete a feature from draw
 * @name this.deleteFeature
 * @param {String} id - a feature id
 */
ModeInterface.prototype.deleteFeature = function(id, opts) {
  if ( opts === void 0 ) opts = {};

  return this._ctx.store.delete(id, opts);
};

/**
 * Add a [DrawFeature](https://github.com/mapbox/mapbox-gl-draw/blob/main/src/feature_types/feature.js) to draw.
 * See `this.newFeature` for converting geojson into a DrawFeature
 * @name this.addFeature
 * @param {DrawFeature} feature - the feature to add
 */
ModeInterface.prototype.addFeature = function(feature) {
  return this._ctx.store.add(feature);
};

/**
 * Clear all selected features
 */
ModeInterface.prototype.clearSelectedFeatures = function() {
  return this._ctx.store.clearSelected();
};

/**
 * Clear all selected coordinates
 */
ModeInterface.prototype.clearSelectedCoordinates = function() {
  return this._ctx.store.clearSelectedCoordinates();
};

/**
 * Indicate if the different action are currently possible with your mode
 * See [draw.actionalbe](https://github.com/mapbox/mapbox-gl-draw/blob/main/API.md#drawactionable) for a list of possible actions. All undefined actions are set to **false** by default
 * @name this.setActionableState
 * @param {Object} actions
 */
ModeInterface.prototype.setActionableState = function(actions) {
  if ( actions === void 0 ) actions = {};

  var newSet = {
    trash: actions.trash || false,
    combineFeatures: actions.combineFeatures || false,
    uncombineFeatures: actions.uncombineFeatures || false
  };
  return this._ctx.events.actionable(newSet);
};

/**
 * Trigger a mode change
 * @name this.changeMode
 * @param {String} mode - the mode to transition into
 * @param {Object} opts - the options object to pass to the new mode
 * @param {Object} eventOpts - used to control what kind of events are emitted.
 */
ModeInterface.prototype.changeMode = function(mode, opts, eventOpts) {
  if ( opts === void 0 ) opts = {};
  if ( eventOpts === void 0 ) eventOpts = {};

  return this._ctx.events.changeMode(mode, opts, eventOpts);
};

/**
 * Update the state of draw map classes
 * @name this.updateUIClasses
 * @param {Object} opts
 */
ModeInterface.prototype.updateUIClasses = function(opts) {
  return this._ctx.ui.queueMapClasses(opts);
};

/**
 * If a name is provided it makes that button active, else if makes all buttons inactive
 * @name this.activateUIButton
 * @param {String?} name - name of the button to make active, leave as undefined to set buttons to be inactive
 */
ModeInterface.prototype.activateUIButton = function(name) {
  return this._ctx.ui.setActiveButton(name);
};

/**
 * Get the features at the location of an event object or in a bbox
 * @name this.featuresAt
 * @param {Event||NULL} event - a mapbox-gl event object
 * @param {BBOX||NULL} bbox - the area to get features from
 * @param {String} bufferType - is this `click` or `tap` event, defaults to click
 */
ModeInterface.prototype.featuresAt = function(event, bbox, bufferType) {
  if ( bufferType === void 0 ) bufferType = 'click';

  if (bufferType !== 'click' && bufferType !== 'touch') { throw new Error('invalid buffer type'); }
  return featuresAt[bufferType](event, bbox, this._ctx);
};

/**
 * Create a new [DrawFeature](https://github.com/mapbox/mapbox-gl-draw/blob/main/src/feature_types/feature.js) from geojson
 * @name this.newFeature
 * @param {GeoJSONFeature} geojson
 * @returns {DrawFeature}
 */
ModeInterface.prototype.newFeature = function(geojson) {
  var type = geojson.geometry.type;
  if (type === geojsonTypes.POINT) { return new Point$2(this._ctx, geojson); }
  if (type === geojsonTypes.LINE_STRING) { return new LineString(this._ctx, geojson); }
  if (type === geojsonTypes.POLYGON) { return new Polygon(this._ctx, geojson); }
  return new MultiFeature(this._ctx, geojson);
};

/**
 * Check is an object is an instance of a [DrawFeature](https://github.com/mapbox/mapbox-gl-draw/blob/main/src/feature_types/feature.js)
 * @name this.isInstanceOf
 * @param {String} type - `Point`, `LineString`, `Polygon`, `MultiFeature`
 * @param {Object} feature - the object that needs to be checked
 * @returns {Boolean}
 */
ModeInterface.prototype.isInstanceOf = function(type, feature) {
  if (type === geojsonTypes.POINT) { return feature instanceof Point$2; }
  if (type === geojsonTypes.LINE_STRING) { return feature instanceof LineString; }
  if (type === geojsonTypes.POLYGON) { return feature instanceof Polygon; }
  if (type === 'MultiFeature') { return feature instanceof MultiFeature; }
  throw new Error(("Unknown feature class: " + type));
};

/**
 * Force draw to rerender the feature of the provided id
 * @name this.doRender
 * @param {String} id - a feature id
 */
ModeInterface.prototype.doRender = function(id) {
  return this._ctx.store.featureChanged(id);
};

/**
 * Triggered while a mode is being transitioned into.
 * @param opts {Object} - this is the object passed via `draw.changeMode('mode', opts)`;
 * @name MODE.onSetup
 * @returns {Object} - this object will be passed to all other life cycle functions
 */
ModeInterface.prototype.onSetup = function() {};

/**
 * Triggered when a drag event is detected on the map
 * @name MODE.onDrag
 * @param state {Object} - a mutible state object created by onSetup
 * @param e {Object} - the captured event that is triggering this life cycle event
 */
ModeInterface.prototype.onDrag = function() {};

/**
 * Triggered when the mouse is clicked
 * @name MODE.onClick
 * @param state {Object} - a mutible state object created by onSetup
 * @param e {Object} - the captured event that is triggering this life cycle event
 */
ModeInterface.prototype.onClick = function() {};

/**
 * Triggered with the mouse is moved
 * @name MODE.onMouseMove
 * @param state {Object} - a mutible state object created by onSetup
 * @param e {Object} - the captured event that is triggering this life cycle event
 */
ModeInterface.prototype.onMouseMove = function() {};

/**
 * Triggered when the mouse button is pressed down
 * @name MODE.onMouseDown
 * @param state {Object} - a mutible state object created by onSetup
 * @param e {Object} - the captured event that is triggering this life cycle event
 */
ModeInterface.prototype.onMouseDown = function() {};

/**
 * Triggered when the mouse button is released
 * @name MODE.onMouseUp
 * @param state {Object} - a mutible state object created by onSetup
 * @param e {Object} - the captured event that is triggering this life cycle event
 */
ModeInterface.prototype.onMouseUp = function() {};

/**
 * Triggered when the mouse leaves the map's container
 * @name MODE.onMouseOut
 * @param state {Object} - a mutible state object created by onSetup
 * @param e {Object} - the captured event that is triggering this life cycle event
 */
ModeInterface.prototype.onMouseOut = function() {};

/**
 * Triggered when a key up event is detected
 * @name MODE.onKeyUp
 * @param state {Object} - a mutible state object created by onSetup
 * @param e {Object} - the captured event that is triggering this life cycle event
 */
ModeInterface.prototype.onKeyUp = function() {};

/**
 * Triggered when a key down event is detected
 * @name MODE.onKeyDown
 * @param state {Object} - a mutible state object created by onSetup
 * @param e {Object} - the captured event that is triggering this life cycle event
 */
ModeInterface.prototype.onKeyDown = function() {};

/**
 * Triggered when a touch event is started
 * @name MODE.onTouchStart
 * @param state {Object} - a mutible state object created by onSetup
 * @param e {Object} - the captured event that is triggering this life cycle event
 */
ModeInterface.prototype.onTouchStart = function() {};

/**
 * Triggered when one drags thier finger on a mobile device
 * @name MODE.onTouchMove
 * @param state {Object} - a mutible state object created by onSetup
 * @param e {Object} - the captured event that is triggering this life cycle event
 */
ModeInterface.prototype.onTouchMove = function() {};

/**
 * Triggered when one removes their finger from the map
 * @name MODE.onTouchEnd
 * @param state {Object} - a mutible state object created by onSetup
 * @param e {Object} - the captured event that is triggering this life cycle event
 */
ModeInterface.prototype.onTouchEnd = function() {};

/**
 * Triggered when one quicly taps the map
 * @name MODE.onTap
 * @param state {Object} - a mutible state object created by onSetup
 * @param e {Object} - the captured event that is triggering this life cycle event
 */
ModeInterface.prototype.onTap = function() {};

/**
 * Triggered when the mode is being exited, to be used for cleaning up artifacts such as invalid features
 * @name MODE.onStop
 * @param state {Object} - a mutible state object created by onSetup
 */
ModeInterface.prototype.onStop = function() {};

/**
 * Triggered when [draw.trash()](https://github.com/mapbox/mapbox-gl-draw/blob/main/API.md#trash-draw) is called.
 * @name MODE.onTrash
 * @param state {Object} - a mutible state object created by onSetup
 */
ModeInterface.prototype.onTrash = function() {};

/**
 * Triggered when [draw.combineFeatures()](https://github.com/mapbox/mapbox-gl-draw/blob/main/API.md#combinefeatures-draw) is called.
 * @name MODE.onCombineFeature
 * @param state {Object} - a mutible state object created by onSetup
 */
ModeInterface.prototype.onCombineFeature = function() {};

/**
 * Triggered when [draw.uncombineFeatures()](https://github.com/mapbox/mapbox-gl-draw/blob/main/API.md#uncombinefeatures-draw) is called.
 * @name MODE.onUncombineFeature
 * @param state {Object} - a mutible state object created by onSetup
 */
ModeInterface.prototype.onUncombineFeature = function() {};

/**
 * Triggered per feature on render to convert raw features into set of features for display on the map
 * See [styling draw](https://github.com/mapbox/mapbox-gl-draw/blob/main/API.md#styling-draw) for information about what geojson properties Draw uses as part of rendering.
 * @name MODE.toDisplayFeatures
 * @param state {Object} - a mutible state object created by onSetup
 * @param geojson {Object} - a geojson being evaulated. To render, pass to `display`.
 * @param display {Function} - all geojson objects passed to this be rendered onto the map
 */
ModeInterface.prototype.toDisplayFeatures = function() {
  throw new Error('You must overwrite toDisplayFeatures');
};

var eventMapper = {
  drag: 'onDrag',
  click: 'onClick',
  mousemove: 'onMouseMove',
  mousedown: 'onMouseDown',
  mouseup: 'onMouseUp',
  mouseout: 'onMouseOut',
  keyup: 'onKeyUp',
  keydown: 'onKeyDown',
  touchstart: 'onTouchStart',
  touchmove: 'onTouchMove',
  touchend: 'onTouchEnd',
  tap: 'onTap'
};

var eventKeys = Object.keys(eventMapper);

function objectToMode(modeObject) {
  var modeObjectKeys = Object.keys(modeObject);

  return function(ctx, startOpts) {
    if ( startOpts === void 0 ) startOpts = {};

    var state = {};

    var mode = modeObjectKeys.reduce(function (m, k) {
      m[k] = modeObject[k];
      return m;
    }, new ModeInterface(ctx));

    function wrapper(eh) {
      return function (e) { return mode[eh](state, e); };
    }

    return {
      start: function start() {
        var this$1$1 = this;

        state = mode.onSetup(startOpts); // this should set ui buttons

        // Adds event handlers for all event options
        // add sets the selector to false for all
        // handlers that are not present in the mode
        // to reduce on render calls for functions that
        // have no logic
        eventKeys.forEach(function (key) {
          var modeHandler = eventMapper[key];
          var selector = function () { return false; };
          if (modeObject[modeHandler]) {
            selector = function () { return true; };
          }
          this$1$1.on(key, selector, wrapper(modeHandler));
        });

      },
      stop: function stop() {
        mode.onStop(state);
      },
      trash: function trash() {
        mode.onTrash(state);
      },
      combineFeatures: function combineFeatures() {
        mode.onCombineFeatures(state);
      },
      uncombineFeatures: function uncombineFeatures() {
        mode.onUncombineFeatures(state);
      },
      render: function render(geojson, push) {
        mode.toDisplayFeatures(state, geojson, push);
      }
    };
  };
}

function events(ctx) {

  var modes = Object.keys(ctx.options.modes).reduce(function (m, k) {
    m[k] = objectToMode(ctx.options.modes[k]);
    return m;
  }, {});

  var mouseDownInfo = {};
  var touchStartInfo = {};
  var events = {};
  var currentModeName = null;
  var currentMode = null;

  events.drag = function(event, isDrag) {
    if (isDrag({
      point: event.point,
      time: new Date().getTime()
    })) {
      ctx.ui.queueMapClasses({ mouse: cursors.DRAG });
      currentMode.drag(event);
    } else {
      event.originalEvent.stopPropagation();
    }
  };

  events.mousedrag = function(event) {
    events.drag(event, function (endInfo) { return !isClick(mouseDownInfo, endInfo); });
  };

  events.touchdrag = function(event) {
    events.drag(event, function (endInfo) { return !isTap(touchStartInfo, endInfo); });
  };

  events.mousemove = function(event) {
    var button = event.originalEvent.buttons !== undefined ? event.originalEvent.buttons : event.originalEvent.which;
    if (button === 1) {
      return events.mousedrag(event);
    }
    var target = getFeatureAtAndSetCursors(event, ctx);
    event.featureTarget = target;
    currentMode.mousemove(event);
  };

  events.mousedown = function(event) {
    mouseDownInfo = {
      time: new Date().getTime(),
      point: event.point
    };
    var target = getFeatureAtAndSetCursors(event, ctx);
    event.featureTarget = target;
    currentMode.mousedown(event);
  };

  events.mouseup = function(event) {
    var target = getFeatureAtAndSetCursors(event, ctx);
    event.featureTarget = target;

    if (isClick(mouseDownInfo, {
      point: event.point,
      time: new Date().getTime()
    })) {
      currentMode.click(event);
    } else {
      currentMode.mouseup(event);
    }
  };

  events.mouseout = function(event) {
    currentMode.mouseout(event);
  };

  events.touchstart = function(event) {
    if (!ctx.options.touchEnabled) {
      return;
    }

    touchStartInfo = {
      time: new Date().getTime(),
      point: event.point
    };
    var target = featuresAt.touch(event, null, ctx)[0];
    event.featureTarget = target;
    currentMode.touchstart(event);
  };

  events.touchmove = function(event) {
    if (!ctx.options.touchEnabled) {
      return;
    }

    currentMode.touchmove(event);
    return events.touchdrag(event);
  };

  events.touchend = function(event) {
    // Prevent emulated mouse events because we will fully handle the touch here.
    // This does not stop the touch events from propogating to mapbox though.
    event.originalEvent.preventDefault();
    if (!ctx.options.touchEnabled) {
      return;
    }

    var target = featuresAt.touch(event, null, ctx)[0];
    event.featureTarget = target;
    if (isTap(touchStartInfo, {
      time: new Date().getTime(),
      point: event.point
    })) {
      currentMode.tap(event);
    } else {
      currentMode.touchend(event);
    }
  };

  // 8 - Backspace
  // 46 - Delete
  var isKeyModeValid = function (code) { return !(code === 8 || code === 46 || (code >= 48 && code <= 57)); };

  events.keydown = function(event) {
    var isMapElement = (event.srcElement || event.target).classList.contains('mapboxgl-canvas');
    if (!isMapElement) { return; } // we only handle events on the map

    if ((event.keyCode === 8 || event.keyCode === 46) && ctx.options.controls.trash) {
      event.preventDefault();
      currentMode.trash();
    } else if (isKeyModeValid(event.keyCode)) {
      currentMode.keydown(event);
    } else if (event.keyCode === 49 && ctx.options.controls.point) {
      changeMode(modes$1.DRAW_POINT);
    } else if (event.keyCode === 50 && ctx.options.controls.line_string) {
      changeMode(modes$1.DRAW_LINE_STRING);
    } else if (event.keyCode === 51 && ctx.options.controls.polygon) {
      changeMode(modes$1.DRAW_POLYGON);
    }
  };

  events.keyup = function(event) {
    if (isKeyModeValid(event.keyCode)) {
      currentMode.keyup(event);
    }
  };

  events.zoomend = function() {
    ctx.store.changeZoom();
  };

  events.data = function(event) {
    if (event.dataType === 'style') {
      var setup = ctx.setup;
      var map = ctx.map;
      var options = ctx.options;
      var store = ctx.store;
      var hasLayers = options.styles.some(function (style) { return map.getLayer(style.id); });
      if (!hasLayers) {
        setup.addLayers();
        store.setDirty();
        store.render();
      }
    }
  };

  function changeMode(modename, nextModeOptions, eventOptions) {
    if ( eventOptions === void 0 ) eventOptions = {};

    currentMode.stop();

    var modebuilder = modes[modename];
    if (modebuilder === undefined) {
      throw new Error((modename + " is not valid"));
    }
    currentModeName = modename;
    var mode = modebuilder(ctx, nextModeOptions);
    currentMode = ModeHandler(mode, ctx);

    if (!eventOptions.silent) {
      ctx.map.fire(events$1.MODE_CHANGE, { mode: modename});
    }

    ctx.store.setDirty();
    ctx.store.render();
  }

  var actionState = {
    trash: false,
    combineFeatures: false,
    uncombineFeatures: false
  };

  function actionable(actions) {
    var changed = false;
    Object.keys(actions).forEach(function (action) {
      if (actionState[action] === undefined) { throw new Error('Invalid action type'); }
      if (actionState[action] !== actions[action]) { changed = true; }
      actionState[action] = actions[action];
    });
    if (changed) { ctx.map.fire(events$1.ACTIONABLE, { actions: actionState }); }
  }

  var api = {
    start: function start() {
      currentModeName = ctx.options.defaultMode;
      currentMode = ModeHandler(modes[currentModeName](ctx), ctx);
    },
    changeMode: changeMode,
    actionable: actionable,
    currentModeName: function currentModeName$1() {
      return currentModeName;
    },
    currentModeRender: function currentModeRender(geojson, push) {
      return currentMode.render(geojson, push);
    },
    fire: function fire(name, event) {
      if (events[name]) {
        events[name](event);
      }
    },
    addEventListeners: function addEventListeners() {
      ctx.map.on('mousemove', events.mousemove);
      ctx.map.on('mousedown', events.mousedown);
      ctx.map.on('mouseup', events.mouseup);
      ctx.map.on('data', events.data);

      ctx.map.on('touchmove', events.touchmove);
      ctx.map.on('touchstart', events.touchstart);
      ctx.map.on('touchend', events.touchend);

      ctx.container.addEventListener('mouseout', events.mouseout);

      if (ctx.options.keybindings) {
        ctx.container.addEventListener('keydown', events.keydown);
        ctx.container.addEventListener('keyup', events.keyup);
      }
    },
    removeEventListeners: function removeEventListeners() {
      ctx.map.off('mousemove', events.mousemove);
      ctx.map.off('mousedown', events.mousedown);
      ctx.map.off('mouseup', events.mouseup);
      ctx.map.off('data', events.data);

      ctx.map.off('touchmove', events.touchmove);
      ctx.map.off('touchstart', events.touchstart);
      ctx.map.off('touchend', events.touchend);

      ctx.container.removeEventListener('mouseout', events.mouseout);

      if (ctx.options.keybindings) {
        ctx.container.removeEventListener('keydown', events.keydown);
        ctx.container.removeEventListener('keyup', events.keyup);
      }
    },
    trash: function trash(options) {
      currentMode.trash(options);
    },
    combineFeatures: function combineFeatures() {
      currentMode.combineFeatures();
    },
    uncombineFeatures: function uncombineFeatures() {
      currentMode.uncombineFeatures();
    },
    getMode: function getMode() {
      return currentModeName;
    }
  };

  /**
   * Biarri: Our own modifications here
   */
  api.getCurrentMode = function () { return currentMode; };

  return api;
}

/**
 * Derive a dense array (no `undefined`s) from a single value or array.
 *
 * @param {any} x
 * @return {Array<any>}
 */
function toDenseArray(x) {
  return [].concat(x).filter(function (y) { return y !== undefined; });
}

function render() {
  // eslint-disable-next-line no-invalid-this
  var store = this;
  var mapExists = store.ctx.map && store.ctx.map.getSource(sources.HOT) !== undefined;
  if (!mapExists) { return cleanup(); }

  var mode = store.ctx.events.currentModeName();

  store.ctx.ui.queueMapClasses({ mode: mode });

  var newHotIds = [];
  var newColdIds = [];

  if (store.isDirty) {
    newColdIds = store.getAllIds();
  } else {
    newHotIds = store.getChangedIds().filter(function (id) { return store.get(id) !== undefined; });
    newColdIds = store.sources.hot.filter(function (geojson) { return geojson.properties.id && newHotIds.indexOf(geojson.properties.id) === -1 && store.get(geojson.properties.id) !== undefined; }).map(function (geojson) { return geojson.properties.id; });
  }

  store.sources.hot = [];
  var lastColdCount = store.sources.cold.length;
  store.sources.cold = store.isDirty ? [] : store.sources.cold.filter(function (geojson) {
    var id = geojson.properties.id || geojson.properties.parent;
    return newHotIds.indexOf(id) === -1;
  });

  var coldChanged = lastColdCount !== store.sources.cold.length || newColdIds.length > 0;
  newHotIds.forEach(function (id) { return renderFeature(id, 'hot'); });
  newColdIds.forEach(function (id) { return renderFeature(id, 'cold'); });

  function renderFeature(id, source) {
    var feature = store.get(id);
    var featureInternal = feature.internal(mode);
    store.ctx.events.currentModeRender(featureInternal, function (geojson) {
      store.sources[source].push(geojson);
    });
  }

  if (coldChanged) {
    store.ctx.map.getSource(sources.COLD).setData({
      type: geojsonTypes.FEATURE_COLLECTION,
      features: store.sources.cold
    });
  }

  store.ctx.map.getSource(sources.HOT).setData({
    type: geojsonTypes.FEATURE_COLLECTION,
    features: store.sources.hot
  });

  if (store._emitSelectionChange) {
    store.ctx.map.fire(events$1.SELECTION_CHANGE, {
      features: store.getSelected().map(function (feature) { return feature.toGeoJSON(); }),
      points: store.getSelectedCoordinates().map(function (coordinate) { return ({
        type: geojsonTypes.FEATURE,
        properties: {},
        geometry: {
          type: geojsonTypes.POINT,
          coordinates: coordinate.coordinates
        }
      }); })
    });
    store._emitSelectionChange = false;
  }

  if (store._deletedFeaturesToEmit.length) {
    var geojsonToEmit = store._deletedFeaturesToEmit.map(function (feature) { return feature.toGeoJSON(); });

    store._deletedFeaturesToEmit = [];

    store.ctx.map.fire(events$1.DELETE, {
      features: geojsonToEmit
    });
  }

  cleanup();
  store.ctx.map.fire(events$1.RENDER, {});

  function cleanup() {
    store.isDirty = false;
    store.clearChangedIds();
  }
}

function Store(ctx) {
  var this$1$1 = this;

  this._features = {};
  this._featureIds = new StringSet();
  this._selectedFeatureIds = new StringSet();
  this._selectedCoordinates = [];
  this._changedFeatureIds = new StringSet();
  this._deletedFeaturesToEmit = [];
  this._emitSelectionChange = false;
  this._mapInitialConfig = {};
  this.ctx = ctx;
  this.sources = {
    hot: [],
    cold: []
  };

  // Deduplicate requests to render and tie them to animation frames.
  var renderRequest;
  this.render = function () {
    if (!renderRequest) {
      renderRequest = requestAnimationFrame(function () {
        renderRequest = null;
        render.call(this$1$1);
      });
    }
  };
  this.isDirty = false;
}


/**
 * Delays all rendering until the returned function is invoked
 * @return {Function} renderBatch
 */
Store.prototype.createRenderBatch = function() {
  var this$1$1 = this;

  var holdRender = this.render;
  var numRenders = 0;
  this.render = function() {
    numRenders++;
  };

  return function () {
    this$1$1.render = holdRender;
    if (numRenders > 0) {
      this$1$1.render();
    }
  };
};

/**
 * Sets the store's state to dirty.
 * @return {Store} this
 */
Store.prototype.setDirty = function() {
  this.isDirty = true;
  return this;
};

/**
 * Sets a feature's state to changed.
 * @param {string} featureId
 * @return {Store} this
 */
Store.prototype.featureChanged = function(featureId) {
  this._changedFeatureIds.add(featureId);
  return this;
};

/**
 * Gets the ids of all features currently in changed state.
 * @return {Store} this
 */
Store.prototype.getChangedIds = function() {
  return this._changedFeatureIds.values();
};

/**
 * Sets all features to unchanged state.
 * @return {Store} this
 */
Store.prototype.clearChangedIds = function() {
  this._changedFeatureIds.clear();
  return this;
};

/**
 * Gets the ids of all features in the store.
 * @return {Store} this
 */
Store.prototype.getAllIds = function() {
  return this._featureIds.values();
};

/**
 * Adds a feature to the store.
 * @param {Object} feature
 *
 * @return {Store} this
 */
Store.prototype.add = function(feature) {
  this.featureChanged(feature.id);
  this._features[feature.id] = feature;
  this._featureIds.add(feature.id);
  return this;
};

/**
 * Deletes a feature or array of features from the store.
 * Cleans up after the deletion by deselecting the features.
 * If changes were made, sets the state to the dirty
 * and fires an event.
 * @param {string | Array<string>} featureIds
 * @param {Object} [options]
 * @param {Object} [options.silent] - If `true`, this invocation will not fire an event.
 * @return {Store} this
 */
Store.prototype.delete = function(featureIds, options) {
  var this$1$1 = this;
  if ( options === void 0 ) options = {};

  toDenseArray(featureIds).forEach(function (id) {
    if (!this$1$1._featureIds.has(id)) { return; }
    this$1$1._featureIds.delete(id);
    this$1$1._selectedFeatureIds.delete(id);
    if (!options.silent) {
      if (this$1$1._deletedFeaturesToEmit.indexOf(this$1$1._features[id]) === -1) {
        this$1$1._deletedFeaturesToEmit.push(this$1$1._features[id]);
      }
    }
    delete this$1$1._features[id];
    this$1$1.isDirty = true;
  });
  refreshSelectedCoordinates(this, options);
  return this;
};

/**
 * Returns a feature in the store matching the specified value.
 * @return {Object | undefined} feature
 */
Store.prototype.get = function(id) {
  return this._features[id];
};

/**
 * Returns all features in the store.
 * @return {Array<Object>}
 */
Store.prototype.getAll = function() {
  var this$1$1 = this;

  return Object.keys(this._features).map(function (id) { return this$1$1._features[id]; });
};

/**
 * Adds features to the current selection.
 * @param {string | Array<string>} featureIds
 * @param {Object} [options]
 * @param {Object} [options.silent] - If `true`, this invocation will not fire an event.
 * @return {Store} this
 */
Store.prototype.select = function(featureIds, options) {
  var this$1$1 = this;
  if ( options === void 0 ) options = {};

  toDenseArray(featureIds).forEach(function (id) {
    if (this$1$1._selectedFeatureIds.has(id)) { return; }
    this$1$1._selectedFeatureIds.add(id);
    this$1$1._changedFeatureIds.add(id);
    if (!options.silent) {
      this$1$1._emitSelectionChange = true;
    }
  });
  return this;
};

/**
 * Deletes features from the current selection.
 * @param {string | Array<string>} featureIds
 * @param {Object} [options]
 * @param {Object} [options.silent] - If `true`, this invocation will not fire an event.
 * @return {Store} this
 */
Store.prototype.deselect = function(featureIds, options) {
  var this$1$1 = this;
  if ( options === void 0 ) options = {};

  toDenseArray(featureIds).forEach(function (id) {
    if (!this$1$1._selectedFeatureIds.has(id)) { return; }
    this$1$1._selectedFeatureIds.delete(id);
    this$1$1._changedFeatureIds.add(id);
    if (!options.silent) {
      this$1$1._emitSelectionChange = true;
    }
  });
  refreshSelectedCoordinates(this, options);
  return this;
};

/**
 * Clears the current selection.
 * @param {Object} [options]
 * @param {Object} [options.silent] - If `true`, this invocation will not fire an event.
 * @return {Store} this
 */
Store.prototype.clearSelected = function(options) {
  if ( options === void 0 ) options = {};

  this.deselect(this._selectedFeatureIds.values(), { silent: options.silent });
  return this;
};

/**
 * Sets the store's selection, clearing any prior values.
 * If no feature ids are passed, the store is just cleared.
 * @param {string | Array<string> | undefined} featureIds
 * @param {Object} [options]
 * @param {Object} [options.silent] - If `true`, this invocation will not fire an event.
 * @return {Store} this
 */
Store.prototype.setSelected = function(featureIds, options) {
  var this$1$1 = this;
  if ( options === void 0 ) options = {};

  featureIds = toDenseArray(featureIds);

  // Deselect any features not in the new selection
  this.deselect(this._selectedFeatureIds.values().filter(function (id) { return featureIds.indexOf(id) === -1; }), { silent: options.silent });

  // Select any features in the new selection that were not already selected
  this.select(featureIds.filter(function (id) { return !this$1$1._selectedFeatureIds.has(id); }), { silent: options.silent });

  return this;
};

/**
 * Sets the store's coordinates selection, clearing any prior values.
 * @param {Array<Array<string>>} coordinates
 * @return {Store} this
 */
Store.prototype.setSelectedCoordinates = function(coordinates) {
  this._selectedCoordinates = coordinates;
  this._emitSelectionChange = true;
  return this;
};

/**
 * Clears the current coordinates selection.
 * @param {Object} [options]
 * @return {Store} this
 */
Store.prototype.clearSelectedCoordinates = function() {
  this._selectedCoordinates = [];
  this._emitSelectionChange = true;
  return this;
};

/**
 * Returns the ids of features in the current selection.
 * @return {Array<string>} Selected feature ids.
 */
Store.prototype.getSelectedIds = function() {
  return this._selectedFeatureIds.values();
};

/**
 * Returns features in the current selection.
 * @return {Array<Object>} Selected features.
 */
Store.prototype.getSelected = function() {
  var this$1$1 = this;

  return this._selectedFeatureIds.values().map(function (id) { return this$1$1.get(id); });
};

/**
 * Returns selected coordinates in the currently selected feature.
 * @return {Array<Object>} Selected coordinates.
 */
Store.prototype.getSelectedCoordinates = function() {
  var this$1$1 = this;

  var selected = this._selectedCoordinates.map(function (coordinate) {
    var feature = this$1$1.get(coordinate.feature_id);
    return {
      coordinates: feature.getCoordinate(coordinate.coord_path)
    };
  });
  return selected;
};

/**
 * Indicates whether a feature is selected.
 * @param {string} featureId
 * @return {boolean} `true` if the feature is selected, `false` if not.
 */
Store.prototype.isSelected = function(featureId) {
  return this._selectedFeatureIds.has(featureId);
};

/**
 * Sets a property on the given feature
 * @param {string} featureId
 * @param {string} property property
 * @param {string} property value
*/
Store.prototype.setFeatureProperty = function(featureId, property, value) {
  this.get(featureId).setProperty(property, value);
  this.featureChanged(featureId);
};

function refreshSelectedCoordinates(store, options) {
  var newSelectedCoordinates = store._selectedCoordinates.filter(function (point) { return store._selectedFeatureIds.has(point.feature_id); });
  if (store._selectedCoordinates.length !== newSelectedCoordinates.length && !options.silent) {
    store._emitSelectionChange = true;
  }
  store._selectedCoordinates = newSelectedCoordinates;
}

/**
 * Stores the initial config for a map, so that we can set it again after we're done.
*/
Store.prototype.storeMapConfig = function() {
  var this$1$1 = this;

  interactions.forEach(function (interaction) {
    var interactionSet = this$1$1.ctx.map[interaction];
    if (interactionSet) {
      this$1$1._mapInitialConfig[interaction] = this$1$1.ctx.map[interaction].isEnabled();
    }
  });
};

/**
 * Restores the initial config for a map, ensuring all is well.
*/
Store.prototype.restoreMapConfig = function() {
  var this$1$1 = this;

  Object.keys(this._mapInitialConfig).forEach(function (key) {
    var value = this$1$1._mapInitialConfig[key];
    if (value) {
      this$1$1.ctx.map[key].enable();
    } else {
      this$1$1.ctx.map[key].disable();
    }
  });
};

/**
 * Returns the initial state of an interaction setting.
 * @param {string} interaction
 * @return {boolean} `true` if the interaction is enabled, `false` if not.
 * Defaults to `true`. (Todo: include defaults.)
*/
Store.prototype.getInitialConfigValue = function(interaction) {
  if (this._mapInitialConfig[interaction] !== undefined) {
    return this._mapInitialConfig[interaction];
  } else {
    // This needs to be set to whatever the default is for that interaction
    // It seems to be true for all cases currently, so let's send back `true`.
    return true;
  }
};

var immutable = extend;

var hasOwnProperty$2 = Object.prototype.hasOwnProperty;

function extend() {
    var arguments$1 = arguments;

    var target = {};

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments$1[i];

        for (var key in source) {
            if (hasOwnProperty$2.call(source, key)) {
                target[key] = source[key];
            }
        }
    }

    return target
}

var xtend = /*@__PURE__*/getDefaultExportFromCjs(immutable);

var classTypes = ['mode', 'feature', 'mouse'];

function ui(ctx) {


  var buttonElements = {};
  var activeButton = null;

  var currentMapClasses = {
    mode: null, // e.g. mode-direct_select
    feature: null, // e.g. feature-vertex
    mouse: null // e.g. mouse-move
  };

  var nextMapClasses = {
    mode: null,
    feature: null,
    mouse: null
  };

  function clearMapClasses() {
    queueMapClasses({mode:null, feature:null, mouse:null});
    updateMapClasses();
  }

  function queueMapClasses(options) {
    nextMapClasses = xtend(nextMapClasses, options);
  }

  function updateMapClasses() {
    var ref, ref$1;

    if (!ctx.container) { return; }

    var classesToRemove = [];
    var classesToAdd = [];

    classTypes.forEach(function (type) {
      if (nextMapClasses[type] === currentMapClasses[type]) { return; }

      classesToRemove.push((type + "-" + (currentMapClasses[type])));
      if (nextMapClasses[type] !== null) {
        classesToAdd.push((type + "-" + (nextMapClasses[type])));
      }
    });

    if (classesToRemove.length > 0) {
      (ref = ctx.container.classList).remove.apply(ref, classesToRemove);
    }

    if (classesToAdd.length > 0) {
      (ref$1 = ctx.container.classList).add.apply(ref$1, classesToAdd);
    }

    currentMapClasses = xtend(currentMapClasses, nextMapClasses);
  }

  function createControlButton(id, options) {
    if ( options === void 0 ) options = {};

    var button = document.createElement('button');
    button.className = (classes.CONTROL_BUTTON) + " " + (options.className);
    button.setAttribute('title', options.title);
    options.container.appendChild(button);

    button.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var clickedButton = e.target;
      if (clickedButton === activeButton) {
        deactivateButtons();
        options.onDeactivate();
        return;
      }

      setActiveButton(id);
      options.onActivate();
    }, true);

    return button;
  }

  function deactivateButtons() {
    if (!activeButton) { return; }
    activeButton.classList.remove(classes.ACTIVE_BUTTON);
    activeButton = null;
  }

  function setActiveButton(id) {
    deactivateButtons();

    var button = buttonElements[id];
    if (!button) { return; }

    if (button && id !== 'trash') {
      button.classList.add(classes.ACTIVE_BUTTON);
      activeButton = button;
    }
  }

  function addButtons() {
    var controls = ctx.options.controls;
    var controlGroup = document.createElement('div');
    controlGroup.className = (classes.CONTROL_GROUP) + " " + (classes.CONTROL_BASE);

    if (!controls) { return controlGroup; }

    if (controls[types$1.LINE]) {
      buttonElements[types$1.LINE] = createControlButton(types$1.LINE, {
        container: controlGroup,
        className: classes.CONTROL_BUTTON_LINE,
        title: ("LineString tool " + (ctx.options.keybindings ? '(l)' : '')),
        onActivate: function () { return ctx.events.changeMode(modes$1.DRAW_LINE_STRING); },
        onDeactivate: function () { return ctx.events.trash(); }
      });
    }

    if (controls[types$1.POLYGON]) {
      buttonElements[types$1.POLYGON] = createControlButton(types$1.POLYGON, {
        container: controlGroup,
        className: classes.CONTROL_BUTTON_POLYGON,
        title: ("Polygon tool " + (ctx.options.keybindings ? '(p)' : '')),
        onActivate: function () { return ctx.events.changeMode(modes$1.DRAW_POLYGON); },
        onDeactivate: function () { return ctx.events.trash(); }
      });
    }

    if (controls[types$1.POINT]) {
      buttonElements[types$1.POINT] = createControlButton(types$1.POINT, {
        container: controlGroup,
        className: classes.CONTROL_BUTTON_POINT,
        title: ("Marker tool " + (ctx.options.keybindings ? '(m)' : '')),
        onActivate: function () { return ctx.events.changeMode(modes$1.DRAW_POINT); },
        onDeactivate: function () { return ctx.events.trash(); }
      });
    }

    if (controls.trash) {
      buttonElements.trash = createControlButton('trash', {
        container: controlGroup,
        className: classes.CONTROL_BUTTON_TRASH,
        title: 'Delete',
        onActivate: function () {
          ctx.events.trash();
        }
      });
    }

    if (controls.combine_features) {
      buttonElements.combine_features = createControlButton('combineFeatures', {
        container: controlGroup,
        className: classes.CONTROL_BUTTON_COMBINE_FEATURES,
        title: 'Combine',
        onActivate: function () {
          ctx.events.combineFeatures();
        }
      });
    }

    if (controls.uncombine_features) {
      buttonElements.uncombine_features = createControlButton('uncombineFeatures', {
        container: controlGroup,
        className: classes.CONTROL_BUTTON_UNCOMBINE_FEATURES,
        title: 'Uncombine',
        onActivate: function () {
          ctx.events.uncombineFeatures();
        }
      });
    }

    return controlGroup;
  }

  function removeButtons() {
    Object.keys(buttonElements).forEach(function (buttonId) {
      var button = buttonElements[buttonId];
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
      delete buttonElements[buttonId];
    });
  }

  return {
    setActiveButton: setActiveButton,
    queueMapClasses: queueMapClasses,
    updateMapClasses: updateMapClasses,
    clearMapClasses: clearMapClasses,
    addButtons: addButtons,
    removeButtons: removeButtons
  };
}

function runSetup(ctx) {

  var controlContainer = null;
  var mapLoadedInterval = null;

  var setup = {
    onRemove: function onRemove() {
      // Stop connect attempt in the event that control is removed before map is loaded
      ctx.map.off('load', setup.connect);
      clearInterval(mapLoadedInterval);

      setup.removeLayers();
      ctx.store.restoreMapConfig();
      ctx.ui.removeButtons();
      ctx.events.removeEventListeners();
      ctx.ui.clearMapClasses();
      if (ctx.boxZoomInitial) { ctx.map.boxZoom.enable(); }
      ctx.map = null;
      ctx.container = null;
      ctx.store = null;

      if (controlContainer && controlContainer.parentNode) { controlContainer.parentNode.removeChild(controlContainer); }
      controlContainer = null;

      return this;
    },
    connect: function connect() {
      ctx.map.off('load', setup.connect);
      clearInterval(mapLoadedInterval);
      setup.addLayers();
      ctx.store.storeMapConfig();
      ctx.events.addEventListeners();
    },
    onAdd: function onAdd(map) {
      {
        // Monkey patch to resolve breaking change to `fire` introduced by
        // mapbox-gl-js. See mapbox/mapbox-gl-draw/issues/766.
        var _fire = map.fire;
        map.fire = function(type, event) {
          // eslint-disable-next-line
          var args = arguments;

          if (_fire.length === 1 && arguments.length !== 1) {
            args = [xtend({}, { type: type }, event)];
          }

          return _fire.apply(map, args);
        };
      }

      ctx.map = map;
      ctx.events = events(ctx);
      ctx.ui = ui(ctx);
      ctx.container = map.getContainer();
      ctx.store = new Store(ctx);


      controlContainer = ctx.ui.addButtons();

      if (ctx.options.boxSelect) {
        ctx.boxZoomInitial = map.boxZoom.isEnabled();
        map.boxZoom.disable();
        // Need to toggle dragPan on and off or else first
        // dragPan disable attempt in simple_select doesn't work
        map.dragPan.disable();
        map.dragPan.enable();
      }

      if (map.loaded()) {
        setup.connect();
      } else {
        map.on('load', setup.connect);
        mapLoadedInterval = setInterval(function () { if (map.loaded()) { setup.connect(); } }, 16);
      }

      ctx.events.start();
      return controlContainer;
    },
    addLayers: function addLayers() {
      // drawn features style
      ctx.map.addSource(sources.COLD, {
        data: {
          type: geojsonTypes.FEATURE_COLLECTION,
          features: []
        },
        type: 'geojson'
      });

      // hot features style
      ctx.map.addSource(sources.HOT, {
        data: {
          type: geojsonTypes.FEATURE_COLLECTION,
          features: []
        },
        type: 'geojson'
      });

      ctx.options.styles.forEach(function (style) {
        ctx.map.addLayer(style);
      });

      ctx.store.setDirty(true);
      ctx.store.render();
    },
    // Check for layers and sources before attempting to remove
    // If user adds draw control and removes it before the map is loaded, layers and sources will be missing
    removeLayers: function removeLayers() {
      ctx.options.styles.forEach(function (style) {
        if (ctx.map.getLayer(style.id)) {
          ctx.map.removeLayer(style.id);
        }
      });

      if (ctx.map.getSource(sources.COLD)) {
        ctx.map.removeSource(sources.COLD);
      }

      if (ctx.map.getSource(sources.HOT)) {
        ctx.map.removeSource(sources.HOT);
      }
    }
  };

  ctx.setup = setup;

  return setup;
}

var styles = [
  {
    'id': 'gl-draw-polygon-fill-inactive',
    'type': 'fill',
    'filter': ['all',
      ['==', 'active', 'false'],
      ['==', '$type', 'Polygon'],
      ['!=', 'mode', 'static']
    ],
    'paint': {
      'fill-color': '#3bb2d0',
      'fill-outline-color': '#3bb2d0',
      'fill-opacity': 0.1
    }
  },
  {
    'id': 'gl-draw-polygon-fill-active',
    'type': 'fill',
    'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    'paint': {
      'fill-color': '#fbb03b',
      'fill-outline-color': '#fbb03b',
      'fill-opacity': 0.1
    }
  },
  {
    'id': 'gl-draw-polygon-midpoint',
    'type': 'circle',
    'filter': ['all',
      ['==', '$type', 'Point'],
      ['==', 'meta', 'midpoint']],
    'paint': {
      'circle-radius': 3,
      'circle-color': '#fbb03b'
    }
  },
  {
    'id': 'gl-draw-polygon-stroke-inactive',
    'type': 'line',
    'filter': ['all',
      ['==', 'active', 'false'],
      ['==', '$type', 'Polygon'],
      ['!=', 'mode', 'static']
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#3bb2d0',
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-polygon-stroke-active',
    'type': 'line',
    'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#fbb03b',
      'line-dasharray': [0.2, 2],
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-line-inactive',
    'type': 'line',
    'filter': ['all',
      ['==', 'active', 'false'],
      ['==', '$type', 'LineString'],
      ['!=', 'mode', 'static']
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#3bb2d0',
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-line-active',
    'type': 'line',
    'filter': ['all',
      ['==', '$type', 'LineString'],
      ['==', 'active', 'true']
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#fbb03b',
      'line-dasharray': [0.2, 2],
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
    'type': 'circle',
    'filter': ['all',
      ['==', 'meta', 'vertex'],
      ['==', '$type', 'Point'],
      ['!=', 'mode', 'static']
    ],
    'paint': {
      'circle-radius': 5,
      'circle-color': '#fff'
    }
  },
  {
    'id': 'gl-draw-polygon-and-line-vertex-inactive',
    'type': 'circle',
    'filter': ['all',
      ['==', 'meta', 'vertex'],
      ['==', '$type', 'Point'],
      ['!=', 'mode', 'static']
    ],
    'paint': {
      'circle-radius': 3,
      'circle-color': '#fbb03b'
    }
  },
  {
    'id': 'gl-draw-point-point-stroke-inactive',
    'type': 'circle',
    'filter': ['all',
      ['==', 'active', 'false'],
      ['==', '$type', 'Point'],
      ['==', 'meta', 'feature'],
      ['!=', 'mode', 'static']
    ],
    'paint': {
      'circle-radius': 5,
      'circle-opacity': 1,
      'circle-color': '#fff'
    }
  },
  {
    'id': 'gl-draw-point-inactive',
    'type': 'circle',
    'filter': ['all',
      ['==', 'active', 'false'],
      ['==', '$type', 'Point'],
      ['==', 'meta', 'feature'],
      ['!=', 'mode', 'static']
    ],
    'paint': {
      'circle-radius': 3,
      'circle-color': '#3bb2d0'
    }
  },
  {
    'id': 'gl-draw-point-stroke-active',
    'type': 'circle',
    'filter': ['all',
      ['==', '$type', 'Point'],
      ['==', 'active', 'true'],
      ['!=', 'meta', 'midpoint']
    ],
    'paint': {
      'circle-radius': 7,
      'circle-color': '#fff'
    }
  },
  {
    'id': 'gl-draw-point-active',
    'type': 'circle',
    'filter': ['all',
      ['==', '$type', 'Point'],
      ['!=', 'meta', 'midpoint'],
      ['==', 'active', 'true']],
    'paint': {
      'circle-radius': 5,
      'circle-color': '#fbb03b'
    }
  },
  {
    'id': 'gl-draw-polygon-fill-static',
    'type': 'fill',
    'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
    'paint': {
      'fill-color': '#404040',
      'fill-outline-color': '#404040',
      'fill-opacity': 0.1
    }
  },
  {
    'id': 'gl-draw-polygon-stroke-static',
    'type': 'line',
    'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#404040',
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-line-static',
    'type': 'line',
    'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'LineString']],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#404040',
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-point-static',
    'type': 'circle',
    'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Point']],
    'paint': {
      'circle-radius': 5,
      'circle-color': '#404040'
    }
  }
];

function isOfMetaType(type) {
  return function(e) {
    var featureTarget = e.featureTarget;
    if (!featureTarget) { return false; }
    if (!featureTarget.properties) { return false; }
    return featureTarget.properties.meta === type;
  };
}

function isShiftMousedown(e) {
  if (!e.originalEvent) { return false; }
  if (!e.originalEvent.shiftKey) { return false; }
  return e.originalEvent.button === 0;
}

function isActiveFeature(e) {
  if (!e.featureTarget) { return false; }
  if (!e.featureTarget.properties) { return false; }
  return e.featureTarget.properties.active === activeStates.ACTIVE &&
    e.featureTarget.properties.meta === meta.FEATURE;
}

function isInactiveFeature(e) {
  if (!e.featureTarget) { return false; }
  if (!e.featureTarget.properties) { return false; }
  return e.featureTarget.properties.active === activeStates.INACTIVE &&
    e.featureTarget.properties.meta === meta.FEATURE;
}

function noTarget(e) {
  return e.featureTarget === undefined;
}

function isFeature(e) {
  if (!e.featureTarget) { return false; }
  if (!e.featureTarget.properties) { return false; }
  return e.featureTarget.properties.meta === meta.FEATURE;
}

function isVertex$1(e) {
  var featureTarget = e.featureTarget;
  if (!featureTarget) { return false; }
  if (!featureTarget.properties) { return false; }
  return featureTarget.properties.meta === meta.VERTEX;
}

function isShiftDown(e) {
  if (!e.originalEvent) { return false; }
  return e.originalEvent.shiftKey === true;
}

function isEscapeKey(e) {
  return e.keyCode === 27;
}

function isEnterKey(e) {
  return e.keyCode === 13;
}

function isTrue() {
  return true;
}

var common_selectors = /*#__PURE__*/Object.freeze({
__proto__: null,
isOfMetaType: isOfMetaType,
isShiftMousedown: isShiftMousedown,
isActiveFeature: isActiveFeature,
isInactiveFeature: isInactiveFeature,
noTarget: noTarget,
isFeature: isFeature,
isVertex: isVertex$1,
isShiftDown: isShiftDown,
isEscapeKey: isEscapeKey,
isEnterKey: isEnterKey,
isTrue: isTrue
});

var pointGeometry = Point;

/**
 * A standalone point geometry with useful accessor, comparison, and
 * modification methods.
 *
 * @class Point
 * @param {Number} x the x-coordinate. this could be longitude or screen
 * pixels, or any other sort of unit.
 * @param {Number} y the y-coordinate. this could be latitude or screen
 * pixels, or any other sort of unit.
 * @example
 * var point = new Point(-77, 38);
 */
function Point(x, y) {
    this.x = x;
    this.y = y;
}

Point.prototype = {

    /**
     * Clone this point, returning a new point that can be modified
     * without affecting the old one.
     * @return {Point} the clone
     */
    clone: function() { return new Point(this.x, this.y); },

    /**
     * Add this point's x & y coordinates to another point,
     * yielding a new point.
     * @param {Point} p the other point
     * @return {Point} output point
     */
    add:     function(p) { return this.clone()._add(p); },

    /**
     * Subtract this point's x & y coordinates to from point,
     * yielding a new point.
     * @param {Point} p the other point
     * @return {Point} output point
     */
    sub:     function(p) { return this.clone()._sub(p); },

    /**
     * Multiply this point's x & y coordinates by point,
     * yielding a new point.
     * @param {Point} p the other point
     * @return {Point} output point
     */
    multByPoint:    function(p) { return this.clone()._multByPoint(p); },

    /**
     * Divide this point's x & y coordinates by point,
     * yielding a new point.
     * @param {Point} p the other point
     * @return {Point} output point
     */
    divByPoint:     function(p) { return this.clone()._divByPoint(p); },

    /**
     * Multiply this point's x & y coordinates by a factor,
     * yielding a new point.
     * @param {Point} k factor
     * @return {Point} output point
     */
    mult:    function(k) { return this.clone()._mult(k); },

    /**
     * Divide this point's x & y coordinates by a factor,
     * yielding a new point.
     * @param {Point} k factor
     * @return {Point} output point
     */
    div:     function(k) { return this.clone()._div(k); },

    /**
     * Rotate this point around the 0, 0 origin by an angle a,
     * given in radians
     * @param {Number} a angle to rotate around, in radians
     * @return {Point} output point
     */
    rotate:  function(a) { return this.clone()._rotate(a); },

    /**
     * Rotate this point around p point by an angle a,
     * given in radians
     * @param {Number} a angle to rotate around, in radians
     * @param {Point} p Point to rotate around
     * @return {Point} output point
     */
    rotateAround:  function(a,p) { return this.clone()._rotateAround(a,p); },

    /**
     * Multiply this point by a 4x1 transformation matrix
     * @param {Array<Number>} m transformation matrix
     * @return {Point} output point
     */
    matMult: function(m) { return this.clone()._matMult(m); },

    /**
     * Calculate this point but as a unit vector from 0, 0, meaning
     * that the distance from the resulting point to the 0, 0
     * coordinate will be equal to 1 and the angle from the resulting
     * point to the 0, 0 coordinate will be the same as before.
     * @return {Point} unit vector point
     */
    unit:    function() { return this.clone()._unit(); },

    /**
     * Compute a perpendicular point, where the new y coordinate
     * is the old x coordinate and the new x coordinate is the old y
     * coordinate multiplied by -1
     * @return {Point} perpendicular point
     */
    perp:    function() { return this.clone()._perp(); },

    /**
     * Return a version of this point with the x & y coordinates
     * rounded to integers.
     * @return {Point} rounded point
     */
    round:   function() { return this.clone()._round(); },

    /**
     * Return the magitude of this point: this is the Euclidean
     * distance from the 0, 0 coordinate to this point's x and y
     * coordinates.
     * @return {Number} magnitude
     */
    mag: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    /**
     * Judge whether this point is equal to another point, returning
     * true or false.
     * @param {Point} other the other point
     * @return {boolean} whether the points are equal
     */
    equals: function(other) {
        return this.x === other.x &&
               this.y === other.y;
    },

    /**
     * Calculate the distance from this point to another point
     * @param {Point} p the other point
     * @return {Number} distance
     */
    dist: function(p) {
        return Math.sqrt(this.distSqr(p));
    },

    /**
     * Calculate the distance from this point to another point,
     * without the square root step. Useful if you're comparing
     * relative distances.
     * @param {Point} p the other point
     * @return {Number} distance
     */
    distSqr: function(p) {
        var dx = p.x - this.x,
            dy = p.y - this.y;
        return dx * dx + dy * dy;
    },

    /**
     * Get the angle from the 0, 0 coordinate to this point, in radians
     * coordinates.
     * @return {Number} angle
     */
    angle: function() {
        return Math.atan2(this.y, this.x);
    },

    /**
     * Get the angle from this point to another point, in radians
     * @param {Point} b the other point
     * @return {Number} angle
     */
    angleTo: function(b) {
        return Math.atan2(this.y - b.y, this.x - b.x);
    },

    /**
     * Get the angle between this point and another point, in radians
     * @param {Point} b the other point
     * @return {Number} angle
     */
    angleWith: function(b) {
        return this.angleWithSep(b.x, b.y);
    },

    /*
     * Find the angle of the two vectors, solving the formula for
     * the cross product a x b = |a||b|sin(θ) for θ.
     * @param {Number} x the x-coordinate
     * @param {Number} y the y-coordinate
     * @return {Number} the angle in radians
     */
    angleWithSep: function(x, y) {
        return Math.atan2(
            this.x * y - this.y * x,
            this.x * x + this.y * y);
    },

    _matMult: function(m) {
        var x = m[0] * this.x + m[1] * this.y,
            y = m[2] * this.x + m[3] * this.y;
        this.x = x;
        this.y = y;
        return this;
    },

    _add: function(p) {
        this.x += p.x;
        this.y += p.y;
        return this;
    },

    _sub: function(p) {
        this.x -= p.x;
        this.y -= p.y;
        return this;
    },

    _mult: function(k) {
        this.x *= k;
        this.y *= k;
        return this;
    },

    _div: function(k) {
        this.x /= k;
        this.y /= k;
        return this;
    },

    _multByPoint: function(p) {
        this.x *= p.x;
        this.y *= p.y;
        return this;
    },

    _divByPoint: function(p) {
        this.x /= p.x;
        this.y /= p.y;
        return this;
    },

    _unit: function() {
        this._div(this.mag());
        return this;
    },

    _perp: function() {
        var y = this.y;
        this.y = this.x;
        this.x = -y;
        return this;
    },

    _rotate: function(angle) {
        var cos = Math.cos(angle),
            sin = Math.sin(angle),
            x = cos * this.x - sin * this.y,
            y = sin * this.x + cos * this.y;
        this.x = x;
        this.y = y;
        return this;
    },

    _rotateAround: function(angle, p) {
        var cos = Math.cos(angle),
            sin = Math.sin(angle),
            x = p.x + cos * (this.x - p.x) - sin * (this.y - p.y),
            y = p.y + sin * (this.x - p.x) + cos * (this.y - p.y);
        this.x = x;
        this.y = y;
        return this;
    },

    _round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
};

/**
 * Construct a point from an array if necessary, otherwise if the input
 * is already a Point, or an unknown type, return it unchanged
 * @param {Array<Number>|Point|*} a any kind of input value
 * @return {Point} constructed point, or passed-through value.
 * @example
 * // this
 * var point = Point.convert([0, 1]);
 * // is equivalent to
 * var point = new Point(0, 1);
 */
Point.convert = function (a) {
    if (a instanceof Point) {
        return a;
    }
    if (Array.isArray(a)) {
        return new Point(a[0], a[1]);
    }
    return a;
};

var Point$1 = /*@__PURE__*/getDefaultExportFromCjs(pointGeometry);

/**
 * Returns a Point representing a mouse event's position
 * relative to a containing element.
 *
 * @param {MouseEvent} mouseEvent
 * @param {Node} container
 * @returns {Point}
 */
function mouseEventPoint(mouseEvent, container) {
  var rect = container.getBoundingClientRect();
  return new Point$1(
    mouseEvent.clientX - rect.left - (container.clientLeft || 0),
    mouseEvent.clientY - rect.top - (container.clientTop || 0)
  );
}

/**
 * Returns GeoJSON for a Point representing the
 * vertex of another feature.
 *
 * @param {string} parentId
 * @param {Array<number>} coordinates
 * @param {string} path - Dot-separated numbers indicating exactly
 *   where the point exists within its parent feature's coordinates.
 * @param {boolean} selected
 * @return {GeoJSON} Point
 */
function createVertex(parentId, coordinates, path, selected) {
  return {
    type: geojsonTypes.FEATURE,
    properties: {
      meta: meta.VERTEX,
      parent: parentId,
      coord_path: path,
      active: (selected) ? activeStates.ACTIVE : activeStates.INACTIVE
    },
    geometry: {
      type: geojsonTypes.POINT,
      coordinates: coordinates
    }
  };
}

function createMidpoint(parent, startVertex, endVertex) {
  var startCoord = startVertex.geometry.coordinates;
  var endCoord = endVertex.geometry.coordinates;

  // If a coordinate exceeds the projection, we can't calculate a midpoint,
  // so run away
  if (startCoord[1] > LAT_RENDERED_MAX$1 ||
    startCoord[1] < LAT_RENDERED_MIN$1 ||
    endCoord[1] > LAT_RENDERED_MAX$1 ||
    endCoord[1] < LAT_RENDERED_MIN$1) {
    return null;
  }

  var mid = {
    lng: (startCoord[0] + endCoord[0]) / 2,
    lat: (startCoord[1] + endCoord[1]) / 2
  };

  return {
    type: geojsonTypes.FEATURE,
    properties: {
      meta: meta.MIDPOINT,
      parent: parent,
      lng: mid.lng,
      lat: mid.lat,
      coord_path: endVertex.properties.coord_path
    },
    geometry: {
      type: geojsonTypes.POINT,
      coordinates: [mid.lng, mid.lat]
    }
  };
}

function createSupplementaryPoints(geojson, options, basePath) {
  if ( options === void 0 ) options = {};
  if ( basePath === void 0 ) basePath = null;

  var ref = geojson.geometry;
  var type = ref.type;
  var coordinates = ref.coordinates;
  var featureId = geojson.properties && geojson.properties.id;

  var supplementaryPoints = [];

  if (type === geojsonTypes.POINT) {
    // For points, just create a vertex
    supplementaryPoints.push(createVertex(featureId, coordinates, basePath, isSelectedPath(basePath)));
  } else if (type === geojsonTypes.POLYGON) {
    // Cycle through a Polygon's rings and
    // process each line
    coordinates.forEach(function (line, lineIndex) {
      processLine(line, (basePath !== null) ? (basePath + "." + lineIndex) : String(lineIndex));
    });
  } else if (type === geojsonTypes.LINE_STRING) {
    processLine(coordinates, basePath);
  } else if (type.indexOf(geojsonTypes.MULTI_PREFIX) === 0) {
    processMultiGeometry();
  }

  function processLine(line, lineBasePath) {
    var firstPointString = '';
    var lastVertex = null;
    line.forEach(function (point, pointIndex) {
      var pointPath = (lineBasePath !== undefined && lineBasePath !== null) ? (lineBasePath + "." + pointIndex) : String(pointIndex);
      var vertex = createVertex(featureId, point, pointPath, isSelectedPath(pointPath));

      // If we're creating midpoints, check if there was a
      // vertex before this one. If so, add a midpoint
      // between that vertex and this one.
      if (options.midpoints && lastVertex) {
        var midpoint = createMidpoint(featureId, lastVertex, vertex);
        if (midpoint) {
          supplementaryPoints.push(midpoint);
        }
      }
      lastVertex = vertex;

      // A Polygon line's last point is the same as the first point. If we're on the last
      // point, we want to draw a midpoint before it but not another vertex on it
      // (since we already a vertex there, from the first point).
      var stringifiedPoint = JSON.stringify(point);
      if (firstPointString !== stringifiedPoint) {
        supplementaryPoints.push(vertex);
      }
      if (pointIndex === 0) {
        firstPointString = stringifiedPoint;
      }
    });
  }

  function isSelectedPath(path) {
    if (!options.selectedPaths) { return false; }
    return options.selectedPaths.indexOf(path) !== -1;
  }

  // Split a multi-geometry into constituent
  // geometries, and accumulate the supplementary points
  // for each of those constituents
  function processMultiGeometry() {
    var subType = type.replace(geojsonTypes.MULTI_PREFIX, '');
    coordinates.forEach(function (subCoordinates, index) {
      var subFeature = {
        type: geojsonTypes.FEATURE,
        properties: geojson.properties,
        geometry: {
          type: subType,
          coordinates: subCoordinates
        }
      };
      supplementaryPoints = supplementaryPoints.concat(createSupplementaryPoints(subFeature, options, index));
    });
  }

  return supplementaryPoints;
}

var doubleClickZoom = {
  enable: function enable(ctx) {
    setTimeout(function () {
      // First check we've got a map and some context.
      if (!ctx.map || !ctx.map.doubleClickZoom || !ctx._ctx || !ctx._ctx.store || !ctx._ctx.store.getInitialConfigValue) { return; }
      // Now check initial state wasn't false (we leave it disabled if so)
      if (!ctx._ctx.store.getInitialConfigValue('doubleClickZoom')) { return; }
      ctx.map.doubleClickZoom.enable();
    }, 0);
  },
  disable: function disable(ctx) {
    setTimeout(function () {
      if (!ctx.map || !ctx.map.doubleClickZoom) { return; }
      // Always disable here, as it's necessary in some cases.
      ctx.map.doubleClickZoom.disable();
    }, 0);
  }
};

var geojsonExtent = {exports: {}};

var geojsonNormalize$1 = normalize;

var types = {
    Point: 'geometry',
    MultiPoint: 'geometry',
    LineString: 'geometry',
    MultiLineString: 'geometry',
    Polygon: 'geometry',
    MultiPolygon: 'geometry',
    GeometryCollection: 'geometry',
    Feature: 'feature',
    FeatureCollection: 'featurecollection'
};

/**
 * Normalize a GeoJSON feature into a FeatureCollection.
 *
 * @param {object} gj geojson data
 * @returns {object} normalized geojson data
 */
function normalize(gj) {
    if (!gj || !gj.type) { return null; }
    var type = types[gj.type];
    if (!type) { return null; }

    if (type === 'geometry') {
        return {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                properties: {},
                geometry: gj
            }]
        };
    } else if (type === 'feature') {
        return {
            type: 'FeatureCollection',
            features: [gj]
        };
    } else if (type === 'featurecollection') {
        return gj;
    }
}

var normalize$1 = /*@__PURE__*/getDefaultExportFromCjs(geojsonNormalize$1);

function e(t){switch(t&&t.type||null){case"FeatureCollection":return t.features=t.features.reduce(function(t,r){return t.concat(e(r))},[]),t;case"Feature":return t.geometry?e(t.geometry).map(function(e){var r={type:"Feature",properties:JSON.parse(JSON.stringify(t.properties)),geometry:e};return void 0!==t.id&&(r.id=t.id),r}):[t];case"MultiPoint":return t.coordinates.map(function(e){return {type:"Point",coordinates:e}});case"MultiPolygon":return t.coordinates.map(function(e){return {type:"Polygon",coordinates:e}});case"MultiLineString":return t.coordinates.map(function(e){return {type:"LineString",coordinates:e}});case"GeometryCollection":return t.geometries.map(e).reduce(function(e,t){return e.concat(t)},[]);case"Point":case"Polygon":case"LineString":return [t]}}

var index_es = /*#__PURE__*/Object.freeze({
__proto__: null,
'default': e
});

var require$$1 = /*@__PURE__*/getAugmentedNamespace(index_es);

var flatten$1 = function flatten(list) {
    return _flatten(list);

    function _flatten(list) {
        if (Array.isArray(list) && list.length &&
            typeof list[0] === 'number') {
            return [list];
        }
        return list.reduce(function (acc, item) {
            if (Array.isArray(item) && Array.isArray(item[0])) {
                return acc.concat(_flatten(item));
            } else {
                acc.push(item);
                return acc;
            }
        }, []);
    }
};

var geojsonNormalize = geojsonNormalize$1,
    geojsonFlatten = require$$1,
    flatten = flatten$1;

if (!(geojsonFlatten instanceof Function)) { geojsonFlatten = geojsonFlatten.default; }

var geojsonCoords$1 = function(_) {
    if (!_) { return []; }
    var normalized = geojsonFlatten(geojsonNormalize(_)),
        coordinates = [];
    normalized.features.forEach(function(feature) {
        if (!feature.geometry) { return; }
        coordinates = coordinates.concat(flatten(feature.geometry.coordinates));
    });
    return coordinates;
};

var fnToStr = Function.prototype.toString;
var reflectApply = typeof Reflect === 'object' && Reflect !== null && Reflect.apply;
var badArrayLike$1;
var isCallableMarker;
if (typeof reflectApply === 'function' && typeof Object.defineProperty === 'function') {
	try {
		badArrayLike$1 = Object.defineProperty({}, 'length', {
			get: function () {
				throw isCallableMarker;
			}
		});
		isCallableMarker = {};
		// eslint-disable-next-line no-throw-literal
		reflectApply(function () { throw 42; }, null, badArrayLike$1);
	} catch (_) {
		if (_ !== isCallableMarker) {
			reflectApply = null;
		}
	}
} else {
	reflectApply = null;
}

var constructorRegex = /^\s*class\b/;
var isES6ClassFn = function isES6ClassFunction(value) {
	try {
		var fnStr = fnToStr.call(value);
		return constructorRegex.test(fnStr);
	} catch (e) {
		return false; // not a function
	}
};

var tryFunctionObject = function tryFunctionToStr(value) {
	try {
		if (isES6ClassFn(value)) { return false; }
		fnToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr$9 = Object.prototype.toString;
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var hasToStringTag$1 = typeof Symbol === 'function' && !!Symbol.toStringTag; // better: use `has-tostringtag`
/* globals document: false */
var documentDotAll = typeof document === 'object' && typeof document.all === 'undefined' && document.all !== undefined ? document.all : {};

var isCallable$2 = reflectApply
	? function isCallable(value) {
		if (value === documentDotAll) { return true; }
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		if (typeof value === 'function' && !value.prototype) { return true; }
		try {
			reflectApply(value, null, badArrayLike$1);
		} catch (e) {
			if (e !== isCallableMarker) { return false; }
		}
		return !isES6ClassFn(value);
	}
	: function isCallable(value) {
		if (value === documentDotAll) { return true; }
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		if (typeof value === 'function' && !value.prototype) { return true; }
		if (hasToStringTag$1) { return tryFunctionObject(value); }
		if (isES6ClassFn(value)) { return false; }
		var strClass = toStr$9.call(value);
		return strClass === fnClass || strClass === genClass;
	};

var isCallable$1 = isCallable$2;

var toStr$8 = Object.prototype.toString;
var hasOwnProperty$1 = Object.prototype.hasOwnProperty;

var forEachArray = function forEachArray(array, iterator, receiver) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty$1.call(array, i)) {
            if (receiver == null) {
                iterator(array[i], i, array);
            } else {
                iterator.call(receiver, array[i], i, array);
            }
        }
    }
};

var forEachString = function forEachString(string, iterator, receiver) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        if (receiver == null) {
            iterator(string.charAt(i), i, string);
        } else {
            iterator.call(receiver, string.charAt(i), i, string);
        }
    }
};

var forEachObject = function forEachObject(object, iterator, receiver) {
    for (var k in object) {
        if (hasOwnProperty$1.call(object, k)) {
            if (receiver == null) {
                iterator(object[k], k, object);
            } else {
                iterator.call(receiver, object[k], k, object);
            }
        }
    }
};

var forEach$6 = function forEach(list, iterator, thisArg) {
    if (!isCallable$1(iterator)) {
        throw new TypeError('iterator must be a function');
    }

    var receiver;
    if (arguments.length >= 3) {
        receiver = thisArg;
    }

    if (toStr$8.call(list) === '[object Array]') {
        forEachArray(list, iterator, receiver);
    } else if (typeof list === 'string') {
        forEachString(list, iterator, receiver);
    } else {
        forEachObject(list, iterator, receiver);
    }
};

var forEach_1 = forEach$6;

/** @type {import('.')} */
var possibleTypedArrayNames = [
	'Float32Array',
	'Float64Array',
	'Int8Array',
	'Int16Array',
	'Int32Array',
	'Uint8Array',
	'Uint8ClampedArray',
	'Uint16Array',
	'Uint32Array',
	'BigInt64Array',
	'BigUint64Array'
];

var possibleNames$2 = possibleTypedArrayNames;

var g$3 = typeof globalThis === 'undefined' ? global : globalThis;

/** @type {import('.')} */
var availableTypedArrays$6 = function availableTypedArrays() {
	var /** @type {ReturnType<typeof availableTypedArrays>} */ out = [];
	for (var i = 0; i < possibleNames$2.length; i++) {
		if (typeof g$3[possibleNames$2[i]] === 'function') {
			// @ts-expect-error
			out[out.length] = possibleNames$2[i];
		}
	}
	return out;
};

var callBind$6 = {exports: {}};

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE$3 = 'Function.prototype.bind called on incompatible ';
var toStr$7 = Object.prototype.toString;
var max$4 = Math.max;
var funcType$3 = '[object Function]';

var concatty$2 = function concatty(a, b) {
    var arr = [];

    for (var i = 0; i < a.length; i += 1) {
        arr[i] = a[i];
    }
    for (var j = 0; j < b.length; j += 1) {
        arr[j + a.length] = b[j];
    }

    return arr;
};

var slicy$2 = function slicy(arrLike, offset) {
    var arr = [];
    for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
        arr[j] = arrLike[i];
    }
    return arr;
};

var joiny$2 = function (arr, joiner) {
    var str = '';
    for (var i = 0; i < arr.length; i += 1) {
        str += arr[i];
        if (i + 1 < arr.length) {
            str += joiner;
        }
    }
    return str;
};

var implementation$c = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr$7.apply(target) !== funcType$3) {
        throw new TypeError(ERROR_MESSAGE$3 + target);
    }
    var args = slicy$2(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                concatty$2(args, arguments)
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        }
        return target.apply(
            that,
            concatty$2(args, arguments)
        );

    };

    var boundLength = max$4(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs[i] = '$' + i;
    }

    bound = Function('binder', 'return function (' + joiny$2(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

var implementation$b = implementation$c;

var functionBind$3 = Function.prototype.bind || implementation$b;

/** @type {import('.')} */
var esErrors = Error;

/** @type {import('./eval')} */
var _eval = EvalError;

/** @type {import('./range')} */
var range = RangeError;

/** @type {import('./ref')} */
var ref = ReferenceError;

/** @type {import('./syntax')} */
var syntax = SyntaxError;

/** @type {import('./type')} */
var type = TypeError;

/** @type {import('./uri')} */
var uri = URIError;

var shams$2;
var hasRequiredShams$2;

function requireShams$2 () {
	if (hasRequiredShams$2) return shams$2;
	hasRequiredShams$2 = 1;

	/* eslint complexity: [2, 18], max-statements: [2, 33] */
	shams$2 = function hasSymbols() {
		if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
		if (typeof Symbol.iterator === 'symbol') { return true; }

		var obj = {};
		var sym = Symbol('test');
		var symObj = Object(sym);
		if (typeof sym === 'string') { return false; }

		if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
		if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

		// temp disabled per https://github.com/ljharb/object.assign/issues/17
		// if (sym instanceof Symbol) { return false; }
		// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
		// if (!(symObj instanceof Symbol)) { return false; }

		// if (typeof Symbol.prototype.toString !== 'function') { return false; }
		// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

		var symVal = 42;
		obj[sym] = symVal;
		for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
		if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

		if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

		var syms = Object.getOwnPropertySymbols(obj);
		if (syms.length !== 1 || syms[0] !== sym) { return false; }

		if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

		if (typeof Object.getOwnPropertyDescriptor === 'function') {
			var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
			if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
		}

		return true;
	};
	return shams$2;
}

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = requireShams$2();

var hasSymbols$6 = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

var test$3 = {
	foo: {}
};

var $Object$3 = Object;

var hasProto$a = function hasProto() {
	return { __proto__: test$3 }.foo === test$3.foo && !({ __proto__: null } instanceof $Object$3);
};

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE$2 = 'Function.prototype.bind called on incompatible ';
var toStr$6 = Object.prototype.toString;
var max$3 = Math.max;
var funcType$2 = '[object Function]';

var concatty$1 = function concatty(a, b) {
    var arr = [];

    for (var i = 0; i < a.length; i += 1) {
        arr[i] = a[i];
    }
    for (var j = 0; j < b.length; j += 1) {
        arr[j + a.length] = b[j];
    }

    return arr;
};

var slicy$1 = function slicy(arrLike, offset) {
    var arr = [];
    for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
        arr[j] = arrLike[i];
    }
    return arr;
};

var joiny$1 = function (arr, joiner) {
    var str = '';
    for (var i = 0; i < arr.length; i += 1) {
        str += arr[i];
        if (i + 1 < arr.length) {
            str += joiner;
        }
    }
    return str;
};

var implementation$a = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr$6.apply(target) !== funcType$2) {
        throw new TypeError(ERROR_MESSAGE$2 + target);
    }
    var args = slicy$1(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                concatty$1(args, arguments)
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        }
        return target.apply(
            that,
            concatty$1(args, arguments)
        );

    };

    var boundLength = max$3(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs[i] = '$' + i;
    }

    bound = Function('binder', 'return function (' + joiny$1(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

var implementation$9 = implementation$a;

var functionBind$2 = Function.prototype.bind || implementation$9;

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE$1 = 'Function.prototype.bind called on incompatible ';
var toStr$5 = Object.prototype.toString;
var max$2 = Math.max;
var funcType$1 = '[object Function]';

var concatty = function concatty(a, b) {
    var arr = [];

    for (var i = 0; i < a.length; i += 1) {
        arr[i] = a[i];
    }
    for (var j = 0; j < b.length; j += 1) {
        arr[j + a.length] = b[j];
    }

    return arr;
};

var slicy = function slicy(arrLike, offset) {
    var arr = [];
    for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
        arr[j] = arrLike[i];
    }
    return arr;
};

var joiny = function (arr, joiner) {
    var str = '';
    for (var i = 0; i < arr.length; i += 1) {
        str += arr[i];
        if (i + 1 < arr.length) {
            str += joiner;
        }
    }
    return str;
};

var implementation$8 = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr$5.apply(target) !== funcType$1) {
        throw new TypeError(ERROR_MESSAGE$1 + target);
    }
    var args = slicy(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                concatty(args, arguments)
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        }
        return target.apply(
            that,
            concatty(args, arguments)
        );

    };

    var boundLength = max$2(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs[i] = '$' + i;
    }

    bound = Function('binder', 'return function (' + joiny(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

var implementation$7 = implementation$8;

var functionBind$1 = Function.prototype.bind || implementation$7;

var call = Function.prototype.call;
var $hasOwn = Object.prototype.hasOwnProperty;
var bind$6 = functionBind$1;

/** @type {import('.')} */
var hasown = bind$6.call(call, $hasOwn);

var undefined$5;

var $Error = esErrors;
var $EvalError = _eval;
var $RangeError = range;
var $ReferenceError = ref;
var $SyntaxError$c = syntax;
var $TypeError$s = type;
var $URIError = uri;

var $Function$4 = Function;

// eslint-disable-next-line consistent-return
var getEvalledConstructor$4 = function (expressionSyntax) {
	try {
		return $Function$4('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD$5 = Object.getOwnPropertyDescriptor;
if ($gOPD$5) {
	try {
		$gOPD$5({}, '');
	} catch (e) {
		$gOPD$5 = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError$4 = function () {
	throw new $TypeError$s();
};
var ThrowTypeError$4 = $gOPD$5
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError$4;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD$5(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError$4;
			}
		}
	}())
	: throwTypeError$4;

var hasSymbols$5 = hasSymbols$6();
var hasProto$9 = hasProto$a();

var getProto$6 = Object.getPrototypeOf || (
	hasProto$9
		? function (x) { return x.__proto__; } // eslint-disable-line no-proto
		: null
);

var needsEval$4 = {};

var TypedArray$4 = typeof Uint8Array === 'undefined' || !getProto$6 ? undefined$5 : getProto$6(Uint8Array);

var INTRINSICS$4 = {
	__proto__: null,
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$5 : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$5 : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols$5 && getProto$6 ? getProto$6([][Symbol.iterator]()) : undefined$5,
	'%AsyncFromSyncIteratorPrototype%': undefined$5,
	'%AsyncFunction%': needsEval$4,
	'%AsyncGenerator%': needsEval$4,
	'%AsyncGeneratorFunction%': needsEval$4,
	'%AsyncIteratorPrototype%': needsEval$4,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined$5 : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined$5 : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined$5 : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined$5 : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined$5 : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': $Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': $EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$5 : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$5 : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$5 : FinalizationRegistry,
	'%Function%': $Function$4,
	'%GeneratorFunction%': needsEval$4,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$5 : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$5 : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$5 : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols$5 && getProto$6 ? getProto$6(getProto$6([][Symbol.iterator]())) : undefined$5,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined$5,
	'%Map%': typeof Map === 'undefined' ? undefined$5 : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols$5 || !getProto$6 ? undefined$5 : getProto$6(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined$5 : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined$5 : Proxy,
	'%RangeError%': $RangeError,
	'%ReferenceError%': $ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined$5 : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined$5 : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols$5 || !getProto$6 ? undefined$5 : getProto$6(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$5 : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols$5 && getProto$6 ? getProto$6(''[Symbol.iterator]()) : undefined$5,
	'%Symbol%': hasSymbols$5 ? Symbol : undefined$5,
	'%SyntaxError%': $SyntaxError$c,
	'%ThrowTypeError%': ThrowTypeError$4,
	'%TypedArray%': TypedArray$4,
	'%TypeError%': $TypeError$s,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$5 : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$5 : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$5 : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$5 : Uint32Array,
	'%URIError%': $URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$5 : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$5 : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$5 : WeakSet
};

if (getProto$6) {
	try {
		null.error; // eslint-disable-line no-unused-expressions
	} catch (e$1) {
		// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
		var errorProto$3 = getProto$6(getProto$6(e$1));
		INTRINSICS$4['%Error.prototype%'] = errorProto$3;
	}
}

var doEval$4 = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor$4('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor$4('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor$4('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen && getProto$6) {
			value = getProto$6(gen.prototype);
		}
	}

	INTRINSICS$4[name] = value;

	return value;
};

var LEGACY_ALIASES$4 = {
	__proto__: null,
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind$5 = functionBind$2;
var hasOwn$6 = hasown;
var $concat$5 = bind$5.call(Function.call, Array.prototype.concat);
var $spliceApply$4 = bind$5.call(Function.apply, Array.prototype.splice);
var $replace$5 = bind$5.call(Function.call, String.prototype.replace);
var $strSlice$4 = bind$5.call(Function.call, String.prototype.slice);
var $exec$4 = bind$5.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName$4 = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar$4 = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath$4 = function stringToPath(string) {
	var first = $strSlice$4(string, 0, 1);
	var last = $strSlice$4(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError$c('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError$c('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace$5(string, rePropName$4, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace$5(subString, reEscapeChar$4, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic$4 = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn$6(LEGACY_ALIASES$4, intrinsicName)) {
		alias = LEGACY_ALIASES$4[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn$6(INTRINSICS$4, intrinsicName)) {
		var value = INTRINSICS$4[intrinsicName];
		if (value === needsEval$4) {
			value = doEval$4(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError$s('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError$c('intrinsic ' + name + ' does not exist!');
};

var getIntrinsic$4 = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError$s('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError$s('"allowMissing" argument must be a boolean');
	}

	if ($exec$4(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError$c('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath$4(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic$4('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply$4(parts, $concat$5([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice$4(part, 0, 1);
		var last = $strSlice$4(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError$c('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn$6(INTRINSICS$4, intrinsicRealName)) {
			value = INTRINSICS$4[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError$s('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined$5;
			}
			if ($gOPD$5 && (i + 1) >= parts.length) {
				var desc = $gOPD$5(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn$6(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS$4[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

var esDefineProperty;
var hasRequiredEsDefineProperty;

function requireEsDefineProperty () {
	if (hasRequiredEsDefineProperty) return esDefineProperty;
	hasRequiredEsDefineProperty = 1;

	var GetIntrinsic = getIntrinsic$4;

	/** @type {import('.')} */
	var $defineProperty = GetIntrinsic('%Object.defineProperty%', true) || false;
	if ($defineProperty) {
		try {
			$defineProperty({}, 'a', { value: 1 });
		} catch (e) {
			// IE 8 has a broken defineProperty
			$defineProperty = false;
		}
	}

	esDefineProperty = $defineProperty;
	return esDefineProperty;
}

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice$1 = Array.prototype.slice;
var toStr$4 = Object.prototype.toString;
var funcType = '[object Function]';

var implementation$6 = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr$4.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice$1.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice$1.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice$1.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

var implementation$5 = implementation$6;

var functionBind = Function.prototype.bind || implementation$5;

var bind$4 = functionBind;

var src = bind$4.call(Function.call, Object.prototype.hasOwnProperty);

var undefined$4;

var $SyntaxError$b = SyntaxError;
var $Function$3 = Function;
var $TypeError$r = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor$3 = function (expressionSyntax) {
	try {
		return $Function$3('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD$4 = Object.getOwnPropertyDescriptor;
if ($gOPD$4) {
	try {
		$gOPD$4({}, '');
	} catch (e) {
		$gOPD$4 = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError$3 = function () {
	throw new $TypeError$r();
};
var ThrowTypeError$3 = $gOPD$4
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError$3;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD$4(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError$3;
			}
		}
	}())
	: throwTypeError$3;

var hasSymbols$4 = hasSymbols$6();

var getProto$5 = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval$3 = {};

var TypedArray$3 = typeof Uint8Array === 'undefined' ? undefined$4 : getProto$5(Uint8Array);

var INTRINSICS$3 = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$4 : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$4 : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols$4 ? getProto$5([][Symbol.iterator]()) : undefined$4,
	'%AsyncFromSyncIteratorPrototype%': undefined$4,
	'%AsyncFunction%': needsEval$3,
	'%AsyncGenerator%': needsEval$3,
	'%AsyncGeneratorFunction%': needsEval$3,
	'%AsyncIteratorPrototype%': needsEval$3,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined$4 : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined$4 : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined$4 : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined$4 : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined$4 : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$4 : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$4 : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$4 : FinalizationRegistry,
	'%Function%': $Function$3,
	'%GeneratorFunction%': needsEval$3,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$4 : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$4 : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$4 : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols$4 ? getProto$5(getProto$5([][Symbol.iterator]())) : undefined$4,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined$4,
	'%Map%': typeof Map === 'undefined' ? undefined$4 : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols$4 ? undefined$4 : getProto$5(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined$4 : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined$4 : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined$4 : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined$4 : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols$4 ? undefined$4 : getProto$5(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$4 : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols$4 ? getProto$5(''[Symbol.iterator]()) : undefined$4,
	'%Symbol%': hasSymbols$4 ? Symbol : undefined$4,
	'%SyntaxError%': $SyntaxError$b,
	'%ThrowTypeError%': ThrowTypeError$3,
	'%TypedArray%': TypedArray$3,
	'%TypeError%': $TypeError$r,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$4 : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$4 : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$4 : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$4 : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$4 : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$4 : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$4 : WeakSet
};

try {
	null.error; // eslint-disable-line no-unused-expressions
} catch (e$1) {
	// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
	var errorProto$2 = getProto$5(getProto$5(e$1));
	INTRINSICS$3['%Error.prototype%'] = errorProto$2;
}

var doEval$3 = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor$3('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor$3('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor$3('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto$5(gen.prototype);
		}
	}

	INTRINSICS$3[name] = value;

	return value;
};

var LEGACY_ALIASES$3 = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind$3 = functionBind;
var hasOwn$5 = src;
var $concat$4 = bind$3.call(Function.call, Array.prototype.concat);
var $spliceApply$3 = bind$3.call(Function.apply, Array.prototype.splice);
var $replace$4 = bind$3.call(Function.call, String.prototype.replace);
var $strSlice$3 = bind$3.call(Function.call, String.prototype.slice);
var $exec$3 = bind$3.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName$3 = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar$3 = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath$3 = function stringToPath(string) {
	var first = $strSlice$3(string, 0, 1);
	var last = $strSlice$3(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError$b('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError$b('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace$4(string, rePropName$3, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace$4(subString, reEscapeChar$3, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic$3 = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn$5(LEGACY_ALIASES$3, intrinsicName)) {
		alias = LEGACY_ALIASES$3[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn$5(INTRINSICS$3, intrinsicName)) {
		var value = INTRINSICS$3[intrinsicName];
		if (value === needsEval$3) {
			value = doEval$3(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError$r('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError$b('intrinsic ' + name + ' does not exist!');
};

var getIntrinsic$3 = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError$r('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError$r('"allowMissing" argument must be a boolean');
	}

	if ($exec$3(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError$b('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath$3(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic$3('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply$3(parts, $concat$4([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice$3(part, 0, 1);
		var last = $strSlice$3(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError$b('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn$5(INTRINSICS$3, intrinsicRealName)) {
			value = INTRINSICS$3[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError$r('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined$4;
			}
			if ($gOPD$4 && (i + 1) >= parts.length) {
				var desc = $gOPD$4(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn$5(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS$3[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

var GetIntrinsic$i = getIntrinsic$3;

var $gOPD$3 = GetIntrinsic$i('%Object.getOwnPropertyDescriptor%', true);

if ($gOPD$3) {
	try {
		$gOPD$3([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD$3 = null;
	}
}

var gopd$3 = $gOPD$3;

var $defineProperty$3 = requireEsDefineProperty();

var $SyntaxError$a = syntax;
var $TypeError$q = type;

var gopd$2 = gopd$3;

/** @type {import('.')} */
var defineDataProperty$2 = function defineDataProperty(
	obj,
	property,
	value
) {
	if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
		throw new $TypeError$q('`obj` must be an object or a function`');
	}
	if (typeof property !== 'string' && typeof property !== 'symbol') {
		throw new $TypeError$q('`property` must be a string or a symbol`');
	}
	if (arguments.length > 3 && typeof arguments[3] !== 'boolean' && arguments[3] !== null) {
		throw new $TypeError$q('`nonEnumerable`, if provided, must be a boolean or null');
	}
	if (arguments.length > 4 && typeof arguments[4] !== 'boolean' && arguments[4] !== null) {
		throw new $TypeError$q('`nonWritable`, if provided, must be a boolean or null');
	}
	if (arguments.length > 5 && typeof arguments[5] !== 'boolean' && arguments[5] !== null) {
		throw new $TypeError$q('`nonConfigurable`, if provided, must be a boolean or null');
	}
	if (arguments.length > 6 && typeof arguments[6] !== 'boolean') {
		throw new $TypeError$q('`loose`, if provided, must be a boolean');
	}

	var nonEnumerable = arguments.length > 3 ? arguments[3] : null;
	var nonWritable = arguments.length > 4 ? arguments[4] : null;
	var nonConfigurable = arguments.length > 5 ? arguments[5] : null;
	var loose = arguments.length > 6 ? arguments[6] : false;

	/* @type {false | TypedPropertyDescriptor<unknown>} */
	var desc = !!gopd$2 && gopd$2(obj, property);

	if ($defineProperty$3) {
		$defineProperty$3(obj, property, {
			configurable: nonConfigurable === null && desc ? desc.configurable : !nonConfigurable,
			enumerable: nonEnumerable === null && desc ? desc.enumerable : !nonEnumerable,
			value: value,
			writable: nonWritable === null && desc ? desc.writable : !nonWritable
		});
	} else if (loose || (!nonEnumerable && !nonWritable && !nonConfigurable)) {
		// must fall back to [[Set]], and was not explicitly asked to make non-enumerable, non-writable, or non-configurable
		obj[property] = value; // eslint-disable-line no-param-reassign
	} else {
		throw new $SyntaxError$a('This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.');
	}
};

var $defineProperty$2 = requireEsDefineProperty();

var hasPropertyDescriptors$2 = function hasPropertyDescriptors() {
	return !!$defineProperty$2;
};

hasPropertyDescriptors$2.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
	// node v0.6 has a bug where array lengths can be Set but not Defined
	if (!$defineProperty$2) {
		return null;
	}
	try {
		return $defineProperty$2([], 'length', { value: 1 }).length !== 1;
	} catch (e) {
		// In Firefox 4-22, defining length on an array throws an exception.
		return true;
	}
};

var hasPropertyDescriptors_1$2 = hasPropertyDescriptors$2;

var GetIntrinsic$h = getIntrinsic$4;
var define$2 = defineDataProperty$2;
var hasDescriptors = hasPropertyDescriptors_1$2();
var gOPD$3 = gopd$3;

var $TypeError$p = type;
var $floor$3 = GetIntrinsic$h('%Math.floor%');

/** @type {import('.')} */
var setFunctionLength = function setFunctionLength(fn, length) {
	if (typeof fn !== 'function') {
		throw new $TypeError$p('`fn` is not a function');
	}
	if (typeof length !== 'number' || length < 0 || length > 0xFFFFFFFF || $floor$3(length) !== length) {
		throw new $TypeError$p('`length` must be a positive 32-bit integer');
	}

	var loose = arguments.length > 2 && !!arguments[2];

	var functionLengthIsConfigurable = true;
	var functionLengthIsWritable = true;
	if ('length' in fn && gOPD$3) {
		var desc = gOPD$3(fn, 'length');
		if (desc && !desc.configurable) {
			functionLengthIsConfigurable = false;
		}
		if (desc && !desc.writable) {
			functionLengthIsWritable = false;
		}
	}

	if (functionLengthIsConfigurable || functionLengthIsWritable || !loose) {
		if (hasDescriptors) {
			define$2(/** @type {Parameters<define>[0]} */ (fn), 'length', length, true, true);
		} else {
			define$2(/** @type {Parameters<define>[0]} */ (fn), 'length', length);
		}
	}
	return fn;
};

callBind$6.exports;

(function (module) {

	var bind = functionBind$3;
	var GetIntrinsic = getIntrinsic$4;
	var setFunctionLength$1 = setFunctionLength;

	var $TypeError = type;
	var $apply = GetIntrinsic('%Function.prototype.apply%');
	var $call = GetIntrinsic('%Function.prototype.call%');
	var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

	var $defineProperty = requireEsDefineProperty();
	var $max = GetIntrinsic('%Math.max%');

	module.exports = function callBind(originalFunction) {
		if (typeof originalFunction !== 'function') {
			throw new $TypeError('a function is required');
		}
		var func = $reflectApply(bind, $call, arguments);
		return setFunctionLength$1(
			func,
			1 + $max(0, originalFunction.length - (arguments.length - 1)),
			true
		);
	};

	var applyBind = function applyBind() {
		return $reflectApply(bind, $apply, arguments);
	};

	if ($defineProperty) {
		$defineProperty(module.exports, 'apply', { value: applyBind });
	} else {
		module.exports.apply = applyBind;
	} 
} (callBind$6));

var callBindExports = callBind$6.exports;

var GetIntrinsic$g = getIntrinsic$4;

var callBind$5 = callBindExports;

var $indexOf$1 = callBind$5(GetIntrinsic$g('String.prototype.indexOf'));

var callBound$8 = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic$g(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf$1(name, '.prototype.') > -1) {
		return callBind$5(intrinsic);
	}
	return intrinsic;
};

var shams$1;
var hasRequiredShams$1;

function requireShams$1 () {
	if (hasRequiredShams$1) return shams$1;
	hasRequiredShams$1 = 1;

	var hasSymbols = requireShams$2();

	/** @type {import('.')} */
	shams$1 = function hasToStringTagShams() {
		return hasSymbols() && !!Symbol.toStringTag;
	};
	return shams$1;
}

var forEach$5 = forEach_1;
var availableTypedArrays$5 = availableTypedArrays$6;
var callBind$4 = callBindExports;
var callBound$7 = callBound$8;
var gOPD$2 = gopd$3;

/** @type {(O: object) => string} */
var $toString$1 = callBound$7('Object.prototype.toString');
var hasToStringTag = requireShams$1()();

var g$2 = typeof globalThis === 'undefined' ? global : globalThis;
var typedArrays$2 = availableTypedArrays$5();

var $slice$2 = callBound$7('String.prototype.slice');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');

/** @type {<T = unknown>(array: readonly T[], value: unknown) => number} */
var $indexOf = callBound$7('Array.prototype.indexOf', true) || function indexOf(array, value) {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i] === value) {
			return i;
		}
	}
	return -1;
};

/** @typedef {(receiver: import('.').TypedArray) => string | typeof Uint8Array.prototype.slice.call | typeof Uint8Array.prototype.set.call} Getter */
/** @type {{ [k in `\$${import('.').TypedArrayName}`]?: Getter } & { __proto__: null }} */
var cache = { __proto__: null };
if (hasToStringTag && gOPD$2 && getPrototypeOf) {
	forEach$5(typedArrays$2, function (typedArray) {
		var arr = new g$2[typedArray]();
		if (Symbol.toStringTag in arr) {
			var proto = getPrototypeOf(arr);
			// @ts-expect-error TS won't narrow inside a closure
			var descriptor = gOPD$2(proto, Symbol.toStringTag);
			if (!descriptor) {
				var superProto = getPrototypeOf(proto);
				// @ts-expect-error TS won't narrow inside a closure
				descriptor = gOPD$2(superProto, Symbol.toStringTag);
			}
			// @ts-expect-error TODO: fix
			cache['$' + typedArray] = callBind$4(descriptor.get);
		}
	});
} else {
	forEach$5(typedArrays$2, function (typedArray) {
		var arr = new g$2[typedArray]();
		var fn = arr.slice || arr.set;
		if (fn) {
			// @ts-expect-error TODO: fix
			cache['$' + typedArray] = callBind$4(fn);
		}
	});
}

/** @type {(value: object) => false | import('.').TypedArrayName} */
var tryTypedArrays$2 = function tryAllTypedArrays(value) {
	/** @type {ReturnType<typeof tryAllTypedArrays>} */ var found = false;
	forEach$5(
		// eslint-disable-next-line no-extra-parens
		/** @type {Record<`\$${TypedArrayName}`, Getter>} */ /** @type {any} */ (cache),
		/** @type {(getter: Getter, name: `\$${import('.').TypedArrayName}`) => void} */
		function (getter, typedArray) {
			if (!found) {
				try {
				// @ts-expect-error TODO: fix
					if ('$' + getter(value) === typedArray) {
						found = $slice$2(typedArray, 1);
					}
				} catch (e) { /**/ }
			}
		}
	);
	return found;
};

/** @type {(value: object) => false | import('.').TypedArrayName} */
var trySlices = function tryAllSlices(value) {
	/** @type {ReturnType<typeof tryAllSlices>} */ var found = false;
	forEach$5(
		// eslint-disable-next-line no-extra-parens
		/** @type {Record<`\$${TypedArrayName}`, Getter>} */ /** @type {any} */ (cache),
		/** @type {(getter: typeof cache, name: `\$${import('.').TypedArrayName}`) => void} */ function (getter, name) {
			if (!found) {
				try {
					// @ts-expect-error TODO: fix
					getter(value);
					found = $slice$2(name, 1);
				} catch (e) { /**/ }
			}
		}
	);
	return found;
};

/** @type {import('.')} */
var whichTypedArray$4 = function whichTypedArray(value) {
	if (!value || typeof value !== 'object') { return false; }
	if (!hasToStringTag) {
		/** @type {string} */
		var tag = $slice$2($toString$1(value), 8, -1);
		if ($indexOf(typedArrays$2, tag) > -1) {
			return tag;
		}
		if (tag !== 'Object') {
			return false;
		}
		// node < 0.6 hits here on real Typed Arrays
		return trySlices(value);
	}
	if (!gOPD$2) { return null; } // unknown engine
	return tryTypedArrays$2(value);
};

var toStr$3 = Object.prototype.toString;

var isArguments = function isArguments(value) {
	var str = toStr$3.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' &&
			value !== null &&
			typeof value === 'object' &&
			typeof value.length === 'number' &&
			value.length >= 0 &&
			toStr$3.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

var implementation$4;
var hasRequiredImplementation$1;

function requireImplementation$1 () {
	if (hasRequiredImplementation$1) return implementation$4;
	hasRequiredImplementation$1 = 1;

	var keysShim;
	if (!Object.keys) {
		// modified from https://github.com/es-shims/es5-shim
		var has = Object.prototype.hasOwnProperty;
		var toStr = Object.prototype.toString;
		var isArgs = isArguments; // eslint-disable-line global-require
		var isEnumerable = Object.prototype.propertyIsEnumerable;
		var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
		var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
		var dontEnums = [
			'toString',
			'toLocaleString',
			'valueOf',
			'hasOwnProperty',
			'isPrototypeOf',
			'propertyIsEnumerable',
			'constructor'
		];
		var equalsConstructorPrototype = function (o) {
			var ctor = o.constructor;
			return ctor && ctor.prototype === o;
		};
		var excludedKeys = {
			$applicationCache: true,
			$console: true,
			$external: true,
			$frame: true,
			$frameElement: true,
			$frames: true,
			$innerHeight: true,
			$innerWidth: true,
			$onmozfullscreenchange: true,
			$onmozfullscreenerror: true,
			$outerHeight: true,
			$outerWidth: true,
			$pageXOffset: true,
			$pageYOffset: true,
			$parent: true,
			$scrollLeft: true,
			$scrollTop: true,
			$scrollX: true,
			$scrollY: true,
			$self: true,
			$webkitIndexedDB: true,
			$webkitStorageInfo: true,
			$window: true
		};
		var hasAutomationEqualityBug = (function () {
			/* global window */
			if (typeof window === 'undefined') { return false; }
			for (var k in window) {
				try {
					if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
						try {
							equalsConstructorPrototype(window[k]);
						} catch (e) {
							return true;
						}
					}
				} catch (e$1) {
					return true;
				}
			}
			return false;
		}());
		var equalsConstructorPrototypeIfNotBuggy = function (o) {
			/* global window */
			if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
				return equalsConstructorPrototype(o);
			}
			try {
				return equalsConstructorPrototype(o);
			} catch (e) {
				return false;
			}
		};

		keysShim = function keys(object) {
			var isObject = object !== null && typeof object === 'object';
			var isFunction = toStr.call(object) === '[object Function]';
			var isArguments = isArgs(object);
			var isString = isObject && toStr.call(object) === '[object String]';
			var theKeys = [];

			if (!isObject && !isFunction && !isArguments) {
				throw new TypeError('Object.keys called on a non-object');
			}

			var skipProto = hasProtoEnumBug && isFunction;
			if (isString && object.length > 0 && !has.call(object, 0)) {
				for (var i = 0; i < object.length; ++i) {
					theKeys.push(String(i));
				}
			}

			if (isArguments && object.length > 0) {
				for (var j = 0; j < object.length; ++j) {
					theKeys.push(String(j));
				}
			} else {
				for (var name in object) {
					if (!(skipProto && name === 'prototype') && has.call(object, name)) {
						theKeys.push(String(name));
					}
				}
			}

			if (hasDontEnumBug) {
				var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

				for (var k = 0; k < dontEnums.length; ++k) {
					if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
						theKeys.push(dontEnums[k]);
					}
				}
			}
			return theKeys;
		};
	}
	implementation$4 = keysShim;
	return implementation$4;
}

var slice = Array.prototype.slice;
var isArgs = isArguments;

var origKeys = Object.keys;
var keysShim = origKeys ? function keys(o) { return origKeys(o); } : requireImplementation$1();

var originalKeys = Object.keys;

keysShim.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = (function () {
			// Safari 5.0 bug
			var args = Object.keys(arguments);
			return args && args.length === arguments.length;
		}(1, 2));
		if (!keysWorksWithArguments) {
			Object.keys = function keys(object) { // eslint-disable-line func-name-matching
				if (isArgs(object)) {
					return originalKeys(slice.call(object));
				}
				return originalKeys(object);
			};
		}
	} else {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

var objectKeys$1 = keysShim;

var undefined$3;

var $SyntaxError$9 = SyntaxError;
var $Function$2 = Function;
var $TypeError$o = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor$2 = function (expressionSyntax) {
	try {
		return $Function$2('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD$2 = Object.getOwnPropertyDescriptor;
if ($gOPD$2) {
	try {
		$gOPD$2({}, '');
	} catch (e) {
		$gOPD$2 = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError$2 = function () {
	throw new $TypeError$o();
};
var ThrowTypeError$2 = $gOPD$2
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError$2;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD$2(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError$2;
			}
		}
	}())
	: throwTypeError$2;

var hasSymbols$3 = hasSymbols$6();

var getProto$4 = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval$2 = {};

var TypedArray$2 = typeof Uint8Array === 'undefined' ? undefined$3 : getProto$4(Uint8Array);

var INTRINSICS$2 = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$3 : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$3 : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols$3 ? getProto$4([][Symbol.iterator]()) : undefined$3,
	'%AsyncFromSyncIteratorPrototype%': undefined$3,
	'%AsyncFunction%': needsEval$2,
	'%AsyncGenerator%': needsEval$2,
	'%AsyncGeneratorFunction%': needsEval$2,
	'%AsyncIteratorPrototype%': needsEval$2,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined$3 : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined$3 : BigInt,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined$3 : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$3 : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$3 : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$3 : FinalizationRegistry,
	'%Function%': $Function$2,
	'%GeneratorFunction%': needsEval$2,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$3 : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$3 : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$3 : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols$3 ? getProto$4(getProto$4([][Symbol.iterator]())) : undefined$3,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined$3,
	'%Map%': typeof Map === 'undefined' ? undefined$3 : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols$3 ? undefined$3 : getProto$4(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined$3 : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined$3 : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined$3 : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined$3 : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols$3 ? undefined$3 : getProto$4(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$3 : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols$3 ? getProto$4(''[Symbol.iterator]()) : undefined$3,
	'%Symbol%': hasSymbols$3 ? Symbol : undefined$3,
	'%SyntaxError%': $SyntaxError$9,
	'%ThrowTypeError%': ThrowTypeError$2,
	'%TypedArray%': TypedArray$2,
	'%TypeError%': $TypeError$o,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$3 : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$3 : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$3 : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$3 : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$3 : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$3 : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$3 : WeakSet
};

var doEval$2 = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor$2('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor$2('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor$2('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto$4(gen.prototype);
		}
	}

	INTRINSICS$2[name] = value;

	return value;
};

var LEGACY_ALIASES$2 = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind$2 = functionBind;
var hasOwn$4 = src;
var $concat$3 = bind$2.call(Function.call, Array.prototype.concat);
var $spliceApply$2 = bind$2.call(Function.apply, Array.prototype.splice);
var $replace$3 = bind$2.call(Function.call, String.prototype.replace);
var $strSlice$2 = bind$2.call(Function.call, String.prototype.slice);
var $exec$2 = bind$2.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName$2 = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar$2 = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath$2 = function stringToPath(string) {
	var first = $strSlice$2(string, 0, 1);
	var last = $strSlice$2(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError$9('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError$9('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace$3(string, rePropName$2, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace$3(subString, reEscapeChar$2, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic$2 = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn$4(LEGACY_ALIASES$2, intrinsicName)) {
		alias = LEGACY_ALIASES$2[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn$4(INTRINSICS$2, intrinsicName)) {
		var value = INTRINSICS$2[intrinsicName];
		if (value === needsEval$2) {
			value = doEval$2(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError$o('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError$9('intrinsic ' + name + ' does not exist!');
};

var getIntrinsic$2 = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError$o('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError$o('"allowMissing" argument must be a boolean');
	}

	if ($exec$2(/^%?[^%]*%?$/g, name) === null) {
		throw new $SyntaxError$9('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath$2(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic$2('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply$2(parts, $concat$3([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice$2(part, 0, 1);
		var last = $strSlice$2(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError$9('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn$4(INTRINSICS$2, intrinsicRealName)) {
			value = INTRINSICS$2[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError$o('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined$3;
			}
			if ($gOPD$2 && (i + 1) >= parts.length) {
				var desc = $gOPD$2(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn$4(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS$2[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

var GetIntrinsic$f = getIntrinsic$2;

var $defineProperty$1 = GetIntrinsic$f('%Object.defineProperty%', true);

var hasPropertyDescriptors$1 = function hasPropertyDescriptors() {
	if ($defineProperty$1) {
		try {
			$defineProperty$1({}, 'a', { value: 1 });
			return true;
		} catch (e) {
			// IE 8 has a broken defineProperty
			return false;
		}
	}
	return false;
};

hasPropertyDescriptors$1.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
	// node v0.6 has a bug where array lengths can be Set but not Defined
	if (!hasPropertyDescriptors$1()) {
		return null;
	}
	try {
		return $defineProperty$1([], 'length', { value: 1 }).length !== 1;
	} catch (e) {
		// In Firefox 4-22, defining length on an array throws an exception.
		return true;
	}
};

var hasPropertyDescriptors_1$1 = hasPropertyDescriptors$1;

var undefined$2;

var $SyntaxError$8 = SyntaxError;
var $Function$1 = Function;
var $TypeError$n = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor$1 = function (expressionSyntax) {
	try {
		return $Function$1('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD$1 = Object.getOwnPropertyDescriptor;
if ($gOPD$1) {
	try {
		$gOPD$1({}, '');
	} catch (e) {
		$gOPD$1 = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError$1 = function () {
	throw new $TypeError$n();
};
var ThrowTypeError$1 = $gOPD$1
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError$1;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD$1(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError$1;
			}
		}
	}())
	: throwTypeError$1;

var hasSymbols$2 = hasSymbols$6();
var hasProto$8 = hasProto$a();

var getProto$3 = Object.getPrototypeOf || (
	hasProto$8
		? function (x) { return x.__proto__; } // eslint-disable-line no-proto
		: null
);

var needsEval$1 = {};

var TypedArray$1 = typeof Uint8Array === 'undefined' || !getProto$3 ? undefined$2 : getProto$3(Uint8Array);

var INTRINSICS$1 = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$2 : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$2 : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols$2 && getProto$3 ? getProto$3([][Symbol.iterator]()) : undefined$2,
	'%AsyncFromSyncIteratorPrototype%': undefined$2,
	'%AsyncFunction%': needsEval$1,
	'%AsyncGenerator%': needsEval$1,
	'%AsyncGeneratorFunction%': needsEval$1,
	'%AsyncIteratorPrototype%': needsEval$1,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined$2 : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined$2 : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined$2 : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined$2 : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined$2 : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$2 : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$2 : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$2 : FinalizationRegistry,
	'%Function%': $Function$1,
	'%GeneratorFunction%': needsEval$1,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$2 : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$2 : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$2 : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols$2 && getProto$3 ? getProto$3(getProto$3([][Symbol.iterator]())) : undefined$2,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined$2,
	'%Map%': typeof Map === 'undefined' ? undefined$2 : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols$2 || !getProto$3 ? undefined$2 : getProto$3(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined$2 : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined$2 : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined$2 : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined$2 : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols$2 || !getProto$3 ? undefined$2 : getProto$3(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$2 : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols$2 && getProto$3 ? getProto$3(''[Symbol.iterator]()) : undefined$2,
	'%Symbol%': hasSymbols$2 ? Symbol : undefined$2,
	'%SyntaxError%': $SyntaxError$8,
	'%ThrowTypeError%': ThrowTypeError$1,
	'%TypedArray%': TypedArray$1,
	'%TypeError%': $TypeError$n,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$2 : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$2 : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$2 : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$2 : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$2 : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$2 : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$2 : WeakSet
};

if (getProto$3) {
	try {
		null.error; // eslint-disable-line no-unused-expressions
	} catch (e$1) {
		// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
		var errorProto$1 = getProto$3(getProto$3(e$1));
		INTRINSICS$1['%Error.prototype%'] = errorProto$1;
	}
}

var doEval$1 = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor$1('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor$1('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor$1('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen && getProto$3) {
			value = getProto$3(gen.prototype);
		}
	}

	INTRINSICS$1[name] = value;

	return value;
};

var LEGACY_ALIASES$1 = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind$1 = functionBind;
var hasOwn$3 = src;
var $concat$2 = bind$1.call(Function.call, Array.prototype.concat);
var $spliceApply$1 = bind$1.call(Function.apply, Array.prototype.splice);
var $replace$2 = bind$1.call(Function.call, String.prototype.replace);
var $strSlice$1 = bind$1.call(Function.call, String.prototype.slice);
var $exec$1 = bind$1.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName$1 = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar$1 = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath$1 = function stringToPath(string) {
	var first = $strSlice$1(string, 0, 1);
	var last = $strSlice$1(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError$8('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError$8('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace$2(string, rePropName$1, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace$2(subString, reEscapeChar$1, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic$1 = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn$3(LEGACY_ALIASES$1, intrinsicName)) {
		alias = LEGACY_ALIASES$1[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn$3(INTRINSICS$1, intrinsicName)) {
		var value = INTRINSICS$1[intrinsicName];
		if (value === needsEval$1) {
			value = doEval$1(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError$n('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError$8('intrinsic ' + name + ' does not exist!');
};

var getIntrinsic$1 = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError$n('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError$n('"allowMissing" argument must be a boolean');
	}

	if ($exec$1(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError$8('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath$1(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic$1('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply$1(parts, $concat$2([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice$1(part, 0, 1);
		var last = $strSlice$1(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError$8('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn$3(INTRINSICS$1, intrinsicRealName)) {
			value = INTRINSICS$1[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError$n('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined$2;
			}
			if ($gOPD$1 && (i + 1) >= parts.length) {
				var desc = $gOPD$1(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn$3(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS$1[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

var hasPropertyDescriptors = hasPropertyDescriptors_1$1();

var GetIntrinsic$e = getIntrinsic$1;

var $defineProperty = hasPropertyDescriptors && GetIntrinsic$e('%Object.defineProperty%', true);

var $SyntaxError$7 = GetIntrinsic$e('%SyntaxError%');
var $TypeError$m = GetIntrinsic$e('%TypeError%');

var gopd$1 = gopd$3;

/** @type {(obj: Record<PropertyKey, unknown>, property: PropertyKey, value: unknown, nonEnumerable?: boolean | null, nonWritable?: boolean | null, nonConfigurable?: boolean | null, loose?: boolean) => void} */
var defineDataProperty$1 = function defineDataProperty(
	obj,
	property,
	value
) {
	if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
		throw new $TypeError$m('`obj` must be an object or a function`');
	}
	if (typeof property !== 'string' && typeof property !== 'symbol') {
		throw new $TypeError$m('`property` must be a string or a symbol`');
	}
	if (arguments.length > 3 && typeof arguments[3] !== 'boolean' && arguments[3] !== null) {
		throw new $TypeError$m('`nonEnumerable`, if provided, must be a boolean or null');
	}
	if (arguments.length > 4 && typeof arguments[4] !== 'boolean' && arguments[4] !== null) {
		throw new $TypeError$m('`nonWritable`, if provided, must be a boolean or null');
	}
	if (arguments.length > 5 && typeof arguments[5] !== 'boolean' && arguments[5] !== null) {
		throw new $TypeError$m('`nonConfigurable`, if provided, must be a boolean or null');
	}
	if (arguments.length > 6 && typeof arguments[6] !== 'boolean') {
		throw new $TypeError$m('`loose`, if provided, must be a boolean');
	}

	var nonEnumerable = arguments.length > 3 ? arguments[3] : null;
	var nonWritable = arguments.length > 4 ? arguments[4] : null;
	var nonConfigurable = arguments.length > 5 ? arguments[5] : null;
	var loose = arguments.length > 6 ? arguments[6] : false;

	/* @type {false | TypedPropertyDescriptor<unknown>} */
	var desc = !!gopd$1 && gopd$1(obj, property);

	if ($defineProperty) {
		$defineProperty(obj, property, {
			configurable: nonConfigurable === null && desc ? desc.configurable : !nonConfigurable,
			enumerable: nonEnumerable === null && desc ? desc.enumerable : !nonEnumerable,
			value: value,
			writable: nonWritable === null && desc ? desc.writable : !nonWritable
		});
	} else if (loose || (!nonEnumerable && !nonWritable && !nonConfigurable)) {
		// must fall back to [[Set]], and was not explicitly asked to make non-enumerable, non-writable, or non-configurable
		obj[property] = value; // eslint-disable-line no-param-reassign
	} else {
		throw new $SyntaxError$7('This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.');
	}
};

var keys = objectKeys$1;
var hasSymbols$1 = typeof Symbol === 'function' && typeof Symbol('foo') === 'symbol';

var toStr$2 = Object.prototype.toString;
var concat = Array.prototype.concat;
var defineDataProperty = defineDataProperty$1;

var isFunction = function (fn) {
	return typeof fn === 'function' && toStr$2.call(fn) === '[object Function]';
};

var supportsDescriptors = hasPropertyDescriptors_1$1();

var defineProperty = function (object, name, value, predicate) {
	if (name in object) {
		if (predicate === true) {
			if (object[name] === value) {
				return;
			}
		} else if (!isFunction(predicate) || !predicate()) {
			return;
		}
	}

	if (supportsDescriptors) {
		defineDataProperty(object, name, value, true);
	} else {
		defineDataProperty(object, name, value);
	}
};

var defineProperties = function (object, map) {
	var predicates = arguments.length > 2 ? arguments[2] : {};
	var props = keys(map);
	if (hasSymbols$1) {
		props = concat.call(props, Object.getOwnPropertySymbols(map));
	}
	for (var i = 0; i < props.length; i += 1) {
		defineProperty(object, props[i], map[props[i]], predicates[props[i]]);
	}
};

defineProperties.supportsDescriptors = !!supportsDescriptors;

var defineProperties_1 = defineProperties;

var _nodeResolve_empty = {};

var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
__proto__: null,
'default': _nodeResolve_empty
});

var require$$0 = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

var hasMap = typeof Map === 'function' && Map.prototype;
var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
var mapForEach = hasMap && Map.prototype.forEach;
var hasSet = typeof Set === 'function' && Set.prototype;
var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
var setForEach = hasSet && Set.prototype.forEach;
var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
var booleanValueOf = Boolean.prototype.valueOf;
var objectToString = Object.prototype.toString;
var functionToString = Function.prototype.toString;
var $match = String.prototype.match;
var $slice$1 = String.prototype.slice;
var $replace$1 = String.prototype.replace;
var $toUpperCase = String.prototype.toUpperCase;
var $toLowerCase = String.prototype.toLowerCase;
var $test = RegExp.prototype.test;
var $concat$1 = Array.prototype.concat;
var $join = Array.prototype.join;
var $arrSlice = Array.prototype.slice;
var $floor$2 = Math.floor;
var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
var gOPS = Object.getOwnPropertySymbols;
var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
// ie, `has-tostringtag/shams
var toStringTag = typeof Symbol === 'function' && Symbol.toStringTag && (typeof Symbol.toStringTag === hasShammedSymbols ? 'object' : 'symbol')
    ? Symbol.toStringTag
    : null;
var isEnumerable = Object.prototype.propertyIsEnumerable;

var gPO = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
    [].__proto__ === Array.prototype // eslint-disable-line no-proto
        ? function (O) {
            return O.__proto__; // eslint-disable-line no-proto
        }
        : null
);

function addNumericSeparator(num, str) {
    if (
        num === Infinity
        || num === -Infinity
        || num !== num
        || (num && num > -1000 && num < 1000)
        || $test.call(/e/, str)
    ) {
        return str;
    }
    var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
    if (typeof num === 'number') {
        var int = num < 0 ? -$floor$2(-num) : $floor$2(num); // trunc(num)
        if (int !== num) {
            var intStr = String(int);
            var dec = $slice$1.call(str, intStr.length + 1);
            return $replace$1.call(intStr, sepRegex, '$&_') + '.' + $replace$1.call($replace$1.call(dec, /([0-9]{3})/g, '$&_'), /_$/, '');
        }
    }
    return $replace$1.call(str, sepRegex, '$&_');
}

var utilInspect = require$$0;
var inspectCustom = utilInspect.custom;
var inspectSymbol = isSymbol$1(inspectCustom) ? inspectCustom : null;

var objectInspect = function inspect_(obj, options, depth, seen) {
    var opts = options || {};

    if (has$1(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
    }
    if (
        has$1(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
            ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
            : opts.maxStringLength !== null
        )
    ) {
        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    }
    var customInspect = has$1(opts, 'customInspect') ? opts.customInspect : true;
    if (typeof customInspect !== 'boolean' && customInspect !== 'symbol') {
        throw new TypeError('option "customInspect", if provided, must be `true`, `false`, or `\'symbol\'`');
    }

    if (
        has$1(opts, 'indent')
        && opts.indent !== null
        && opts.indent !== '\t'
        && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
    ) {
        throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
    }
    if (has$1(opts, 'numericSeparator') && typeof opts.numericSeparator !== 'boolean') {
        throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
    }
    var numericSeparator = opts.numericSeparator;

    if (typeof obj === 'undefined') {
        return 'undefined';
    }
    if (obj === null) {
        return 'null';
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false';
    }

    if (typeof obj === 'string') {
        return inspectString(obj, opts);
    }
    if (typeof obj === 'number') {
        if (obj === 0) {
            return Infinity / obj > 0 ? '0' : '-0';
        }
        var str = String(obj);
        return numericSeparator ? addNumericSeparator(obj, str) : str;
    }
    if (typeof obj === 'bigint') {
        var bigIntStr = String(obj) + 'n';
        return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr;
    }

    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
    if (typeof depth === 'undefined') { depth = 0; }
    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
        return isArray$1(obj) ? '[Array]' : '[Object]';
    }

    var indent = getIndent(opts, depth);

    if (typeof seen === 'undefined') {
        seen = [];
    } else if (indexOf(seen, obj) >= 0) {
        return '[Circular]';
    }

    function inspect(value, from, noIndent) {
        if (from) {
            seen = $arrSlice.call(seen);
            seen.push(from);
        }
        if (noIndent) {
            var newOpts = {
                depth: opts.depth
            };
            if (has$1(opts, 'quoteStyle')) {
                newOpts.quoteStyle = opts.quoteStyle;
            }
            return inspect_(value, newOpts, depth + 1, seen);
        }
        return inspect_(value, opts, depth + 1, seen);
    }

    if (typeof obj === 'function' && !isRegExp$1(obj)) { // in older engines, regexes are callable
        var name = nameOf(obj);
        var keys = arrObjKeys(obj, inspect);
        return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + $join.call(keys, ', ') + ' }' : '');
    }
    if (isSymbol$1(obj)) {
        var symString = hasShammedSymbols ? $replace$1.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
        return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
    }
    if (isElement(obj)) {
        var s = '<' + $toLowerCase.call(String(obj.nodeName));
        var attrs = obj.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
            s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
        }
        s += '>';
        if (obj.childNodes && obj.childNodes.length) { s += '...'; }
        s += '</' + $toLowerCase.call(String(obj.nodeName)) + '>';
        return s;
    }
    if (isArray$1(obj)) {
        if (obj.length === 0) { return '[]'; }
        var xs = arrObjKeys(obj, inspect);
        if (indent && !singleLineValues(xs)) {
            return '[' + indentedJoin(xs, indent) + ']';
        }
        return '[ ' + $join.call(xs, ', ') + ' ]';
    }
    if (isError$1(obj)) {
        var parts = arrObjKeys(obj, inspect);
        if (!('cause' in Error.prototype) && 'cause' in obj && !isEnumerable.call(obj, 'cause')) {
            return '{ [' + String(obj) + '] ' + $join.call($concat$1.call('[cause]: ' + inspect(obj.cause), parts), ', ') + ' }';
        }
        if (parts.length === 0) { return '[' + String(obj) + ']'; }
        return '{ [' + String(obj) + '] ' + $join.call(parts, ', ') + ' }';
    }
    if (typeof obj === 'object' && customInspect) {
        if (inspectSymbol && typeof obj[inspectSymbol] === 'function' && utilInspect) {
            return utilInspect(obj, { depth: maxDepth - depth });
        } else if (customInspect !== 'symbol' && typeof obj.inspect === 'function') {
            return obj.inspect();
        }
    }
    if (isMap(obj)) {
        var mapParts = [];
        if (mapForEach) {
            mapForEach.call(obj, function (value, key) {
                mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
            });
        }
        return collectionOf('Map', mapSize.call(obj), mapParts, indent);
    }
    if (isSet(obj)) {
        var setParts = [];
        if (setForEach) {
            setForEach.call(obj, function (value) {
                setParts.push(inspect(value, obj));
            });
        }
        return collectionOf('Set', setSize.call(obj), setParts, indent);
    }
    if (isWeakMap(obj)) {
        return weakCollectionOf('WeakMap');
    }
    if (isWeakSet(obj)) {
        return weakCollectionOf('WeakSet');
    }
    if (isWeakRef(obj)) {
        return weakCollectionOf('WeakRef');
    }
    if (isNumber$1(obj)) {
        return markBoxed(inspect(Number(obj)));
    }
    if (isBigInt(obj)) {
        return markBoxed(inspect(bigIntValueOf.call(obj)));
    }
    if (isBoolean$1(obj)) {
        return markBoxed(booleanValueOf.call(obj));
    }
    if (isString$1(obj)) {
        return markBoxed(inspect(String(obj)));
    }
    // note: in IE 8, sometimes `global !== window` but both are the prototypes of each other
    /* eslint-env browser */
    if (typeof window !== 'undefined' && obj === window) {
        return '{ [object Window] }';
    }
    if (
        (typeof globalThis !== 'undefined' && obj === globalThis)
        || (typeof global !== 'undefined' && obj === global)
    ) {
        return '{ [object globalThis] }';
    }
    if (!isDate$1(obj) && !isRegExp$1(obj)) {
        var ys = arrObjKeys(obj, inspect);
        var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
        var protoTag = obj instanceof Object ? '' : 'null prototype';
        var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? $slice$1.call(toStr$1(obj), 8, -1) : protoTag ? 'Object' : '';
        var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
        var tag = constructorTag + (stringTag || protoTag ? '[' + $join.call($concat$1.call([], stringTag || [], protoTag || []), ': ') + '] ' : '');
        if (ys.length === 0) { return tag + '{}'; }
        if (indent) {
            return tag + '{' + indentedJoin(ys, indent) + '}';
        }
        return tag + '{ ' + $join.call(ys, ', ') + ' }';
    }
    return String(obj);
};

function wrapQuotes(s, defaultStyle, opts) {
    var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
    return quoteChar + s + quoteChar;
}

function quote(s) {
    return $replace$1.call(String(s), /"/g, '&quot;');
}

function isArray$1(obj) { return toStr$1(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isDate$1(obj) { return toStr$1(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isRegExp$1(obj) { return toStr$1(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isError$1(obj) { return toStr$1(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isString$1(obj) { return toStr$1(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isNumber$1(obj) { return toStr$1(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isBoolean$1(obj) { return toStr$1(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

// Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
function isSymbol$1(obj) {
    if (hasShammedSymbols) {
        return obj && typeof obj === 'object' && obj instanceof Symbol;
    }
    if (typeof obj === 'symbol') {
        return true;
    }
    if (!obj || typeof obj !== 'object' || !symToString) {
        return false;
    }
    try {
        symToString.call(obj);
        return true;
    } catch (e) {}
    return false;
}

function isBigInt(obj) {
    if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
        return false;
    }
    try {
        bigIntValueOf.call(obj);
        return true;
    } catch (e) {}
    return false;
}

var hasOwn$2 = Object.prototype.hasOwnProperty || function (key) { return key in this; };
function has$1(obj, key) {
    return hasOwn$2.call(obj, key);
}

function toStr$1(obj) {
    return objectToString.call(obj);
}

function nameOf(f) {
    if (f.name) { return f.name; }
    var m = $match.call(functionToString.call(f), /^function\s*([\w$]+)/);
    if (m) { return m[1]; }
    return null;
}

function indexOf(xs, x) {
    if (xs.indexOf) { return xs.indexOf(x); }
    for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) { return i; }
    }
    return -1;
}

function isMap(x) {
    if (!mapSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        mapSize.call(x);
        try {
            setSize.call(x);
        } catch (s) {
            return true;
        }
        return x instanceof Map; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakMap(x) {
    if (!weakMapHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakMapHas.call(x, weakMapHas);
        try {
            weakSetHas.call(x, weakSetHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakRef(x) {
    if (!weakRefDeref || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakRefDeref.call(x);
        return true;
    } catch (e) {}
    return false;
}

function isSet(x) {
    if (!setSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        setSize.call(x);
        try {
            mapSize.call(x);
        } catch (m) {
            return true;
        }
        return x instanceof Set; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakSet(x) {
    if (!weakSetHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakSetHas.call(x, weakSetHas);
        try {
            weakMapHas.call(x, weakMapHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isElement(x) {
    if (!x || typeof x !== 'object') { return false; }
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
        return true;
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
}

function inspectString(str, opts) {
    if (str.length > opts.maxStringLength) {
        var remaining = str.length - opts.maxStringLength;
        var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
        return inspectString($slice$1.call(str, 0, opts.maxStringLength), opts) + trailer;
    }
    // eslint-disable-next-line no-control-regex
    var s = $replace$1.call($replace$1.call(str, /(['\\])/g, '\\$1'), /[\x00-\x1f]/g, lowbyte);
    return wrapQuotes(s, 'single', opts);
}

function lowbyte(c) {
    var n = c.charCodeAt(0);
    var x = {
        8: 'b',
        9: 't',
        10: 'n',
        12: 'f',
        13: 'r'
    }[n];
    if (x) { return '\\' + x; }
    return '\\x' + (n < 0x10 ? '0' : '') + $toUpperCase.call(n.toString(16));
}

function markBoxed(str) {
    return 'Object(' + str + ')';
}

function weakCollectionOf(type) {
    return type + ' { ? }';
}

function collectionOf(type, size, entries, indent) {
    var joinedEntries = indent ? indentedJoin(entries, indent) : $join.call(entries, ', ');
    return type + ' (' + size + ') {' + joinedEntries + '}';
}

function singleLineValues(xs) {
    for (var i = 0; i < xs.length; i++) {
        if (indexOf(xs[i], '\n') >= 0) {
            return false;
        }
    }
    return true;
}

function getIndent(opts, depth) {
    var baseIndent;
    if (opts.indent === '\t') {
        baseIndent = '\t';
    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
        baseIndent = $join.call(Array(opts.indent + 1), ' ');
    } else {
        return null;
    }
    return {
        base: baseIndent,
        prev: $join.call(Array(depth + 1), baseIndent)
    };
}

function indentedJoin(xs, indent) {
    if (xs.length === 0) { return ''; }
    var lineJoiner = '\n' + indent.prev + indent.base;
    return lineJoiner + $join.call(xs, ',' + lineJoiner) + '\n' + indent.prev;
}

function arrObjKeys(obj, inspect) {
    var isArr = isArray$1(obj);
    var xs = [];
    if (isArr) {
        xs.length = obj.length;
        for (var i = 0; i < obj.length; i++) {
            xs[i] = has$1(obj, i) ? inspect(obj[i], obj) : '';
        }
    }
    var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
    var symMap;
    if (hasShammedSymbols) {
        symMap = {};
        for (var k = 0; k < syms.length; k++) {
            symMap['$' + syms[k]] = syms[k];
        }
    }

    for (var key in obj) { // eslint-disable-line no-restricted-syntax
        if (!has$1(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
            // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
            continue; // eslint-disable-line no-restricted-syntax, no-continue
        } else if ($test.call(/[^\w$]/, key)) {
            xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
        } else {
            xs.push(key + ': ' + inspect(obj[key], obj));
        }
    }
    if (typeof gOPS === 'function') {
        for (var j = 0; j < syms.length; j++) {
            if (isEnumerable.call(obj, syms[j])) {
                xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
            }
        }
    }
    return xs;
}

// https://262.ecma-international.org/6.0/#sec-ispropertykey

var IsPropertyKey$2 = function IsPropertyKey(argument) {
	return typeof argument === 'string' || typeof argument === 'symbol';
};

// https://262.ecma-international.org/5.1/#sec-8

var Type$5 = function Type(x) {
	if (x === null) {
		return 'Null';
	}
	if (typeof x === 'undefined') {
		return 'Undefined';
	}
	if (typeof x === 'function' || typeof x === 'object') {
		return 'Object';
	}
	if (typeof x === 'number') {
		return 'Number';
	}
	if (typeof x === 'boolean') {
		return 'Boolean';
	}
	if (typeof x === 'string') {
		return 'String';
	}
};

var ES5Type = Type$5;

// https://262.ecma-international.org/11.0/#sec-ecmascript-data-types-and-values

var Type$4 = function Type(x) {
	if (typeof x === 'symbol') {
		return 'Symbol';
	}
	if (typeof x === 'bigint') {
		return 'BigInt';
	}
	return ES5Type(x);
};

var $TypeError$l = type;

var inspect = objectInspect;

var IsPropertyKey$1 = IsPropertyKey$2;
var Type$3 = Type$4;

// https://262.ecma-international.org/6.0/#sec-get-o-p

var Get$1 = function Get(O, P) {
	// 7.3.1.1
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$l('Assertion failed: Type(O) is not Object');
	}
	// 7.3.1.2
	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$l('Assertion failed: IsPropertyKey(P) is not true, got ' + inspect(P));
	}
	// 7.3.1.3
	return O[P];
};

var _isNaN = Number.isNaN || function isNaN(a) {
	return a !== a;
};

var $isNaN$3 = _isNaN;

var _isFinite = function (x) { return (typeof x === 'number' || typeof x === 'bigint') && !$isNaN$3(x) && x !== Infinity && x !== -Infinity; };

var GetIntrinsic$d = getIntrinsic$4;

var $abs = GetIntrinsic$d('%Math.abs%');
var $floor$1 = GetIntrinsic$d('%Math.floor%');

var $isNaN$2 = _isNaN;
var $isFinite$1 = _isFinite;

var isInteger$4 = function isInteger(argument) {
	if (typeof argument !== 'number' || $isNaN$2(argument) || !$isFinite$1(argument)) {
		return false;
	}
	var absValue = $abs(argument);
	return $floor$1(absValue) === absValue;
};

var test$2 = {
	foo: {}
};

var $Object$2 = Object;

var hasProto$7 = function hasProto() {
	return { __proto__: test$2 }.foo === test$2.foo && !({ __proto__: null } instanceof $Object$2);
};

var undefined$1;

var $SyntaxError$6 = SyntaxError;
var $Function = Function;
var $TypeError$k = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError$k();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = hasSymbols$6();
var hasProto$6 = hasProto$7();

var getProto$2 = Object.getPrototypeOf || (
	hasProto$6
		? function (x) { return x.__proto__; } // eslint-disable-line no-proto
		: null
);

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' || !getProto$2 ? undefined$1 : getProto$2(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$1 : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols && getProto$2 ? getProto$2([][Symbol.iterator]()) : undefined$1,
	'%AsyncFromSyncIteratorPrototype%': undefined$1,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined$1 : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined$1 : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined$1 : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$1 : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols && getProto$2 ? getProto$2(getProto$2([][Symbol.iterator]())) : undefined$1,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols || !getProto$2 ? undefined$1 : getProto$2(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols || !getProto$2 ? undefined$1 : getProto$2(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols && getProto$2 ? getProto$2(''[Symbol.iterator]()) : undefined$1,
	'%Symbol%': hasSymbols ? Symbol : undefined$1,
	'%SyntaxError%': $SyntaxError$6,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError$k,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$1 : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet
};

if (getProto$2) {
	try {
		null.error; // eslint-disable-line no-unused-expressions
	} catch (e$1) {
		// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
		var errorProto = getProto$2(getProto$2(e$1));
		INTRINSICS['%Error.prototype%'] = errorProto;
	}
}

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen && getProto$2) {
			value = getProto$2(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = functionBind;
var hasOwn$1 = src;
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);
var $exec = bind.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError$6('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError$6('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn$1(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn$1(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError$k('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError$6('intrinsic ' + name + ' does not exist!');
};

var getIntrinsic = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError$k('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError$k('"allowMissing" argument must be a boolean');
	}

	if ($exec(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError$6('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError$6('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn$1(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError$k('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined$1;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn$1(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

var callBind$3 = callBindExports;
var callBound$6 = callBound$8;
var GetIntrinsic$c = getIntrinsic;

var $ArrayBuffer = GetIntrinsic$c('%ArrayBuffer%', true);
/** @type {undefined | ((receiver: ArrayBuffer) => number) | ((receiver: unknown) => never)} */
var $byteLength$3 = callBound$6('ArrayBuffer.prototype.byteLength', true);
var $toString = callBound$6('Object.prototype.toString');

// in node 0.10, ArrayBuffers have no prototype methods, but have an own slot-checking `slice` method
var abSlice = !!$ArrayBuffer && !$byteLength$3 && new $ArrayBuffer(0).slice;
var $abSlice = !!abSlice && callBind$3(abSlice);

/** @type {import('.')} */
var isArrayBuffer$6 = $byteLength$3 || $abSlice
	? function isArrayBuffer(obj) {
		if (!obj || typeof obj !== 'object') {
			return false;
		}
		try {
			if ($byteLength$3) {
				// @ts-expect-error no idea why TS can't handle the overload
				$byteLength$3(obj);
			} else {
				// @ts-expect-error TS chooses not to type-narrow inside a closure
				$abSlice(obj, 0);
			}
			return true;
		} catch (e) {
			return false;
		}
	}
	: $ArrayBuffer
		// in node 0.8, ArrayBuffers have no prototype or own methods, but also no Symbol.toStringTag
		? function isArrayBuffer(obj) {
			return $toString(obj) === '[object ArrayBuffer]';
		}
		: function isArrayBuffer(obj) { // eslint-disable-line no-unused-vars
			return false;
		};

var callBound$5 = callBound$8;
var $byteLength$2 = callBound$5('ArrayBuffer.prototype.byteLength', true);

var isArrayBuffer$5 = isArrayBuffer$6;

/** @type {import('.')} */
var arrayBufferByteLength$1 = function byteLength(ab) {
	if (!isArrayBuffer$5(ab)) {
		return NaN;
	}
	return $byteLength$2 ? $byteLength$2(ab) : ab.byteLength;
}; // in node < 0.11, byteLength is an own nonconfigurable property

var possibleNames$1 = possibleTypedArrayNames;

var g$1 = typeof globalThis === 'undefined' ? global : globalThis;

/** @type {import('.')} */
var availableTypedArrays$4 = function availableTypedArrays() {
	var /** @type {ReturnType<typeof availableTypedArrays>} */ out = [];
	for (var i = 0; i < possibleNames$1.length; i++) {
		if (typeof g$1[possibleNames$1[i]] === 'function') {
			// @ts-expect-error
			out[out.length] = possibleNames$1[i];
		}
	}
	return out;
};

var callBound$4 = callBound$8;

var $byteLength$1 = callBound$4('SharedArrayBuffer.prototype.byteLength', true);

/** @type {import('.')} */
var isSharedArrayBuffer$5 = $byteLength$1
	? function isSharedArrayBuffer(obj) {
		if (!obj || typeof obj !== 'object') {
			return false;
		}
		try {
			$byteLength$1(obj);
			return true;
		} catch (e) {
			return false;
		}
	}
	: function isSharedArrayBuffer(obj) { // eslint-disable-line no-unused-vars
		return false;
	};

var $TypeError$j = type;

var $byteLength = arrayBufferByteLength$1;
var availableTypedArrays$3 = availableTypedArrays$4();
var callBound$3 = callBound$8;
var isArrayBuffer$4 = isArrayBuffer$6;
var isSharedArrayBuffer$4 = isSharedArrayBuffer$5;

var $sabByteLength = callBound$3('SharedArrayBuffer.prototype.byteLength', true);

// https://262.ecma-international.org/8.0/#sec-isdetachedbuffer

var IsDetachedBuffer$6 = function IsDetachedBuffer(arrayBuffer) {
	var isSAB = isSharedArrayBuffer$4(arrayBuffer);
	if (!isArrayBuffer$4(arrayBuffer) && !isSAB) {
		throw new $TypeError$j('Assertion failed: `arrayBuffer` must be an Object with an [[ArrayBufferData]] internal slot');
	}
	if ((isSAB ? $sabByteLength : $byteLength)(arrayBuffer) === 0) {
		try {
			new global[availableTypedArrays$3[0]](arrayBuffer); // eslint-disable-line no-new
		} catch (error) {
			return !!error && error.name === 'TypeError';
		}
	}
	return false;
};

var HasOwnProperty;
var hasRequiredHasOwnProperty;

function requireHasOwnProperty () {
	if (hasRequiredHasOwnProperty) return HasOwnProperty;
	hasRequiredHasOwnProperty = 1;

	var $TypeError = type;

	var hasOwn = hasown;

	var IsPropertyKey = IsPropertyKey$2;
	var Type = Type$4;

	// https://262.ecma-international.org/6.0/#sec-hasownproperty

	HasOwnProperty = function HasOwnProperty(O, P) {
		if (Type(O) !== 'Object') {
			throw new $TypeError('Assertion failed: `O` must be an Object');
		}
		if (!IsPropertyKey(P)) {
			throw new $TypeError('Assertion failed: `P` must be a Property Key');
		}
		return hasOwn(O, P);
	};
	return HasOwnProperty;
}

var GetIntrinsic$b = getIntrinsic$4;

var $Array = GetIntrinsic$b('%Array%');

// eslint-disable-next-line global-require
var toStr = !$Array.isArray && callBound$8('Object.prototype.toString');

var IsArray$3 = $Array.isArray || function IsArray(argument) {
	return toStr(argument) === '[object Array]';
};

// https://262.ecma-international.org/6.0/#sec-isarray
var IsArray$2 = IsArray$3;

var IsBigIntElementType$1;
var hasRequiredIsBigIntElementType;

function requireIsBigIntElementType () {
	if (hasRequiredIsBigIntElementType) return IsBigIntElementType$1;
	hasRequiredIsBigIntElementType = 1;

	// https://262.ecma-international.org/15.0/#sec-isbigintelementtype

	IsBigIntElementType$1 = function IsBigIntElementType(type) {
		return type === 'BIGUINT64' || type === 'BIGINT64';
	};
	return IsBigIntElementType$1;
}

var IsUnsignedElementType;
var hasRequiredIsUnsignedElementType;

function requireIsUnsignedElementType () {
	if (hasRequiredIsUnsignedElementType) return IsUnsignedElementType;
	hasRequiredIsUnsignedElementType = 1;

	// https://262.ecma-international.org/15.0/#sec-isunsignedelementtype

	IsUnsignedElementType = function IsUnsignedElementType(type) {
		return type === 'UINT8'
			|| type === 'UINT8C'
			|| type === 'UINT16'
			|| type === 'UINT32'
			|| type === 'BIGUINT64';
	};
	return IsUnsignedElementType;
}

var bytesAsFloat32;
var hasRequiredBytesAsFloat32;

function requireBytesAsFloat32 () {
	if (hasRequiredBytesAsFloat32) return bytesAsFloat32;
	hasRequiredBytesAsFloat32 = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $pow = GetIntrinsic('%Math.pow%');

	bytesAsFloat32 = function bytesAsFloat32(rawBytes) {
		// return new $Float32Array(new $Uint8Array(rawBytes).buffer)[0];

		/*
	        Let value be the byte elements of rawBytes concatenated and interpreted as a little-endian bit string encoding of an IEEE 754-2008 binary32 value.
	If value is an IEEE 754-2008 binary32 NaN value, return the NaN Number value.
	Return the Number value that corresponds to value.
	        */
		var sign = rawBytes[3] & 0x80 ? -1 : 1; // Check the sign bit
		var exponent = ((rawBytes[3] & 0x7F) << 1)
			| (rawBytes[2] >> 7); // Combine bits for exponent
		var mantissa = ((rawBytes[2] & 0x7F) << 16)
			| (rawBytes[1] << 8)
			| rawBytes[0]; // Combine bits for mantissa

		if (exponent === 0 && mantissa === 0) {
			return sign === 1 ? 0 : -0;
		}
		if (exponent === 0xFF && mantissa === 0) {
			return sign === 1 ? Infinity : -Infinity;
		}
		if (exponent === 0xFF && mantissa !== 0) {
			return NaN;
		}

		exponent -= 127; // subtract the bias

		if (exponent === -127) {
			return sign * mantissa * $pow(2, -126 - 23);
		}
		return sign * (1 + (mantissa * $pow(2, -23))) * $pow(2, exponent);
	};
	return bytesAsFloat32;
}

var bytesAsFloat64;
var hasRequiredBytesAsFloat64;

function requireBytesAsFloat64 () {
	if (hasRequiredBytesAsFloat64) return bytesAsFloat64;
	hasRequiredBytesAsFloat64 = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $pow = GetIntrinsic('%Math.pow%');

	bytesAsFloat64 = function bytesAsFloat64(rawBytes) {
		// return new $Float64Array(new $Uint8Array(rawBytes).buffer)[0];

		/*
	    Let value be the byte elements of rawBytes concatenated and interpreted as a little-endian bit string encoding of an IEEE 754-2008 binary64 value.
	If value is an IEEE 754-2008 binary64 NaN value, return the NaN Number value.
	Return the Number value that corresponds to value.
	    */
		var sign = rawBytes[7] & 0x80 ? -1 : 1; // first bit
		var exponent = ((rawBytes[7] & 0x7F) << 4) // 7 bits from index 7
	        | ((rawBytes[6] & 0xF0) >> 4); // 4 bits from index 6
		var mantissa = ((rawBytes[6] & 0x0F) * 0x1000000000000) // 4 bits from index 6
	        + (rawBytes[5] * 0x10000000000) // 8 bits from index 5
	        + (rawBytes[4] * 0x100000000) // 8 bits from index 4
	        + (rawBytes[3] * 0x1000000) // 8 bits from index 3
	        + (rawBytes[2] * 0x10000) // 8 bits from index 2
	        + (rawBytes[1] * 0x100) // 8 bits from index 1
	        + rawBytes[0]; // 8 bits from index 0

		if (exponent === 0 && mantissa === 0) {
			return sign * 0;
		}
		if (exponent === 0x7FF && mantissa !== 0) {
			return NaN;
		}
		if (exponent === 0x7FF && mantissa === 0) {
			return sign * Infinity;
		}

		exponent -= 1023; // subtract the bias

		// Handle subnormal numbers
		if (exponent === -1023) {
			return sign * mantissa * 5e-324; // $pow(2, -1022 - 52)
		}

		return sign * (1 + (mantissa / 0x10000000000000)) * $pow(2, exponent);
	};
	return bytesAsFloat64;
}

var bytesAsInteger;
var hasRequiredBytesAsInteger;

function requireBytesAsInteger () {
	if (hasRequiredBytesAsInteger) return bytesAsInteger;
	hasRequiredBytesAsInteger = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $pow = GetIntrinsic('%Math.pow%');
	var $Number = GetIntrinsic('%Number%');
	var $BigInt = GetIntrinsic('%BigInt%', true);

	bytesAsInteger = function bytesAsInteger(rawBytes, elementSize, isUnsigned, isBigInt) {
		var Z = isBigInt ? $BigInt : $Number;

		// this is common to both branches
		var intValue = Z(0);
		for (var i = 0; i < rawBytes.length; i++) {
			intValue += Z(rawBytes[i] * $pow(2, 8 * i));
		}
		/*
		Let intValue be the byte elements of rawBytes concatenated and interpreted as a bit string encoding of an unsigned little-endian binary number.
		*/

		if (!isUnsigned) { // steps 5-6
			// Let intValue be the byte elements of rawBytes concatenated and interpreted as a bit string encoding of a binary little-endian 2's complement number of bit length elementSize × 8.
			var bitLength = elementSize * 8;

			if (rawBytes[elementSize - 1] & 0x80) {
				intValue -= Z($pow(2, bitLength));
			}
		}

		return intValue; // step 7
	};
	return bytesAsInteger;
}

var every;
var hasRequiredEvery;

function requireEvery () {
	if (hasRequiredEvery) return every;
	hasRequiredEvery = 1;

	every = function every(array, predicate) {
		for (var i = 0; i < array.length; i += 1) {
			if (!predicate(array[i], i, array)) {
				return false;
			}
		}
		return true;
	};
	return every;
}

var isByteValue;
var hasRequiredIsByteValue;

function requireIsByteValue () {
	if (hasRequiredIsByteValue) return isByteValue;
	hasRequiredIsByteValue = 1;

	isByteValue = function isByteValue(value) {
		return typeof value === 'number' && value >= 0 && value <= 255 && (value | 0) === value;
	};
	return isByteValue;
}

var RawBytesToNumeric$1;
var hasRequiredRawBytesToNumeric;

function requireRawBytesToNumeric () {
	if (hasRequiredRawBytesToNumeric) return RawBytesToNumeric$1;
	hasRequiredRawBytesToNumeric = 1;

	var GetIntrinsic = getIntrinsic$4;
	var callBound = callBound$8;

	var $RangeError = range;
	var $SyntaxError = syntax;
	var $TypeError = type;
	var $BigInt = GetIntrinsic('%BigInt%', true);

	var hasOwnProperty = requireHasOwnProperty();
	var IsArray = IsArray$2;
	var IsBigIntElementType = requireIsBigIntElementType();
	var IsUnsignedElementType = requireIsUnsignedElementType();

	var bytesAsFloat32 = requireBytesAsFloat32();
	var bytesAsFloat64 = requireBytesAsFloat64();
	var bytesAsInteger = requireBytesAsInteger();
	var every = requireEvery();
	var isByteValue = requireIsByteValue();

	var $reverse = callBound('Array.prototype.reverse');
	var $slice = callBound('Array.prototype.slice');

	var keys = objectKeys$1;

	// https://262.ecma-international.org/15.0/#table-the-typedarray-constructors
	var TypeToSizes = {
		__proto__: null,
		INT8: 1,
		UINT8: 1,
		UINT8C: 1,
		INT16: 2,
		UINT16: 2,
		INT32: 4,
		UINT32: 4,
		BIGINT64: 8,
		BIGUINT64: 8,
		FLOAT32: 4,
		FLOAT64: 8
	};

	// https://262.ecma-international.org/15.0/#sec-rawbytestonumeric

	RawBytesToNumeric$1 = function RawBytesToNumeric(type, rawBytes, isLittleEndian) {
		if (!hasOwnProperty(TypeToSizes, type)) {
			throw new $TypeError('Assertion failed: `type` must be a TypedArray element type: ' + keys(TypeToSizes));
		}
		if (!IsArray(rawBytes) || !every(rawBytes, isByteValue)) {
			throw new $TypeError('Assertion failed: `rawBytes` must be an Array of bytes');
		}
		if (typeof isLittleEndian !== 'boolean') {
			throw new $TypeError('Assertion failed: `isLittleEndian` must be a Boolean');
		}

		var elementSize = TypeToSizes[type]; // step 1

		if (rawBytes.length !== elementSize) {
			// this assertion is not in the spec, but it'd be an editorial error if it were ever violated
			throw new $RangeError('Assertion failed: `rawBytes` must have a length of ' + elementSize + ' for type ' + type);
		}

		var isBigInt = IsBigIntElementType(type);
		if (isBigInt && !$BigInt) {
			throw new $SyntaxError('this environment does not support BigInts');
		}

		// eslint-disable-next-line no-param-reassign
		rawBytes = $slice(rawBytes, 0, elementSize);
		if (!isLittleEndian) {
			$reverse(rawBytes); // step 2
		}

		if (type === 'FLOAT32') { // step 3
			return bytesAsFloat32(rawBytes);
		}

		if (type === 'FLOAT64') { // step 4
			return bytesAsFloat64(rawBytes);
		}

		return bytesAsInteger(rawBytes, elementSize, IsUnsignedElementType(type), isBigInt);
	};
	return RawBytesToNumeric$1;
}

var isarray;
var hasRequiredIsarray;

function requireIsarray () {
	if (hasRequiredIsarray) return isarray;
	hasRequiredIsarray = 1;
	var toString = {}.toString;

	isarray = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};
	return isarray;
}

var safeArrayConcat;
var hasRequiredSafeArrayConcat;

function requireSafeArrayConcat () {
	if (hasRequiredSafeArrayConcat) return safeArrayConcat;
	hasRequiredSafeArrayConcat = 1;

	var GetIntrinsic = getIntrinsic$4;
	var $concat = GetIntrinsic('%Array.prototype.concat%');

	var callBind = callBindExports;

	var callBound = callBound$8;
	var $slice = callBound('Array.prototype.slice');

	var hasSymbols = requireShams$2()();
	var isConcatSpreadable = hasSymbols && Symbol.isConcatSpreadable;

	/** @type {never[]} */ var empty = [];
	var $concatApply = isConcatSpreadable ? callBind.apply($concat, empty) : null;

	// eslint-disable-next-line no-extra-parens
	var isArray = isConcatSpreadable ? /** @type {(value: unknown) => value is unknown[]} */ (requireIsarray()) : null;

	/** @type {import('.')} */
	safeArrayConcat = isConcatSpreadable
		// eslint-disable-next-line no-unused-vars
		? function safeArrayConcat(item) {
			var arguments$1 = arguments;

			for (var i = 0; i < arguments.length; i += 1) {
				/** @type {typeof item} */ var arg = arguments$1[i];
				// @ts-expect-error ts(2538) see https://github.com/microsoft/TypeScript/issues/9998#issuecomment-1890787975; works if `const`
				if (arg && typeof arg === 'object' && typeof arg[isConcatSpreadable] === 'boolean') {
					// @ts-expect-error ts(7015) TS doesn't yet support Symbol indexing
					if (!empty[isConcatSpreadable]) {
						// @ts-expect-error ts(7015) TS doesn't yet support Symbol indexing
						empty[isConcatSpreadable] = true;
					}
					// @ts-expect-error ts(2721) ts(18047) not sure why TS can't figure out this can't be null
					var arr = isArray(arg) ? $slice(arg) : [arg];
					// @ts-expect-error ts(7015) TS can't handle expandos on an array
					arr[isConcatSpreadable] = true; // shadow the property. TODO: use [[Define]]
					arguments$1[i] = arr;
				}
			}
			// @ts-expect-error ts(2345) https://github.com/microsoft/TypeScript/issues/57164 TS doesn't understand that apply can take an arguments object
			return $concatApply(arguments);
		}
		: callBind($concat, empty);
	return safeArrayConcat;
}

// https://262.ecma-international.org/15.0/#table-the-typedarray-constructors

var typedArrayObjects = {
	__proto__: null,
	name: {
		__proto__: null,
		$Int8Array: 'INT8',
		$Uint8Array: 'UINT8',
		$Uint8ClampedArray: 'UINT8C',
		$Int16Array: 'INT16',
		$Uint16Array: 'UINT16',
		$Int32Array: 'INT32',
		$Uint32Array: 'UINT32',
		$BigInt64Array: 'BIGINT64',
		$BigUint64Array: 'BIGUINT64',
		$Float32Array: 'FLOAT32',
		$Float64Array: 'FLOAT64'
	},
	size: {
		__proto__: null,
		$INT8: 1,
		$UINT8: 1,
		$UINT8C: 1,
		$INT16: 2,
		$UINT16: 2,
		$INT32: 4,
		$UINT32: 4,
		$BIGINT64: 8,
		$BIGUINT64: 8,
		$FLOAT32: 4,
		$FLOAT64: 8
	}
};

var isTypedArray$6;
var hasRequiredIsTypedArray;

function requireIsTypedArray () {
	if (hasRequiredIsTypedArray) return isTypedArray$6;
	hasRequiredIsTypedArray = 1;

	var whichTypedArray = whichTypedArray$4;

	/** @type {import('.')} */
	isTypedArray$6 = function isTypedArray(value) {
		return !!whichTypedArray(value);
	};
	return isTypedArray$6;
}

var $TypeError$i = type;

var callBound$2 = callBound$8;

var $typedArrayBuffer = callBound$2('TypedArray.prototype.buffer', true);

var isTypedArray$5 = requireIsTypedArray();

/** @type {import('.')} */
// node <= 0.10, < 0.11.4 has a nonconfigurable own property instead of a prototype getter
var typedArrayBuffer$4 = $typedArrayBuffer || function typedArrayBuffer(x) {
	if (!isTypedArray$5(x)) {
		throw new $TypeError$i('Not a Typed Array');
	}
	return x.buffer;
};

var defaultEndianness$2;
var hasRequiredDefaultEndianness;

function requireDefaultEndianness () {
	if (hasRequiredDefaultEndianness) return defaultEndianness$2;
	hasRequiredDefaultEndianness = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $Uint8Array = GetIntrinsic('%Uint8Array%', true);
	var $Uint32Array = GetIntrinsic('%Uint32Array%', true);

	var typedArrayBuffer = typedArrayBuffer$4;

	var uInt32 = $Uint32Array && new $Uint32Array([0x12345678]);
	var uInt8 = uInt32 && new $Uint8Array(typedArrayBuffer(uInt32));

	defaultEndianness$2 = uInt8
		? uInt8[0] === 0x78
			? 'little'
			: uInt8[0] === 0x12
				? 'big'
				: uInt8[0] === 0x34
					? 'mixed' // https://developer.mozilla.org/en-US/docs/Glossary/Endianness
					: 'unknown' // ???
		: 'indeterminate'; // no way to know
	return defaultEndianness$2;
}

var GetIntrinsic$a = getIntrinsic$4;

var $SyntaxError$5 = syntax;
var $TypeError$h = type;
var $Uint8Array$1 = GetIntrinsic$a('%Uint8Array%', true);

var callBound$1 = callBound$8;

var $slice = callBound$1('Array.prototype.slice');

var isInteger$3 = isInteger$4;

var IsDetachedBuffer$5 = IsDetachedBuffer$6;
var RawBytesToNumeric = requireRawBytesToNumeric();

var isArrayBuffer$3 = isArrayBuffer$6;
var isSharedArrayBuffer$3 = isSharedArrayBuffer$5;
var safeConcat = requireSafeArrayConcat();

var tableTAO$3 = typedArrayObjects;

var defaultEndianness$1 = requireDefaultEndianness();

// https://262.ecma-international.org/15.0/#sec-getvaluefrombuffer

var GetValueFromBuffer$1 = function GetValueFromBuffer(arrayBuffer, byteIndex, type, isTypedArray, order) {
	var isSAB = isSharedArrayBuffer$3(arrayBuffer);
	if (!isArrayBuffer$3(arrayBuffer) && !isSAB) {
		throw new $TypeError$h('Assertion failed: `arrayBuffer` must be an ArrayBuffer or a SharedArrayBuffer');
	}

	if (!isInteger$3(byteIndex)) {
		throw new $TypeError$h('Assertion failed: `byteIndex` must be an integer');
	}

	if (typeof type !== 'string' || typeof tableTAO$3.size['$' + type] !== 'number') {
		throw new $TypeError$h('Assertion failed: `type` must be a Typed Array element type');
	}

	if (typeof isTypedArray !== 'boolean') {
		throw new $TypeError$h('Assertion failed: `isTypedArray` must be a boolean');
	}

	if (order !== 'SEQ-CST' && order !== 'UNORDERED') {
		throw new $TypeError$h('Assertion failed: `order` must be either `SEQ-CST` or `UNORDERED`');
	}

	if (arguments.length > 5 && typeof arguments[5] !== 'boolean') {
		throw new $TypeError$h('Assertion failed: `isLittleEndian` must be a boolean, if present');
	}

	if (IsDetachedBuffer$5(arrayBuffer)) {
		throw new $TypeError$h('Assertion failed: `arrayBuffer` is detached'); // step 1
	}

	// 2. Assert: There are sufficient bytes in arrayBuffer starting at byteIndex to represent a value of type.

	if (byteIndex < 0) {
		throw new $TypeError$h('Assertion failed: `byteIndex` must be non-negative'); // step 3
	}

	// 4. Let block be arrayBuffer.[[ArrayBufferData]].

	var elementSize = tableTAO$3.size['$' + type]; // step 5
	if (!elementSize) {
		throw new $TypeError$h('Assertion failed: `type` must be one of "INT8", "UINT8", "UINT8C", "INT16", "UINT16", "INT32", "UINT32", "BIGINT64", "BIGUINT64", "FLOAT32", or "FLOAT64"');
	}

	var rawValue;
	if (isSAB) { // step 6
		/*
		a. Let execution be the [[CandidateExecution]] field of the surrounding agent's Agent Record.
		b. Let eventList be the [[EventList]] field of the element in execution.[[EventLists]] whose [[AgentSignifier]] is AgentSignifier().
		c. If isTypedArray is true and type is "Int8", "Uint8", "Int16", "Uint16", "Int32", or "Uint32", let noTear be true; otherwise let noTear be false.
		d. Let rawValue be a List of length elementSize of nondeterministically chosen byte values.
		e. NOTE: In implementations, rawValue is the result of a non-atomic or atomic read instruction on the underlying hardware. The nondeterminism is a semantic prescription of the memory model to describe observable behaviour of hardware with weak consistency.
		f. Let readEvent be ReadSharedMemory{ [[Order]]: order, [[NoTear]]: noTear, [[Block]]: block, [[ByteIndex]]: byteIndex, [[ElementSize]]: elementSize }.
		g. Append readEvent to eventList.
		h. Append Chosen Value Record { [[Event]]: readEvent, [[ChosenValue]]: rawValue } to execution.[[ChosenValues]].
		*/
		throw new $SyntaxError$5('SharedArrayBuffer is not supported by this implementation');
	} else {
		// 7. Let rawValue be a List of elementSize containing, in order, the elementSize sequence of bytes starting with block[byteIndex].
		rawValue = $slice(new $Uint8Array$1(arrayBuffer, byteIndex), 0, elementSize); // step 6
	}

	// 8. If isLittleEndian is not present, set isLittleEndian to either true or false. The choice is implementation dependent and should be the alternative that is most efficient for the implementation. An implementation must use the same value each time this step is executed and the same value must be used for the corresponding step in the SetValueInBuffer abstract operation.
	var isLittleEndian = arguments.length > 5 ? arguments[5] : defaultEndianness$1 === 'little'; // step 8

	var bytes = isLittleEndian
		? $slice(safeConcat([0, 0, 0, 0, 0, 0, 0, 0], rawValue), -elementSize)
		: $slice(safeConcat(rawValue, [0, 0, 0, 0, 0, 0, 0, 0]), 0, elementSize);

	return RawBytesToNumeric(type, bytes, isLittleEndian);
};

var GetIntrinsic$9 = getIntrinsic$4;

// https://262.ecma-international.org/6.0/#sec-algorithm-conventions

var max$1 = GetIntrinsic$9('%Math.max%');

var GetIntrinsic$8 = getIntrinsic$4;

// https://262.ecma-international.org/6.0/#sec-algorithm-conventions

var min$1 = GetIntrinsic$8('%Math.min%');

var $isNaN$1 = _isNaN;

// http://262.ecma-international.org/5.1/#sec-9.12

var SameValue$1 = function SameValue(x, y) {
	if (x === y) { // 0 === -0, but they are not identical.
		if (x === 0) { return 1 / x === 1 / y; }
		return true;
	}
	return $isNaN$1(x) && $isNaN$1(y);
};

var $TypeError$g = type;

var IsPropertyKey = IsPropertyKey$2;
var SameValue = SameValue$1;
var Type$2 = Type$4;

// IE 9 does not throw in strict mode when writability/configurability/extensibility is violated
var noThrowOnStrictViolation = (function () {
	try {
		delete [].length;
		return true;
	} catch (e) {
		return false;
	}
}());

// https://262.ecma-international.org/6.0/#sec-set-o-p-v-throw

var _Set = function Set(O, P, V, Throw) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$g('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError$g('Assertion failed: `P` must be a Property Key');
	}
	if (typeof Throw !== 'boolean') {
		throw new $TypeError$g('Assertion failed: `Throw` must be a Boolean');
	}
	if (Throw) {
		O[P] = V; // eslint-disable-line no-param-reassign
		if (noThrowOnStrictViolation && !SameValue(O[P], V)) {
			throw new $TypeError$g('Attempted to assign to readonly property.');
		}
		return true;
	}
	try {
		O[P] = V; // eslint-disable-line no-param-reassign
		return noThrowOnStrictViolation ? SameValue(O[P], V) : true;
	} catch (e) {
		return false;
	}

};

var StringToBigInt;
var hasRequiredStringToBigInt;

function requireStringToBigInt () {
	if (hasRequiredStringToBigInt) return StringToBigInt;
	hasRequiredStringToBigInt = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $BigInt = GetIntrinsic('%BigInt%', true);
	var $TypeError = type;
	var $SyntaxError = syntax;

	// https://262.ecma-international.org/14.0/#sec-stringtobigint

	StringToBigInt = function StringToBigInt(argument) {
		if (typeof argument !== 'string') {
			throw new $TypeError('`argument` must be a string');
		}
		if (!$BigInt) {
			throw new $SyntaxError('BigInts are not supported in this environment');
		}
		try {
			return $BigInt(argument);
		} catch (e) {
			return void undefined;
		}
	};
	return StringToBigInt;
}

var isPrimitive$2;
var hasRequiredIsPrimitive$1;

function requireIsPrimitive$1 () {
	if (hasRequiredIsPrimitive$1) return isPrimitive$2;
	hasRequiredIsPrimitive$1 = 1;

	isPrimitive$2 = function isPrimitive(value) {
		return value === null || (typeof value !== 'function' && typeof value !== 'object');
	};
	return isPrimitive$2;
}

var shams;
var hasRequiredShams;

function requireShams () {
	if (hasRequiredShams) return shams;
	hasRequiredShams = 1;

	var hasSymbols = requireShams$2();

	shams = function hasToStringTagShams() {
		return hasSymbols() && !!Symbol.toStringTag;
	};
	return shams;
}

var isDateObject;
var hasRequiredIsDateObject;

function requireIsDateObject () {
	if (hasRequiredIsDateObject) return isDateObject;
	hasRequiredIsDateObject = 1;

	var getDay = Date.prototype.getDay;
	var tryDateObject = function tryDateGetDayCall(value) {
		try {
			getDay.call(value);
			return true;
		} catch (e) {
			return false;
		}
	};

	var toStr = Object.prototype.toString;
	var dateClass = '[object Date]';
	var hasToStringTag = requireShams()();

	isDateObject = function isDateObject(value) {
		if (typeof value !== 'object' || value === null) {
			return false;
		}
		return hasToStringTag ? tryDateObject(value) : toStr.call(value) === dateClass;
	};
	return isDateObject;
}

var isSymbol = {exports: {}};

var hasRequiredIsSymbol;

function requireIsSymbol () {
	if (hasRequiredIsSymbol) return isSymbol.exports;
	hasRequiredIsSymbol = 1;

	var toStr = Object.prototype.toString;
	var hasSymbols = hasSymbols$6();

	if (hasSymbols) {
		var symToStr = Symbol.prototype.toString;
		var symStringRegex = /^Symbol\(.*\)$/;
		var isSymbolObject = function isRealSymbolObject(value) {
			if (typeof value.valueOf() !== 'symbol') {
				return false;
			}
			return symStringRegex.test(symToStr.call(value));
		};

		isSymbol.exports = function isSymbol(value) {
			if (typeof value === 'symbol') {
				return true;
			}
			if (toStr.call(value) !== '[object Symbol]') {
				return false;
			}
			try {
				return isSymbolObject(value);
			} catch (e) {
				return false;
			}
		};
	} else {

		isSymbol.exports = function isSymbol(value) {
			// this environment does not support Symbols.
			return false ;
		};
	}
	return isSymbol.exports;
}

var es2015;
var hasRequiredEs2015;

function requireEs2015 () {
	if (hasRequiredEs2015) return es2015;
	hasRequiredEs2015 = 1;

	var hasSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol';

	var isPrimitive = requireIsPrimitive$1();
	var isCallable = isCallable$2;
	var isDate = requireIsDateObject();
	var isSymbol = requireIsSymbol();

	var ordinaryToPrimitive = function OrdinaryToPrimitive(O, hint) {
		if (typeof O === 'undefined' || O === null) {
			throw new TypeError('Cannot call method on ' + O);
		}
		if (typeof hint !== 'string' || (hint !== 'number' && hint !== 'string')) {
			throw new TypeError('hint must be "string" or "number"');
		}
		var methodNames = hint === 'string' ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
		var method, result, i;
		for (i = 0; i < methodNames.length; ++i) {
			method = O[methodNames[i]];
			if (isCallable(method)) {
				result = method.call(O);
				if (isPrimitive(result)) {
					return result;
				}
			}
		}
		throw new TypeError('No default value');
	};

	var GetMethod = function GetMethod(O, P) {
		var func = O[P];
		if (func !== null && typeof func !== 'undefined') {
			if (!isCallable(func)) {
				throw new TypeError(func + ' returned for property ' + P + ' of object ' + O + ' is not a function');
			}
			return func;
		}
		return void 0;
	};

	// http://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive
	es2015 = function ToPrimitive(input) {
		if (isPrimitive(input)) {
			return input;
		}
		var hint = 'default';
		if (arguments.length > 1) {
			if (arguments[1] === String) {
				hint = 'string';
			} else if (arguments[1] === Number) {
				hint = 'number';
			}
		}

		var exoticToPrim;
		if (hasSymbols) {
			if (Symbol.toPrimitive) {
				exoticToPrim = GetMethod(input, Symbol.toPrimitive);
			} else if (isSymbol(input)) {
				exoticToPrim = Symbol.prototype.valueOf;
			}
		}
		if (typeof exoticToPrim !== 'undefined') {
			var result = exoticToPrim.call(input, hint);
			if (isPrimitive(result)) {
				return result;
			}
			throw new TypeError('unable to convert exotic object to primitive');
		}
		if (hint === 'default' && (isDate(input) || isSymbol(input))) {
			hint = 'string';
		}
		return ordinaryToPrimitive(input, hint === 'default' ? 'number' : hint);
	};
	return es2015;
}

var ToPrimitive$1;
var hasRequiredToPrimitive;

function requireToPrimitive () {
	if (hasRequiredToPrimitive) return ToPrimitive$1;
	hasRequiredToPrimitive = 1;

	var toPrimitive = requireEs2015();

	// https://262.ecma-international.org/6.0/#sec-toprimitive

	ToPrimitive$1 = function ToPrimitive(input) {
		if (arguments.length > 1) {
			return toPrimitive(input, arguments[1]);
		}
		return toPrimitive(input);
	};
	return ToPrimitive$1;
}

var ToBigInt;
var hasRequiredToBigInt;

function requireToBigInt () {
	if (hasRequiredToBigInt) return ToBigInt;
	hasRequiredToBigInt = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $BigInt = GetIntrinsic('%BigInt%', true);
	var $Number = GetIntrinsic('%Number%');
	var $TypeError = type;
	var $SyntaxError = syntax;

	var StringToBigInt = requireStringToBigInt();
	var ToPrimitive = requireToPrimitive();

	// https://262.ecma-international.org/13.0/#sec-tobigint

	ToBigInt = function ToBigInt(argument) {
		if (!$BigInt) {
			throw new $SyntaxError('BigInts are not supported in this environment');
		}

		var prim = ToPrimitive(argument, $Number);

		if (prim == null) {
			throw new $TypeError('Cannot convert null or undefined to a BigInt');
		}

		if (typeof prim === 'boolean') {
			return prim ? $BigInt(1) : $BigInt(0);
		}

		if (typeof prim === 'number') {
			throw new $TypeError('Cannot convert a Number value to a BigInt');
		}

		if (typeof prim === 'string') {
			var n = StringToBigInt(prim);
			if (typeof n === 'undefined') {
				throw new $TypeError('Failed to parse String to BigInt');
			}
			return n;
		}

		if (typeof prim === 'symbol') {
			throw new $TypeError('Cannot convert a Symbol value to a BigInt');
		}

		if (typeof prim !== 'bigint') {
			throw new $SyntaxError('Assertion failed: unknown primitive type');
		}

		return prim;
	};
	return ToBigInt;
}

var remainder;
var hasRequiredRemainder;

function requireRemainder () {
	if (hasRequiredRemainder) return remainder;
	hasRequiredRemainder = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $BigInt = GetIntrinsic('%BigInt%', true);
	var $RangeError = range;
	var $TypeError = type;

	var zero = $BigInt && $BigInt(0);

	// https://262.ecma-international.org/11.0/#sec-numeric-types-bigint-remainder

	remainder = function BigIntRemainder(n, d) {
		if (typeof n !== 'bigint' || typeof d !== 'bigint') {
			throw new $TypeError('Assertion failed: `n` and `d` arguments must be BigInts');
		}

		if (d === zero) {
			throw new $RangeError('Division by zero');
		}

		if (n === zero) {
			return zero;
		}

		// shortcut for the actual spec mechanics
		return n % d;
	};
	return remainder;
}

var modBigInt;
var hasRequiredModBigInt;

function requireModBigInt () {
	if (hasRequiredModBigInt) return modBigInt;
	hasRequiredModBigInt = 1;

	modBigInt = function bigIntMod(BigIntRemainder, bigint, modulo) {
		var remain = BigIntRemainder(bigint, modulo);
		return remain >= 0 ? remain : remain + modulo;
	};
	return modBigInt;
}

var ToBigInt64;
var hasRequiredToBigInt64;

function requireToBigInt64 () {
	if (hasRequiredToBigInt64) return ToBigInt64;
	hasRequiredToBigInt64 = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $BigInt = GetIntrinsic('%BigInt%', true);
	var $pow = GetIntrinsic('%Math.pow%');

	var ToBigInt = requireToBigInt();
	var BigIntRemainder = requireRemainder();

	var modBigInt = requireModBigInt();

	// BigInt(2**63), but node v10.4-v10.8 have a bug where you can't `BigInt(x)` anything larger than MAX_SAFE_INTEGER
	var twoSixtyThree = $BigInt && (BigInt($pow(2, 32)) * BigInt($pow(2, 31)));

	// BigInt(2**64), but node v10.4-v10.8 have a bug where you can't `BigInt(x)` anything larger than MAX_SAFE_INTEGER
	var twoSixtyFour = $BigInt && (BigInt($pow(2, 32)) * BigInt($pow(2, 32)));

	// https://262.ecma-international.org/11.0/#sec-tobigint64

	ToBigInt64 = function ToBigInt64(argument) {
		var n = ToBigInt(argument);
		var int64bit = modBigInt(BigIntRemainder, n, twoSixtyFour);
		return int64bit >= twoSixtyThree ? int64bit - twoSixtyFour : int64bit;
	};
	return ToBigInt64;
}

var ToBigUint64;
var hasRequiredToBigUint64;

function requireToBigUint64 () {
	if (hasRequiredToBigUint64) return ToBigUint64;
	hasRequiredToBigUint64 = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $BigInt = GetIntrinsic('%BigInt%', true);
	var $pow = GetIntrinsic('%Math.pow%');

	var ToBigInt = requireToBigInt();
	var BigIntRemainder = requireRemainder();

	var modBigInt = requireModBigInt();

	// BigInt(2**64), but node v10.4-v10.8 have a bug where you can't `BigInt(x)` anything larger than MAX_SAFE_INTEGER
	var twoSixtyFour = $BigInt && (BigInt($pow(2, 32)) * BigInt($pow(2, 32)));

	// https://262.ecma-international.org/11.0/#sec-tobiguint64

	ToBigUint64 = function ToBigUint64(argument) {
		var n = ToBigInt(argument);
		var int64bit = modBigInt(BigIntRemainder, n, twoSixtyFour);
		return int64bit;
	};
	return ToBigUint64;
}

var mod;
var hasRequiredMod;

function requireMod () {
	if (hasRequiredMod) return mod;
	hasRequiredMod = 1;

	var $floor = Math.floor;

	mod = function mod(number, modulo) {
		var remain = number % modulo;
		return $floor(remain >= 0 ? remain : remain + modulo);
	};
	return mod;
}

var modulo;
var hasRequiredModulo;

function requireModulo () {
	if (hasRequiredModulo) return modulo;
	hasRequiredModulo = 1;

	var mod = requireMod();

	// https://262.ecma-international.org/5.1/#sec-5.2

	modulo = function modulo(x, y) {
		return mod(x, y);
	};
	return modulo;
}

var isPrimitive$1;
var hasRequiredIsPrimitive;

function requireIsPrimitive () {
	if (hasRequiredIsPrimitive) return isPrimitive$1;
	hasRequiredIsPrimitive = 1;

	isPrimitive$1 = function isPrimitive(value) {
		return value === null || (typeof value !== 'function' && typeof value !== 'object');
	};
	return isPrimitive$1;
}

var isRegex;
var hasRequiredIsRegex;

function requireIsRegex () {
	if (hasRequiredIsRegex) return isRegex;
	hasRequiredIsRegex = 1;

	var callBound = callBound$8;
	var hasToStringTag = requireShams()();
	var has;
	var $exec;
	var isRegexMarker;
	var badStringifier;

	if (hasToStringTag) {
		has = callBound('Object.prototype.hasOwnProperty');
		$exec = callBound('RegExp.prototype.exec');
		isRegexMarker = {};

		var throwRegexMarker = function () {
			throw isRegexMarker;
		};
		badStringifier = {
			toString: throwRegexMarker,
			valueOf: throwRegexMarker
		};

		if (typeof Symbol.toPrimitive === 'symbol') {
			badStringifier[Symbol.toPrimitive] = throwRegexMarker;
		}
	}

	var $toString = callBound('Object.prototype.toString');
	var gOPD = Object.getOwnPropertyDescriptor;
	var regexClass = '[object RegExp]';

	isRegex = hasToStringTag
		// eslint-disable-next-line consistent-return
		? function isRegex(value) {
			if (!value || typeof value !== 'object') {
				return false;
			}

			var descriptor = gOPD(value, 'lastIndex');
			var hasLastIndexDataProperty = descriptor && has(descriptor, 'value');
			if (!hasLastIndexDataProperty) {
				return false;
			}

			try {
				$exec(value, badStringifier);
			} catch (e) {
				return e === isRegexMarker;
			}
		}
		: function isRegex(value) {
			// In older browsers, typeof regex incorrectly returns 'function'
			if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
				return false;
			}

			return $toString(value) === regexClass;
		};
	return isRegex;
}

var safeRegexTest;
var hasRequiredSafeRegexTest;

function requireSafeRegexTest () {
	if (hasRequiredSafeRegexTest) return safeRegexTest;
	hasRequiredSafeRegexTest = 1;

	var callBound = callBound$8;
	var isRegex = requireIsRegex();

	var $exec = callBound('RegExp.prototype.exec');
	var $TypeError = type;

	safeRegexTest = function regexTester(regex) {
		if (!isRegex(regex)) {
			throw new $TypeError('`regex` must be a RegExp');
		}
		return function test(s) {
			return $exec(regex, s) !== null;
		};
	};
	return safeRegexTest;
}

var RequireObjectCoercible;
var hasRequiredRequireObjectCoercible;

function requireRequireObjectCoercible () {
	if (hasRequiredRequireObjectCoercible) return RequireObjectCoercible;
	hasRequiredRequireObjectCoercible = 1;

	var $TypeError = type;

	/** @type {import('./RequireObjectCoercible')} */
	RequireObjectCoercible = function RequireObjectCoercible(value) {
		if (value == null) {
			throw new $TypeError((arguments.length > 0 && arguments[1]) || ('Cannot call method on ' + value));
		}
		return value;
	};
	return RequireObjectCoercible;
}

var GetIntrinsic$7 = getIntrinsic$4;

var $String = GetIntrinsic$7('%String%');
var $TypeError$f = type;

// https://262.ecma-international.org/6.0/#sec-tostring

var ToString$1 = function ToString(argument) {
	if (typeof argument === 'symbol') {
		throw new $TypeError$f('Cannot convert a Symbol value to a string');
	}
	return $String(argument);
};

var implementation$3;
var hasRequiredImplementation;

function requireImplementation () {
	if (hasRequiredImplementation) return implementation$3;
	hasRequiredImplementation = 1;

	var RequireObjectCoercible = requireRequireObjectCoercible();
	var ToString = ToString$1;
	var callBound = callBound$8;
	var $replace = callBound('String.prototype.replace');

	var mvsIsWS = (/^\s$/).test('\u180E');
	/* eslint-disable no-control-regex */
	var leftWhitespace = mvsIsWS
		? /^[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]+/
		: /^[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]+/;
	var rightWhitespace = mvsIsWS
		? /[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]+$/
		: /[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]+$/;
	/* eslint-enable no-control-regex */

	implementation$3 = function trim() {
		var S = ToString(RequireObjectCoercible(this));
		return $replace($replace(S, leftWhitespace, ''), rightWhitespace, '');
	};
	return implementation$3;
}

var polyfill$1;
var hasRequiredPolyfill;

function requirePolyfill () {
	if (hasRequiredPolyfill) return polyfill$1;
	hasRequiredPolyfill = 1;

	var implementation = requireImplementation();

	var zeroWidthSpace = '\u200b';
	var mongolianVowelSeparator = '\u180E';

	polyfill$1 = function getPolyfill() {
		if (
			String.prototype.trim
			&& zeroWidthSpace.trim() === zeroWidthSpace
			&& mongolianVowelSeparator.trim() === mongolianVowelSeparator
			&& ('_' + mongolianVowelSeparator).trim() === ('_' + mongolianVowelSeparator)
			&& (mongolianVowelSeparator + '_').trim() === (mongolianVowelSeparator + '_')
		) {
			return String.prototype.trim;
		}
		return implementation;
	};
	return polyfill$1;
}

var shim$2;
var hasRequiredShim;

function requireShim () {
	if (hasRequiredShim) return shim$2;
	hasRequiredShim = 1;

	var define = defineProperties_1;
	var getPolyfill = requirePolyfill();

	shim$2 = function shimStringTrim() {
		var polyfill = getPolyfill();
		define(String.prototype, { trim: polyfill }, {
			trim: function testTrim() {
				return String.prototype.trim !== polyfill;
			}
		});
		return polyfill;
	};
	return shim$2;
}

var string_prototype_trim;
var hasRequiredString_prototype_trim;

function requireString_prototype_trim () {
	if (hasRequiredString_prototype_trim) return string_prototype_trim;
	hasRequiredString_prototype_trim = 1;

	var callBind = callBindExports;
	var define = defineProperties_1;
	var RequireObjectCoercible = requireRequireObjectCoercible();

	var implementation = requireImplementation();
	var getPolyfill = requirePolyfill();
	var shim = requireShim();

	var bound = callBind(getPolyfill());
	var boundMethod = function trim(receiver) {
		RequireObjectCoercible(receiver);
		return bound(receiver);
	};

	define(boundMethod, {
		getPolyfill: getPolyfill,
		implementation: implementation,
		shim: shim
	});

	string_prototype_trim = boundMethod;
	return string_prototype_trim;
}

var StringToNumber$1;
var hasRequiredStringToNumber;

function requireStringToNumber () {
	if (hasRequiredStringToNumber) return StringToNumber$1;
	hasRequiredStringToNumber = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $Number = GetIntrinsic('%Number%');
	var $RegExp = GetIntrinsic('%RegExp%');
	var $TypeError = type;
	var $parseInteger = GetIntrinsic('%parseInt%');

	var callBound = callBound$8;
	var regexTester = requireSafeRegexTest();

	var $strSlice = callBound('String.prototype.slice');
	var isBinary = regexTester(/^0b[01]+$/i);
	var isOctal = regexTester(/^0o[0-7]+$/i);
	var isInvalidHexLiteral = regexTester(/^[-+]0x[0-9a-f]+$/i);
	var nonWS = ['\u0085', '\u200b', '\ufffe'].join('');
	var nonWSregex = new $RegExp('[' + nonWS + ']', 'g');
	var hasNonWS = regexTester(nonWSregex);

	var $trim = requireString_prototype_trim();

	// https://262.ecma-international.org/13.0/#sec-stringtonumber

	StringToNumber$1 = function StringToNumber(argument) {
		if (typeof argument !== 'string') {
			throw new $TypeError('Assertion failed: `argument` is not a String');
		}
		if (isBinary(argument)) {
			return $Number($parseInteger($strSlice(argument, 2), 2));
		}
		if (isOctal(argument)) {
			return $Number($parseInteger($strSlice(argument, 2), 8));
		}
		if (hasNonWS(argument) || isInvalidHexLiteral(argument)) {
			return NaN;
		}
		var trimmed = $trim(argument);
		if (trimmed !== argument) {
			return StringToNumber(trimmed);
		}
		return $Number(argument);
	};
	return StringToNumber$1;
}

var GetIntrinsic$6 = getIntrinsic$4;

var $TypeError$e = type;
var $Number = GetIntrinsic$6('%Number%');
var isPrimitive = requireIsPrimitive();

var ToPrimitive = requireToPrimitive();
var StringToNumber = requireStringToNumber();

// https://262.ecma-international.org/13.0/#sec-tonumber

var ToNumber$1 = function ToNumber(argument) {
	var value = isPrimitive(argument) ? argument : ToPrimitive(argument, $Number);
	if (typeof value === 'symbol') {
		throw new $TypeError$e('Cannot convert a Symbol value to a number');
	}
	if (typeof value === 'bigint') {
		throw new $TypeError$e('Conversion from \'BigInt\' to \'number\' is not allowed.');
	}
	if (typeof value === 'string') {
		return StringToNumber(value);
	}
	return $Number(value);
};

// var modulo = require('./modulo');
var $floor = Math.floor;

// http://262.ecma-international.org/11.0/#eqn-floor

var floor$2 = function floor(x) {
	// return x - modulo(x, 1);
	if (typeof x === 'bigint') {
		return x;
	}
	return $floor(x);
};

var floor$1 = floor$2;

var $TypeError$d = type;

// https://262.ecma-international.org/14.0/#eqn-truncate

var truncate$1 = function truncate(x) {
	if (typeof x !== 'number' && typeof x !== 'bigint') {
		throw new $TypeError$d('argument must be a Number or a BigInt');
	}
	var result = x < 0 ? -floor$1(-x) : floor$1(x);
	return result === 0 ? 0 : result; // in the spec, these are math values, so we filter out -0 here
};

var ToInt16;
var hasRequiredToInt16;

function requireToInt16 () {
	if (hasRequiredToInt16) return ToInt16;
	hasRequiredToInt16 = 1;

	var modulo = requireModulo();
	var ToNumber = ToNumber$1;
	var truncate = truncate$1;

	var isFinite = _isFinite;

	// https://262.ecma-international.org/14.0/#sec-toint16

	var two16 = 0x10000; // Math.pow(2, 16);

	ToInt16 = function ToInt16(argument) {
		var number = ToNumber(argument);
		if (!isFinite(number) || number === 0) {
			return 0;
		}
		var int = truncate(number);
		var int16bit = modulo(int, two16);
		return int16bit >= 0x8000 ? int16bit - two16 : int16bit;
	};
	return ToInt16;
}

var ToInt32;
var hasRequiredToInt32;

function requireToInt32 () {
	if (hasRequiredToInt32) return ToInt32;
	hasRequiredToInt32 = 1;

	var modulo = requireModulo();
	var ToNumber = ToNumber$1;
	var truncate = truncate$1;

	var isFinite = _isFinite;

	// https://262.ecma-international.org/14.0/#sec-toint32

	var two31 = 0x80000000; // Math.pow(2, 31);
	var two32 = 0x100000000; // Math.pow(2, 32);

	ToInt32 = function ToInt32(argument) {
		var number = ToNumber(argument);
		if (!isFinite(number) || number === 0) {
			return 0;
		}
		var int = truncate(number);
		var int32bit = modulo(int, two32);
		var result = int32bit >= two31 ? int32bit - two32 : int32bit;
		return result === 0 ? 0 : result; // in the spec, these are math values, so we filter out -0 here
	};
	return ToInt32;
}

var ToInt8;
var hasRequiredToInt8;

function requireToInt8 () {
	if (hasRequiredToInt8) return ToInt8;
	hasRequiredToInt8 = 1;

	var modulo = requireModulo();
	var ToNumber = ToNumber$1;
	var truncate = truncate$1;

	var isFinite = _isFinite;

	// https://262.ecma-international.org/14.0/#sec-toint8

	ToInt8 = function ToInt8(argument) {
		var number = ToNumber(argument);
		if (!isFinite(number) || number === 0) {
			return 0;
		}
		var int = truncate(number);
		var int8bit = modulo(int, 0x100);
		return int8bit >= 0x80 ? int8bit - 0x100 : int8bit;
	};
	return ToInt8;
}

var ToUint16;
var hasRequiredToUint16;

function requireToUint16 () {
	if (hasRequiredToUint16) return ToUint16;
	hasRequiredToUint16 = 1;

	var modulo = requireModulo();
	var ToNumber = ToNumber$1;
	var truncate = truncate$1;

	var isFinite = _isFinite;

	// https://262.ecma-international.org/14.0/#sec-touint16

	var two16 = 0x10000; // Math.pow(2, 16)

	ToUint16 = function ToUint16(argument) {
		var number = ToNumber(argument);
		if (!isFinite(number) || number === 0) {
			return 0;
		}
		var int = truncate(number);
		var int16bit = modulo(int, two16);
		return int16bit === 0 ? 0 : int16bit; // in the spec, these are math values, so we filter out -0 here
	};
	return ToUint16;
}

var ToUint32;
var hasRequiredToUint32;

function requireToUint32 () {
	if (hasRequiredToUint32) return ToUint32;
	hasRequiredToUint32 = 1;

	var modulo = requireModulo();
	var ToNumber = ToNumber$1;
	var truncate = truncate$1;

	var isFinite = _isFinite;

	// https://262.ecma-international.org/14.0/#sec-touint32

	var two32 = 0x100000000; // Math.pow(2, 32);

	ToUint32 = function ToUint32(argument) {
		var number = ToNumber(argument);
		if (!isFinite(number) || number === 0) {
			return 0;
		}
		var int = truncate(number);
		var int32bit = modulo(int, two32);
		return int32bit === 0 ? 0 : int32bit; // in the spec, these are math values, so we filter out -0 here
	};
	return ToUint32;
}

var ToUint8;
var hasRequiredToUint8;

function requireToUint8 () {
	if (hasRequiredToUint8) return ToUint8;
	hasRequiredToUint8 = 1;

	var isFinite = _isFinite;

	var modulo = requireModulo();
	var ToNumber = ToNumber$1;
	var truncate = truncate$1;

	// https://262.ecma-international.org/14.0/#sec-touint8

	ToUint8 = function ToUint8(argument) {
		var number = ToNumber(argument);
		if (!isFinite(number) || number === 0) {
			return 0;
		}
		var int = truncate(number);
		var int8bit = modulo(int, 0x100);
		return int8bit;
	};
	return ToUint8;
}

var clamp;
var hasRequiredClamp;

function requireClamp () {
	if (hasRequiredClamp) return clamp;
	hasRequiredClamp = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $TypeError = type;
	var max = GetIntrinsic('%Math.max%');
	var min = GetIntrinsic('%Math.min%');

	// https://262.ecma-international.org/12.0/#clamping

	clamp = function clamp(x, lower, upper) {
		if (typeof x !== 'number' || typeof lower !== 'number' || typeof upper !== 'number' || !(lower <= upper)) {
			throw new $TypeError('Assertion failed: all three arguments must be MVs, and `lower` must be `<= upper`');
		}
		return min(max(lower, x), upper);
	};
	return clamp;
}

var ToUint8Clamp;
var hasRequiredToUint8Clamp;

function requireToUint8Clamp () {
	if (hasRequiredToUint8Clamp) return ToUint8Clamp;
	hasRequiredToUint8Clamp = 1;

	var clamp = requireClamp();

	var ToNumber = ToNumber$1;
	var floor = floor$2;

	var $isNaN = _isNaN;

	// https://262.ecma-international.org/15.0/#sec-touint8clamp

	ToUint8Clamp = function ToUint8Clamp(argument) {
		var number = ToNumber(argument); // step 1

		if ($isNaN(number)) { return 0; } // step 2

		var clamped = clamp(number, 0, 255); // step 4

		var f = floor(clamped); // step 5

		if (clamped < (f + 0.5)) { return f; } // step 6

		if (clamped > (f + 0.5)) { return f + 1; } // step 7

		return f % 2 === 0 ? f : f + 1; // step 8
	};
	return ToUint8Clamp;
}

var isNegativeZero;
var hasRequiredIsNegativeZero;

function requireIsNegativeZero () {
	if (hasRequiredIsNegativeZero) return isNegativeZero;
	hasRequiredIsNegativeZero = 1;

	isNegativeZero = function isNegativeZero(x) {
		return x === 0 && 1 / x === 1 / -0;
	};
	return isNegativeZero;
}

var valueToFloat32Bytes;
var hasRequiredValueToFloat32Bytes;

function requireValueToFloat32Bytes () {
	if (hasRequiredValueToFloat32Bytes) return valueToFloat32Bytes;
	hasRequiredValueToFloat32Bytes = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $abs = GetIntrinsic('%Math.abs%');
	var $floor = GetIntrinsic('%Math.floor%');
	var $pow = GetIntrinsic('%Math.pow%');

	var isFinite = _isFinite;
	var isNaN = _isNaN;
	var isNegativeZero = requireIsNegativeZero();

	var maxFiniteFloat32 = 3.4028234663852886e+38; // roughly 2 ** 128 - 1

	valueToFloat32Bytes = function valueToFloat32Bytes(value, isLittleEndian) {
		if (isNaN(value)) {
			return isLittleEndian ? [0, 0, 192, 127] : [127, 192, 0, 0]; // hardcoded
		}

		var leastSig;

		if (value === 0) {
			leastSig = isNegativeZero(value) ? 0x80 : 0;
			return isLittleEndian ? [0, 0, 0, leastSig] : [leastSig, 0, 0, 0];
		}

		if ($abs(value) > maxFiniteFloat32 || !isFinite(value)) {
			leastSig = value < 0 ? 255 : 127;
			return isLittleEndian ? [0, 0, 128, leastSig] : [leastSig, 128, 0, 0];
		}

		var sign = value < 0 ? 1 : 0;
		value = $abs(value); // eslint-disable-line no-param-reassign

		var exponent = 0;
		while (value >= 2) {
			exponent += 1;
			value /= 2; // eslint-disable-line no-param-reassign
		}

		while (value < 1) {
			exponent -= 1;
			value *= 2; // eslint-disable-line no-param-reassign
		}

		var mantissa = value - 1;
		mantissa *= $pow(2, 23) + 0.5;
		mantissa = $floor(mantissa);

		exponent += 127;
		exponent <<= 23;

		var result = (sign << 31)
	        | exponent
	        | mantissa;

		var byte0 = result & 255;
		result >>= 8;
		var byte1 = result & 255;
		result >>= 8;
		var byte2 = result & 255;
		result >>= 8;
		var byte3 = result & 255;

		if (isLittleEndian) {
			return [byte0, byte1, byte2, byte3];
		}
		return [byte3, byte2, byte1, byte0];
	};
	return valueToFloat32Bytes;
}

var fractionToBinaryString;
var hasRequiredFractionToBinaryString;

function requireFractionToBinaryString () {
	if (hasRequiredFractionToBinaryString) return fractionToBinaryString;
	hasRequiredFractionToBinaryString = 1;

	var MAX_ITER = 1075; // 1023+52 (subnormals) => BIAS+NUM_SIGNFICAND_BITS-1
	var maxBits = 54; // only 53 bits for fraction

	fractionToBinaryString = function fractionToBitString(x) {
		var str = '';
		if (x === 0) {
			return str;
		}
		var j = MAX_ITER;

		var y;
		// Each time we multiply by 2 and find a ones digit, add a '1'; otherwise, add a '0'..
		for (var i = 0; i < MAX_ITER; i += 1) {
			y = x * 2;
			if (y >= 1) {
				x = y - 1; // eslint-disable-line no-param-reassign
				str += '1';
				if (j === MAX_ITER) {
					j = i; // first 1
				}
			} else {
				x = y; // eslint-disable-line no-param-reassign
				str += '0';
			}
			// Stop when we have no more decimals to process or in the event we found a fraction which cannot be represented in a finite number of bits...
			if (y === 1 || i - j > maxBits) {
				return str;
			}
		}
		return str;
	};
	return fractionToBinaryString;
}

var intToBinaryString;
var hasRequiredIntToBinaryString;

function requireIntToBinaryString () {
	if (hasRequiredIntToBinaryString) return intToBinaryString;
	hasRequiredIntToBinaryString = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $floor = GetIntrinsic('%Math.floor%');

	// https://runestone.academy/ns/books/published/pythonds/BasicDS/ConvertingDecimalNumberstoBinaryNumbers.html#:~:text=The%20Divide%20by%202%20algorithm,have%20a%20remainder%20of%200

	intToBinaryString = function intToBinaryString(x) {
		var str = '';
		var y;

		while (x > 0) {
			y = x / 2;
			x = $floor(y); // eslint-disable-line no-param-reassign
			if (y === x) {
				str = '0' + str;
			} else {
				str = '1' + str;
			}
		}
		return str;
	};
	return intToBinaryString;
}

var valueToFloat64Bytes;
var hasRequiredValueToFloat64Bytes;

function requireValueToFloat64Bytes () {
	if (hasRequiredValueToFloat64Bytes) return valueToFloat64Bytes;
	hasRequiredValueToFloat64Bytes = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $parseInt = GetIntrinsic('%parseInt%');
	var $abs = GetIntrinsic('%Math.abs%');
	var $floor = GetIntrinsic('%Math.floor%');

	var callBound = callBound$8;

	var $strIndexOf = callBound('String.prototype.indexOf');
	var $strSlice = callBound('String.prototype.slice');

	var fractionToBitString = requireFractionToBinaryString();
	var intToBinString = requireIntToBinaryString();
	var isNegativeZero = requireIsNegativeZero();

	var float64bias = 1023;

	var elevenOnes = '11111111111';
	var elevenZeroes = '00000000000';
	var fiftyOneZeroes = elevenZeroes + elevenZeroes + elevenZeroes + elevenZeroes + '0000000';

	// IEEE 754-1985
	valueToFloat64Bytes = function valueToFloat64Bytes(value, isLittleEndian) {
		var signBit = value < 0 || isNegativeZero(value) ? '1' : '0';
		var exponentBits;
		var significandBits;

		if (isNaN(value)) {
			exponentBits = elevenOnes;
			significandBits = '1' + fiftyOneZeroes;
		} else if (!isFinite(value)) {
			exponentBits = elevenOnes;
			significandBits = '0' + fiftyOneZeroes;
		} else if (value === 0) {
			exponentBits = elevenZeroes;
			significandBits = '0' + fiftyOneZeroes;
		} else {
			value = $abs(value); // eslint-disable-line no-param-reassign

			// Isolate the integer part (digits before the decimal):
			var integerPart = $floor(value);

			var intBinString = intToBinString(integerPart); // bit string for integer part
			var fracBinString = fractionToBitString(value - integerPart); // bit string for fractional part

			var numberOfBits;
			// find exponent needed to normalize integer+fractional parts
			if (intBinString) {
				exponentBits = intBinString.length - 1; // move the decimal to the left
			} else {
				var first1 = $strIndexOf(fracBinString, '1');
				if (first1 > -1) {
					numberOfBits = first1 + 1;
				}
				exponentBits = -numberOfBits; // move the decimal to the right
			}

			significandBits = intBinString + fracBinString;
			if (exponentBits < 0) {
				// subnormals
				if (exponentBits <= -float64bias) {
					numberOfBits = float64bias - 1; // limit number of removed bits
				}
				significandBits = $strSlice(significandBits, numberOfBits); // remove all leading 0s and the first 1 for normal values; for subnormals, remove up to `float64bias - 1` leading bits
			} else {
				significandBits = $strSlice(significandBits, 1); // remove the leading '1' (implicit/hidden bit)
			}
			exponentBits = $strSlice(elevenZeroes + intToBinString(exponentBits + float64bias), -11); // Convert the exponent to a bit string

			significandBits = $strSlice(significandBits + fiftyOneZeroes + '0', 0, 52); // fill in any trailing zeros and ensure we have only 52 fraction bits
		}

		var bits = signBit + exponentBits + significandBits;
		var rawBytes = [];
		for (var i = 0; i < 8; i++) {
			var targetIndex = isLittleEndian ? 8 - i - 1 : i;
			rawBytes[targetIndex] = $parseInt($strSlice(bits, i * 8, (i + 1) * 8), 2);
		}

		return rawBytes;
	};
	return valueToFloat64Bytes;
}

var integerToNBytes;
var hasRequiredIntegerToNBytes;

function requireIntegerToNBytes () {
	if (hasRequiredIntegerToNBytes) return integerToNBytes;
	hasRequiredIntegerToNBytes = 1;

	var GetIntrinsic = getIntrinsic$4;

	var $Number = GetIntrinsic('%Number%');
	var $BigInt = GetIntrinsic('%BigInt%', true);

	integerToNBytes = function integerToNBytes(intValue, n, isLittleEndian) {
		var Z = typeof intValue === 'bigint' ? $BigInt : $Number;
		/*
		if (intValue >= 0) { // step 3.d
			// Let rawBytes be a List containing the n-byte binary encoding of intValue. If isLittleEndian is false, the bytes are ordered in big endian order. Otherwise, the bytes are ordered in little endian order.
		} else { // step 3.e
			// Let rawBytes be a List containing the n-byte binary 2's complement encoding of intValue. If isLittleEndian is false, the bytes are ordered in big endian order. Otherwise, the bytes are ordered in little endian order.
		}
	    */
		if (intValue < 0) {
			intValue >>>= 0; // eslint-disable-line no-param-reassign
		}

		var rawBytes = [];
		for (var i = 0; i < n; i++) {
			rawBytes[isLittleEndian ? i : n - 1 - i] = $Number(intValue & Z(0xFF));
			intValue >>= Z(8); // eslint-disable-line no-param-reassign
		}

		return rawBytes; // step 4
	};
	return integerToNBytes;
}

var NumericToRawBytes$1;
var hasRequiredNumericToRawBytes;

function requireNumericToRawBytes () {
	if (hasRequiredNumericToRawBytes) return NumericToRawBytes$1;
	hasRequiredNumericToRawBytes = 1;

	var $TypeError = type;

	var hasOwnProperty = requireHasOwnProperty();
	var ToBigInt64 = requireToBigInt64();
	var ToBigUint64 = requireToBigUint64();
	var ToInt16 = requireToInt16();
	var ToInt32 = requireToInt32();
	var ToInt8 = requireToInt8();
	var ToUint16 = requireToUint16();
	var ToUint32 = requireToUint32();
	var ToUint8 = requireToUint8();
	var ToUint8Clamp = requireToUint8Clamp();

	var valueToFloat32Bytes = requireValueToFloat32Bytes();
	var valueToFloat64Bytes = requireValueToFloat64Bytes();
	var integerToNBytes = requireIntegerToNBytes();

	var keys = objectKeys$1;

	// https://262.ecma-international.org/15.0/#table-the-typedarray-constructors
	var TypeToSizes = {
		__proto__: null,
		INT8: 1,
		UINT8: 1,
		UINT8C: 1,
		INT16: 2,
		UINT16: 2,
		INT32: 4,
		UINT32: 4,
		BIGINT64: 8,
		BIGUINT64: 8,
		FLOAT32: 4,
		FLOAT64: 8
	};

	var TypeToAO = {
		__proto__: null,
		INT8: ToInt8,
		UINT8: ToUint8,
		UINT8C: ToUint8Clamp,
		INT16: ToInt16,
		UINT16: ToUint16,
		INT32: ToInt32,
		UINT32: ToUint32,
		BIGINT64: ToBigInt64,
		BIGUINT64: ToBigUint64
	};

	// https://262.ecma-international.org/15.0/#sec-numerictorawbytes

	NumericToRawBytes$1 = function NumericToRawBytes(type, value, isLittleEndian) {
		if (typeof type !== 'string' || !hasOwnProperty(TypeToSizes, type)) {
			throw new $TypeError('Assertion failed: `type` must be a TypedArray element type: ' + keys(TypeToSizes));
		}
		if (typeof value !== 'number' && typeof value !== 'bigint') {
			throw new $TypeError('Assertion failed: `value` must be a Number or a BigInt');
		}
		if (typeof isLittleEndian !== 'boolean') {
			throw new $TypeError('Assertion failed: `isLittleEndian` must be a Boolean');
		}

		if (type === 'FLOAT32') { // step 1
			return valueToFloat32Bytes(value, isLittleEndian);
		} else if (type === 'FLOAT64') { // step 2
			return valueToFloat64Bytes(value, isLittleEndian);
		} // step 3

		var n = TypeToSizes[type]; // step 3.a

		var convOp = TypeToAO[type]; // step 3.b

		var intValue = convOp(value); // step 3.c

		return integerToNBytes(intValue, n, isLittleEndian); // step 3.d, 3.e, 4
	};
	return NumericToRawBytes$1;
}

var forEach$4;
var hasRequiredForEach;

function requireForEach () {
	if (hasRequiredForEach) return forEach$4;
	hasRequiredForEach = 1;

	forEach$4 = function forEach(array, callback) {
		for (var i = 0; i < array.length; i += 1) {
			callback(array[i], i, array); // eslint-disable-line callback-return
		}
	};
	return forEach$4;
}

var GetIntrinsic$5 = getIntrinsic$4;

var $SyntaxError$4 = syntax;
var $TypeError$c = type;
var $Uint8Array = GetIntrinsic$5('%Uint8Array%', true);

var isInteger$2 = isInteger$4;

var IsBigIntElementType = requireIsBigIntElementType();
var IsDetachedBuffer$4 = IsDetachedBuffer$6;
var NumericToRawBytes = requireNumericToRawBytes();

var isArrayBuffer$2 = isArrayBuffer$6;
var isSharedArrayBuffer$2 = isSharedArrayBuffer$5;
var has = hasown;

var tableTAO$2 = typedArrayObjects;

var defaultEndianness = requireDefaultEndianness();
var forEach$3 = requireForEach();

// https://262.ecma-international.org/15.0/#sec-setvalueinbuffer

/* eslint max-params: 0 */

var SetValueInBuffer$1 = function SetValueInBuffer(arrayBuffer, byteIndex, type, value, isTypedArray, order) {
	var isSAB = isSharedArrayBuffer$2(arrayBuffer);
	if (!isArrayBuffer$2(arrayBuffer) && !isSAB) {
		throw new $TypeError$c('Assertion failed: `arrayBuffer` must be an ArrayBuffer or a SharedArrayBuffer');
	}

	if (!isInteger$2(byteIndex) || byteIndex < 0) {
		throw new $TypeError$c('Assertion failed: `byteIndex` must be a non-negative integer');
	}

	if (typeof type !== 'string' || !has(tableTAO$2.size, '$' + type)) {
		throw new $TypeError$c('Assertion failed: `type` must be a Typed Array Element Type');
	}

	if (typeof value !== 'number' && typeof value !== 'bigint') {
		throw new $TypeError$c('Assertion failed: `value` must be a Number or a BigInt');
	}

	if (typeof isTypedArray !== 'boolean') {
		throw new $TypeError$c('Assertion failed: `isTypedArray` must be a boolean');
	}
	if (order !== 'SEQ-CST' && order !== 'UNORDERED' && order !== 'INIT') {
		throw new $TypeError$c('Assertion failed: `order` must be `"SEQ-CST"`, `"UNORDERED"`, or `"INIT"`');
	}

	if (arguments.length > 6 && typeof arguments[6] !== 'boolean') {
		throw new $TypeError$c('Assertion failed: `isLittleEndian` must be a boolean, if present');
	}

	if (IsDetachedBuffer$4(arrayBuffer)) {
		throw new $TypeError$c('Assertion failed: ArrayBuffer is detached'); // step 1
	}

	// 2. Assert: There are sufficient bytes in arrayBuffer starting at byteIndex to represent a value of type.

	if (IsBigIntElementType(type) ? typeof value !== 'bigint' : typeof value !== 'number') { // step 3
		throw new $TypeError$c('Assertion failed: `value` must be a BigInt if type is ~BIGINT64~ or ~BIGUINT64~, otherwise a Number');
	}

	// 4. Let block be arrayBuffer’s [[ArrayBufferData]] internal slot.

	var elementSize = tableTAO$2.size['$' + type]; // step 5

	// 6. If isLittleEndian is not present, set isLittleEndian to either true or false. The choice is implementation dependent and should be the alternative that is most efficient for the implementation. An implementation must use the same value each time this step is executed and the same value must be used for the corresponding step in the GetValueFromBuffer abstract operation.
	var isLittleEndian = arguments.length > 6 ? arguments[6] : defaultEndianness === 'little'; // step 6

	var rawBytes = NumericToRawBytes(type, value, isLittleEndian); // step 7

	if (isSAB) { // step 8
		/*
			Let execution be the [[CandidateExecution]] field of the surrounding agent's Agent Record.
			Let eventList be the [[EventList]] field of the element in execution.[[EventsRecords]] whose [[AgentSignifier]] is AgentSignifier().
			If isTypedArray is true and IsNoTearConfiguration(type, order) is true, let noTear be true; otherwise let noTear be false.
			Append WriteSharedMemory { [[Order]]: order, [[NoTear]]: noTear, [[Block]]: block, [[ByteIndex]]: byteIndex, [[ElementSize]]: elementSize, [[Payload]]: rawBytes } to eventList.
		*/
		throw new $SyntaxError$4('SharedArrayBuffer is not supported by this implementation');
	} else {
		// 9. Store the individual bytes of rawBytes into block, in order, starting at block[byteIndex].
		var arr = new $Uint8Array(arrayBuffer, byteIndex, elementSize);
		forEach$3(rawBytes, function (rawByte, i) {
			arr[i] = rawByte;
		});
	}

	// 10. Return NormalCompletion(undefined).
};

var ToNumber = ToNumber$1;
var truncate = truncate$1;

var $isNaN = _isNaN;
var $isFinite = _isFinite;

// https://262.ecma-international.org/14.0/#sec-tointegerorinfinity

var ToIntegerOrInfinity$1 = function ToIntegerOrInfinity(value) {
	var number = ToNumber(value);
	if ($isNaN(number) || number === 0) { return 0; }
	if (!$isFinite(number)) { return number; }
	return truncate(number);
};

var $SyntaxError$3 = syntax;
var $TypeError$b = type;

var isInteger$1 = isInteger$4;

var whichTypedArray$3 = whichTypedArray$4;

// https://262.ecma-international.org/13.0/#sec-typedarrayelementsize

var tableTAO$1 = typedArrayObjects;

var TypedArrayElementSize$3 = function TypedArrayElementSize(O) {
	var type = whichTypedArray$3(O);
	if (type === false) {
		throw new $TypeError$b('Assertion failed: `O` must be a TypedArray');
	}
	var size = tableTAO$1.size['$' + tableTAO$1.name['$' + type]];
	if (!isInteger$1(size) || size < 0) {
		throw new $SyntaxError$3('Assertion failed: Unknown TypedArray type `' + type + '`');
	}

	return size;
};

var $SyntaxError$2 = syntax;
var $TypeError$a = type;

var whichTypedArray$2 = whichTypedArray$4;

// https://262.ecma-international.org/15.0/#sec-typedarrayelementtype

var tableTAO = typedArrayObjects;

var TypedArrayElementType$1 = function TypedArrayElementType(O) {
	var type = whichTypedArray$2(O);
	if (type === false) {
		throw new $TypeError$a('Assertion failed: `O` must be a TypedArray');
	}
	var result = tableTAO.name['$' + type];
	if (typeof result !== 'string') {
		throw new $SyntaxError$2('Assertion failed: Unknown TypedArray type `' + type + '`');
	}

	return result;
};

var IsConstructor$2 = {exports: {}};

// TODO: remove, semver-major

var GetIntrinsic$4 = getIntrinsic$4;

var propertyDescriptor;
var hasRequiredPropertyDescriptor;

function requirePropertyDescriptor () {
	if (hasRequiredPropertyDescriptor) return propertyDescriptor;
	hasRequiredPropertyDescriptor = 1;

	var $TypeError = type;

	var hasOwn = hasown;

	var allowed = {
		__proto__: null,
		'[[Configurable]]': true,
		'[[Enumerable]]': true,
		'[[Get]]': true,
		'[[Set]]': true,
		'[[Value]]': true,
		'[[Writable]]': true
	};

	// https://262.ecma-international.org/6.0/#sec-property-descriptor-specification-type

	propertyDescriptor = function isPropertyDescriptor(Desc) {
		if (!Desc || typeof Desc !== 'object') {
			return false;
		}

		for (var key in Desc) { // eslint-disable-line
			if (hasOwn(Desc, key) && !allowed[key]) {
				return false;
			}
		}

		var isData = hasOwn(Desc, '[[Value]]') || hasOwn(Desc, '[[Writable]]');
		var IsAccessor = hasOwn(Desc, '[[Get]]') || hasOwn(Desc, '[[Set]]');
		if (isData && IsAccessor) {
			throw new $TypeError('Property Descriptors may not be both accessor and data descriptors');
		}
		return true;
	};
	return propertyDescriptor;
}

var hasPropertyDescriptors_1;
var hasRequiredHasPropertyDescriptors;

function requireHasPropertyDescriptors () {
	if (hasRequiredHasPropertyDescriptors) return hasPropertyDescriptors_1;
	hasRequiredHasPropertyDescriptors = 1;

	var $defineProperty = requireEsDefineProperty();

	var hasPropertyDescriptors = function hasPropertyDescriptors() {
		return !!$defineProperty;
	};

	hasPropertyDescriptors.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
		// node v0.6 has a bug where array lengths can be Set but not Defined
		if (!$defineProperty) {
			return null;
		}
		try {
			return $defineProperty([], 'length', { value: 1 }).length !== 1;
		} catch (e) {
			// In Firefox 4-22, defining length on an array throws an exception.
			return true;
		}
	};

	hasPropertyDescriptors_1 = hasPropertyDescriptors;
	return hasPropertyDescriptors_1;
}

var DefineOwnProperty;
var hasRequiredDefineOwnProperty;

function requireDefineOwnProperty () {
	if (hasRequiredDefineOwnProperty) return DefineOwnProperty;
	hasRequiredDefineOwnProperty = 1;

	var hasPropertyDescriptors = requireHasPropertyDescriptors();

	var $defineProperty = requireEsDefineProperty();

	var hasArrayLengthDefineBug = hasPropertyDescriptors.hasArrayLengthDefineBug();

	// eslint-disable-next-line global-require
	var isArray = hasArrayLengthDefineBug && IsArray$3;

	var callBound = callBound$8;

	var $isEnumerable = callBound('Object.prototype.propertyIsEnumerable');

	// eslint-disable-next-line max-params
	DefineOwnProperty = function DefineOwnProperty(IsDataDescriptor, SameValue, FromPropertyDescriptor, O, P, desc) {
		if (!$defineProperty) {
			if (!IsDataDescriptor(desc)) {
				// ES3 does not support getters/setters
				return false;
			}
			if (!desc['[[Configurable]]'] || !desc['[[Writable]]']) {
				return false;
			}

			// fallback for ES3
			if (P in O && $isEnumerable(O, P) !== !!desc['[[Enumerable]]']) {
				// a non-enumerable existing property
				return false;
			}

			// property does not exist at all, or exists but is enumerable
			var V = desc['[[Value]]'];
			// eslint-disable-next-line no-param-reassign
			O[P] = V; // will use [[Define]]
			return SameValue(O[P], V);
		}
		if (
			hasArrayLengthDefineBug
			&& P === 'length'
			&& '[[Value]]' in desc
			&& isArray(O)
			&& O.length !== desc['[[Value]]']
		) {
			// eslint-disable-next-line no-param-reassign
			O.length = desc['[[Value]]'];
			return O.length === desc['[[Value]]'];
		}

		$defineProperty(O, P, FromPropertyDescriptor(desc));
		return true;
	};
	return DefineOwnProperty;
}

var fromPropertyDescriptor;
var hasRequiredFromPropertyDescriptor$1;

function requireFromPropertyDescriptor$1 () {
	if (hasRequiredFromPropertyDescriptor$1) return fromPropertyDescriptor;
	hasRequiredFromPropertyDescriptor$1 = 1;

	fromPropertyDescriptor = function fromPropertyDescriptor(Desc) {
		if (typeof Desc === 'undefined') {
			return Desc;
		}
		var obj = {};
		if ('[[Value]]' in Desc) {
			obj.value = Desc['[[Value]]'];
		}
		if ('[[Writable]]' in Desc) {
			obj.writable = !!Desc['[[Writable]]'];
		}
		if ('[[Get]]' in Desc) {
			obj.get = Desc['[[Get]]'];
		}
		if ('[[Set]]' in Desc) {
			obj.set = Desc['[[Set]]'];
		}
		if ('[[Enumerable]]' in Desc) {
			obj.enumerable = !!Desc['[[Enumerable]]'];
		}
		if ('[[Configurable]]' in Desc) {
			obj.configurable = !!Desc['[[Configurable]]'];
		}
		return obj;
	};
	return fromPropertyDescriptor;
}

var FromPropertyDescriptor;
var hasRequiredFromPropertyDescriptor;

function requireFromPropertyDescriptor () {
	if (hasRequiredFromPropertyDescriptor) return FromPropertyDescriptor;
	hasRequiredFromPropertyDescriptor = 1;

	var $TypeError = type;

	var isPropertyDescriptor = requirePropertyDescriptor();
	var fromPropertyDescriptor = requireFromPropertyDescriptor$1();

	// https://262.ecma-international.org/6.0/#sec-frompropertydescriptor

	FromPropertyDescriptor = function FromPropertyDescriptor(Desc) {
		if (typeof Desc !== 'undefined' && !isPropertyDescriptor(Desc)) {
			throw new $TypeError('Assertion failed: `Desc` must be a Property Descriptor');
		}

		return fromPropertyDescriptor(Desc);
	};
	return FromPropertyDescriptor;
}

var IsDataDescriptor;
var hasRequiredIsDataDescriptor;

function requireIsDataDescriptor () {
	if (hasRequiredIsDataDescriptor) return IsDataDescriptor;
	hasRequiredIsDataDescriptor = 1;

	var $TypeError = type;

	var hasOwn = hasown;

	var isPropertyDescriptor = requirePropertyDescriptor();

	// https://262.ecma-international.org/5.1/#sec-8.10.2

	IsDataDescriptor = function IsDataDescriptor(Desc) {
		if (typeof Desc === 'undefined') {
			return false;
		}

		if (!isPropertyDescriptor(Desc)) {
			throw new $TypeError('Assertion failed: `Desc` must be a Property Descriptor');
		}

		if (!hasOwn(Desc, '[[Value]]') && !hasOwn(Desc, '[[Writable]]')) {
			return false;
		}

		return true;
	};
	return IsDataDescriptor;
}

var ToBoolean;
var hasRequiredToBoolean;

function requireToBoolean () {
	if (hasRequiredToBoolean) return ToBoolean;
	hasRequiredToBoolean = 1;

	// http://262.ecma-international.org/5.1/#sec-9.2

	ToBoolean = function ToBoolean(value) { return !!value; };
	return ToBoolean;
}

var isCallable;
var hasRequiredIsCallable$1;

function requireIsCallable$1 () {
	if (hasRequiredIsCallable$1) return isCallable;
	hasRequiredIsCallable$1 = 1;

	var fnToStr = Function.prototype.toString;
	var reflectApply = typeof Reflect === 'object' && Reflect !== null && Reflect.apply;
	var badArrayLike;
	var isCallableMarker;
	if (typeof reflectApply === 'function' && typeof Object.defineProperty === 'function') {
		try {
			badArrayLike = Object.defineProperty({}, 'length', {
				get: function () {
					throw isCallableMarker;
				}
			});
			isCallableMarker = {};
			// eslint-disable-next-line no-throw-literal
			reflectApply(function () { throw 42; }, null, badArrayLike);
		} catch (_) {
			if (_ !== isCallableMarker) {
				reflectApply = null;
			}
		}
	} else {
		reflectApply = null;
	}

	var constructorRegex = /^\s*class\b/;
	var isES6ClassFn = function isES6ClassFunction(value) {
		try {
			var fnStr = fnToStr.call(value);
			return constructorRegex.test(fnStr);
		} catch (e) {
			return false; // not a function
		}
	};

	var tryFunctionObject = function tryFunctionToStr(value) {
		try {
			if (isES6ClassFn(value)) { return false; }
			fnToStr.call(value);
			return true;
		} catch (e) {
			return false;
		}
	};
	var toStr = Object.prototype.toString;
	var objectClass = '[object Object]';
	var fnClass = '[object Function]';
	var genClass = '[object GeneratorFunction]';
	var ddaClass = '[object HTMLAllCollection]'; // IE 11
	var ddaClass2 = '[object HTML document.all class]';
	var ddaClass3 = '[object HTMLCollection]'; // IE 9-10
	var hasToStringTag = typeof Symbol === 'function' && !!Symbol.toStringTag; // better: use `has-tostringtag`

	var isIE68 = !(0 in [,]); // eslint-disable-line no-sparse-arrays, comma-spacing

	var isDDA = function isDocumentDotAll() { return false; };
	if (typeof document === 'object') {
		// Firefox 3 canonicalizes DDA to undefined when it's not accessed directly
		var all = document.all;
		if (toStr.call(all) === toStr.call(document.all)) {
			isDDA = function isDocumentDotAll(value) {
				/* globals document: false */
				// in IE 6-8, typeof document.all is "object" and it's truthy
				if ((isIE68 || !value) && (typeof value === 'undefined' || typeof value === 'object')) {
					try {
						var str = toStr.call(value);
						return (
							str === ddaClass
							|| str === ddaClass2
							|| str === ddaClass3 // opera 12.16
							|| str === objectClass // IE 6-8
						) && value('') == null; // eslint-disable-line eqeqeq
					} catch (e) { /**/ }
				}
				return false;
			};
		}
	}

	isCallable = reflectApply
		? function isCallable(value) {
			if (isDDA(value)) { return true; }
			if (!value) { return false; }
			if (typeof value !== 'function' && typeof value !== 'object') { return false; }
			try {
				reflectApply(value, null, badArrayLike);
			} catch (e) {
				if (e !== isCallableMarker) { return false; }
			}
			return !isES6ClassFn(value) && tryFunctionObject(value);
		}
		: function isCallable(value) {
			if (isDDA(value)) { return true; }
			if (!value) { return false; }
			if (typeof value !== 'function' && typeof value !== 'object') { return false; }
			if (hasToStringTag) { return tryFunctionObject(value); }
			if (isES6ClassFn(value)) { return false; }
			var strClass = toStr.call(value);
			if (strClass !== fnClass && strClass !== genClass && !(/^\[object HTML/).test(strClass)) { return false; }
			return tryFunctionObject(value);
		};
	return isCallable;
}

var IsCallable;
var hasRequiredIsCallable;

function requireIsCallable () {
	if (hasRequiredIsCallable) return IsCallable;
	hasRequiredIsCallable = 1;

	// http://262.ecma-international.org/5.1/#sec-9.11

	IsCallable = requireIsCallable$1();
	return IsCallable;
}

var ToPropertyDescriptor;
var hasRequiredToPropertyDescriptor;

function requireToPropertyDescriptor () {
	if (hasRequiredToPropertyDescriptor) return ToPropertyDescriptor;
	hasRequiredToPropertyDescriptor = 1;

	var hasOwn = hasown;

	var $TypeError = type;

	var Type = Type$4;
	var ToBoolean = requireToBoolean();
	var IsCallable = requireIsCallable();

	// https://262.ecma-international.org/5.1/#sec-8.10.5

	ToPropertyDescriptor = function ToPropertyDescriptor(Obj) {
		if (Type(Obj) !== 'Object') {
			throw new $TypeError('ToPropertyDescriptor requires an object');
		}

		var desc = {};
		if (hasOwn(Obj, 'enumerable')) {
			desc['[[Enumerable]]'] = ToBoolean(Obj.enumerable);
		}
		if (hasOwn(Obj, 'configurable')) {
			desc['[[Configurable]]'] = ToBoolean(Obj.configurable);
		}
		if (hasOwn(Obj, 'value')) {
			desc['[[Value]]'] = Obj.value;
		}
		if (hasOwn(Obj, 'writable')) {
			desc['[[Writable]]'] = ToBoolean(Obj.writable);
		}
		if (hasOwn(Obj, 'get')) {
			var getter = Obj.get;
			if (typeof getter !== 'undefined' && !IsCallable(getter)) {
				throw new $TypeError('getter must be a function');
			}
			desc['[[Get]]'] = getter;
		}
		if (hasOwn(Obj, 'set')) {
			var setter = Obj.set;
			if (typeof setter !== 'undefined' && !IsCallable(setter)) {
				throw new $TypeError('setter must be a function');
			}
			desc['[[Set]]'] = setter;
		}

		if ((hasOwn(desc, '[[Get]]') || hasOwn(desc, '[[Set]]')) && (hasOwn(desc, '[[Value]]') || hasOwn(desc, '[[Writable]]'))) {
			throw new $TypeError('Invalid property descriptor. Cannot both specify accessors and a value or writable attribute');
		}
		return desc;
	};
	return ToPropertyDescriptor;
}

var DefinePropertyOrThrow$1;
var hasRequiredDefinePropertyOrThrow;

function requireDefinePropertyOrThrow () {
	if (hasRequiredDefinePropertyOrThrow) return DefinePropertyOrThrow$1;
	hasRequiredDefinePropertyOrThrow = 1;

	var $TypeError = type;

	var isPropertyDescriptor = requirePropertyDescriptor();
	var DefineOwnProperty = requireDefineOwnProperty();

	var FromPropertyDescriptor = requireFromPropertyDescriptor();
	var IsDataDescriptor = requireIsDataDescriptor();
	var IsPropertyKey = IsPropertyKey$2;
	var SameValue = SameValue$1;
	var ToPropertyDescriptor = requireToPropertyDescriptor();
	var Type = Type$4;

	// https://262.ecma-international.org/6.0/#sec-definepropertyorthrow

	DefinePropertyOrThrow$1 = function DefinePropertyOrThrow(O, P, desc) {
		if (Type(O) !== 'Object') {
			throw new $TypeError('Assertion failed: Type(O) is not Object');
		}

		if (!IsPropertyKey(P)) {
			throw new $TypeError('Assertion failed: IsPropertyKey(P) is not true');
		}

		var Desc = isPropertyDescriptor(desc) ? desc : ToPropertyDescriptor(desc);
		if (!isPropertyDescriptor(Desc)) {
			throw new $TypeError('Assertion failed: Desc is not a valid Property Descriptor');
		}

		return DefineOwnProperty(
			IsDataDescriptor,
			SameValue,
			FromPropertyDescriptor,
			O,
			P,
			Desc
		);
	};
	return DefinePropertyOrThrow$1;
}

var GetIntrinsic$3 = GetIntrinsic$4;

var $construct = GetIntrinsic$3('%Reflect.construct%', true);

var DefinePropertyOrThrow = requireDefinePropertyOrThrow();
try {
	DefinePropertyOrThrow({}, '', { '[[Get]]': function () {} });
} catch (e) {
	// Accessor properties aren't supported
	DefinePropertyOrThrow = null;
}

// https://262.ecma-international.org/6.0/#sec-isconstructor

if (DefinePropertyOrThrow && $construct) {
	var isConstructorMarker = {};
	var badArrayLike = {};
	DefinePropertyOrThrow(badArrayLike, 'length', {
		'[[Get]]': function () {
			throw isConstructorMarker;
		},
		'[[Enumerable]]': true
	});

	IsConstructor$2.exports = function IsConstructor(argument) {
		try {
			// `Reflect.construct` invokes `IsConstructor(target)` before `Get(args, 'length')`:
			$construct(argument, badArrayLike);
		} catch (err) {
			return err === isConstructorMarker;
		}
	};
} else {
	IsConstructor$2.exports = function IsConstructor(argument) {
		// unfortunately there's no way to truly check this without try/catch `new argument` in old environments
		return typeof argument === 'function' && !!argument.prototype;
	};
}

var IsConstructorExports = IsConstructor$2.exports;

var GetIntrinsic$2 = getIntrinsic$4;

var $species = GetIntrinsic$2('%Symbol.species%', true);
var $TypeError$9 = type;

var IsConstructor$1 = IsConstructorExports;
var Type$1 = Type$4;

// https://262.ecma-international.org/6.0/#sec-speciesconstructor

var SpeciesConstructor$1 = function SpeciesConstructor(O, defaultConstructor) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$9('Assertion failed: Type(O) is not Object');
	}
	var C = O.constructor;
	if (typeof C === 'undefined') {
		return defaultConstructor;
	}
	if (Type$1(C) !== 'Object') {
		throw new $TypeError$9('O.constructor is not an Object');
	}
	var S = $species ? C[$species] : void 0;
	if (S == null) {
		return defaultConstructor;
	}
	if (IsConstructor$1(S)) {
		return S;
	}
	throw new $TypeError$9('no constructor found');
};

var hasOwn = hasown;
var isTypedArray$4 = requireIsTypedArray();

var isInteger = isInteger$4;

var typedArrayWithBufferWitnessRecord = function isTypedArrayWithBufferWitnessRecord(value) {
	return !!value
		&& typeof value === 'object'
		&& hasOwn(value, '[[Object]]')
		&& hasOwn(value, '[[CachedBufferByteLength]]')
		&& (
			(isInteger(value['[[CachedBufferByteLength]]']) && value['[[CachedBufferByteLength]]'] >= 0)
			|| value['[[CachedBufferByteLength]]'] === 'DETACHED'
		)
		&& isTypedArray$4(value['[[Object]]']);
};

var possibleNames = possibleTypedArrayNames;

var g = typeof globalThis === 'undefined' ? global : globalThis;

/** @type {import('.')} */
var availableTypedArrays$2 = function availableTypedArrays() {
	var /** @type {ReturnType<typeof availableTypedArrays>} */ out = [];
	for (var i = 0; i < possibleNames.length; i++) {
		if (typeof g[possibleNames[i]] === 'function') {
			// @ts-expect-error
			out[out.length] = possibleNames[i];
		}
	}
	return out;
};

var test$1 = {
	__proto__: null,
	foo: {}
};

var $Object$1 = Object;

/** @type {import('.')} */
var hasProto$5 = function hasProto() {
	// @ts-expect-error: TS errors on an inherited property for some reason
	return { __proto__: test$1 }.foo === test$1.foo
		&& !(test$1 instanceof $Object$1);
};

var forEach$2 = forEach_1;
var callBind$2 = callBindExports;

var typedArrays$1 = availableTypedArrays$2();

/** @typedef {Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BigInt64Array | BigUint64Array} TypedArray */
/** @typedef {(x: TypedArray) => number} ByteOffsetGetter */

/** @type {Object.<typeof typedArrays, ByteOffsetGetter>} */
var getters$1 = {};
var hasProto$4 = hasProto$5();

var gOPD$1 = gopd$3;
var oDP$1 = Object.defineProperty;
if (gOPD$1) {
	/** @type {ByteOffsetGetter} */
	var getByteOffset = function (x) {
		return x.byteOffset;
	};
	forEach$2(typedArrays$1, function (typedArray) {
		// In Safari 7, Typed Array constructors are typeof object
		if (typeof global[typedArray] === 'function' || typeof global[typedArray] === 'object') {
			var Proto = global[typedArray].prototype;
			// @ts-expect-error TS can't guarantee the callback is invoked sync
			var descriptor = gOPD$1(Proto, 'byteOffset');
			if (!descriptor && hasProto$4) {
				// @ts-expect-error hush, TS, every object has a dunder proto
				var superProto = Proto.__proto__; // eslint-disable-line no-proto
				// @ts-expect-error TS can't guarantee the callback is invoked sync
				descriptor = gOPD$1(superProto, 'byteOffset');
			}
			// Opera 12.16 has a magic byteOffset data property on instances AND on Proto
			if (descriptor && descriptor.get) {
				getters$1[typedArray] = callBind$2(descriptor.get);
			} else if (oDP$1) {
				// this is likely an engine where instances have a magic byteOffset data property
				var arr = new global[typedArray](2);
				// @ts-expect-error TS can't guarantee the callback is invoked sync
				descriptor = gOPD$1(arr, 'byteOffset');
				if (descriptor && descriptor.configurable) {
					oDP$1(arr, 'length', { value: 3 });
				}
				if (arr.length === 2) {
					getters$1[typedArray] = getByteOffset;
				}
			}
		}
	});
}

/** @type {ByteOffsetGetter} */
var tryTypedArrays$1 = function tryAllTypedArrays(value) {
	/** @type {number} */ var foundOffset;
	forEach$2(getters$1, /** @type {(getter: ByteOffsetGetter) => void} */ function (getter) {
		if (typeof foundOffset !== 'number') {
			try {
				var offset = getter(value);
				if (typeof offset === 'number') {
					foundOffset = offset;
				}
			} catch (e) {}
		}
	});
	// @ts-expect-error TS can't guarantee the callback is invoked sync
	return foundOffset;
};

var isTypedArray$3 = requireIsTypedArray();

/** @type {import('.')} */
var typedArrayByteOffset$3 = function typedArrayByteOffset(value) {
	if (!isTypedArray$3(value)) {
		return false;
	}
	return tryTypedArrays$1(value);
};

var test = {
	__proto__: null,
	foo: {}
};

var $Object = Object;

/** @type {import('.')} */
var hasProto$3 = function hasProto() {
	// @ts-expect-error: TS errors on an inherited property for some reason
	return { __proto__: test }.foo === test.foo
		&& !(test instanceof $Object);
};

// / <reference types="node" />

var callBind$1 = callBindExports;
var forEach$1 = forEach_1;
var gOPD = gopd$3;
var hasProto$2 = hasProto$3();
var isTypedArray$2 = requireIsTypedArray();
var typedArrays = possibleTypedArrayNames;

/** @typedef {(value: import('.').TypedArray) => number} TypedArrayLengthGetter */
/** @typedef {{ [k in `$${import('.').TypedArrayName}` | '__proto__']: k extends '__proto__' ? null : TypedArrayLengthGetter }} Cache */

/** @type {Cache} */
// @ts-expect-error TS doesn't seem to have a "will eventually satisfy" type
var getters = { __proto__: null };
var oDP = Object.defineProperty;
if (gOPD) {
	var getLength = /** @type {TypedArrayLengthGetter} */ function (x) {
		return x.length;
	};
	forEach$1(typedArrays, /** @type {(typedArray: import('.').TypedArrayName) => void} */ function (typedArray) {
		var TA = global[typedArray];
		// In Safari 7, Typed Array constructors are typeof object
		if (typeof TA === 'function' || typeof TA === 'object') {
			var Proto = TA.prototype;
			// @ts-expect-error TS doesn't narrow types inside callbacks, which is weird
			var descriptor = gOPD(Proto, 'length');
			if (!descriptor && hasProto$2) {
				var superProto = Proto.__proto__; // eslint-disable-line no-proto
				// @ts-expect-error TS doesn't narrow types inside callbacks, which is weird
				descriptor = gOPD(superProto, 'length');
			}
			// Opera 12.16 has a magic length data property on instances AND on Proto
			if (descriptor && descriptor.get) {
				// eslint-disable-next-line no-extra-parens
				getters[/** @type {`$${import('.').TypedArrayName}`} */ ('$' + typedArray)] = callBind$1(descriptor.get);
			} else if (oDP) {
				// this is likely an engine where instances have a magic length data property
				var arr = new global[typedArray](2);
				// @ts-expect-error TS doesn't narrow types inside callbacks, which is weird
				descriptor = gOPD(arr, 'length');
				if (descriptor && descriptor.configurable) {
					oDP(arr, 'length', { value: 3 });
				}
				if (arr.length === 2) {
				// eslint-disable-next-line no-extra-parens
					getters[/** @type {`$${import('.').TypedArrayName}`} */ ('$' + typedArray)] = getLength;
				}
			}
		}
	});
}

/** @type {TypedArrayLengthGetter} */
var tryTypedArrays = function tryAllTypedArrays(value) {
	/** @type {number} */ var foundLength;
	// @ts-expect-error not sure why this won't work
	forEach$1(getters, /** @type {(getter: TypedArrayLengthGetter) => void} */ function (getter) {
		if (typeof foundLength !== 'number') {
			try {
				var length = getter(value);
				if (typeof length === 'number') {
					foundLength = length;
				}
			} catch (e) {}
		}
	});
	// @ts-expect-error TS can't guarantee the above callback is invoked sync
	return foundLength;
};

/** @type {import('.')} */
var typedArrayLength$2 = function typedArrayLength(value) {
	if (!isTypedArray$2(value)) {
		return false;
	}
	return tryTypedArrays(value);
};

var $TypeError$8 = type;

var IsDetachedBuffer$3 = IsDetachedBuffer$6;
var TypedArrayElementSize$2 = TypedArrayElementSize$3;

var isTypedArrayWithBufferWitnessRecord$1 = typedArrayWithBufferWitnessRecord;

var typedArrayBuffer$3 = typedArrayBuffer$4;
var typedArrayByteOffset$2 = typedArrayByteOffset$3;
var typedArrayLength$1 = typedArrayLength$2;

// https://tc39.es/ecma262/#sec-istypedarrayoutofbounds

var IsTypedArrayOutOfBounds$3 = function IsTypedArrayOutOfBounds(taRecord) {
	if (!isTypedArrayWithBufferWitnessRecord$1(taRecord)) {
		throw new $TypeError$8('Assertion failed: `taRecord` must be a TypedArray With Buffer Witness Record');
	}

	var O = taRecord['[[Object]]']; // step 1

	var bufferByteLength = taRecord['[[CachedBufferByteLength]]']; // step 2

	if (IsDetachedBuffer$3(typedArrayBuffer$3(O)) && bufferByteLength !== 'DETACHED') {
		throw new $TypeError$8('Assertion failed: typed array is detached only if the byte length is ~DETACHED~'); // step 3
	}

	if (bufferByteLength === 'DETACHED') {
		return true; // step 4
	}

	var byteOffsetStart = typedArrayByteOffset$2(O); // step 5

	var byteOffsetEnd;
	var length = typedArrayLength$1(O);
	// TODO: probably use package for array length
	// seems to apply when TA is backed by a resizable/growable AB
	if (length === 'AUTO') { // step 6
		byteOffsetEnd = bufferByteLength; // step 6.a
	} else {
		var elementSize = TypedArrayElementSize$2(O); // step 7.a

		byteOffsetEnd = byteOffsetStart + (length * elementSize); // step 7.b
	}

	if (byteOffsetStart > bufferByteLength || byteOffsetEnd > bufferByteLength) {
		return true; // step 8
	}

	// 9. NOTE: 0-length TypedArrays are not considered out-of-bounds.

	return false; // step 10
};

var $TypeError$7 = type;

var callBound = callBound$8;

var $arrayBufferResizable = callBound('%ArrayBuffer.prototype.resizable%', true);
var $sharedArrayGrowable = callBound('%SharedArrayBuffer.prototype.growable%', true);

var isArrayBuffer$1 = isArrayBuffer$6;
var isSharedArrayBuffer$1 = isSharedArrayBuffer$5;

// https://262.ecma-international.org/15.0/#sec-isfixedlengtharraybuffer

var IsFixedLengthArrayBuffer$1 = function IsFixedLengthArrayBuffer(arrayBuffer) {
	var isAB = isArrayBuffer$1(arrayBuffer);
	var isSAB = isSharedArrayBuffer$1(arrayBuffer);
	if (!isAB && !isSAB) {
		throw new $TypeError$7('Assertion failed: `arrayBuffer` must be an ArrayBuffer or SharedArrayBuffer');
	}

	if (isAB && $arrayBufferResizable) {
		return !$arrayBufferResizable(arrayBuffer); // step 1
	}
	if (isSAB && $sharedArrayGrowable) {
		return !$sharedArrayGrowable(arrayBuffer); // step 1
	}
	return true; // step 2
};

var $TypeError$6 = type;

var floor = floor$2;
var IsFixedLengthArrayBuffer = IsFixedLengthArrayBuffer$1;
var IsTypedArrayOutOfBounds$2 = IsTypedArrayOutOfBounds$3;
var TypedArrayElementSize$1 = TypedArrayElementSize$3;

var isTypedArrayWithBufferWitnessRecord = typedArrayWithBufferWitnessRecord;

var typedArrayBuffer$2 = typedArrayBuffer$4;
var typedArrayByteOffset$1 = typedArrayByteOffset$3;
var typedArrayLength = typedArrayLength$2;

// http://www.ecma-international.org/ecma-262/15.0/#sec-typedarraylength

var TypedArrayLength$1 = function TypedArrayLength(taRecord) {
	if (!isTypedArrayWithBufferWitnessRecord(taRecord)) {
		throw new $TypeError$6('Assertion failed: `taRecord` must be a TypedArray With Buffer Witness Record');
	}

	if (IsTypedArrayOutOfBounds$2(taRecord)) {
		throw new $TypeError$6('Assertion failed: `taRecord` is out of bounds'); // step 1
	}

	var O = taRecord['[[Object]]']; // step 2

	var length = typedArrayLength(O);
	if (length !== 'AUTO') {
		return length; // step 3
	}

	if (IsFixedLengthArrayBuffer(typedArrayBuffer$2(O))) {
		throw new $TypeError$6('Assertion failed: array buffer is not fixed length'); // step 4
	}

	var byteOffset = typedArrayByteOffset$1(O); // step 5

	var elementSize = TypedArrayElementSize$1(O); // step 6

	var byteLength = taRecord['[[CachedBufferByteLength]]']; // step 7

	if (byteLength === 'DETACHED') {
		throw new $TypeError$6('Assertion failed: typed array is detached'); // step 8
	}

	return floor((byteLength - byteOffset) / elementSize); // step 9
};

var $TypeError$5 = type;

// https://tc39.es/ecma262/#sec-arraybufferbytelength

var IsDetachedBuffer$2 = IsDetachedBuffer$6;

var isArrayBuffer = isArrayBuffer$6;
var isSharedArrayBuffer = isSharedArrayBuffer$5;
var arrayBufferByteLength = arrayBufferByteLength$1;

var ArrayBufferByteLength$1 = function ArrayBufferByteLength(arrayBuffer, order) {
	var isSAB = isSharedArrayBuffer(arrayBuffer);
	if (!isArrayBuffer(arrayBuffer) && !isSAB) {
		throw new $TypeError$5('Assertion failed: `arrayBuffer` must be an ArrayBuffer or a SharedArrayBuffer');
	}
	if (order !== 'SEQ-CST' && order !== 'UNORDERED') {
		throw new $TypeError$5('Assertion failed: `order` must be ~SEQ-CST~ or ~UNORDERED~');
	}

	if (IsDetachedBuffer$2(arrayBuffer)) {
		throw new $TypeError$5('Assertion failed: `arrayBuffer` must not be detached'); // step 2
	}

	return arrayBufferByteLength(arrayBuffer);
};

var $TypeError$4 = type;

var ArrayBufferByteLength = ArrayBufferByteLength$1;
var IsDetachedBuffer$1 = IsDetachedBuffer$6;

var isTypedArray$1 = requireIsTypedArray();
var typedArrayBuffer$1 = typedArrayBuffer$4;

// https://tc39.es/ecma262/#sec-maketypedarraywithbufferwitnessrecord

var MakeTypedArrayWithBufferWitnessRecord$1 = function MakeTypedArrayWithBufferWitnessRecord(obj, order) {
	if (!isTypedArray$1(obj)) {
		throw new $TypeError$4('Assertion failed: `obj` must be a Typed Array');
	}
	if (order !== 'SEQ-CST' && order !== 'UNORDERED') {
		throw new $TypeError$4('Assertion failed: `order` must be ~SEQ-CST~ or ~UNORDERED~');
	}

	var buffer = typedArrayBuffer$1(obj); // step 1

	var byteLength = IsDetachedBuffer$1(buffer) ? 'DETACHED' : ArrayBufferByteLength(buffer, order); // steps 2 - 3

	return { '[[Object]]': obj, '[[CachedBufferByteLength]]': byteLength }; // step 4
};

var $TypeError$3 = type;

var IsTypedArrayOutOfBounds$1 = IsTypedArrayOutOfBounds$3;
var MakeTypedArrayWithBufferWitnessRecord = MakeTypedArrayWithBufferWitnessRecord$1;
var Type = Type$4;

var isTypedArray = requireIsTypedArray();

// https://262.ecma-international.org/15.0/#sec-validatetypedarray

var ValidateTypedArray$2 = function ValidateTypedArray(O, order) {
	if (order !== 'SEQ-CST' && order !== 'UNORDERED') {
		throw new $TypeError$3('Assertion failed: `order` must be ~SEQ-CST~ or ~UNORDERED~');
	}

	if (Type(O) !== 'Object') {
		throw new $TypeError$3('Assertion failed: `O` must be an Object'); // step 1
	}
	if (!isTypedArray(O)) {
		throw new $TypeError$3('Assertion failed: `O` must be a Typed Array'); // steps 1 - 2
	}

	var taRecord = MakeTypedArrayWithBufferWitnessRecord(O, order); // step 3

	if (IsTypedArrayOutOfBounds$1(taRecord)) {
		throw new $TypeError$3('`O` must be in-bounds and backed by a non-detached buffer'); // step 4
	}

	return taRecord; // step 5
};

var $SyntaxError$1 = syntax;
var $TypeError$2 = type;

var IsArray$1 = IsArray$2;
var IsConstructor = IsConstructorExports;
var IsTypedArrayOutOfBounds = IsTypedArrayOutOfBounds$3;
var TypedArrayLength = TypedArrayLength$1;
var ValidateTypedArray$1 = ValidateTypedArray$2;

var availableTypedArrays$1 = availableTypedArrays$4();

// https://262.ecma-international.org/15.0/#typedarraycreatefromconstructor

var TypedArrayCreateFromConstructor$1 = function TypedArrayCreateFromConstructor(constructor, argumentList) {
	if (!IsConstructor(constructor)) {
		throw new $TypeError$2('Assertion failed: `constructor` must be a constructor');
	}
	if (!IsArray$1(argumentList)) {
		throw new $TypeError$2('Assertion failed: `argumentList` must be a List');
	}
	if (availableTypedArrays$1.length === 0) {
		throw new $SyntaxError$1('Assertion failed: Typed Arrays are not supported in this environment');
	}

	// var newTypedArray = Construct(constructor, argumentList); // step 1
	var newTypedArray;
	if (argumentList.length === 0) {
		newTypedArray = new constructor();
	} else if (argumentList.length === 1) {
		newTypedArray = new constructor(argumentList[0]);
	} else if (argumentList.length === 2) {
		newTypedArray = new constructor(argumentList[0], argumentList[1]);
	} else {
		newTypedArray = new constructor(argumentList[0], argumentList[1], argumentList[2]);
	}

	var taRecord = ValidateTypedArray$1(newTypedArray, 'SEQ-CST'); // step 2

	if (argumentList.length === 1 && typeof argumentList[0] === 'number') { // step 3
		if (IsTypedArrayOutOfBounds(taRecord)) {
			throw new $TypeError$2('new Typed Array is out of bounds'); // step 3.a
		}
		var length = TypedArrayLength(taRecord); // step 3.b
		if (length < argumentList[0]) {
			throw new $TypeError$2('`argumentList[0]` must be <= `newTypedArray.length`'); // step 3.c
		}
	}

	return newTypedArray; // step 4
};

var GetIntrinsic$1 = getIntrinsic$4;

var constructors = {
	__proto__: null,
	$Int8Array: GetIntrinsic$1('%Int8Array%', true),
	$Uint8Array: GetIntrinsic$1('%Uint8Array%', true),
	$Uint8ClampedArray: GetIntrinsic$1('%Uint8ClampedArray%', true),
	$Int16Array: GetIntrinsic$1('%Int16Array%', true),
	$Uint16Array: GetIntrinsic$1('%Uint16Array%', true),
	$Int32Array: GetIntrinsic$1('%Int32Array%', true),
	$Uint32Array: GetIntrinsic$1('%Uint32Array%', true),
	$BigInt64Array: GetIntrinsic$1('%BigInt64Array%', true),
	$BigUint64Array: GetIntrinsic$1('%BigUint64Array%', true),
	$Float32Array: GetIntrinsic$1('%Float32Array%', true),
	$Float64Array: GetIntrinsic$1('%Float64Array%', true)
};

var typedArrayConstructors = function getConstructor(kind) {
	return constructors['$' + kind];
};

var $SyntaxError = syntax;
var $TypeError$1 = type;

var whichTypedArray$1 = whichTypedArray$4;
var availableTypedArrays = availableTypedArrays$4();

var IsArray = IsArray$2;
var SpeciesConstructor = SpeciesConstructor$1;
var TypedArrayCreateFromConstructor = TypedArrayCreateFromConstructor$1;

var getConstructor = typedArrayConstructors;

// https://262.ecma-international.org/15.0/#typedarray-species-create

var TypedArraySpeciesCreate$1 = function TypedArraySpeciesCreate(exemplar, argumentList) {
	if (availableTypedArrays.length === 0) {
		throw new $SyntaxError('Assertion failed: Typed Arrays are not supported in this environment');
	}

	var kind = whichTypedArray$1(exemplar);
	if (!kind) {
		throw new $TypeError$1('Assertion failed: exemplar must be a TypedArray'); // step 1
	}
	if (!IsArray(argumentList)) {
		throw new $TypeError$1('Assertion failed: `argumentList` must be a List'); // step 1
	}

	var defaultConstructor = getConstructor(kind); // step 2
	if (typeof defaultConstructor !== 'function') {
		throw new $SyntaxError('Assertion failed: `constructor` of `exemplar` (' + kind + ') must exist. Please report this!');
	}
	var constructor = SpeciesConstructor(exemplar, defaultConstructor); // step 3

	return TypedArrayCreateFromConstructor(constructor, argumentList); // step 4
};

var $TypeError = type;

var Get = Get$1;
var GetValueFromBuffer = GetValueFromBuffer$1;
var IsDetachedBuffer = IsDetachedBuffer$6;
var max = max$1;
var min = min$1;
var Set$1 = _Set;
var SetValueInBuffer = SetValueInBuffer$1;
var ToIntegerOrInfinity = ToIntegerOrInfinity$1;
var ToString = ToString$1;
var TypedArrayElementSize = TypedArrayElementSize$3;
var TypedArrayElementType = TypedArrayElementType$1;
var TypedArraySpeciesCreate = TypedArraySpeciesCreate$1;
var ValidateTypedArray = ValidateTypedArray$2;

var typedArrayBuffer = typedArrayBuffer$4;
var typedArrayByteOffset = typedArrayByteOffset$3;

// https://tc39.es/ecma262/#sec-%typedarray%.prototype.slice

var implementation$2 = function slice(start, end) {
	var O = this; // step 1

	ValidateTypedArray(O, 'SEQ-CST'); // step 2

	// 3. Let len be O.[[ArrayLength]].
	var len = O.length; // steps 3

	var relativeStart = ToIntegerOrInfinity(start); // step 4

	var k;
	if (relativeStart === -Infinity) {
		k = 0; // step 5
	} else if (relativeStart < 0) {
		k = max(len + relativeStart, 0); // step 6
	} else {
		k = min(relativeStart, len); // step 7
	}

	var relativeEnd = typeof end === 'undefined' ? len : ToIntegerOrInfinity(end); // step 8

	var final;
	if (relativeEnd === -Infinity) {
		final = 0; // step 9
	} else if (relativeEnd < 0) {
		final = max(len + relativeEnd, 0); // step 10
	} else {
		final = min(relativeEnd, len); // step 11
	}

	var count = max(final - k, 0); // step 12

	var A = TypedArraySpeciesCreate(O, [count]); // step 13

	if (count > 0) { // step 14
		if (IsDetachedBuffer(typedArrayBuffer(O))) {
			throw new $TypeError('Cannot use a Typed Array with an underlying ArrayBuffer that is detached'); // step 14.a
		}
		var srcType = TypedArrayElementType(O); // step 14.b
		var targetType = TypedArrayElementType(A); // step 14.c
		if (srcType === targetType) { // step 14.d
			//  1. NOTE: The transfer must be performed in a manner that preserves the bit-level encoding of the source data.
			var srcBuffer = typedArrayBuffer(O); // step 14.d.ii
			var targetBuffer = typedArrayBuffer(A); // step 14.d.iii
			var elementSize = TypedArrayElementSize(O); // step 14.d.iv
			var srcByteOffset = typedArrayByteOffset(O); // step 14.d.v
			var srcByteIndex = (k * elementSize) + srcByteOffset; // step 14.d.vi
			var targetByteIndex = typedArrayByteOffset(A); // step 14.d.vii
			var limit = targetByteIndex + (count * elementSize); // step 14.d.viii
			while (targetByteIndex < limit) { // step 14.d.ix
				var value = GetValueFromBuffer(srcBuffer, srcByteIndex, 'UINT8', true, 'UNORDERED'); // step 14.d.ix.1
				SetValueInBuffer(targetBuffer, targetByteIndex, 'UINT8', value, true, 'UNORDERED'); // step 14.d.ix.2
				srcByteIndex += 1; // step 14.d.ix.3
				targetByteIndex += 1; // step 14.d.ix.4
			}
		} else { // step 14.e
			var n = 0; // step 14.e.i
			while (k < final) { // step 14.e.ii
				var Pk = ToString(k); // step 14.e.ii.1
				var kValue = Get(O, Pk); // step 14.e.ii.2
				Set$1(A, ToString(n), kValue, true); // step 14.e.ii.3
				k += 1; // step 14.e.ii.4
				n += 1; // step 14.e.ii.5
			}
		}
	}

	return A; // step 15
};

var implementation$1 = implementation$2;

var polyfill = function getPolyfill() {
	return (typeof Uint8Array === 'function' && Uint8Array.prototype.slice) || implementation$1;
};

var hasProto$1;
var hasRequiredHasProto;

function requireHasProto () {
	if (hasRequiredHasProto) return hasProto$1;
	hasRequiredHasProto = 1;

	var test = {
		__proto__: null,
		foo: {}
	};

	var $Object = Object;

	/** @type {import('.')} */
	hasProto$1 = function hasProto() {
		// @ts-expect-error: TS errors on an inherited property for some reason
		return { __proto__: test }.foo === test.foo
			&& !(test instanceof $Object);
	};
	return hasProto$1;
}

var GetIntrinsic = getIntrinsic$4;

var originalGetProto = GetIntrinsic('%Object.getPrototypeOf%', true);

var hasProto = requireHasProto()();

var getProto$1 = originalGetProto || (
	hasProto
		? function (O) {
			return O.__proto__; // eslint-disable-line no-proto
		}
		: null
);

var define$1 = defineProperties_1;
var getProto = getProto$1;

var getPolyfill$1 = polyfill;

var shim$1 = function shimTypedArraySlice() {
	if (typeof Uint8Array === 'function') {
		var polyfill = getPolyfill$1();
		var proto = getProto(Uint8Array.prototype);
		define$1(
			proto,
			{ slice: polyfill },
			{ slice: function () { return proto.slice !== polyfill; } }
		);
	}

	return polyfill;
};

var define = defineProperties_1;
var callBind = callBindExports;

var implementation = implementation$2;
var getPolyfill = polyfill;
var shim = shim$1;

var bound = callBind(getPolyfill());

define(bound, {
	getPolyfill: getPolyfill,
	implementation: implementation,
	shim: shim
});

var typedarray_prototype_slice = bound;

var whichTypedArray = whichTypedArray$4;
var taSlice = typedarray_prototype_slice;
var gopd = gopd$3;

// TODO: use call-bind, is-date, is-regex, is-string, is-boolean-object, is-number-object
function toS(obj) { return Object.prototype.toString.call(obj); }
function isDate(obj) { return toS(obj) === '[object Date]'; }
function isRegExp(obj) { return toS(obj) === '[object RegExp]'; }
function isError(obj) { return toS(obj) === '[object Error]'; }
function isBoolean(obj) { return toS(obj) === '[object Boolean]'; }
function isNumber(obj) { return toS(obj) === '[object Number]'; }
function isString(obj) { return toS(obj) === '[object String]'; }

// TODO: use isarray
var isArray = Array.isArray || function isArray(xs) {
	return Object.prototype.toString.call(xs) === '[object Array]';
};

// TODO: use for-each?
function forEach(xs, fn) {
	if (xs.forEach) { return xs.forEach(fn); }
	for (var i = 0; i < xs.length; i++) {
		fn(xs[i], i, xs);
	}
	return void undefined;
}

// TODO: use object-keys
var objectKeys = Object.keys || function keys(obj) {
	var res = [];
	for (var key in obj) { res.push(key); } // eslint-disable-line no-restricted-syntax
	return res;
};

var propertyIsEnumerable = Object.prototype.propertyIsEnumerable;
var getOwnPropertySymbols = Object.getOwnPropertySymbols; // eslint-disable-line id-length

// TODO: use reflect.ownkeys and filter out non-enumerables
function ownEnumerableKeys(obj) {
	var res = objectKeys(obj);

	// Include enumerable symbol properties.
	if (getOwnPropertySymbols) {
		var symbols = getOwnPropertySymbols(obj);
		for (var i = 0; i < symbols.length; i++) {
			if (propertyIsEnumerable.call(obj, symbols[i])) {
				res.push(symbols[i]);
			}
		}
	}
	return res;
}

// TODO: use object.hasown
var hasOwnProperty = Object.prototype.hasOwnProperty || function (obj, key) {
	return key in obj;
};

function isWritable(object, key) {
	if (typeof gopd !== 'function') {
		return true;
	}

	return !gopd(object, key).writable;
}

function copy(src, options) {
	if (typeof src === 'object' && src !== null) {
		var dst;

		if (isArray(src)) {
			dst = [];
		} else if (isDate(src)) {
			dst = new Date(src.getTime ? src.getTime() : src);
		} else if (isRegExp(src)) {
			dst = new RegExp(src);
		} else if (isError(src)) {
			dst = { message: src.message };
		} else if (isBoolean(src) || isNumber(src) || isString(src)) {
			dst = Object(src);
		} else {
			var ta = whichTypedArray(src);
			if (ta) {
				return taSlice(src);
			} else if (Object.create && Object.getPrototypeOf) {
				dst = Object.create(Object.getPrototypeOf(src));
			} else if (src.constructor === Object) {
				dst = {};
			} else {
				var proto = (src.constructor && src.constructor.prototype)
					|| src.__proto__
					|| {};
				var T = function T() {}; // eslint-disable-line func-style, func-name-matching
				T.prototype = proto;
				dst = new T();
			}
		}

		var iteratorFunction = options.includeSymbols ? ownEnumerableKeys : objectKeys;
		forEach(iteratorFunction(src), function (key) {
			dst[key] = src[key];
		});
		return dst;
	}
	return src;
}

/** @type {TraverseOptions} */
var emptyNull = { __proto__: null };

function walk(root, cb) {
	var path = [];
	var parents = [];
	var alive = true;
	var options = arguments.length > 2 ? arguments[2] : emptyNull;
	var iteratorFunction = options.includeSymbols ? ownEnumerableKeys : objectKeys;
	var immutable = !!options.immutable;

	return (function walker(node_) {
		var node = immutable ? copy(node_, options) : node_;
		var modifiers = {};

		var keepGoing = true;

		var state = {
			node: node,
			node_: node_,
			path: [].concat(path),
			parent: parents[parents.length - 1],
			parents: parents,
			key: path[path.length - 1],
			isRoot: path.length === 0,
			level: path.length,
			circular: null,
			update: function (x, stopHere) {
				if (!state.isRoot) {
					state.parent.node[state.key] = x;
				}
				state.node = x;
				if (stopHere) { keepGoing = false; }
			},
			delete: function (stopHere) {
				delete state.parent.node[state.key];
				if (stopHere) { keepGoing = false; }
			},
			remove: function (stopHere) {
				if (isArray(state.parent.node)) {
					state.parent.node.splice(state.key, 1);
				} else {
					delete state.parent.node[state.key];
				}
				if (stopHere) { keepGoing = false; }
			},
			keys: null,
			before: function (f) { modifiers.before = f; },
			after: function (f) { modifiers.after = f; },
			pre: function (f) { modifiers.pre = f; },
			post: function (f) { modifiers.post = f; },
			stop: function () { alive = false; },
			block: function () { keepGoing = false; },
		};

		if (!alive) { return state; }

		function updateState() {
			if (typeof state.node === 'object' && state.node !== null) {
				if (!state.keys || state.node_ !== state.node) {
					state.keys = iteratorFunction(state.node);
				}

				state.isLeaf = state.keys.length === 0;

				for (var i = 0; i < parents.length; i++) {
					if (parents[i].node_ === node_) {
						state.circular = parents[i];
						break; // eslint-disable-line no-restricted-syntax
					}
				}
			} else {
				state.isLeaf = true;
				state.keys = null;
			}

			state.notLeaf = !state.isLeaf;
			state.notRoot = !state.isRoot;
		}

		updateState();

		// use return values to update if defined
		var ret = cb.call(state, state.node);
		if (ret !== undefined && state.update) { state.update(ret); }

		if (modifiers.before) { modifiers.before.call(state, state.node); }

		if (!keepGoing) { return state; }

		if (
			typeof state.node === 'object'
			&& state.node !== null
			&& !state.circular
		) {
			parents.push(state);

			updateState();

			forEach(state.keys, function (key, i) {
				path.push(key);

				if (modifiers.pre) { modifiers.pre.call(state, state.node[key], key); }

				var child = walker(state.node[key]);
				if (
					immutable
					&& hasOwnProperty.call(state.node, key)
					&& !isWritable(state.node, key)
				) {
					state.node[key] = child.node;
				}

				child.isLast = i === state.keys.length - 1;
				child.isFirst = i === 0;

				if (modifiers.post) { modifiers.post.call(state, child); }

				path.pop();
			});
			parents.pop();
		}

		if (modifiers.after) { modifiers.after.call(state, state.node); }

		return state;
	}(root)).node;
}

/** @typedef {{ immutable?: boolean, includeSymbols?: boolean }} TraverseOptions */

/**
 * A traverse constructor
 * @param {object} obj - the object to traverse
 * @param {TraverseOptions | undefined} [options] - options for the traverse
 * @constructor
 */
function Traverse(obj) {
	/** @type {TraverseOptions} */
	this.options = arguments.length > 1 ? arguments[1] : emptyNull;
	this.value = obj;
}

/** @type {(ps: PropertyKey[]) => Traverse['value']} */
Traverse.prototype.get = function (ps) {
	var node = this.value;
	for (var i = 0; node && i < ps.length; i++) {
		var key = ps[i];
		if (
			!hasOwnProperty.call(node, key)
			|| (!this.options.includeSymbols && typeof key === 'symbol')
		) {
			return void undefined;
		}
		node = node[key];
	}
	return node;
};

/** @type {(ps: PropertyKey[]) => boolean} */
Traverse.prototype.has = function (ps) {
	var node = this.value;
	for (var i = 0; node && i < ps.length; i++) {
		var key = ps[i];
		if (!hasOwnProperty.call(node, key) || (!this.options.includeSymbols && typeof key === 'symbol')) {
			return false;
		}
		node = node[key];
	}
	return true;
};

Traverse.prototype.set = function (ps, value) {
	var node = this.value;
	for (var i = 0; i < ps.length - 1; i++) {
		var key = ps[i];
		if (!hasOwnProperty.call(node, key)) { node[key] = {}; }
		node = node[key];
	}
	node[ps[i]] = value;
	return value;
};

Traverse.prototype.map = function (cb) {
	return walk(this.value, cb, { __proto__: null, immutable: true, includeSymbols: !!this.options.includeSymbols });
};

Traverse.prototype.forEach = function (cb) {
	this.value = walk(this.value, cb, this.options);
	return this.value;
};

Traverse.prototype.reduce = function (cb, init) {
	var skip = arguments.length === 1;
	var acc = skip ? this.value : init;
	this.forEach(function (x) {
		if (!this.isRoot || !skip) {
			acc = cb.call(this, acc, x);
		}
	});
	return acc;
};

Traverse.prototype.paths = function () {
	var acc = [];
	this.forEach(function () {
		acc.push(this.path);
	});
	return acc;
};

Traverse.prototype.nodes = function () {
	var acc = [];
	this.forEach(function () {
		acc.push(this.node);
	});
	return acc;
};

Traverse.prototype.clone = function () {
	var parents = [];
	var nodes = [];
	var options = this.options;

	if (whichTypedArray(this.value)) {
		return taSlice(this.value);
	}

	return (function clone(src) {
		for (var i = 0; i < parents.length; i++) {
			if (parents[i] === src) {
				return nodes[i];
			}
		}

		if (typeof src === 'object' && src !== null) {
			var dst = copy(src, options);

			parents.push(src);
			nodes.push(dst);

			var iteratorFunction = options.includeSymbols ? ownEnumerableKeys : objectKeys;
			forEach(iteratorFunction(src), function (key) {
				dst[key] = clone(src[key]);
			});

			parents.pop();
			nodes.pop();
			return dst;
		}

		return src;

	}(this.value));
};

/** @type {(obj: object, options?: TraverseOptions) => Traverse} */
function traverse$1(obj) {
	var options = arguments.length > 1 ? arguments[1] : emptyNull;
	return new Traverse(obj, options);
}

// TODO: replace with object.assign?
forEach(ownEnumerableKeys(Traverse.prototype), function (key) {
	traverse$1[key] = function (obj) {
		var args = [].slice.call(arguments, 1);
		var t = new Traverse(obj);
		return t[key].apply(t, args);
	};
});

var traverse_1 = traverse$1;

var extent$2 = Extent;

function Extent(bbox) {
    if (!(this instanceof Extent)) {
        return new Extent(bbox);
    }
    this._bbox = bbox || [Infinity, Infinity, -Infinity, -Infinity];
    this._valid = !!bbox;
}

Extent.prototype.include = function(ll) {
    this._valid = true;
    this._bbox[0] = Math.min(this._bbox[0], ll[0]);
    this._bbox[1] = Math.min(this._bbox[1], ll[1]);
    this._bbox[2] = Math.max(this._bbox[2], ll[0]);
    this._bbox[3] = Math.max(this._bbox[3], ll[1]);
    return this;
};

Extent.prototype.equals = function(_) {
    var other;
    if (_ instanceof Extent) { other = _.bbox(); } else { other = _; }
    return this._bbox[0] == other[0] &&
        this._bbox[1] == other[1] &&
        this._bbox[2] == other[2] &&
        this._bbox[3] == other[3];
};

Extent.prototype.center = function(_) {
    if (!this._valid) { return null; }
    return [
        (this._bbox[0] + this._bbox[2]) / 2,
        (this._bbox[1] + this._bbox[3]) / 2]
};

Extent.prototype.union = function(_) {
    this._valid = true;
    var other;
    if (_ instanceof Extent) { other = _.bbox(); } else { other = _; }
    this._bbox[0] = Math.min(this._bbox[0], other[0]);
    this._bbox[1] = Math.min(this._bbox[1], other[1]);
    this._bbox[2] = Math.max(this._bbox[2], other[2]);
    this._bbox[3] = Math.max(this._bbox[3], other[3]);
    return this;
};

Extent.prototype.bbox = function() {
    if (!this._valid) { return null; }
    return this._bbox;
};

Extent.prototype.contains = function(ll) {
    if (!ll) { return this._fastContains(); }
    if (!this._valid) { return null; }
    var lon = ll[0], lat = ll[1];
    return this._bbox[0] <= lon &&
        this._bbox[1] <= lat &&
        this._bbox[2] >= lon &&
        this._bbox[3] >= lat;
};

Extent.prototype.intersect = function(_) {
    if (!this._valid) { return null; }

    var other;
    if (_ instanceof Extent) { other = _.bbox(); } else { other = _; }

    return !(
      this._bbox[0] > other[2] ||
      this._bbox[2] < other[0] ||
      this._bbox[3] < other[1] ||
      this._bbox[1] > other[3]
    );
};

Extent.prototype._fastContains = function() {
    if (!this._valid) { return new Function('return null;'); }
    var body = 'return ' +
        this._bbox[0] + '<= ll[0] &&' +
        this._bbox[1] + '<= ll[1] &&' +
        this._bbox[2] + '>= ll[0] &&' +
        this._bbox[3] + '>= ll[1]';
    return new Function('ll', body);
};

Extent.prototype.polygon = function() {
    if (!this._valid) { return null; }
    return {
        type: 'Polygon',
        coordinates: [
            [
                // W, S
                [this._bbox[0], this._bbox[1]],
                // E, S
                [this._bbox[2], this._bbox[1]],
                // E, N
                [this._bbox[2], this._bbox[3]],
                // W, N
                [this._bbox[0], this._bbox[3]],
                // W, S
                [this._bbox[0], this._bbox[1]]
            ]
        ]
    };
};

var geojsonCoords = geojsonCoords$1,
    traverse = traverse_1,
    extent = extent$2;

var geojsonTypesByDataAttributes = {
    features: ['FeatureCollection'],
    coordinates: ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'],
    geometry: ['Feature'],
    geometries: ['GeometryCollection']
};

var dataAttributes = Object.keys(geojsonTypesByDataAttributes);

geojsonExtent.exports = function(_) {
    return getExtent(_).bbox();
};

geojsonExtent.exports.polygon = function(_) {
    return getExtent(_).polygon();
};

geojsonExtent.exports.bboxify = function(_) {
    return traverse(_).map(function(value) {
        if (!value) { return ; }

        var isValid = dataAttributes.some(function(attribute){
            if(value[attribute]) {
                return geojsonTypesByDataAttributes[attribute].indexOf(value.type) !== -1;
            }
            return false;
        });

        if(isValid){
            value.bbox = getExtent(value).bbox();
            this.update(value);
        }

    });
};

function getExtent(_) {
    var ext = extent(),
        coords = geojsonCoords(_);
    for (var i = 0; i < coords.length; i++) { ext.include(coords[i]); }
    return ext;
}

var geojsonExtentExports = geojsonExtent.exports;
var extent$1 = /*@__PURE__*/getDefaultExportFromCjs(geojsonExtentExports);

var LAT_MIN = LAT_MIN$1;
var LAT_MAX = LAT_MAX$1;
var LAT_RENDERED_MIN = LAT_RENDERED_MIN$1;
var LAT_RENDERED_MAX = LAT_RENDERED_MAX$1;
var LNG_MIN = LNG_MIN$1;
var LNG_MAX = LNG_MAX$1;

// Ensure that we do not drag north-south far enough for
// - any part of any feature to exceed the poles
// - any feature to be completely lost in the space between the projection's
//   edge and the poles, such that it couldn't be re-selected and moved back
function constrainFeatureMovement(geojsonFeatures, delta) {
  // "inner edge" = a feature's latitude closest to the equator
  var northInnerEdge = LAT_MIN;
  var southInnerEdge = LAT_MAX;
  // "outer edge" = a feature's latitude furthest from the equator
  var northOuterEdge = LAT_MIN;
  var southOuterEdge = LAT_MAX;

  var westEdge = LNG_MAX;
  var eastEdge = LNG_MIN;

  geojsonFeatures.forEach(function (feature) {
    var bounds = extent$1(feature);
    var featureSouthEdge = bounds[1];
    var featureNorthEdge = bounds[3];
    var featureWestEdge = bounds[0];
    var featureEastEdge = bounds[2];
    if (featureSouthEdge > northInnerEdge) { northInnerEdge = featureSouthEdge; }
    if (featureNorthEdge < southInnerEdge) { southInnerEdge = featureNorthEdge; }
    if (featureNorthEdge > northOuterEdge) { northOuterEdge = featureNorthEdge; }
    if (featureSouthEdge < southOuterEdge) { southOuterEdge = featureSouthEdge; }
    if (featureWestEdge < westEdge) { westEdge = featureWestEdge; }
    if (featureEastEdge > eastEdge) { eastEdge = featureEastEdge; }
  });


  // These changes are not mutually exclusive: we might hit the inner
  // edge but also have hit the outer edge and therefore need
  // another readjustment
  var constrainedDelta = delta;
  if (northInnerEdge + constrainedDelta.lat > LAT_RENDERED_MAX) {
    constrainedDelta.lat = LAT_RENDERED_MAX - northInnerEdge;
  }
  if (northOuterEdge + constrainedDelta.lat > LAT_MAX) {
    constrainedDelta.lat = LAT_MAX - northOuterEdge;
  }
  if (southInnerEdge + constrainedDelta.lat < LAT_RENDERED_MIN) {
    constrainedDelta.lat = LAT_RENDERED_MIN - southInnerEdge;
  }
  if (southOuterEdge + constrainedDelta.lat < LAT_MIN) {
    constrainedDelta.lat = LAT_MIN - southOuterEdge;
  }
  if (westEdge + constrainedDelta.lng <= LNG_MIN) {
    constrainedDelta.lng += Math.ceil(Math.abs(constrainedDelta.lng) / 360) * 360;
  }
  if (eastEdge + constrainedDelta.lng >= LNG_MAX) {
    constrainedDelta.lng -= Math.ceil(Math.abs(constrainedDelta.lng) / 360) * 360;
  }

  return constrainedDelta;
}

function moveFeatures(features, delta) {
  var constrainedDelta = constrainFeatureMovement(features.map(function (feature) { return feature.toGeoJSON(); }), delta);

  features.forEach(function (feature) {
    var currentCoordinates = feature.getCoordinates();

    var moveCoordinate = function (coord) {
      var point = {
        lng: coord[0] + constrainedDelta.lng,
        lat: coord[1] + constrainedDelta.lat
      };
      return [point.lng, point.lat];
    };
    var moveRing = function (ring) { return ring.map(function (coord) { return moveCoordinate(coord); }); };
    var moveMultiPolygon = function (multi) { return multi.map(function (ring) { return moveRing(ring); }); };

    var nextCoordinates;
    if (feature.type === geojsonTypes.POINT) {
      nextCoordinates = moveCoordinate(currentCoordinates);
    } else if (feature.type === geojsonTypes.LINE_STRING || feature.type === geojsonTypes.MULTI_POINT) {
      nextCoordinates = currentCoordinates.map(moveCoordinate);
    } else if (feature.type === geojsonTypes.POLYGON || feature.type === geojsonTypes.MULTI_LINE_STRING) {
      nextCoordinates = currentCoordinates.map(moveRing);
    } else if (feature.type === geojsonTypes.MULTI_POLYGON) {
      nextCoordinates = currentCoordinates.map(moveMultiPolygon);
    }

    feature.incomingCoords(nextCoordinates);
  });
}

var SimpleSelect = {};

SimpleSelect.onSetup = function(opts) {
  var this$1$1 = this;

  // turn the opts into state.
  var state = {
    dragMoveLocation: null,
    boxSelectStartLocation: null,
    boxSelectElement: undefined,
    boxSelecting: false,
    canBoxSelect: false,
    dragMoving: false,
    canDragMove: false,
    initiallySelectedFeatureIds: opts.featureIds || []
  };

  this.setSelected(state.initiallySelectedFeatureIds.filter(function (id) { return this$1$1.getFeature(id) !== undefined; }));
  this.fireActionable();

  this.setActionableState({
    combineFeatures: true,
    uncombineFeatures: true,
    trash: true
  });

  return state;
};

SimpleSelect.fireUpdate = function() {
  this.map.fire(events$1.UPDATE, {
    action: updateActions.MOVE,
    features: this.getSelected().map(function (f) { return f.toGeoJSON(); })
  });
};

SimpleSelect.fireActionable = function() {
  var this$1$1 = this;

  var selectedFeatures = this.getSelected();

  var multiFeatures = selectedFeatures.filter(
    function (feature) { return this$1$1.isInstanceOf('MultiFeature', feature); }
  );

  var combineFeatures = false;

  if (selectedFeatures.length > 1) {
    combineFeatures = true;
    var featureType = selectedFeatures[0].type.replace('Multi', '');
    selectedFeatures.forEach(function (feature) {
      if (feature.type.replace('Multi', '') !== featureType) {
        combineFeatures = false;
      }
    });
  }

  var uncombineFeatures = multiFeatures.length > 0;
  var trash = selectedFeatures.length > 0;

  this.setActionableState({
    combineFeatures: combineFeatures, uncombineFeatures: uncombineFeatures, trash: trash
  });
};

SimpleSelect.getUniqueIds = function(allFeatures) {
  if (!allFeatures.length) { return []; }
  var ids = allFeatures.map(function (s) { return s.properties.id; })
    .filter(function (id) { return id !== undefined; })
    .reduce(function (memo, id) {
      memo.add(id);
      return memo;
    }, new StringSet());

  return ids.values();
};

SimpleSelect.stopExtendedInteractions = function(state) {
  if (state.boxSelectElement) {
    if (state.boxSelectElement.parentNode) { state.boxSelectElement.parentNode.removeChild(state.boxSelectElement); }
    state.boxSelectElement = null;
  }

  this.map.dragPan.enable();

  state.boxSelecting = false;
  state.canBoxSelect = false;
  state.dragMoving = false;
  state.canDragMove = false;
};

SimpleSelect.onStop = function() {
  doubleClickZoom.enable(this);
};

SimpleSelect.onMouseMove = function(state, e) {
  var isFeature$1 = isFeature(e);
  if (isFeature$1 && state.dragMoving) { this.fireUpdate(); }

  // On mousemove that is not a drag, stop extended interactions.
  // This is useful if you drag off the canvas, release the button,
  // then move the mouse back over the canvas --- we don't allow the
  // interaction to continue then, but we do let it continue if you held
  // the mouse button that whole time
  this.stopExtendedInteractions(state);

  // Skip render
  return true;
};

SimpleSelect.onMouseOut = function(state) {
  // As soon as you mouse leaves the canvas, update the feature
  if (state.dragMoving) { return this.fireUpdate(); }

  // Skip render
  return true;
};

SimpleSelect.onTap = SimpleSelect.onClick = function(state, e) {
  // Click (with or without shift) on no feature
  if (noTarget(e)) { return this.clickAnywhere(state, e); } // also tap
  if (isOfMetaType(meta.VERTEX)(e)) { return this.clickOnVertex(state, e); } //tap
  if (isFeature(e)) { return this.clickOnFeature(state, e); }
};

SimpleSelect.clickAnywhere = function (state) {
  var this$1$1 = this;

  // Clear the re-render selection
  var wasSelected = this.getSelectedIds();
  if (wasSelected.length) {
    this.clearSelectedFeatures();
    wasSelected.forEach(function (id) { return this$1$1.doRender(id); });
  }
  doubleClickZoom.enable(this);
  this.stopExtendedInteractions(state);
};

SimpleSelect.clickOnVertex = function(state, e) {
  // Enter direct select mode
  this.changeMode(modes$1.DIRECT_SELECT, {
    featureId: e.featureTarget.properties.parent,
    coordPath: e.featureTarget.properties.coord_path,
    startPos: e.lngLat
  });
  this.updateUIClasses({ mouse: cursors.MOVE });
};

SimpleSelect.startOnActiveFeature = function(state, e) {
  // Stop any already-underway extended interactions
  this.stopExtendedInteractions(state);

  // Disable map.dragPan immediately so it can't start
  this.map.dragPan.disable();

  // Re-render it and enable drag move
  this.doRender(e.featureTarget.properties.id);

  // Set up the state for drag moving
  state.canDragMove = true;
  state.dragMoveLocation = e.lngLat;
};

SimpleSelect.clickOnFeature = function(state, e) {
  var this$1$1 = this;

  // Stop everything
  doubleClickZoom.disable(this);
  this.stopExtendedInteractions(state);

  var isShiftClick = isShiftDown(e);
  var selectedFeatureIds = this.getSelectedIds();
  var featureId = e.featureTarget.properties.id;
  var isFeatureSelected = this.isSelected(featureId);

  // Click (without shift) on any selected feature but a point
  if (!isShiftClick && isFeatureSelected && this.getFeature(featureId).type !== geojsonTypes.POINT) {
    // Enter direct select mode
    return this.changeMode(modes$1.DIRECT_SELECT, {
      featureId: featureId
    });
  }

  // Shift-click on a selected feature
  if (isFeatureSelected && isShiftClick) {
    // Deselect it
    this.deselect(featureId);
    this.updateUIClasses({ mouse: cursors.POINTER });
    if (selectedFeatureIds.length === 1) {
      doubleClickZoom.enable(this);
    }
  // Shift-click on an unselected feature
  } else if (!isFeatureSelected && isShiftClick) {
    // Add it to the selection
    this.select(featureId);
    this.updateUIClasses({ mouse: cursors.MOVE });
  // Click (without shift) on an unselected feature
  } else if (!isFeatureSelected && !isShiftClick) {
    // Make it the only selected feature
    selectedFeatureIds.forEach(function (id) { return this$1$1.doRender(id); });
    this.setSelected(featureId);
    this.updateUIClasses({ mouse: cursors.MOVE });
  }

  // No matter what, re-render the clicked feature
  this.doRender(featureId);
};

SimpleSelect.onMouseDown = function(state, e) {
  if (isActiveFeature(e)) { return this.startOnActiveFeature(state, e); }
  if (this.drawConfig.boxSelect && isShiftMousedown(e)) { return this.startBoxSelect(state, e); }
};

SimpleSelect.startBoxSelect = function(state, e) {
  this.stopExtendedInteractions(state);
  this.map.dragPan.disable();
  // Enable box select
  state.boxSelectStartLocation = mouseEventPoint(e.originalEvent, this.map.getContainer());
  state.canBoxSelect = true;
};

SimpleSelect.onTouchStart = function(state, e) {
  if (isActiveFeature(e)) { return this.startOnActiveFeature(state, e); }
};

SimpleSelect.onDrag = function(state, e) {
  if (state.canDragMove) { return this.dragMove(state, e); }
  if (this.drawConfig.boxSelect && state.canBoxSelect) { return this.whileBoxSelect(state, e); }
};

SimpleSelect.whileBoxSelect = function(state, e) {
  state.boxSelecting = true;
  this.updateUIClasses({ mouse: cursors.ADD });

  // Create the box node if it doesn't exist
  if (!state.boxSelectElement) {
    state.boxSelectElement = document.createElement('div');
    state.boxSelectElement.classList.add(classes.BOX_SELECT);
    this.map.getContainer().appendChild(state.boxSelectElement);
  }

  // Adjust the box node's width and xy position
  var current = mouseEventPoint(e.originalEvent, this.map.getContainer());
  var minX = Math.min(state.boxSelectStartLocation.x, current.x);
  var maxX = Math.max(state.boxSelectStartLocation.x, current.x);
  var minY = Math.min(state.boxSelectStartLocation.y, current.y);
  var maxY = Math.max(state.boxSelectStartLocation.y, current.y);
  var translateValue = "translate(" + minX + "px, " + minY + "px)";
  state.boxSelectElement.style.transform = translateValue;
  state.boxSelectElement.style.WebkitTransform = translateValue;
  state.boxSelectElement.style.width = (maxX - minX) + "px";
  state.boxSelectElement.style.height = (maxY - minY) + "px";
};

SimpleSelect.dragMove = function(state, e) {
  // Dragging when drag move is enabled
  state.dragMoving = true;
  e.originalEvent.stopPropagation();

  var delta = {
    lng: e.lngLat.lng - state.dragMoveLocation.lng,
    lat: e.lngLat.lat - state.dragMoveLocation.lat
  };

  moveFeatures(this.getSelected(), delta);

  state.dragMoveLocation = e.lngLat;
};

SimpleSelect.onTouchEnd = SimpleSelect.onMouseUp = function(state, e) {
  var this$1$1 = this;

  // End any extended interactions
  if (state.dragMoving) {
    this.fireUpdate();
  } else if (state.boxSelecting) {
    var bbox = [
      state.boxSelectStartLocation,
      mouseEventPoint(e.originalEvent, this.map.getContainer())
    ];
    var featuresInBox = this.featuresAt(null, bbox, 'click');
    var idsToSelect = this.getUniqueIds(featuresInBox)
      .filter(function (id) { return !this$1$1.isSelected(id); });

    if (idsToSelect.length) {
      this.select(idsToSelect);
      idsToSelect.forEach(function (id) { return this$1$1.doRender(id); });
      this.updateUIClasses({ mouse: cursors.MOVE });
    }
  }
  this.stopExtendedInteractions(state);
};

SimpleSelect.toDisplayFeatures = function(state, geojson, display) {
  geojson.properties.active = (this.isSelected(geojson.properties.id)) ?
    activeStates.ACTIVE : activeStates.INACTIVE;
  display(geojson);
  this.fireActionable();
  if (geojson.properties.active !== activeStates.ACTIVE ||
    geojson.geometry.type === geojsonTypes.POINT) { return; }
  createSupplementaryPoints(geojson).forEach(display);
};

SimpleSelect.onTrash = function() {
  this.deleteFeature(this.getSelectedIds());
  this.fireActionable();
};

SimpleSelect.onCombineFeatures = function() {
  var selectedFeatures = this.getSelected();

  if (selectedFeatures.length === 0 || selectedFeatures.length < 2) { return; }

  var coordinates = [], featuresCombined = [];
  var featureType = selectedFeatures[0].type.replace('Multi', '');

  for (var i = 0; i < selectedFeatures.length; i++) {
    var feature = selectedFeatures[i];

    if (feature.type.replace('Multi', '') !== featureType) {
      return;
    }
    if (feature.type.includes('Multi')) {
      feature.getCoordinates().forEach(function (subcoords) {
        coordinates.push(subcoords);
      });
    } else {
      coordinates.push(feature.getCoordinates());
    }

    featuresCombined.push(feature.toGeoJSON());
  }

  if (featuresCombined.length > 1) {
    var multiFeature = this.newFeature({
      type: geojsonTypes.FEATURE,
      properties: featuresCombined[0].properties,
      geometry: {
        type: ("Multi" + featureType),
        coordinates: coordinates
      }
    });

    this.addFeature(multiFeature);
    this.deleteFeature(this.getSelectedIds(), { silent: true });
    this.setSelected([multiFeature.id]);

    this.map.fire(events$1.COMBINE_FEATURES, {
      createdFeatures: [multiFeature.toGeoJSON()],
      deletedFeatures: featuresCombined
    });
  }
  this.fireActionable();
};

SimpleSelect.onUncombineFeatures = function() {
  var this$1$1 = this;

  var selectedFeatures = this.getSelected();
  if (selectedFeatures.length === 0) { return; }

  var createdFeatures = [];
  var featuresUncombined = [];

  var loop = function ( i ) {
    var feature = selectedFeatures[i];

    if (this$1$1.isInstanceOf('MultiFeature', feature)) {
      feature.getFeatures().forEach(function (subFeature) {
        this$1$1.addFeature(subFeature);
        subFeature.properties = feature.properties;
        createdFeatures.push(subFeature.toGeoJSON());
        this$1$1.select([subFeature.id]);
      });
      this$1$1.deleteFeature(feature.id, { silent: true });
      featuresUncombined.push(feature.toGeoJSON());
    }
  };

  for (var i = 0; i < selectedFeatures.length; i++) loop( i );

  if (createdFeatures.length > 1) {
    this.map.fire(events$1.UNCOMBINE_FEATURES, {
      createdFeatures: createdFeatures,
      deletedFeatures: featuresUncombined
    });
  }
  this.fireActionable();
};

var isVertex = isOfMetaType(meta.VERTEX);
var isMidpoint = isOfMetaType(meta.MIDPOINT);

var DirectSelect = {};

// INTERNAL FUCNTIONS

DirectSelect.fireUpdate = function() {
  this.map.fire(events$1.UPDATE, {
    action: updateActions.CHANGE_COORDINATES,
    features: this.getSelected().map(function (f) { return f.toGeoJSON(); })
  });
};

DirectSelect.fireActionable = function(state) {
  this.setActionableState({
    combineFeatures: false,
    uncombineFeatures: false,
    trash: state.selectedCoordPaths.length > 0
  });
};

DirectSelect.startDragging = function(state, e) {
  this.map.dragPan.disable();
  state.canDragMove = true;
  state.dragMoveLocation = e.lngLat;
};

DirectSelect.stopDragging = function(state) {
  this.map.dragPan.enable();
  state.dragMoving = false;
  state.canDragMove = false;
  state.dragMoveLocation = null;
};

DirectSelect.onVertex = function (state, e) {
  this.startDragging(state, e);
  var about = e.featureTarget.properties;
  var selectedIndex = state.selectedCoordPaths.indexOf(about.coord_path);
  if (!isShiftDown(e) && selectedIndex === -1) {
    state.selectedCoordPaths = [about.coord_path];
  } else if (isShiftDown(e) && selectedIndex === -1) {
    state.selectedCoordPaths.push(about.coord_path);
  }

  var selectedCoordinates = this.pathsToCoordinates(state.featureId, state.selectedCoordPaths);
  this.setSelectedCoordinates(selectedCoordinates);
};

DirectSelect.onMidpoint = function(state, e) {
  this.startDragging(state, e);
  var about = e.featureTarget.properties;
  state.feature.addCoordinate(about.coord_path, about.lng, about.lat);
  this.fireUpdate();
  state.selectedCoordPaths = [about.coord_path];
};

DirectSelect.pathsToCoordinates = function(featureId, paths) {
  return paths.map(function (coord_path) { return ({ feature_id: featureId, coord_path: coord_path }); });
};

DirectSelect.onFeature = function(state, e) {
  if (state.selectedCoordPaths.length === 0) { this.startDragging(state, e); }
  else { this.stopDragging(state); }
};

DirectSelect.dragFeature = function(state, e, delta) {
  moveFeatures(this.getSelected(), delta);
  state.dragMoveLocation = e.lngLat;
};

DirectSelect.dragVertex = function(state, e, delta) {
  var selectedCoords = state.selectedCoordPaths.map(function (coord_path) { return state.feature.getCoordinate(coord_path); });
  var selectedCoordPoints = selectedCoords.map(function (coords) { return ({
    type: geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: geojsonTypes.POINT,
      coordinates: coords
    }
  }); });

  var constrainedDelta = constrainFeatureMovement(selectedCoordPoints, delta);
  for (var i = 0; i < selectedCoords.length; i++) {
    var coord = selectedCoords[i];
    state.feature.updateCoordinate(state.selectedCoordPaths[i], coord[0] + constrainedDelta.lng, coord[1] + constrainedDelta.lat);
  }
};

DirectSelect.clickNoTarget = function () {
  this.changeMode(modes$1.SIMPLE_SELECT);
};

DirectSelect.clickInactive = function () {
  this.changeMode(modes$1.SIMPLE_SELECT);
};

DirectSelect.clickActiveFeature = function (state) {
  state.selectedCoordPaths = [];
  this.clearSelectedCoordinates();
  state.feature.changed();
};

// EXTERNAL FUNCTIONS

DirectSelect.onSetup = function(opts) {
  var featureId = opts.featureId;
  var feature = this.getFeature(featureId);

  if (!feature) {
    throw new Error('You must provide a featureId to enter direct_select mode');
  }

  if (feature.type === geojsonTypes.POINT) {
    throw new TypeError('direct_select mode doesn\'t handle point features');
  }

  var state = {
    featureId: featureId,
    feature: feature,
    dragMoveLocation: opts.startPos || null,
    dragMoving: false,
    canDragMove: false,
    selectedCoordPaths: opts.coordPath ? [opts.coordPath] : []
  };

  this.setSelectedCoordinates(this.pathsToCoordinates(featureId, state.selectedCoordPaths));
  this.setSelected(featureId);
  doubleClickZoom.disable(this);

  this.setActionableState({
    trash: true
  });

  return state;
};

DirectSelect.onStop = function() {
  doubleClickZoom.enable(this);
  this.clearSelectedCoordinates();
};

DirectSelect.toDisplayFeatures = function(state, geojson, push) {
  if (state.featureId === geojson.properties.id) {
    geojson.properties.active = activeStates.ACTIVE;
    push(geojson);
    createSupplementaryPoints(geojson, {
      map: this.map,
      midpoints: true,
      selectedPaths: state.selectedCoordPaths
    }).forEach(push);
  } else {
    geojson.properties.active = activeStates.INACTIVE;
    push(geojson);
  }
  this.fireActionable(state);
};

DirectSelect.onTrash = function(state) {
  // Uses number-aware sorting to make sure '9' < '10'. Comparison is reversed because we want them
  // in reverse order so that we can remove by index safely.
  state.selectedCoordPaths
    .sort(function (a, b) { return b.localeCompare(a, 'en', { numeric: true }); })
    .forEach(function (id) { return state.feature.removeCoordinate(id); });
  this.fireUpdate();
  state.selectedCoordPaths = [];
  this.clearSelectedCoordinates();
  this.fireActionable(state);
  if (state.feature.isValid() === false) {
    this.deleteFeature([state.featureId]);
    this.changeMode(modes$1.SIMPLE_SELECT, {});
  }
};

DirectSelect.onMouseMove = function(state, e) {
  // On mousemove that is not a drag, stop vertex movement.
  var isFeature = isActiveFeature(e);
  var onVertex = isVertex(e);
  var isMidPoint = isMidpoint(e);
  var noCoords = state.selectedCoordPaths.length === 0;
  if (isFeature && noCoords) { this.updateUIClasses({ mouse: cursors.MOVE }); }
  else if (onVertex && !noCoords) { this.updateUIClasses({ mouse: cursors.MOVE }); }
  else { this.updateUIClasses({ mouse: cursors.NONE }); }

  var isDraggableItem = onVertex || isFeature || isMidPoint;
  if (isDraggableItem && state.dragMoving) { this.fireUpdate(); }

  this.stopDragging(state);

  // Skip render
  return true;
};

DirectSelect.onMouseOut = function(state) {
  // As soon as you mouse leaves the canvas, update the feature
  if (state.dragMoving) { this.fireUpdate(); }

  // Skip render
  return true;
};

DirectSelect.onTouchStart = DirectSelect.onMouseDown = function(state, e) {
  if (isVertex(e)) { return this.onVertex(state, e); }
  if (isActiveFeature(e)) { return this.onFeature(state, e); }
  if (isMidpoint(e)) { return this.onMidpoint(state, e); }
};

DirectSelect.onDrag = function(state, e) {
  if (state.canDragMove !== true) { return; }
  state.dragMoving = true;
  e.originalEvent.stopPropagation();

  var delta = {
    lng: e.lngLat.lng - state.dragMoveLocation.lng,
    lat: e.lngLat.lat - state.dragMoveLocation.lat
  };
  if (state.selectedCoordPaths.length > 0) { this.dragVertex(state, e, delta); }
  else { this.dragFeature(state, e, delta); }

  state.dragMoveLocation = e.lngLat;
};

DirectSelect.onClick = function(state, e) {
  if (noTarget(e)) { return this.clickNoTarget(state, e); }
  if (isActiveFeature(e)) { return this.clickActiveFeature(state, e); }
  if (isInactiveFeature(e)) { return this.clickInactive(state, e); }
  this.stopDragging(state);
};

DirectSelect.onTap = function(state, e) {
  if (noTarget(e)) { return this.clickNoTarget(state, e); }
  if (isActiveFeature(e)) { return this.clickActiveFeature(state, e); }
  if (isInactiveFeature(e)) { return this.clickInactive(state, e); }
};

DirectSelect.onTouchEnd = DirectSelect.onMouseUp = function(state) {
  if (state.dragMoving) {
    this.fireUpdate();
  }
  this.stopDragging(state);
};

var DrawPoint = {};

DrawPoint.onSetup = function() {
  var point = this.newFeature({
    type: geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: geojsonTypes.POINT,
      coordinates: []
    }
  });

  this.addFeature(point);

  this.clearSelectedFeatures();
  this.updateUIClasses({ mouse: cursors.ADD });
  this.activateUIButton(types$1.POINT);

  this.setActionableState({
    trash: true
  });

  return { point: point };
};

DrawPoint.stopDrawingAndRemove = function(state) {
  this.deleteFeature([state.point.id], { silent: true });
  this.changeMode(modes$1.SIMPLE_SELECT);
};

DrawPoint.onTap = DrawPoint.onClick = function(state, e) {
  this.updateUIClasses({ mouse: cursors.MOVE });
  state.point.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);
  this.map.fire(events$1.CREATE, {
    features: [state.point.toGeoJSON()]
  });
  this.changeMode(modes$1.SIMPLE_SELECT, { featureIds: [state.point.id] });
};

DrawPoint.onStop = function(state) {
  this.activateUIButton();
  if (!state.point.getCoordinate().length) {
    this.deleteFeature([state.point.id], { silent: true });
  }
};

DrawPoint.toDisplayFeatures = function(state, geojson, display) {
  // Never render the point we're drawing
  var isActivePoint = geojson.properties.id === state.point.id;
  geojson.properties.active = (isActivePoint) ? activeStates.ACTIVE : activeStates.INACTIVE;
  if (!isActivePoint) { return display(geojson); }
};

DrawPoint.onTrash = DrawPoint.stopDrawingAndRemove;

DrawPoint.onKeyUp = function(state, e) {
  if (isEscapeKey(e) || isEnterKey(e)) {
    return this.stopDrawingAndRemove(state, e);
  }
};

function isEventAtCoordinates(event, coordinates) {
  if (!event.lngLat) { return false; }
  return event.lngLat.lng === coordinates[0] && event.lngLat.lat === coordinates[1];
}

var DrawPolygon = {};

DrawPolygon.onSetup = function() {
  var polygon = this.newFeature({
    type: geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: geojsonTypes.POLYGON,
      coordinates: [[]]
    }
  });

  this.addFeature(polygon);

  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);
  this.updateUIClasses({ mouse: cursors.ADD });
  this.activateUIButton(types$1.POLYGON);
  this.setActionableState({
    trash: true
  });

  return {
    polygon: polygon,
    currentVertexPosition: 0
  };
};

DrawPolygon.clickAnywhere = function(state, e) {
  if (state.currentVertexPosition > 0 && isEventAtCoordinates(e, state.polygon.coordinates[0][state.currentVertexPosition - 1])) {
    return this.changeMode(modes$1.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
  }
  this.updateUIClasses({ mouse: cursors.ADD });
  state.polygon.updateCoordinate(("0." + (state.currentVertexPosition)), e.lngLat.lng, e.lngLat.lat);
  state.currentVertexPosition++;
  state.polygon.updateCoordinate(("0." + (state.currentVertexPosition)), e.lngLat.lng, e.lngLat.lat);
};

DrawPolygon.clickOnVertex = function(state) {
  return this.changeMode(modes$1.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
};

DrawPolygon.onMouseMove = function(state, e) {
  state.polygon.updateCoordinate(("0." + (state.currentVertexPosition)), e.lngLat.lng, e.lngLat.lat);
  if (isVertex$1(e)) {
    this.updateUIClasses({ mouse: cursors.POINTER });
  }
};

DrawPolygon.onTap = DrawPolygon.onClick = function(state, e) {
  if (isVertex$1(e)) { return this.clickOnVertex(state, e); }
  return this.clickAnywhere(state, e);
};

DrawPolygon.onKeyUp = function(state, e) {
  if (isEscapeKey(e)) {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode(modes$1.SIMPLE_SELECT);
  } else if (isEnterKey(e)) {
    this.changeMode(modes$1.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
  }
};

DrawPolygon.onStop = function(state) {
  this.updateUIClasses({ mouse: cursors.NONE });
  doubleClickZoom.enable(this);
  this.activateUIButton();

  // check to see if we've deleted this feature
  if (this.getFeature(state.polygon.id) === undefined) { return; }

  //remove last added coordinate
  state.polygon.removeCoordinate(("0." + (state.currentVertexPosition)));
  if (state.polygon.isValid()) {
    this.map.fire(events$1.CREATE, {
      features: [state.polygon.toGeoJSON()]
    });
  } else {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode(modes$1.SIMPLE_SELECT, {}, { silent: true });
  }
};

DrawPolygon.toDisplayFeatures = function(state, geojson, display) {
  var isActivePolygon = geojson.properties.id === state.polygon.id;
  geojson.properties.active = (isActivePolygon) ? activeStates.ACTIVE : activeStates.INACTIVE;
  if (!isActivePolygon) { return display(geojson); }

  // Don't render a polygon until it has two positions
  // (and a 3rd which is just the first repeated)
  if (geojson.geometry.coordinates.length === 0) { return; }

  var coordinateCount = geojson.geometry.coordinates[0].length;
  // 2 coordinates after selecting a draw type
  // 3 after creating the first point
  if (coordinateCount < 3) {
    return;
  }
  geojson.properties.meta = meta.FEATURE;
  display(createVertex(state.polygon.id, geojson.geometry.coordinates[0][0], '0.0', false));
  if (coordinateCount > 3) {
    // Add a start position marker to the map, clicking on this will finish the feature
    // This should only be shown when we're in a valid spot
    var endPos = geojson.geometry.coordinates[0].length - 3;
    display(createVertex(state.polygon.id, geojson.geometry.coordinates[0][endPos], ("0." + endPos), false));
  }
  if (coordinateCount <= 4) {
    // If we've only drawn two positions (plus the closer),
    // make a LineString instead of a Polygon
    var lineCoordinates = [
      [geojson.geometry.coordinates[0][0][0], geojson.geometry.coordinates[0][0][1]], [geojson.geometry.coordinates[0][1][0], geojson.geometry.coordinates[0][1][1]]
    ];
    // create an initial vertex so that we can track the first point on mobile devices
    display({
      type: geojsonTypes.FEATURE,
      properties: geojson.properties,
      geometry: {
        coordinates: lineCoordinates,
        type: geojsonTypes.LINE_STRING
      }
    });
    if (coordinateCount === 3) {
      return;
    }
  }
  // render the Polygon
  return display(geojson);
};

DrawPolygon.onTrash = function(state) {
  this.deleteFeature([state.polygon.id], { silent: true });
  this.changeMode(modes$1.SIMPLE_SELECT);
};

var DrawLineString = {};

DrawLineString.onSetup = function(opts) {
  opts = opts || {};
  var featureId = opts.featureId;

  var line, currentVertexPosition;
  var direction = 'forward';
  if (featureId) {
    line = this.getFeature(featureId);
    if (!line) {
      throw new Error('Could not find a feature with the provided featureId');
    }
    var from = opts.from;
    if (from && from.type === 'Feature' && from.geometry && from.geometry.type === 'Point') {
      from = from.geometry;
    }
    if (from && from.type === 'Point' && from.coordinates && from.coordinates.length === 2) {
      from = from.coordinates;
    }
    if (!from || !Array.isArray(from)) {
      throw new Error('Please use the `from` property to indicate which point to continue the line from');
    }
    var lastCoord = line.coordinates.length - 1;
    if (line.coordinates[lastCoord][0] === from[0] && line.coordinates[lastCoord][1] === from[1]) {
      currentVertexPosition = lastCoord + 1;
      // add one new coordinate to continue from
      line.addCoordinate.apply(line, [ currentVertexPosition ].concat( line.coordinates[lastCoord] ));
    } else if (line.coordinates[0][0] === from[0] && line.coordinates[0][1] === from[1]) {
      direction = 'backwards';
      currentVertexPosition = 0;
      // add one new coordinate to continue from
      line.addCoordinate.apply(line, [ currentVertexPosition ].concat( line.coordinates[0] ));
    } else {
      throw new Error('`from` should match the point at either the start or the end of the provided LineString');
    }
  } else {
    line = this.newFeature({
      type: geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: geojsonTypes.LINE_STRING,
        coordinates: []
      }
    });
    currentVertexPosition = 0;
    this.addFeature(line);
  }

  this.clearSelectedFeatures();
  doubleClickZoom.disable(this);
  this.updateUIClasses({ mouse: cursors.ADD });
  this.activateUIButton(types$1.LINE);
  this.setActionableState({
    trash: true
  });

  return {
    line: line,
    currentVertexPosition: currentVertexPosition,
    direction: direction
  };
};

DrawLineString.clickAnywhere = function(state, e) {
  if (state.currentVertexPosition > 0 && isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition - 1]) ||
      state.direction === 'backwards' && isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition + 1])) {
    return this.changeMode(modes$1.SIMPLE_SELECT, { featureIds: [state.line.id] });
  }
  this.updateUIClasses({ mouse: cursors.ADD });
  state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
  if (state.direction === 'forward') {
    state.currentVertexPosition++;
    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
  } else {
    state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
  }
};

DrawLineString.clickOnVertex = function(state) {
  return this.changeMode(modes$1.SIMPLE_SELECT, { featureIds: [state.line.id] });
};

DrawLineString.onMouseMove = function(state, e) {
  state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
  if (isVertex$1(e)) {
    this.updateUIClasses({ mouse: cursors.POINTER });
  }
};

DrawLineString.onTap = DrawLineString.onClick = function(state, e) {
  if (isVertex$1(e)) { return this.clickOnVertex(state, e); }
  this.clickAnywhere(state, e);
};

DrawLineString.onKeyUp = function(state, e) {
  if (isEnterKey(e)) {
    this.changeMode(modes$1.SIMPLE_SELECT, { featureIds: [state.line.id] });
  } else if (isEscapeKey(e)) {
    this.deleteFeature([state.line.id], { silent: true });
    this.changeMode(modes$1.SIMPLE_SELECT);
  }
};

DrawLineString.onStop = function(state) {
  doubleClickZoom.enable(this);
  this.activateUIButton();

  // check to see if we've deleted this feature
  if (this.getFeature(state.line.id) === undefined) { return; }

  //remove last added coordinate
  state.line.removeCoordinate(("" + (state.currentVertexPosition)));
  if (state.line.isValid()) {
    this.map.fire(events$1.CREATE, {
      features: [state.line.toGeoJSON()]
    });
  } else {
    this.deleteFeature([state.line.id], { silent: true });
    this.changeMode(modes$1.SIMPLE_SELECT, {}, { silent: true });
  }
};

DrawLineString.onTrash = function(state) {
  this.deleteFeature([state.line.id], { silent: true });
  this.changeMode(modes$1.SIMPLE_SELECT);
};

DrawLineString.toDisplayFeatures = function(state, geojson, display) {
  var isActiveLine = geojson.properties.id === state.line.id;
  geojson.properties.active = (isActiveLine) ? activeStates.ACTIVE : activeStates.INACTIVE;
  if (!isActiveLine) { return display(geojson); }
  // Only render the line if it has at least one real coordinate
  if (geojson.geometry.coordinates.length < 2) { return; }
  geojson.properties.meta = meta.FEATURE;
  display(createVertex(
    state.line.id,
    geojson.geometry.coordinates[state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1],
    ("" + (state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1)),
    false
  ));

  display(geojson);
};

var modes = {
  simple_select: SimpleSelect,
  direct_select: DirectSelect,
  draw_point: DrawPoint,
  draw_polygon: DrawPolygon,
  draw_line_string: DrawLineString,
};

var defaultOptions = {
  defaultMode: modes$1.SIMPLE_SELECT,
  keybindings: true,
  touchEnabled: true,
  clickBuffer: 2,
  touchBuffer: 25,
  boxSelect: true,
  displayControlsDefault: true,
  styles: styles,
  modes: modes,
  controls: {},
  userProperties: false
};

var showControls = {
  point: true,
  line_string: true,
  polygon: true,
  trash: true,
  combine_features: true,
  uncombine_features: true
};

var hideControls = {
  point: false,
  line_string: false,
  polygon: false,
  trash: false,
  combine_features: false,
  uncombine_features: false
};

function addSources(styles, sourceBucket) {
  return styles.map(function (style) {
    if (style.source) { return style; }
    return xtend(style, {
      id: ((style.id) + "." + sourceBucket),
      source: (sourceBucket === 'hot') ? sources.HOT : sources.COLD
    });
  });
}

function setupOptions(options) {
  if ( options === void 0 ) options = {};

  var withDefaults = xtend(options);

  if (!options.controls) {
    withDefaults.controls = {};
  }

  if (options.displayControlsDefault === false) {
    withDefaults.controls = xtend(hideControls, options.controls);
  } else {
    withDefaults.controls = xtend(showControls, options.controls);
  }

  withDefaults = xtend(defaultOptions, withDefaults);

  // Layers with a shared source should be adjacent for performance reasons
  withDefaults.styles = addSources(withDefaults.styles, 'cold').concat(addSources(withDefaults.styles, 'hot'));

  return withDefaults;
}

var lodash_isequal = {exports: {}};

/**
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
lodash_isequal.exports;

(function (module, exports) {
	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE = 200;

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';

	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1,
	    COMPARE_UNORDERED_FLAG = 2;

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;

	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    asyncTag = '[object AsyncFunction]',
	    boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    nullTag = '[object Null]',
	    objectTag = '[object Object]',
	    promiseTag = '[object Promise]',
	    proxyTag = '[object Proxy]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    symbolTag = '[object Symbol]',
	    undefinedTag = '[object Undefined]',
	    weakMapTag = '[object WeakMap]';

	var arrayBufferTag = '[object ArrayBuffer]',
	    dataViewTag = '[object DataView]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';

	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;

	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;

	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags = {};
	typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
	typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
	typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
	typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
	typedArrayTags[uint32Tag] = true;
	typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
	typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
	typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
	typedArrayTags[errorTag] = typedArrayTags[funcTag] =
	typedArrayTags[mapTag] = typedArrayTags[numberTag] =
	typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
	typedArrayTags[setTag] = typedArrayTags[stringTag] =
	typedArrayTags[weakMapTag] = false;

	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function('return this')();

	/** Detect free variable `exports`. */
	var freeExports = exports && !exports.nodeType && exports;

	/** Detect free variable `module`. */
	var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports = freeModule && freeModule.exports === freeExports;

	/** Detect free variable `process` from Node.js. */
	var freeProcess = moduleExports && freeGlobal.process;

	/** Used to access faster Node.js helpers. */
	var nodeUtil = (function() {
	  try {
	    return freeProcess && freeProcess.binding && freeProcess.binding('util');
	  } catch (e) {}
	}());

	/* Node.js helper references. */
	var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

	/**
	 * A specialized version of `_.filter` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {Array} Returns the new filtered array.
	 */
	function arrayFilter(array, predicate) {
	  var index = -1,
	      length = array == null ? 0 : array.length,
	      resIndex = 0,
	      result = [];

	  while (++index < length) {
	    var value = array[index];
	    if (predicate(value, index, array)) {
	      result[resIndex++] = value;
	    }
	  }
	  return result;
	}

	/**
	 * Appends the elements of `values` to `array`.
	 *
	 * @private
	 * @param {Array} array The array to modify.
	 * @param {Array} values The values to append.
	 * @returns {Array} Returns `array`.
	 */
	function arrayPush(array, values) {
	  var index = -1,
	      length = values.length,
	      offset = array.length;

	  while (++index < length) {
	    array[offset + index] = values[index];
	  }
	  return array;
	}

	/**
	 * A specialized version of `_.some` for arrays without support for iteratee
	 * shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {boolean} Returns `true` if any element passes the predicate check,
	 *  else `false`.
	 */
	function arraySome(array, predicate) {
	  var index = -1,
	      length = array == null ? 0 : array.length;

	  while (++index < length) {
	    if (predicate(array[index], index, array)) {
	      return true;
	    }
	  }
	  return false;
	}

	/**
	 * The base implementation of `_.times` without support for iteratee shorthands
	 * or max array length checks.
	 *
	 * @private
	 * @param {number} n The number of times to invoke `iteratee`.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the array of results.
	 */
	function baseTimes(n, iteratee) {
	  var index = -1,
	      result = Array(n);

	  while (++index < n) {
	    result[index] = iteratee(index);
	  }
	  return result;
	}

	/**
	 * The base implementation of `_.unary` without support for storing metadata.
	 *
	 * @private
	 * @param {Function} func The function to cap arguments for.
	 * @returns {Function} Returns the new capped function.
	 */
	function baseUnary(func) {
	  return function(value) {
	    return func(value);
	  };
	}

	/**
	 * Checks if a `cache` value for `key` exists.
	 *
	 * @private
	 * @param {Object} cache The cache to query.
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function cacheHas(cache, key) {
	  return cache.has(key);
	}

	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function getValue(object, key) {
	  return object == null ? undefined : object[key];
	}

	/**
	 * Converts `map` to its key-value pairs.
	 *
	 * @private
	 * @param {Object} map The map to convert.
	 * @returns {Array} Returns the key-value pairs.
	 */
	function mapToArray(map) {
	  var index = -1,
	      result = Array(map.size);

	  map.forEach(function(value, key) {
	    result[++index] = [key, value];
	  });
	  return result;
	}

	/**
	 * Creates a unary function that invokes `func` with its argument transformed.
	 *
	 * @private
	 * @param {Function} func The function to wrap.
	 * @param {Function} transform The argument transform.
	 * @returns {Function} Returns the new function.
	 */
	function overArg(func, transform) {
	  return function(arg) {
	    return func(transform(arg));
	  };
	}

	/**
	 * Converts `set` to an array of its values.
	 *
	 * @private
	 * @param {Object} set The set to convert.
	 * @returns {Array} Returns the values.
	 */
	function setToArray(set) {
	  var index = -1,
	      result = Array(set.size);

	  set.forEach(function(value) {
	    result[++index] = value;
	  });
	  return result;
	}

	/** Used for built-in method references. */
	var arrayProto = Array.prototype,
	    funcProto = Function.prototype,
	    objectProto = Object.prototype;

	/** Used to detect overreaching core-js shims. */
	var coreJsData = root['__core-js_shared__'];

	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/** Used to detect methods masquerading as native. */
	var maskSrcKey = (function() {
	  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
	  return uid ? ('Symbol(src)_1.' + uid) : '';
	}());

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = objectProto.toString;

	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);

	/** Built-in value references. */
	var Buffer = moduleExports ? root.Buffer : undefined,
	    Symbol = root.Symbol,
	    Uint8Array = root.Uint8Array,
	    propertyIsEnumerable = objectProto.propertyIsEnumerable,
	    splice = arrayProto.splice,
	    symToStringTag = Symbol ? Symbol.toStringTag : undefined;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeGetSymbols = Object.getOwnPropertySymbols,
	    nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
	    nativeKeys = overArg(Object.keys, Object);

	/* Built-in method references that are verified to be native. */
	var DataView = getNative(root, 'DataView'),
	    Map = getNative(root, 'Map'),
	    Promise = getNative(root, 'Promise'),
	    Set = getNative(root, 'Set'),
	    WeakMap = getNative(root, 'WeakMap'),
	    nativeCreate = getNative(Object, 'create');

	/** Used to detect maps, sets, and weakmaps. */
	var dataViewCtorString = toSource(DataView),
	    mapCtorString = toSource(Map),
	    promiseCtorString = toSource(Promise),
	    setCtorString = toSource(Set),
	    weakMapCtorString = toSource(WeakMap);

	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : undefined,
	    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear() {
	  this.__data__ = nativeCreate ? nativeCreate(null) : {};
	  this.size = 0;
	}

	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete(key) {
	  var result = this.has(key) && delete this.__data__[key];
	  this.size -= result ? 1 : 0;
	  return result;
	}

	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(key) {
	  var data = this.__data__;
	  if (nativeCreate) {
	    var result = data[key];
	    return result === HASH_UNDEFINED ? undefined : result;
	  }
	  return hasOwnProperty.call(data, key) ? data[key] : undefined;
	}

	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(key) {
	  var data = this.__data__;
	  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
	}

	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet(key, value) {
	  var data = this.__data__;
	  this.size += this.has(key) ? 0 : 1;
	  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
	  return this;
	}

	// Add methods to `Hash`.
	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;

	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */
	function listCacheClear() {
	  this.__data__ = [];
	  this.size = 0;
	}

	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  if (index < 0) {
	    return false;
	  }
	  var lastIndex = data.length - 1;
	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice.call(data, index, 1);
	  }
	  --this.size;
	  return true;
	}

	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  return index < 0 ? undefined : data[index][1];
	}

	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas(key) {
	  return assocIndexOf(this.__data__, key) > -1;
	}

	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet(key, value) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  if (index < 0) {
	    ++this.size;
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }
	  return this;
	}

	// Add methods to `ListCache`.
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;

	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear() {
	  this.size = 0;
	  this.__data__ = {
	    'hash': new Hash,
	    'map': new (Map || ListCache),
	    'string': new Hash
	  };
	}

	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete(key) {
	  var result = getMapData(this, key)['delete'](key);
	  this.size -= result ? 1 : 0;
	  return result;
	}

	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet(key) {
	  return getMapData(this, key).get(key);
	}

	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas(key) {
	  return getMapData(this, key).has(key);
	}

	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet(key, value) {
	  var data = getMapData(this, key),
	      size = data.size;

	  data.set(key, value);
	  this.size += data.size == size ? 0 : 1;
	  return this;
	}

	// Add methods to `MapCache`.
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;

	/**
	 *
	 * Creates an array cache object to store unique values.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [values] The values to cache.
	 */
	function SetCache(values) {
	  var index = -1,
	      length = values == null ? 0 : values.length;

	  this.__data__ = new MapCache;
	  while (++index < length) {
	    this.add(values[index]);
	  }
	}

	/**
	 * Adds `value` to the array cache.
	 *
	 * @private
	 * @name add
	 * @memberOf SetCache
	 * @alias push
	 * @param {*} value The value to cache.
	 * @returns {Object} Returns the cache instance.
	 */
	function setCacheAdd(value) {
	  this.__data__.set(value, HASH_UNDEFINED);
	  return this;
	}

	/**
	 * Checks if `value` is in the array cache.
	 *
	 * @private
	 * @name has
	 * @memberOf SetCache
	 * @param {*} value The value to search for.
	 * @returns {number} Returns `true` if `value` is found, else `false`.
	 */
	function setCacheHas(value) {
	  return this.__data__.has(value);
	}

	// Add methods to `SetCache`.
	SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
	SetCache.prototype.has = setCacheHas;

	/**
	 * Creates a stack cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Stack(entries) {
	  var data = this.__data__ = new ListCache(entries);
	  this.size = data.size;
	}

	/**
	 * Removes all key-value entries from the stack.
	 *
	 * @private
	 * @name clear
	 * @memberOf Stack
	 */
	function stackClear() {
	  this.__data__ = new ListCache;
	  this.size = 0;
	}

	/**
	 * Removes `key` and its value from the stack.
	 *
	 * @private
	 * @name delete
	 * @memberOf Stack
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function stackDelete(key) {
	  var data = this.__data__,
	      result = data['delete'](key);

	  this.size = data.size;
	  return result;
	}

	/**
	 * Gets the stack value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Stack
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function stackGet(key) {
	  return this.__data__.get(key);
	}

	/**
	 * Checks if a stack value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Stack
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function stackHas(key) {
	  return this.__data__.has(key);
	}

	/**
	 * Sets the stack `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Stack
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the stack cache instance.
	 */
	function stackSet(key, value) {
	  var data = this.__data__;
	  if (data instanceof ListCache) {
	    var pairs = data.__data__;
	    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
	      pairs.push([key, value]);
	      this.size = ++data.size;
	      return this;
	    }
	    data = this.__data__ = new MapCache(pairs);
	  }
	  data.set(key, value);
	  this.size = data.size;
	  return this;
	}

	// Add methods to `Stack`.
	Stack.prototype.clear = stackClear;
	Stack.prototype['delete'] = stackDelete;
	Stack.prototype.get = stackGet;
	Stack.prototype.has = stackHas;
	Stack.prototype.set = stackSet;

	/**
	 * Creates an array of the enumerable property names of the array-like `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @param {boolean} inherited Specify returning inherited property names.
	 * @returns {Array} Returns the array of property names.
	 */
	function arrayLikeKeys(value, inherited) {
	  var isArr = isArray(value),
	      isArg = !isArr && isArguments(value),
	      isBuff = !isArr && !isArg && isBuffer(value),
	      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
	      skipIndexes = isArr || isArg || isBuff || isType,
	      result = skipIndexes ? baseTimes(value.length, String) : [],
	      length = result.length;

	  for (var key in value) {
	    if ((inherited || hasOwnProperty.call(value, key)) &&
	        !(skipIndexes && (
	           // Safari 9 has enumerable `arguments.length` in strict mode.
	           key == 'length' ||
	           // Node.js 0.10 has enumerable non-index properties on buffers.
	           (isBuff && (key == 'offset' || key == 'parent')) ||
	           // PhantomJS 2 has enumerable non-index properties on typed arrays.
	           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
	           // Skip index properties.
	           isIndex(key, length)
	        ))) {
	      result.push(key);
	    }
	  }
	  return result;
	}

	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
	  var length = array.length;
	  while (length--) {
	    if (eq(array[length][0], key)) {
	      return length;
	    }
	  }
	  return -1;
	}

	/**
	 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
	 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
	 * symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @param {Function} symbolsFunc The function to get the symbols of `object`.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function baseGetAllKeys(object, keysFunc, symbolsFunc) {
	  var result = keysFunc(object);
	  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
	}

	/**
	 * The base implementation of `getTag` without fallbacks for buggy environments.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	function baseGetTag(value) {
	  if (value == null) {
	    return value === undefined ? undefinedTag : nullTag;
	  }
	  return (symToStringTag && symToStringTag in Object(value))
	    ? getRawTag(value)
	    : objectToString(value);
	}

	/**
	 * The base implementation of `_.isArguments`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 */
	function baseIsArguments(value) {
	  return isObjectLike(value) && baseGetTag(value) == argsTag;
	}

	/**
	 * The base implementation of `_.isEqual` which supports partial comparisons
	 * and tracks traversed objects.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @param {boolean} bitmask The bitmask flags.
	 *  1 - Unordered comparison
	 *  2 - Partial comparison
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 */
	function baseIsEqual(value, other, bitmask, customizer, stack) {
	  if (value === other) {
	    return true;
	  }
	  if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
	    return value !== value && other !== other;
	  }
	  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
	}

	/**
	 * A specialized version of `baseIsEqual` for arrays and objects which performs
	 * deep comparisons and tracks traversed objects enabling objects with circular
	 * references to be compared.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
	  var objIsArr = isArray(object),
	      othIsArr = isArray(other),
	      objTag = objIsArr ? arrayTag : getTag(object),
	      othTag = othIsArr ? arrayTag : getTag(other);

	  objTag = objTag == argsTag ? objectTag : objTag;
	  othTag = othTag == argsTag ? objectTag : othTag;

	  var objIsObj = objTag == objectTag,
	      othIsObj = othTag == objectTag,
	      isSameTag = objTag == othTag;

	  if (isSameTag && isBuffer(object)) {
	    if (!isBuffer(other)) {
	      return false;
	    }
	    objIsArr = true;
	    objIsObj = false;
	  }
	  if (isSameTag && !objIsObj) {
	    stack || (stack = new Stack);
	    return (objIsArr || isTypedArray(object))
	      ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
	      : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
	  }
	  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
	    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
	        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

	    if (objIsWrapped || othIsWrapped) {
	      var objUnwrapped = objIsWrapped ? object.value() : object,
	          othUnwrapped = othIsWrapped ? other.value() : other;

	      stack || (stack = new Stack);
	      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
	    }
	  }
	  if (!isSameTag) {
	    return false;
	  }
	  stack || (stack = new Stack);
	  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
	}

	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative(value) {
	  if (!isObject(value) || isMasked(value)) {
	    return false;
	  }
	  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
	  return pattern.test(toSource(value));
	}

	/**
	 * The base implementation of `_.isTypedArray` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 */
	function baseIsTypedArray(value) {
	  return isObjectLike(value) &&
	    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
	}

	/**
	 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeys(object) {
	  if (!isPrototype(object)) {
	    return nativeKeys(object);
	  }
	  var result = [];
	  for (var key in Object(object)) {
	    if (hasOwnProperty.call(object, key) && key != 'constructor') {
	      result.push(key);
	    }
	  }
	  return result;
	}

	/**
	 * A specialized version of `baseIsEqualDeep` for arrays with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Array} array The array to compare.
	 * @param {Array} other The other array to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `array` and `other` objects.
	 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
	 */
	function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
	  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
	      arrLength = array.length,
	      othLength = other.length;

	  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
	    return false;
	  }
	  // Assume cyclic values are equal.
	  var stacked = stack.get(array);
	  if (stacked && stack.get(other)) {
	    return stacked == other;
	  }
	  var index = -1,
	      result = true,
	      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

	  stack.set(array, other);
	  stack.set(other, array);

	  // Ignore non-index properties.
	  while (++index < arrLength) {
	    var arrValue = array[index],
	        othValue = other[index];

	    if (customizer) {
	      var compared = isPartial
	        ? customizer(othValue, arrValue, index, other, array, stack)
	        : customizer(arrValue, othValue, index, array, other, stack);
	    }
	    if (compared !== undefined) {
	      if (compared) {
	        continue;
	      }
	      result = false;
	      break;
	    }
	    // Recursively compare arrays (susceptible to call stack limits).
	    if (seen) {
	      if (!arraySome(other, function(othValue, othIndex) {
	            if (!cacheHas(seen, othIndex) &&
	                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
	              return seen.push(othIndex);
	            }
	          })) {
	        result = false;
	        break;
	      }
	    } else if (!(
	          arrValue === othValue ||
	            equalFunc(arrValue, othValue, bitmask, customizer, stack)
	        )) {
	      result = false;
	      break;
	    }
	  }
	  stack['delete'](array);
	  stack['delete'](other);
	  return result;
	}

	/**
	 * A specialized version of `baseIsEqualDeep` for comparing objects of
	 * the same `toStringTag`.
	 *
	 * **Note:** This function only supports comparing values with tags of
	 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {string} tag The `toStringTag` of the objects to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
	  switch (tag) {
	    case dataViewTag:
	      if ((object.byteLength != other.byteLength) ||
	          (object.byteOffset != other.byteOffset)) {
	        return false;
	      }
	      object = object.buffer;
	      other = other.buffer;

	    case arrayBufferTag:
	      if ((object.byteLength != other.byteLength) ||
	          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
	        return false;
	      }
	      return true;

	    case boolTag:
	    case dateTag:
	    case numberTag:
	      // Coerce booleans to `1` or `0` and dates to milliseconds.
	      // Invalid dates are coerced to `NaN`.
	      return eq(+object, +other);

	    case errorTag:
	      return object.name == other.name && object.message == other.message;

	    case regexpTag:
	    case stringTag:
	      // Coerce regexes to strings and treat strings, primitives and objects,
	      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
	      // for more details.
	      return object == (other + '');

	    case mapTag:
	      var convert = mapToArray;

	    case setTag:
	      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
	      convert || (convert = setToArray);

	      if (object.size != other.size && !isPartial) {
	        return false;
	      }
	      // Assume cyclic values are equal.
	      var stacked = stack.get(object);
	      if (stacked) {
	        return stacked == other;
	      }
	      bitmask |= COMPARE_UNORDERED_FLAG;

	      // Recursively compare objects (susceptible to call stack limits).
	      stack.set(object, other);
	      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
	      stack['delete'](object);
	      return result;

	    case symbolTag:
	      if (symbolValueOf) {
	        return symbolValueOf.call(object) == symbolValueOf.call(other);
	      }
	  }
	  return false;
	}

	/**
	 * A specialized version of `baseIsEqualDeep` for objects with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
	  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
	      objProps = getAllKeys(object),
	      objLength = objProps.length,
	      othProps = getAllKeys(other),
	      othLength = othProps.length;

	  if (objLength != othLength && !isPartial) {
	    return false;
	  }
	  var index = objLength;
	  while (index--) {
	    var key = objProps[index];
	    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
	      return false;
	    }
	  }
	  // Assume cyclic values are equal.
	  var stacked = stack.get(object);
	  if (stacked && stack.get(other)) {
	    return stacked == other;
	  }
	  var result = true;
	  stack.set(object, other);
	  stack.set(other, object);

	  var skipCtor = isPartial;
	  while (++index < objLength) {
	    key = objProps[index];
	    var objValue = object[key],
	        othValue = other[key];

	    if (customizer) {
	      var compared = isPartial
	        ? customizer(othValue, objValue, key, other, object, stack)
	        : customizer(objValue, othValue, key, object, other, stack);
	    }
	    // Recursively compare objects (susceptible to call stack limits).
	    if (!(compared === undefined
	          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
	          : compared
	        )) {
	      result = false;
	      break;
	    }
	    skipCtor || (skipCtor = key == 'constructor');
	  }
	  if (result && !skipCtor) {
	    var objCtor = object.constructor,
	        othCtor = other.constructor;

	    // Non `Object` object instances with different constructors are not equal.
	    if (objCtor != othCtor &&
	        ('constructor' in object && 'constructor' in other) &&
	        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
	          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
	      result = false;
	    }
	  }
	  stack['delete'](object);
	  stack['delete'](other);
	  return result;
	}

	/**
	 * Creates an array of own enumerable property names and symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function getAllKeys(object) {
	  return baseGetAllKeys(object, keys, getSymbols);
	}

	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData(map, key) {
	  var data = map.__data__;
	  return isKeyable(key)
	    ? data[typeof key == 'string' ? 'string' : 'hash']
	    : data.map;
	}

	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	  var value = getValue(object, key);
	  return baseIsNative(value) ? value : undefined;
	}

	/**
	 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the raw `toStringTag`.
	 */
	function getRawTag(value) {
	  var isOwn = hasOwnProperty.call(value, symToStringTag),
	      tag = value[symToStringTag];

	  try {
	    value[symToStringTag] = undefined;
	    var unmasked = true;
	  } catch (e) {}

	  var result = nativeObjectToString.call(value);
	  if (unmasked) {
	    if (isOwn) {
	      value[symToStringTag] = tag;
	    } else {
	      delete value[symToStringTag];
	    }
	  }
	  return result;
	}

	/**
	 * Creates an array of the own enumerable symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of symbols.
	 */
	var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
	  if (object == null) {
	    return [];
	  }
	  object = Object(object);
	  return arrayFilter(nativeGetSymbols(object), function(symbol) {
	    return propertyIsEnumerable.call(object, symbol);
	  });
	};

	/**
	 * Gets the `toStringTag` of `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	var getTag = baseGetTag;

	// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
	if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
	    (Map && getTag(new Map) != mapTag) ||
	    (Promise && getTag(Promise.resolve()) != promiseTag) ||
	    (Set && getTag(new Set) != setTag) ||
	    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
	  getTag = function(value) {
	    var result = baseGetTag(value),
	        Ctor = result == objectTag ? value.constructor : undefined,
	        ctorString = Ctor ? toSource(Ctor) : '';

	    if (ctorString) {
	      switch (ctorString) {
	        case dataViewCtorString: return dataViewTag;
	        case mapCtorString: return mapTag;
	        case promiseCtorString: return promiseTag;
	        case setCtorString: return setTag;
	        case weakMapCtorString: return weakMapTag;
	      }
	    }
	    return result;
	  };
	}

	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  length = length == null ? MAX_SAFE_INTEGER : length;
	  return !!length &&
	    (typeof value == 'number' || reIsUint.test(value)) &&
	    (value > -1 && value % 1 == 0 && value < length);
	}

	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
	  var type = typeof value;
	  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
	    ? (value !== '__proto__')
	    : (value === null);
	}

	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked(func) {
	  return !!maskSrcKey && (maskSrcKey in func);
	}

	/**
	 * Checks if `value` is likely a prototype object.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	 */
	function isPrototype(value) {
	  var Ctor = value && value.constructor,
	      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

	  return value === proto;
	}

	/**
	 * Converts `value` to a string using `Object.prototype.toString`.
	 *
	 * @private
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 */
	function objectToString(value) {
	  return nativeObjectToString.call(value);
	}

	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to convert.
	 * @returns {string} Returns the source code.
	 */
	function toSource(func) {
	  if (func != null) {
	    try {
	      return funcToString.call(func);
	    } catch (e) {}
	    try {
	      return (func + '');
	    } catch (e$1) {}
	  }
	  return '';
	}

	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq(value, other) {
	  return value === other || (value !== value && other !== other);
	}

	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
	  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
	    !propertyIsEnumerable.call(value, 'callee');
	};

	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;

	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike(value) {
	  return value != null && isLength(value.length) && !isFunction(value);
	}

	/**
	 * Checks if `value` is a buffer.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
	 * @example
	 *
	 * _.isBuffer(new Buffer(2));
	 * // => true
	 *
	 * _.isBuffer(new Uint8Array(2));
	 * // => false
	 */
	var isBuffer = nativeIsBuffer || stubFalse;

	/**
	 * Performs a deep comparison between two values to determine if they are
	 * equivalent.
	 *
	 * **Note:** This method supports comparing arrays, array buffers, booleans,
	 * date objects, error objects, maps, numbers, `Object` objects, regexes,
	 * sets, strings, symbols, and typed arrays. `Object` objects are compared
	 * by their own, not inherited, enumerable properties. Functions and DOM
	 * nodes are compared by strict equality, i.e. `===`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.isEqual(object, other);
	 * // => true
	 *
	 * object === other;
	 * // => false
	 */
	function isEqual(value, other) {
	  return baseIsEqual(value, other);
	}

	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  if (!isObject(value)) {
	    return false;
	  }
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 9 which returns 'object' for typed arrays and other constructors.
	  var tag = baseGetTag(value);
	  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
	}

	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength(value) {
	  return typeof value == 'number' &&
	    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}

	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  var type = typeof value;
	  return value != null && (type == 'object' || type == 'function');
	}

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return value != null && typeof value == 'object';
	}

	/**
	 * Checks if `value` is classified as a typed array.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 * @example
	 *
	 * _.isTypedArray(new Uint8Array);
	 * // => true
	 *
	 * _.isTypedArray([]);
	 * // => false
	 */
	var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

	/**
	 * Creates an array of the own enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects. See the
	 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * for more details.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keys(new Foo);
	 * // => ['a', 'b'] (iteration order is not guaranteed)
	 *
	 * _.keys('hi');
	 * // => ['0', '1']
	 */
	function keys(object) {
	  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
	}

	/**
	 * This method returns a new empty array.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {Array} Returns the new empty array.
	 * @example
	 *
	 * var arrays = _.times(2, _.stubArray);
	 *
	 * console.log(arrays);
	 * // => [[], []]
	 *
	 * console.log(arrays[0] === arrays[1]);
	 * // => false
	 */
	function stubArray() {
	  return [];
	}

	/**
	 * This method returns `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {boolean} Returns `false`.
	 * @example
	 *
	 * _.times(2, _.stubFalse);
	 * // => [false, false]
	 */
	function stubFalse() {
	  return false;
	}

	module.exports = isEqual; 
} (lodash_isequal, lodash_isequal.exports));

var lodash_isequalExports = lodash_isequal.exports;
var isEqual = /*@__PURE__*/getDefaultExportFromCjs(lodash_isequalExports);

function stringSetsAreEqual(a, b) {
  if (a.length !== b.length) { return false; }
  return JSON.stringify(a.map(function (id) { return id; }).sort()) === JSON.stringify(b.map(function (id) { return id; }).sort());
}

var featureTypes = {
  Polygon: Polygon,
  LineString: LineString,
  Point: Point$2,
  MultiPolygon: MultiFeature,
  MultiLineString: MultiFeature,
  MultiPoint: MultiFeature
};

function setupAPI(ctx, api) {

  api.modes = modes$1;

  api.getFeatureIdsAt = function(point) {
    var features = featuresAt.click({ point: point }, null, ctx);
    return features.map(function (feature) { return feature.properties.id; });
  };

  api.getSelectedIds = function () {
    return ctx.store.getSelectedIds();
  };

  api.getSelected = function () {
    return {
      type: geojsonTypes.FEATURE_COLLECTION,
      features: ctx.store.getSelectedIds().map(function (id) { return ctx.store.get(id); }).map(function (feature) { return feature.toGeoJSON(); })
    };
  };

  api.getSelectedPoints = function () {
    return {
      type: geojsonTypes.FEATURE_COLLECTION,
      features: ctx.store.getSelectedCoordinates().map(function (coordinate) { return ({
        type: geojsonTypes.FEATURE,
        properties: {},
        geometry: {
          type: geojsonTypes.POINT,
          coordinates: coordinate.coordinates
        }
      }); })
    };
  };

  api.set = function(featureCollection) {
    if (featureCollection.type === undefined || featureCollection.type !== geojsonTypes.FEATURE_COLLECTION || !Array.isArray(featureCollection.features)) {
      throw new Error('Invalid FeatureCollection');
    }
    var renderBatch = ctx.store.createRenderBatch();
    var toDelete = ctx.store.getAllIds().slice();
    var newIds = api.add(featureCollection);
    var newIdsLookup = new StringSet(newIds);

    toDelete = toDelete.filter(function (id) { return !newIdsLookup.has(id); });
    if (toDelete.length) {
      api.delete(toDelete);
    }

    renderBatch();
    return newIds;
  };

  api.add = function (geojson) {
    var featureCollection = JSON.parse(JSON.stringify(normalize$1(geojson)));

    var ids = featureCollection.features.map(function (feature) {
      feature.id = feature.id || hat$1();

      if (feature.geometry === null) {
        throw new Error('Invalid geometry: null');
      }

      if (ctx.store.get(feature.id) === undefined || ctx.store.get(feature.id).type !== feature.geometry.type) {
        // If the feature has not yet been created ...
        var Model = featureTypes[feature.geometry.type];
        if (Model === undefined) {
          throw new Error(("Invalid geometry type: " + (feature.geometry.type) + "."));
        }
        var internalFeature = new Model(ctx, feature);
        ctx.store.add(internalFeature);
      } else {
        // If a feature of that id has already been created, and we are swapping it out ...
        var internalFeature$1 = ctx.store.get(feature.id);
        internalFeature$1.properties = feature.properties;
        if (!isEqual(internalFeature$1.properties, feature.properties)) {
          ctx.store.featureChanged(internalFeature$1.id);
        }
        if (!isEqual(internalFeature$1.getCoordinates(), feature.geometry.coordinates)) {
          internalFeature$1.incomingCoords(feature.geometry.coordinates);
        }
      }
      return feature.id;
    });

    ctx.store.render();
    return ids;
  };


  api.get = function (id) {
    var feature = ctx.store.get(id);
    if (feature) {
      return feature.toGeoJSON();
    }
  };

  api.getAll = function() {
    return {
      type: geojsonTypes.FEATURE_COLLECTION,
      features: ctx.store.getAll().map(function (feature) { return feature.toGeoJSON(); })
    };
  };

  api.delete = function(featureIds) {
    ctx.store.delete(featureIds, { silent: true });
    // If we were in direct select mode and our selected feature no longer exists
    // (because it was deleted), we need to get out of that mode.
    if (api.getMode() === modes$1.DIRECT_SELECT && !ctx.store.getSelectedIds().length) {
      ctx.events.changeMode(modes$1.SIMPLE_SELECT, undefined, { silent: true });
    } else {
      ctx.store.render();
    }

    return api;
  };

  api.deleteAll = function() {
    ctx.store.delete(ctx.store.getAllIds(), { silent: true });
    // If we were in direct select mode, now our selected feature no longer exists,
    // so escape that mode.
    if (api.getMode() === modes$1.DIRECT_SELECT) {
      ctx.events.changeMode(modes$1.SIMPLE_SELECT, undefined, { silent: true });
    } else {
      ctx.store.render();
    }

    return api;
  };

  api.changeMode = function(mode, modeOptions) {
    if ( modeOptions === void 0 ) modeOptions = {};

    // Avoid changing modes just to re-select what's already selected
    if (mode === modes$1.SIMPLE_SELECT && api.getMode() === modes$1.SIMPLE_SELECT) {
      if (stringSetsAreEqual((modeOptions.featureIds || []), ctx.store.getSelectedIds())) { return api; }
      // And if we are changing the selection within simple_select mode, just change the selection,
      // instead of stopping and re-starting the mode
      ctx.store.setSelected(modeOptions.featureIds, { silent: true });
      ctx.store.render();
      return api;
    }

    if (mode === modes$1.DIRECT_SELECT && api.getMode() === modes$1.DIRECT_SELECT &&
      modeOptions.featureId === ctx.store.getSelectedIds()[0]) {
      return api;
    }

    ctx.events.changeMode(mode, modeOptions, { silent: true });
    return api;
  };

  api.getMode = function() {
    return ctx.events.getMode();
  };

  api.trash = function() {
    ctx.events.trash({ silent: true });
    return api;
  };

  api.combineFeatures = function() {
    ctx.events.combineFeatures({ silent: true });
    return api;
  };

  api.uncombineFeatures = function() {
    ctx.events.uncombineFeatures({ silent: true });
    return api;
  };

  api.setFeatureProperty = function(featureId, property, value) {
    ctx.store.setFeatureProperty(featureId, property, value);
    return api;
  };

  return api;
}

var lib = /*#__PURE__*/Object.freeze({
__proto__: null,
CommonSelectors: common_selectors,
constrainFeatureMovement: constrainFeatureMovement,
createMidPoint: createMidpoint,
createSupplementaryPoints: createSupplementaryPoints,
createVertex: createVertex,
doubleClickZoom: doubleClickZoom,
euclideanDistance: euclideanDistance,
featuresAt: featuresAt,
getFeatureAtAndSetCursors: getFeatureAtAndSetCursors,
isClick: isClick,
isEventAtCoordinates: isEventAtCoordinates,
isTap: isTap,
mapEventToBoundingBox: mapEventToBoundingBox,
ModeHandler: ModeHandler,
moveFeatures: moveFeatures,
sortFeatures: sortFeatures,
stringSetsAreEqual: stringSetsAreEqual,
StringSet: StringSet,
theme: styles,
toDenseArray: toDenseArray
});

var setupDraw = function(options, api) {
  options = setupOptions(options);

  var ctx = {
    options: options
  };

  api = setupAPI(ctx, api);
  ctx.api = api;

  var setup = runSetup(ctx);

  api.onAdd = setup.onAdd;
  api.onRemove = setup.onRemove;
  api.types = types$1;
  api.options = options;

  // Biarri: We expose the context
  api.ctx = ctx;

  return api;
};

function MapboxDraw(options) {
  setupDraw(options, this);
}
MapboxDraw.modes = modes;
MapboxDraw.constants = Constants;
MapboxDraw.lib = lib;

return MapboxDraw;

}));
//# sourceMappingURL=mapbox-gl-draw-unminified.js.map
