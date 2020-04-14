/*
 * @name: @zbm1/lru-cache
 * @version: 5.1.2
 * @description: A cache object that deletes the least-recently-used items.
 * @author: Isaac Z. Schlueter <i@izs.me>
 * @license: ISC
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var iterator = function (Yallist) {
  Yallist.prototype[Symbol.iterator] = function* () {
    for (let walker = this.head; walker; walker = walker.next) {
      yield walker.value;
    }
  };
};

var yallist = Yallist;

Yallist.Node = Node;
Yallist.create = Yallist;

function Yallist (list) {
  var self = this;
  if (!(self instanceof Yallist)) {
    self = new Yallist();
  }

  self.tail = null;
  self.head = null;
  self.length = 0;

  if (list && typeof list.forEach === 'function') {
    list.forEach(function (item) {
      self.push(item);
    });
  } else if (arguments.length > 0) {
    for (var i = 0, l = arguments.length; i < l; i++) {
      self.push(arguments[i]);
    }
  }

  return self
}

Yallist.prototype.removeNode = function (node) {
  if (node.list !== this) {
    throw new Error('removing node which does not belong to this list')
  }

  var next = node.next;
  var prev = node.prev;

  if (next) {
    next.prev = prev;
  }

  if (prev) {
    prev.next = next;
  }

  if (node === this.head) {
    this.head = next;
  }
  if (node === this.tail) {
    this.tail = prev;
  }

  node.list.length--;
  node.next = null;
  node.prev = null;
  node.list = null;

  return next
};

Yallist.prototype.unshiftNode = function (node) {
  if (node === this.head) {
    return
  }

  if (node.list) {
    node.list.removeNode(node);
  }

  var head = this.head;
  node.list = this;
  node.next = head;
  if (head) {
    head.prev = node;
  }

  this.head = node;
  if (!this.tail) {
    this.tail = node;
  }
  this.length++;
};

Yallist.prototype.pushNode = function (node) {
  if (node === this.tail) {
    return
  }

  if (node.list) {
    node.list.removeNode(node);
  }

  var tail = this.tail;
  node.list = this;
  node.prev = tail;
  if (tail) {
    tail.next = node;
  }

  this.tail = node;
  if (!this.head) {
    this.head = node;
  }
  this.length++;
};

Yallist.prototype.push = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    push(this, arguments[i]);
  }
  return this.length
};

Yallist.prototype.unshift = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    unshift(this, arguments[i]);
  }
  return this.length
};

Yallist.prototype.pop = function () {
  if (!this.tail) {
    return undefined
  }

  var res = this.tail.value;
  this.tail = this.tail.prev;
  if (this.tail) {
    this.tail.next = null;
  } else {
    this.head = null;
  }
  this.length--;
  return res
};

Yallist.prototype.shift = function () {
  if (!this.head) {
    return undefined
  }

  var res = this.head.value;
  this.head = this.head.next;
  if (this.head) {
    this.head.prev = null;
  } else {
    this.tail = null;
  }
  this.length--;
  return res
};

Yallist.prototype.forEach = function (fn, thisp) {
  thisp = thisp || this;
  for (var walker = this.head, i = 0; walker !== null; i++) {
    fn.call(thisp, walker.value, i, this);
    walker = walker.next;
  }
};

Yallist.prototype.forEachReverse = function (fn, thisp) {
  thisp = thisp || this;
  for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
    fn.call(thisp, walker.value, i, this);
    walker = walker.prev;
  }
};

Yallist.prototype.get = function (n) {
  for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
    // abort out of the list early if we hit a cycle
    walker = walker.next;
  }
  if (i === n && walker !== null) {
    return walker.value
  }
};

Yallist.prototype.getReverse = function (n) {
  for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
    // abort out of the list early if we hit a cycle
    walker = walker.prev;
  }
  if (i === n && walker !== null) {
    return walker.value
  }
};

Yallist.prototype.map = function (fn, thisp) {
  thisp = thisp || this;
  var res = new Yallist();
  for (var walker = this.head; walker !== null;) {
    res.push(fn.call(thisp, walker.value, this));
    walker = walker.next;
  }
  return res
};

Yallist.prototype.mapReverse = function (fn, thisp) {
  thisp = thisp || this;
  var res = new Yallist();
  for (var walker = this.tail; walker !== null;) {
    res.push(fn.call(thisp, walker.value, this));
    walker = walker.prev;
  }
  return res
};

Yallist.prototype.reduce = function (fn, initial) {
  var acc;
  var walker = this.head;
  if (arguments.length > 1) {
    acc = initial;
  } else if (this.head) {
    walker = this.head.next;
    acc = this.head.value;
  } else {
    throw new TypeError('Reduce of empty list with no initial value')
  }

  for (var i = 0; walker !== null; i++) {
    acc = fn(acc, walker.value, i);
    walker = walker.next;
  }

  return acc
};

Yallist.prototype.reduceReverse = function (fn, initial) {
  var acc;
  var walker = this.tail;
  if (arguments.length > 1) {
    acc = initial;
  } else if (this.tail) {
    walker = this.tail.prev;
    acc = this.tail.value;
  } else {
    throw new TypeError('Reduce of empty list with no initial value')
  }

  for (var i = this.length - 1; walker !== null; i--) {
    acc = fn(acc, walker.value, i);
    walker = walker.prev;
  }

  return acc
};

Yallist.prototype.toArray = function () {
  var arr = new Array(this.length);
  for (var i = 0, walker = this.head; walker !== null; i++) {
    arr[i] = walker.value;
    walker = walker.next;
  }
  return arr
};

Yallist.prototype.toArrayReverse = function () {
  var arr = new Array(this.length);
  for (var i = 0, walker = this.tail; walker !== null; i++) {
    arr[i] = walker.value;
    walker = walker.prev;
  }
  return arr
};

Yallist.prototype.slice = function (from, to) {
  to = to || this.length;
  if (to < 0) {
    to += this.length;
  }
  from = from || 0;
  if (from < 0) {
    from += this.length;
  }
  var ret = new Yallist();
  if (to < from || to < 0) {
    return ret
  }
  if (from < 0) {
    from = 0;
  }
  if (to > this.length) {
    to = this.length;
  }
  for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
    walker = walker.next;
  }
  for (; walker !== null && i < to; i++, walker = walker.next) {
    ret.push(walker.value);
  }
  return ret
};

Yallist.prototype.sliceReverse = function (from, to) {
  to = to || this.length;
  if (to < 0) {
    to += this.length;
  }
  from = from || 0;
  if (from < 0) {
    from += this.length;
  }
  var ret = new Yallist();
  if (to < from || to < 0) {
    return ret
  }
  if (from < 0) {
    from = 0;
  }
  if (to > this.length) {
    to = this.length;
  }
  for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
    walker = walker.prev;
  }
  for (; walker !== null && i > from; i--, walker = walker.prev) {
    ret.push(walker.value);
  }
  return ret
};

Yallist.prototype.splice = function (start, deleteCount, ...nodes) {
  if (start > this.length) {
    start = this.length - 1;
  }
  if (start < 0) {
    start = this.length + start;
  }

  for (var i = 0, walker = this.head; walker !== null && i < start; i++) {
    walker = walker.next;
  }

  var ret = [];
  for (var i = 0; walker && i < deleteCount; i++) {
    ret.push(walker.value);
    walker = this.removeNode(walker);
  }
  if (walker === null) {
    walker = this.tail;
  }

  if (walker !== this.head && walker !== this.tail) {
    walker = walker.prev;
  }

  for (var i = 0; i < nodes.length; i++) {
    walker = insert(this, walker, nodes[i]);
  }
  return ret;
};

Yallist.prototype.reverse = function () {
  var head = this.head;
  var tail = this.tail;
  for (var walker = head; walker !== null; walker = walker.prev) {
    var p = walker.prev;
    walker.prev = walker.next;
    walker.next = p;
  }
  this.head = tail;
  this.tail = head;
  return this
};

function insert (self, node, value) {
  var inserted = node === self.head ?
    new Node(value, null, node, self) :
    new Node(value, node, node.next, self);

  if (inserted.next === null) {
    self.tail = inserted;
  }
  if (inserted.prev === null) {
    self.head = inserted;
  }

  self.length++;

  return inserted
}

function push (self, item) {
  self.tail = new Node(item, self.tail, null, self);
  if (!self.head) {
    self.head = self.tail;
  }
  self.length++;
}

function unshift (self, item) {
  self.head = new Node(item, null, self.head, self);
  if (!self.tail) {
    self.tail = self.head;
  }
  self.length++;
}

function Node (value, prev, next, list) {
  if (!(this instanceof Node)) {
    return new Node(value, prev, next, list)
  }

  this.list = list;
  this.value = value;

  if (prev) {
    prev.next = this;
    this.prev = prev;
  } else {
    this.prev = null;
  }

  if (next) {
    next.prev = this;
    this.next = next;
  } else {
    this.next = null;
  }
}

try {
  // add if support for Symbol.iterator is present
  iterator(Yallist);
} catch (er) {}

var isImplemented = function () {
	if (typeof globalThis !== "object") return false;
	if (!globalThis) return false;
	return globalThis.Array === Array;
};

var naiveFallback = function () {
	if (typeof self === "object" && self) return self;
	if (typeof window === "object" && window) return window;
	throw new Error("Unable to resolve global `this`");
};

var implementation = (function () {
	if (this) return this;

	// Unexpected strict mode (may happen if e.g. bundled into ESM module)

	// Thanks @mathiasbynens -> https://mathiasbynens.be/notes/globalthis
	// In all ES5+ engines global object inherits from Object.prototype
	// (if you approached one that doesn't please report)
	try {
		Object.defineProperty(Object.prototype, "__global__", {
			get: function () { return this; },
			configurable: true
		});
	} catch (error) {
		// Unfortunate case of Object.prototype being sealed (via preventExtensions, seal or freeze)
		return naiveFallback();
	}
	try {
		// Safari case (window.__global__ is resolved with global context, but __global__ does not)
		if (!__global__) return naiveFallback();
		return __global__;
	} finally {
		delete Object.prototype.__global__;
	}
})();

var globalThis_1 = isImplemented() ? globalThis : implementation;

var validTypes = { object: true, symbol: true };

var isImplemented$1 = function () {
	var Symbol = globalThis_1.Symbol;
	var symbol;
	if (typeof Symbol !== "function") return false;
	symbol = Symbol("test symbol");
	try { String(symbol); }
	catch (e) { return false; }

	// Return 'true' also for polyfills
	if (!validTypes[typeof Symbol.iterator]) return false;
	if (!validTypes[typeof Symbol.toPrimitive]) return false;
	if (!validTypes[typeof Symbol.toStringTag]) return false;

	return true;
};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

// ES3 safe
var _undefined = void 0;

var is = function (value) { return value !== _undefined && value !== null; };

// prettier-ignore
var possibleTypes = { "object": true, "function": true, "undefined": true /* document.all */ };

