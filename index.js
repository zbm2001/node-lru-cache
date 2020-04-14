/*
 * @name: lru-cache
 * @version: 5.1.1
 * @description: A cache object that deletes the least-recently-used items.
 * @author: Isaac Z. Schlueter <i@izs.me>
 * @license: ISC
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var yallist = _interopDefault(require('yallist'));
var es6Symbol = _interopDefault(require('es6-symbol'));

// A linked list to keep track of recently-used-ness



var MAX = es6Symbol('max');
var LENGTH = es6Symbol('length');
var LENGTH_CALCULATOR = es6Symbol('lengthCalculator');
var ALLOW_STALE = es6Symbol('allowStale');
var MAX_AGE = es6Symbol('maxAge');
var DISPOSE = es6Symbol('dispose');
var NO_DISPOSE_ON_SET = es6Symbol('noDisposeOnSet');
var LRU_LIST = es6Symbol('lruList');
var CACHE = es6Symbol('cache');
var UPDATE_AGE_ON_GET = es6Symbol('updateAgeOnGet');

var naiveLength = function () { return 1; };

// lruList is a yallist where the head is the youngest
// item, and the tail is the oldest.  the list contains the Hit
// objects as the entries.
// Each Hit object has a reference to its Yallist.Node.  This
// never changes.
//
// cache is a Map (or PseudoMap) that matches the keys to
// the Yallist.Node object.
var LRUCache = function LRUCache (options) {
  if (typeof options === 'number')
    { options = { max: options }; }

  if (!options)
    { options = {}; }

  if (options.max && (typeof options.max !== 'number' || options.max < 0))
    { throw new TypeError('max must be a non-negative number') }
  // Kind of weird to have a default max of Infinity, but oh well.
  var max = this[MAX] = options.max || Infinity;

  var lc = options.length || naiveLength;
  this[LENGTH_CALCULATOR] = (typeof lc !== 'function') ? naiveLength : lc;
  this[ALLOW_STALE] = options.stale || false;
  if (options.maxAge && typeof options.maxAge !== 'number')
    { throw new TypeError('maxAge must be a number') }
  this[MAX_AGE] = options.maxAge || 0;
  this[DISPOSE] = options.dispose;
  this[NO_DISPOSE_ON_SET] = options.noDisposeOnSet || false;
  this[UPDATE_AGE_ON_GET] = options.updateAgeOnGet || false;
  this.reset();
};

var prototypeAccessors = { max: { configurable: true },allowStale: { configurable: true },maxAge: { configurable: true },lengthCalculator: { configurable: true },length: { configurable: true },itemCount: { configurable: true } };

// resize the cache when the max changes.
prototypeAccessors.max.set = function (mL) {
  if (typeof mL !== 'number' || mL < 0)
    { throw new TypeError('max must be a non-negative number') }

  this[MAX] = mL || Infinity;
  trim(this);
};
prototypeAccessors.max.get = function () {
  return this[MAX]
};

prototypeAccessors.allowStale.set = function (allowStale) {
  this[ALLOW_STALE] = !!allowStale;
};
prototypeAccessors.allowStale.get = function () {
  return this[ALLOW_STALE]
};

prototypeAccessors.maxAge.set = function (mA) {
  if (typeof mA !== 'number')
    { throw new TypeError('maxAge must be a non-negative number') }

  this[MAX_AGE] = mA;
  trim(this);
};
prototypeAccessors.maxAge.get = function () {
  return this[MAX_AGE]
};

// resize the cache when the lengthCalculator changes.
prototypeAccessors.lengthCalculator.set = function (lC) {
    var this$1 = this;

  if (typeof lC !== 'function')
    { lC = naiveLength; }

  if (lC !== this[LENGTH_CALCULATOR]) {
    this[LENGTH_CALCULATOR] = lC;
    this[LENGTH] = 0;
    this[LRU_LIST].forEach(function (hit) {
      hit.length = this$1[LENGTH_CALCULATOR](hit.value, hit.key);
      this$1[LENGTH] += hit.length;
    });
  }
  trim(this);
};
prototypeAccessors.lengthCalculator.get = function () { return this[LENGTH_CALCULATOR] };

prototypeAccessors.length.get = function () { return this[LENGTH] };
prototypeAccessors.itemCount.get = function () { return this[LRU_LIST].length };

LRUCache.prototype.rforEach = function rforEach (fn, thisp) {
  thisp = thisp || this;
  for (var walker = this[LRU_LIST].tail; walker !== null;) {
    var prev = walker.prev;
    forEachStep(this, fn, walker, thisp);
    walker = prev;
  }
};

LRUCache.prototype.forEach = function forEach (fn, thisp) {
  thisp = thisp || this;
  for (var walker = this[LRU_LIST].head; walker !== null;) {
    var next = walker.next;
    forEachStep(this, fn, walker, thisp);
    walker = next;
  }
};

LRUCache.prototype.keys = function keys () {
  return this[LRU_LIST].toArray().map(function (k) { return k.key; })
};

LRUCache.prototype.values = function values () {
  return this[LRU_LIST].toArray().map(function (k) { return k.value; })
};

LRUCache.prototype.reset = function reset () {
    var this$1 = this;

  if (this[DISPOSE] &&
      this[LRU_LIST] &&
      this[LRU_LIST].length) {
    this[LRU_LIST].forEach(function (hit) { return this$1[DISPOSE](hit.key, hit.value); });
  }

  this[CACHE] = new Map(); // hash of items by key
  this[LRU_LIST] = new yallist(); // list of items in order of use recency
  this[LENGTH] = 0; // length of items in the list
};

LRUCache.prototype.dump = function dump () {
    var this$1 = this;

  return this[LRU_LIST].map(function (hit) { return isStale(this$1, hit) ? false : {
      k: hit.key,
      v: hit.value,
      e: hit.now + (hit.maxAge || 0)
    }; }).toArray().filter(function (h) { return h; })
};

LRUCache.prototype.dumpLru = function dumpLru () {
  return this[LRU_LIST]
};

LRUCache.prototype.set = function set (key, value, maxAge) {
  maxAge = maxAge || this[MAX_AGE];

  if (maxAge && typeof maxAge !== 'number')
    { throw new TypeError('maxAge must be a number') }

  var now = maxAge ? Date.now() : 0;
  var len = this[LENGTH_CALCULATOR](value, key);

  if (this[CACHE].has(key)) {
    if (len > this[MAX]) {
      del(this, this[CACHE].get(key));
      return false
    }

    var node = this[CACHE].get(key);
    var item = node.value;

    // dispose of the old one before overwriting
    // split out into 2 ifs for better coverage tracking
    if (this[DISPOSE]) {
      if (!this[NO_DISPOSE_ON_SET])
        { this[DISPOSE](key, item.value); }
    }

    item.now = now;
    item.maxAge = maxAge;
    item.value = value;
    this[LENGTH] += len - item.length;
    item.length = len;
    this.get(key);
    trim(this);
    return true
  }

  var hit = new Entry(key, value, len, now, maxAge);

  // oversized objects fall out of cache automatically.
  if (hit.length > this[MAX]) {
    if (this[DISPOSE])
      { this[DISPOSE](key, value); }

    return false
  }

  this[LENGTH] += hit.length;
  this[LRU_LIST].unshift(hit);
  this[CACHE].set(key, this[LRU_LIST].head);
  trim(this);
  return true
};

LRUCache.prototype.has = function has (key) {
  if (!this[CACHE].has(key)) { return false }
  var hit = this[CACHE].get(key).value;
  return !isStale(this, hit)
};

LRUCache.prototype.get = function get$1 (key) {
  return get(this, key, true)
};

LRUCache.prototype.peek = function peek (key) {
  return get(this, key, false)
};

LRUCache.prototype.pop = function pop () {
  var node = this[LRU_LIST].tail;
  if (!node)
    { return null }

  del(this, node);
  return node.value
};

LRUCache.prototype.del = function del$1 (key) {
  del(this, this[CACHE].get(key));
};

LRUCache.prototype.load = function load (arr) {
  // reset the cache
  this.reset();

  var now = Date.now();
  // A previous serialized cache has the most recent items first
  for (var l = arr.length - 1; l >= 0; l--) {
    var hit = arr[l];
    var expiresAt = hit.e || 0;
    if (expiresAt === 0)
      // the item was created without expiration in a non aged cache
      { this.set(hit.k, hit.v); }
    else {
      var maxAge = expiresAt - now;
      // dont add already expired items
      if (maxAge > 0) {
        this.set(hit.k, hit.v, maxAge);
      }
    }
  }
};

LRUCache.prototype.prune = function prune () {
    var this$1 = this;

  this[CACHE].forEach(function (value, key) { return get(this$1, key, false); });
};

Object.defineProperties( LRUCache.prototype, prototypeAccessors );

var get = function (self, key, doUse) {
  var node = self[CACHE].get(key);
  if (node) {
    var hit = node.value;
    if (isStale(self, hit)) {
      del(self, node);
      if (!self[ALLOW_STALE])
        { return undefined }
    } else {
      if (doUse) {
        if (self[UPDATE_AGE_ON_GET])
          { node.value.now = Date.now(); }
        self[LRU_LIST].unshiftNode(node);
      }
    }
    return hit.value
  }
};

var isStale = function (self, hit) {
  if (!hit || (!hit.maxAge && !self[MAX_AGE]))
    { return false }

  var diff = Date.now() - hit.now;
  return hit.maxAge ? diff > hit.maxAge
    : self[MAX_AGE] && (diff > self[MAX_AGE])
};

var trim = function (self) {
  if (self[LENGTH] > self[MAX]) {
    for (var walker = self[LRU_LIST].tail;
      self[LENGTH] > self[MAX] && walker !== null;) {
      // We know that we're about to delete this one, and also
      // what the next least recently used key will be, so just
      // go ahead and set it now.
      var prev = walker.prev;
      del(self, walker);
      walker = prev;
    }
  }
};

var del = function (self, node) {
  if (node) {
    var hit = node.value;
    if (self[DISPOSE])
      { self[DISPOSE](hit.key, hit.value); }

    self[LENGTH] -= hit.length;
    self[CACHE].delete(hit.key);
    self[LRU_LIST].removeNode(node);
  }
};

var Entry = function Entry (key, value, length, now, maxAge) {
  this.key = key;
  this.value = value;
  this.length = length;
  this.now = now;
  this.maxAge = maxAge || 0;
};

var forEachStep = function (self, fn, node, thisp) {
  var hit = node.value;
  if (isStale(self, hit)) {
    del(self, node);
    if (!self[ALLOW_STALE])
      { hit = undefined; }
  }
  if (hit)
    { fn.call(thisp, hit.value, hit.key, self); }
};

var src = LRUCache;

exports.default = src;
