// GameFramework/framework/utils/MathUtils.js
// Math utilities: Vector2, scalars, random helpers, angle utils, easing functions.
// All members hang off GF.Math — no class needed, just a plain namespace object.

(function (GF) {
  'use strict';

  // ─── Easing Functions ───────────────────────────────────────────────────────
  // All take t in [0, 1] and return a value in (approximately) [0, 1].

  const ease = {
    linear:      t => t,

    inQuad:      t => t * t,
    outQuad:     t => t * (2 - t),
    inOutQuad:   t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

    inCubic:     t => t * t * t,
    outCubic:    t => (--t) * t * t + 1,
    inOutCubic:  t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

    inQuart:     t => t * t * t * t,
    outQuart:    t => 1 - (--t) * t * t * t,
    inOutQuart:  t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

    inSine:      t => 1 - Math.cos(t * Math.PI / 2),
    outSine:     t => Math.sin(t * Math.PI / 2),
    inOutSine:   t => -(Math.cos(Math.PI * t) - 1) / 2,

    inExpo:      t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
    outExpo:     t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    inOutExpo:   t => t === 0 ? 0 : t === 1 ? 1
                       : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2
                       : (2 - Math.pow(2, -20 * t + 10)) / 2,

    inBack:      t => { const c1 = 1.70158; return c1 * t * t * t - c1 * t * t; },
    outBack:     t => { const c1 = 1.70158; t--; return 1 + c1 * t * t * t + c1 * t * t; },

    outBounce:   t => {
      if (t < 1 / 2.75)      return 7.5625 * t * t;
      if (t < 2 / 2.75)      { t -= 1.5   / 2.75; return 7.5625 * t * t + 0.75; }
      if (t < 2.5 / 2.75)   { t -= 2.25  / 2.75; return 7.5625 * t * t + 0.9375; }
                               t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
    },
    inBounce:    t => 1 - ease.outBounce(1 - t),

    outElastic:  t => {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    },
    inElastic:   t => {
      if (t === 0 || t === 1) return t;
      return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI) / 3);
    },
  };

  // ─── Vector2 ────────────────────────────────────────────────────────────────
  // Returns plain {x, y} objects — lightweight and JSON-friendly.

  const TAU = Math.PI * 2;

  const Vec2 = {
    /** Create a new vector. */
    create(x = 0, y = 0) { return { x, y }; },

    /** Add two vectors, returns new vector. */
    add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; },

    /** Subtract b from a, returns new vector. */
    sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; },

    /** Scale vector by scalar, returns new vector. */
    scale(a, s) { return { x: a.x * s, y: a.y * s }; },

    /** Dot product. */
    dot(a, b) { return a.x * b.x + a.y * b.y; },

    /** Magnitude (length) of vector. */
    mag(a) { return Math.sqrt(a.x * a.x + a.y * a.y); },

    /** Squared magnitude (avoids sqrt, good for comparisons). */
    magSq(a) { return a.x * a.x + a.y * a.y; },

    /** Normalize to unit vector; returns zero vector if magnitude is 0. */
    normalize(a) {
      const m = Vec2.mag(a);
      return m === 0 ? { x: 0, y: 0 } : { x: a.x / m, y: a.y / m };
    },

    /** Distance between two points. */
    dist(a, b) { return Vec2.mag(Vec2.sub(a, b)); },

    /** Squared distance (avoids sqrt). */
    distSq(a, b) { const d = Vec2.sub(a, b); return d.x * d.x + d.y * d.y; },

    /** Linear interpolate between a and b by t. */
    lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; },

    /** Vector from angle (radians) and magnitude. */
    fromAngle(angle, mag = 1) { return { x: Math.cos(angle) * mag, y: Math.sin(angle) * mag }; },

    /** Angle of vector in radians. */
    angle(a) { return Math.atan2(a.y, a.x); },

    /** Perpendicular vector (rotated 90° clockwise). */
    perp(a) { return { x: a.y, y: -a.x }; },

    /** Rotate vector by angle (radians). */
    rotate(a, angle) {
      const cos = Math.cos(angle), sin = Math.sin(angle);
      return { x: a.x * cos - a.y * sin, y: a.x * sin + a.y * cos };
    },

    /** Clamp magnitude to a maximum length. */
    clampMag(a, maxMag) {
      const m = Vec2.mag(a);
      return m > maxMag ? Vec2.scale(a, maxMag / m) : { x: a.x, y: a.y };
    },
  };

  // ─── GF.Math namespace ──────────────────────────────────────────────────────

  GF.Math = {
    TAU,
    PI: Math.PI,

    // ── Scalar helpers ──────────────────────────────────────────────────────

    /** Clamp v between min and max. */
    clamp(v, min, max) { return v < min ? min : v > max ? max : v; },

    /** Linear interpolate from a to b by t. */
    lerp(a, b, t) { return a + (b - a) * t; },

    /** Map v from [inMin, inMax] to [outMin, outMax]. */
    map(v, inMin, inMax, outMin, outMax) {
      return outMin + (outMax - outMin) * ((v - inMin) / (inMax - inMin));
    },

    /** Map v from [inMin, inMax] to [outMin, outMax], clamped to output range. */
    mapClamp(v, inMin, inMax, outMin, outMax) {
      const t = GF.Math.clamp((v - inMin) / (inMax - inMin), 0, 1);
      return outMin + (outMax - outMin) * t;
    },

    /** Smooth-step interpolation (smooth start and end). */
    smoothstep(edge0, edge1, t) {
      t = GF.Math.clamp((t - edge0) / (edge1 - edge0), 0, 1);
      return t * t * (3 - 2 * t);
    },

    /** Wrap v into the range [min, max). */
    wrap(v, min, max) {
      const range = max - min;
      return ((v - min) % range + range) % range + min;
    },

    /** Round to a given number of decimal places. */
    roundTo(v, decimals) {
      const factor = Math.pow(10, decimals);
      return Math.round(v * factor) / factor;
    },

    /** Convert degrees to radians. */
    toRad(degrees) { return degrees * (Math.PI / 180); },

    /** Convert radians to degrees. */
    toDeg(radians) { return radians * (180 / Math.PI); },

    /** Shortest angular difference from a to b (radians), in [-π, π]. */
    angleDiff(a, b) {
      let d = (b - a) % TAU;
      if (d >  Math.PI) d -= TAU;
      if (d < -Math.PI) d += TAU;
      return d;
    },

    /** Angle from point (x1,y1) to point (x2,y2) in radians. */
    angleTo(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); },

    // ── Random helpers ──────────────────────────────────────────────────────

    /** Random float in [min, max). */
    rand(min = 0, max = 1) { return min + Math.random() * (max - min); },

    /** Random integer in [min, max] inclusive. */
    randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); },

    /** Random element from an array. */
    randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

    /** Random element from a weighted array: [{item, weight}, ...]. */
    randWeighted(items) {
      let total = items.reduce((s, i) => s + i.weight, 0);
      let r = Math.random() * total;
      for (const item of items) { r -= item.weight; if (r <= 0) return item.item; }
      return items[items.length - 1].item;
    },

    /** Random angle in [0, TAU). */
    randAngle() { return Math.random() * TAU; },

    /** Random boolean, with optional probability of true (default 0.5). */
    randBool(p = 0.5) { return Math.random() < p; },

    /** Shuffle array in-place using Fisher-Yates; returns the array. */
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    // ── Geometry helpers ────────────────────────────────────────────────────

    /** True if point (px, py) is inside AABB. */
    pointInRect(px, py, rx, ry, rw, rh) {
      return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    /** True if point (px, py) is inside circle (cx, cy, r). */
    pointInCircle(px, py, cx, cy, r) {
      const dx = px - cx, dy = py - cy;
      return dx * dx + dy * dy <= r * r;
    },

    /** True if two AABBs overlap. */
    rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    },

    // ── Submodules ──────────────────────────────────────────────────────────

    /** Vec2 utilities — all operations return new {x, y} objects. */
    Vec2,

    /** Easing functions — all take t in [0,1] and return a number. */
    ease,
  };

})(window.GF = window.GF || {});