var is$1 = function (value) {
	if (!is(value)) return false;
	return hasOwnProperty.call(possibleTypes, typeof value);
};

var is$2 = function (value) {
	if (!is$1(value)) return false;
	try {
		if (!value.constructor) return false;
		return value.constructor.prototype === value;
	} catch (error) {
		return false;
	}
};

var is$3 = function (value) {
	if (typeof value !== "function") return false;

	if (!hasOwnProperty.call(value, "length")) return false;

	try {
		if (typeof value.length !== "number") return false;
		if (typeof value.call !== "function") return false;
		if (typeof value.apply !== "function") return false;
	} catch (error) {
		return false;
	}

	return !is$2(value);
};

var classRe = /^\s*class[\s{/}]/, functionToString = Function.prototype.toString;

var is$4 = function (value) {
	if (!is$3(value)) return false;
	if (classRe.test(functionToString.call(value))) return false;
	return true;
};

var isImplemented$2 = function () {
	var assign = Object.assign, obj;
	if (typeof assign !== "function") return false;
	obj = { foo: "raz" };
	assign(obj, { bar: "dwa" }, { trzy: "trzy" });
	return obj.foo + obj.bar + obj.trzy === "razdwatrzy";
};

var isImplemented$3 = function () {
	try {
		Object.keys("primitive");
		return true;
	} catch (e) {
		return false;
	}
};

// eslint-disable-next-line no-empty-function
var noop = function () {};

var _undefined$1 = noop(); // Support ES3 engines

var isValue = function (val) { return val !== _undefined$1 && val !== null; };

var keys = Object.keys;

var shim = function (object) { return keys(isValue(object) ? Object(object) : object); };

var keys$1 = isImplemented$3() ? Object.keys : shim;

var validValue = function (value) {
	if (!isValue(value)) throw new TypeError("Cannot use null or undefined");
	return value;
};

var max   = Math.max;

var shim$1 = function (dest, src/*, …srcn*/) {
	var error, i, length = max(arguments.length, 2), assign;
	dest = Object(validValue(dest));
	assign = function (key) {
		try {
			dest[key] = src[key];
		} catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < length; ++i) {
		src = arguments[i];
		keys$1(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

var assign = isImplemented$2() ? Object.assign : shim$1;

var forEach = Array.prototype.forEach, create = Object.create;

var process = function (src, obj) {
	var key;
	for (key in src) obj[key] = src[key];
};

// eslint-disable-next-line no-unused-vars
var normalizeOptions = function (opts1/*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (!isValue(options)) return;
		process(Object(options), result);
	});
	return result;
};

var str = "razdwatrzy";

var isImplemented$4 = function () {
	if (typeof str.contains !== "function") return false;
	return str.contains("dwa") === true && str.contains("foo") === false;
};

var indexOf = String.prototype.indexOf;

var shim$2 = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

var contains = isImplemented$4() ? String.prototype.contains : shim$2;

var _d_1_0_1_d = createCommonjsModule(function (module) {



var d = (module.exports = function (dscr, value/*, options*/) {
	var c, e, w, options, desc;
	if (arguments.length < 2 || typeof dscr !== "string") {
		options = value;
		value = dscr;
		dscr = null;
	} else {
		options = arguments[2];
	}
	if (is(dscr)) {
		c = contains.call(dscr, "c");
		e = contains.call(dscr, "e");
		w = contains.call(dscr, "w");
	} else {
		c = w = true;
		e = false;
	}

	desc = { value: value, configurable: c, enumerable: e, writable: w };
	return !options ? desc : assign(normalizeOptions(options), desc);
});

d.gs = function (dscr, get, set/*, options*/) {
	var c, e, options, desc;
	if (typeof dscr !== "string") {
		options = set;
		set = get;
		get = dscr;
		dscr = null;
	} else {
		options = arguments[3];
	}
	if (!is(get)) {
		get = undefined;
	} else if (!is$4(get)) {
		options = get;
		get = set = undefined;
	} else if (!is(set)) {
		set = undefined;
	} else if (!is$4(set)) {
		options = set;
		set = undefined;
	}
	if (is(dscr)) {
		c = contains.call(dscr, "c");
		e = contains.call(dscr, "e");
	} else {
		c = true;
		e = false;
	}

	desc = { get: get, set: set, configurable: c, enumerable: e };
	return !options ? desc : assign(normalizeOptions(options), desc);
};
});

var isSymbol = function (value) {
	if (!value) return false;
	if (typeof value === "symbol") return true;
	if (!value.constructor) return false;
	if (value.constructor.name !== "Symbol") return false;
	return value[value.constructor.toStringTag] === "Symbol";
};

var validateSymbol = function (value) {
	if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
	return value;
};

var create$1 = Object.create, defineProperty = Object.defineProperty, objPrototype = Object.prototype;

var created = create$1(null);
var generateName = function (desc) {
	var postfix = 0, name, ie11BugWorkaround;
	while (created[desc + (postfix || "")]) ++postfix;
	desc += postfix || "";
	created[desc] = true;
	name = "@@" + desc;
	defineProperty(
		objPrototype,
		name,
		_d_1_0_1_d.gs(null, function (value) {
			// For IE11 issue see:
			// https://connect.microsoft.com/IE/feedbackdetail/view/1928508/
			//    ie11-broken-getters-on-dom-objects
			// https://github.com/medikoo/es6-symbol/issues/12
			if (ie11BugWorkaround) return;
			ie11BugWorkaround = true;
			defineProperty(this, name, _d_1_0_1_d(value));
			ie11BugWorkaround = false;
		})
	);
	return name;
};

var NativeSymbol = globalThis_1.Symbol;

var standardSymbols = function (SymbolPolyfill) {
	return Object.defineProperties(SymbolPolyfill, {
		// To ensure proper interoperability with other native functions (e.g. Array.from)
		// fallback to eventual native implementation of given symbol
		hasInstance: _d_1_0_1_d(
			"", (NativeSymbol && NativeSymbol.hasInstance) || SymbolPolyfill("hasInstance")
		),
		isConcatSpreadable: _d_1_0_1_d(
			"",
			(NativeSymbol && NativeSymbol.isConcatSpreadable) ||
				SymbolPolyfill("isConcatSpreadable")
		),
		iterator: _d_1_0_1_d("", (NativeSymbol && NativeSymbol.iterator) || SymbolPolyfill("iterator")),
		match: _d_1_0_1_d("", (NativeSymbol && NativeSymbol.match) || SymbolPolyfill("match")),
		replace: _d_1_0_1_d("", (NativeSymbol && NativeSymbol.replace) || SymbolPolyfill("replace")),
		search: _d_1_0_1_d("", (NativeSymbol && NativeSymbol.search) || SymbolPolyfill("search")),
		species: _d_1_0_1_d("", (NativeSymbol && NativeSymbol.species) || SymbolPolyfill("species")),
		split: _d_1_0_1_d("", (NativeSymbol && NativeSymbol.split) || SymbolPolyfill("split")),
		toPrimitive: _d_1_0_1_d(
			"", (NativeSymbol && NativeSymbol.toPrimitive) || SymbolPolyfill("toPrimitive")
		),
		toStringTag: _d_1_0_1_d(
			"", (NativeSymbol && NativeSymbol.toStringTag) || SymbolPolyfill("toStringTag")
		),
		unscopables: _d_1_0_1_d(
			"", (NativeSymbol && NativeSymbol.unscopables) || SymbolPolyfill("unscopables")
		)
	});
};

var registry = Object.create(null);

var symbolRegistry = function (SymbolPolyfill) {
	return Object.defineProperties(SymbolPolyfill, {
		for: _d_1_0_1_d(function (key) {
			if (registry[key]) return registry[key];
			return (registry[key] = SymbolPolyfill(String(key)));
		}),
		keyFor: _d_1_0_1_d(function (symbol) {
			var key;
			validateSymbol(symbol);
			for (key in registry) {
				if (registry[key] === symbol) return key;
			}
			return undefined;
		})
	});
};

var NativeSymbol$1         = globalThis_1.Symbol;

var create$2 = Object.create
  , defineProperties = Object.defineProperties
  , defineProperty$1 = Object.defineProperty;

var SymbolPolyfill, HiddenSymbol, isNativeSafe;

if (typeof NativeSymbol$1 === "function") {
	try {
		String(NativeSymbol$1());
		isNativeSafe = true;
	} catch (ignore) {}
} else {
	NativeSymbol$1 = null;
}

// Internal constructor (not one exposed) for creating Symbol instances.
// This one is used to ensure that `someSymbol instanceof Symbol` always return false
HiddenSymbol = function Symbol(description) {
	if (this instanceof HiddenSymbol) throw new TypeError("Symbol is not a constructor");
	return SymbolPolyfill(description);
};

// Exposed `Symbol` constructor
// (returns instances of HiddenSymbol)
var polyfill = SymbolPolyfill = function Symbol(description) {
	var symbol;
	if (this instanceof Symbol) throw new TypeError("Symbol is not a constructor");
	if (isNativeSafe) return NativeSymbol$1(description);
	symbol = create$2(HiddenSymbol.prototype);
	description = description === undefined ? "" : String(description);
	return defineProperties(symbol, {
		__description__: _d_1_0_1_d("", description),
		__name__: _d_1_0_1_d("", generateName(description))
	});
};

standardSymbols(SymbolPolyfill);
symbolRegistry(SymbolPolyfill);

// Internal tweaks for real symbol producer
defineProperties(HiddenSymbol.prototype, {
	constructor: _d_1_0_1_d(SymbolPolyfill),
	toString: _d_1_0_1_d("", function () { return this.__name__; })
});

// Proper implementation of methods exposed on Symbol.prototype
// They won't be accessible on produced symbol instances as they derive from HiddenSymbol.prototype
defineProperties(SymbolPolyfill.prototype, {
	toString: _d_1_0_1_d(function () { return "Symbol (" + validateSymbol(this).__description__ + ")"; }),
	valueOf: _d_1_0_1_d(function () { return validateSymbol(this); })
});
defineProperty$1(
	SymbolPolyfill.prototype,
	SymbolPolyfill.toPrimitive,
	_d_1_0_1_d("", function () {
		var symbol = validateSymbol(this);
		if (typeof symbol === "symbol") return symbol;
		return symbol.toString();
	})
);
defineProperty$1(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, _d_1_0_1_d("c", "Symbol"));

// Proper implementaton of toPrimitive and toStringTag for returned symbol instances
defineProperty$1(
	HiddenSymbol.prototype, SymbolPolyfill.toStringTag,
	_d_1_0_1_d("c", SymbolPolyfill.prototype[SymbolPolyfill.toStringTag])
);

// Note: It's important to define `toPrimitive` as last one, as some implementations
// implement `toPrimitive` natively without implementing `toStringTag` (or other specified symbols)
// And that may invoke error in definition flow:
// See: https://github.com/medikoo/es6-symbol/issues/13#issuecomment-164146149
defineProperty$1(
	HiddenSymbol.prototype, SymbolPolyfill.toPrimitive,
	_d_1_0_1_d("c", SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive])
);

var _es6Symbol_3_1_3_es6Symbol = isImplemented$1()
	? globalThis_1.Symbol
	: polyfill;

// A linked list to keep track of recently-used-ness



var MAX = _es6Symbol_3_1_3_es6Symbol('max');
var LENGTH = _es6Symbol_3_1_3_es6Symbol('length');
var LENGTH_CALCULATOR = _es6Symbol_3_1_3_es6Symbol('lengthCalculator');
var ALLOW_STALE = _es6Symbol_3_1_3_es6Symbol('allowStale');
var MAX_AGE = _es6Symbol_3_1_3_es6Symbol('maxAge');
var DISPOSE = _es6Symbol_3_1_3_es6Symbol('dispose');
var NO_DISPOSE_ON_SET = _es6Symbol_3_1_3_es6Symbol('noDisposeOnSet');
var LRU_LIST = _es6Symbol_3_1_3_es6Symbol('lruList');
var CACHE = _es6Symbol_3_1_3_es6Symbol('cache');
var UPDATE_AGE_ON_GET = _es6Symbol_3_1_3_es6Symbol('updateAgeOnGet');

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
