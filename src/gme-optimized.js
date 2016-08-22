// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 22984;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } },{ func: function() { __GLOBAL__I_a() } },{ func: function() { __GLOBAL__I_a287() } },{ func: function() { __GLOBAL__I_a524() } });
var __ZTVN10__cxxabiv120__si_class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,120,71,0,0,174,0,0,0,138,0,0,0,186,0,0,0,78,0,0,0,18,0,0,0,6,0,0,0,4,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,136,71,0,0,174,0,0,0,248,0,0,0,186,0,0,0,78,0,0,0,18,0,0,0,2,0,0,0,16,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZN11Blip_BufferC1Ev;
var __ZN11Blip_BufferD1Ev;
var __ZN11Blip_Synth_C1EPsi;
var __ZN11Classic_EmuD1Ev;
var __ZN13Subset_ReaderC1EP11Data_Readerl;
var __ZN16Remaining_ReaderC1EPKvlP11Data_Reader;
var __ZN15Mem_File_ReaderC1EPKvl;
var __ZN14Dual_ResamplerD1Ev;
var __ZN14Effects_Buffer8config_tC1Ev;
var __ZN14Effects_BufferC1Eb;
var __ZN14Effects_BufferD1Ev;
var __ZN8Gme_FileD1Ev;
var __ZN13Stereo_BufferC1Ev;
var __ZN13Stereo_BufferD1Ev;
var __ZN9Music_EmuD1Ev;
var __ZN6Ay_ApuC1Ev;
var __ZN10Ym2612_EmuD1Ev;
var __ZN7Sms_ApuC1Ev;
var __ZN7Sms_ApuD1Ev;
var __ZN6Ay_EmuC1Ev;
var __ZN6Ay_EmuD1Ev;
var __ZN6Gb_ApuC1Ev;
var __ZN7Gbs_EmuC1Ev;
var __ZN7Gbs_EmuD1Ev;
var __ZN7Gym_EmuC1Ev;
var __ZN7Gym_EmuD1Ev;
var __ZN7Hes_ApuC1Ev;
var __ZN7Hes_EmuC1Ev;
var __ZN7Hes_EmuD1Ev;
var __ZN7Kss_EmuC1Ev;
var __ZN7Kss_EmuD1Ev;
var __ZN7Nes_ApuC1Ev;
var __ZN13Nes_Namco_ApuC1Ev;
var __ZN12Nes_Vrc6_ApuC1Ev;
var __ZN7Nsf_EmuC1Ev;
var __ZN7Nsf_EmuD1Ev;
var __ZN9Nsfe_InfoC1Ev;
var __ZN9Nsfe_InfoD1Ev;
var __ZN8Nsfe_EmuC1Ev;
var __ZN8Nsfe_EmuD1Ev;
var __ZN12Sap_Apu_ImplC1Ev;
var __ZN7Sap_ApuC1Ev;
var __ZN7Sap_EmuC1Ev;
var __ZN7Sap_EmuD1Ev;
var __ZN7Spc_EmuC1Ev;
var __ZN7Spc_EmuD1Ev;
var __ZN10SPC_FilterC1Ev;
var __ZN7Vgm_EmuC1Ev;
var __ZN7Vgm_EmuD1Ev;
/* memory initializer */ allocate([160,6,0,0,0,0,0,0,232,80,0,0,0,0,0,0,0,81,0,0,0,0,0,0,24,81,0,0,0,0,0,0,48,81,0,0,0,0,0,0,192,80,0,0,0,0,0,0,72,81,0,0,0,0,0,0,96,81,0,0,0,0,0,0,120,81,0,0,0,0,0,0,144,81,0,0,0,0,0,0,168,81,0,0,0,0,0,0,128,82,0,0,0,0,0,0,110,32,60,61,32,115,105,122,101,95,0,0,0,0,0,0,83,113,117,97,114,101,32,50,0,0,0,0,0,0,0,0,86,71,77,0,0,0,0,0,69,109,117,108,97,116,105,111,110,32,101,114,114,111,114,32,40,105,108,108,101,103,97,108,32,105,110,115,116,114,117,99,116,105,111,110,41,0,0,0,87,97,118,101,32,50,0,0,40,117,110,115,105,103,110,101,100,41,32,111,115,99,32,60,32,111,115,99,95,99,111,117,110,116,0,0,0,0,0,0,70,77,32,115,111,117,110,100,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,65,121,95,65,112,117,46,104,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,77,117,115,105,99,95,69,109,117,46,99,112,112,0,0,0,0,99,111,117,110,116,32,60,61,32,115,97,109,112,108,101,115,95,97,118,97,105,108,40,41,0,0,0,0,0,0,0,0,83,113,117,97,114,101,32,49,0,0,0,0,0,0,0,0,83,80,67,0,0,0,0,0,109,46,115,112,99,95,116,105,109,101,32,60,61,32,101,110,100,95,116,105,109,101,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,83,112,99,95,68,115,112,46,104,0,0,0,0,0,0,0,0,73,110,118,97,108,105,100,32,102,105,108,101,32,100,97,116,97,32,98,108,111,99,107,0,87,97,118,101,32,49,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,78,101,115,95,86,114,99,54,95,65,112,117,46,104,0,0,0,85,110,107,110,111,119,110,32,100,97,116,97,32,105,110,32,104,101,97,100,101,114,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,70,105,114,95,82,101,115,97,109,112,108,101,114,46,104,0,0,68,97,116,97,32,104,101,97,100,101,114,32,109,105,115,115,105,110,103,0,0,0,0,0,69,109,117,108,97,116,105,111,110,32,101,114,114,111,114,32,40,105,108,108,101,103,97,108,47,117,110,115,117,112,112,111,114,116,101,100,32,105,110,115,116,114,117,99,116,105,111,110,41,0,0,0,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,105,32,60,32,111,115,99,95,99,111,117,110,116,0,0,0,0,0,0,0,0,33,115,97,109,112,108,101,95,114,97,116,101,40,41,0,0,115,97,109,112,108,101,115,95,97,118,97,105,108,40,41,32,60,61,32,40,108,111,110,103,41,32,98,117,102,102,101,114,95,115,105,122,101,95,0,0,73,110,118,97,108,105,100,32,116,114,97,99,107,32,105,110,32,109,51,117,32,112,108,97,121,108,105,115,116,0,0,0,80,83,71,0,0,0,0,0,68,83,80,32,56,0,0,0,48,0,0,0,0,0,0,0,83,65,80,0,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,97,100,100,114,32,60,32,114,101,103,105,115,116,101,114,95,99,111,117,110,116,0,0,0,0,0,0,0,0,87,97,118,101,32,56,0,0,78,105,110,116,101,110,100,111,32,78,69,83,0,0,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,40,117,110,115,105,103,110,101,100,41,32,105,32,60,32,111,115,99,95,99,111,117,110,116,0,0,0,0,0,0,0,0,87,97,118,101,32,53,0,0,68,65,84,65,0,0,0,0,119,114,105,116,101,95,112,111,115,32,60,61,32,98,117,102,46,101,110,100,40,41,0,0,80,83,71,0,0,0,0,0,73,110,118,97,108,105,100,32,108,111,97,100,47,105,110,105,116,47,112,108,97,121,32,97,100,100,114,101,115,115,0,0,40,117,110,115,105,103,110,101,100,41,32,105,110,100,101,120,32,60,32,114,101,103,105,115,116,101,114,95,99,111,117,110,116,0,0,0,0,0,0,0,77,105,115,115,105,110,103,32,102,105,108,101,32,100,97,116,97,0,0,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,66,108,105,112,95,66,117,102,102,101,114,46,104,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,67,108,97,115,115,105,99,95,69,109,117,46,104,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,66,108,105,112,95,66,117,102,102,101,114,46,104,0,0,0,0,86,111,105,99,101,32,56,0,83,116,114,101,97,109,32,108,97,99,107,101,100,32,101,110,100,32,101,118,101,110,116,0,102,97,99,116,111,114,32,62,32,48,32,124,124,32,33,115,97,109,112,108,101,95,114,97,116,101,95,0,0,0,0,0,70,77,32,49,0,0,0,0,73,110,118,97,108,105,100,32,116,114,97,99,107,0,0,0,80,67,77,0,0,0,0,0,40,99,111,117,110,116,32,38,32,49,41,32,61,61,32,48,0,0,0,0,0,0,0,0,68,83,80,32,55,0,0,0,83,80,67,32,101,109,117,108,97,116,105,111,110,32,101,114,114,111,114,0,0,0,0,0,40,99,111,117,110,116,32,38,32,49,41,32,61,61,32,48,0,0,0,0,0,0,0,0,78,83,70,69,0,0,0,0,87,97,118,101,32,55,0,0,87,114,111,110,103,32,102,105,108,101,32,116,121,112,101,32,102,111,114,32,116,104,105,115,32,101,109,117,108,97,116,111,114,0,0,0,0,0,0,0,68,77,67,0,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,100,97,116,97,32,60,61,32,48,120,70,70,0,68,83,80,32,49,0,0,0,87,97,118,101,32,52,0,0,85,110,107,110,111,119,110,32,102,105,108,101,32,118,101,114,115,105,111,110,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,98,108,97,114,103,103,95,99,111,109,109,111,110,46,104,0,0,80,67,77,0,0,0,0,0,73,110,118,97,108,105,100,32,116,105,109,101,114,32,109,111,100,101,0,0,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,100,97,116,97,32,60,32,48,120,49,48,48,0,66,97,100,32,100,97,116,97,32,98,108,111,99,107,32,115,105,122,101,0,0,0,0,0,40,98,108,105,112,95,108,111,110,103,41,32,40,116,105,109,101,32,62,62,32,66,76,73,80,95,66,85,70,70,69,82,95,65,67,67,85,82,65,67,89,41,32,60,32,98,108,105,112,95,98,117,102,45,62,98,117,102,102,101,114,95,115,105,122,101,95,0,0,0,0,0,40,115,105,122,101,32,38,32,49,41,32,61,61,32,48,0,40,98,108,105,112,95,108,111,110,103,41,32,40,116,105,109,101,32,62,62,32,66,76,73,80,95,66,85,70,70,69,82,95,65,67,67,85,82,65,67,89,41,32,60,32,98,108,105,112,95,98,117,102,45,62,98,117,102,102,101,114,95,115,105,122,101,95,0,0,0,0,0,33,98,117,102,32,38,38,32,110,101,119,95,98,117,102,0,86,111,105,99,101,32,55,0,82,65,77,32,91,105,32,43,32,114,111,109,95,97,100,100,114,93,32,61,61,32,40,117,105,110,116,56,95,116,41,32,100,97,116,97,0,0,0,0,108,101,110,103,116,104,95,32,61,61,32,109,115,101,99,0,78,111,116,32,97,110,32,83,80,67,32,102,105,108,101,0,60,32,63,32,62,0,0,0,70,77,32,54,0,0,0,0,68,83,80,32,54,0,0,0,109,46,114,97,109,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,83,112,99,95,67,112,117,46,104,0,0,0,0,0,0,0,0,111,117,116,32,60,61,32,38,109,46,101,120,116,114,97,95,98,117,102,32,91,101,120,116,114,97,95,115,105,122,101,93,0,0,0,0,0,0,0,0,78,83,70,0,0,0,0,0,87,97,118,101,32,54,0,0,78,111,105,115,101,0,0,0,87,97,118,101,32,49,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,78,101,115,95,78,97,109,99,111,95,65,112,117,46,104,0,0,40,117,110,115,105,103,110,101,100,41,32,111,112,99,111,100,101,32,60,61,32,48,120,70,70,0,0,0,0,0,0,0,97,100,100,114,32,62,32,48,120,50,48,0,0,0,0,0,87,97,118,101,32,51,0,0,77,117,108,116,105,32,50,0,110,32,60,61,32,115,105,122,101,95,0,0,0,0,0,0,65,89,0,0,0,0,0,0,70,77,32,54,0,0,0,0,85,110,107,110,111,119,110,32,102,105,108,101,32,118,101,114,115,105,111,110,0,0,0,0,78,83,70,69,0,0,0,0,108,97,115,116,95,116,105,109,101,32,62,61,32,101,110,100,95,116,105,109,101,0,0,0,70,105,108,101,32,100,97,116,97,32,109,105,115,115,105,110,103,0,0,0,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,100,97,116,97,32,60,61,32,48,120,70,70,0,101,110,118,46,112,111,115,32,60,32,48,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,98,108,97,114,103,103,95,99,111,109,109,111,110,46,104,0,0,86,111,105,99,101,32,54,0,98,117,102,102,101,114,95,115,105,122,101,95,32,33,61,32,115,105,108,101,110,116,95,98,117,102,95,115,105,122,101,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,85,115,101,115,32,117,110,115,117,112,112,111,114,116,101,100,32,97,117,100,105,111,32,101,120,112,97,110,115,105,111,110,32,104,97,114,100,119,97,114,101,0,0,0,0,0,0,0,116,105,109,101,32,62,61,32,108,97,115,116,95,116,105,109,101,0,0,0,0,0,0,0,60,63,62,0,0,0,0,0,101,110,97,98,108,101,100,40,41,0,0,0,0,0,0,0,70,77,32,53,0,0,0,0,68,83,80,32,53,0,0,0,105,32,61,61,32,45,48,120,56,48,48,48,0,0,0,0,114,101,108,95,116,105,109,101,32,60,61,32,48,0,0,0,111,117,116,32,60,61,32,111,117,116,95,101,110,100,0,0,75,83,83,0,0,0,0,0,87,97,118,101,32,53,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,84,114,105,97,110,103,108,101,0,0,0,0,0,0,0,0,112,114,103,95,114,101,97,100,101,114,0,0,0,0,0,0,108,97,115,116,95,116,105,109,101,32,62,61,32,116,105,109,101,0,0,0,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,105,32,60,32,111,115,99,95,99,111,117,110,116,0,0,0,0,0,0,0,0,115,116,97,114,116,32,43,32,115,105,122,101,32,60,61,32,48,120,49,48,48,48,48,0,108,97,115,116,95,116,105,109,101,32,62,61,32,116,105,109,101,0,0,0,0,0,0,0,108,97,115,116,95,100,109,99,95,116,105,109,101,32,62,61,32,48,0,0,0,0,0,0,87,97,118,101,32,50,0,0,101,110,100,95,116,105,109,101,32,62,61,32,108,97,115,116,95,116,105,109,101,0,0,0,77,117,108,116,105,32,49,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,70,77,32,53,0,0,0,0,78,111,105,115,101,0,0,0,73,110,118,97,108,105,100,32,98,97,110,107,0,0,0,0,110,101,120,116,95,102,114,97,109,101,95,116,105,109,101,32,62,61,32,101,110,100,95,116,105,109,101,0,0,0,0,0,85,110,107,110,111,119,110,32,102,105,108,101,32,118,101,114,115,105,111,110,0,0,0,0,108,97,115,116,95,116,105,109,101,32,62,61,32,101,110,100,95,116,105,109,101,0,0,0,40,117,110,115,105,103,110,101,100,41,32,100,97,116,97,32,60,61,32,48,120,70,70,0,101,110,118,46,100,101,108,97,121,32,62,32,48,0,0,0,110,32,60,61,32,115,105,122,101,95,0,0,0,0,0,0,86,111,105,99,101,32,53,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,70,97,109,105,99,111,109,0,83,113,117,97,114,101,32,49,0,0,0,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,86,103,109,95,69,109,117,95,73,109,112,108,46,99,112,112,0,63,0,0,0,0,0,0,0,78,83,70,0,0,0,0,0,70,77,32,52,0,0,0,0,68,83,80,32,52,0,0,0,97,100,100,114,32,37,32,112,97,103,101,95,115,105,122,101,32,61,61,32,48,0,0,0,105,32,61,61,32,43,48,120,55,70,70,70,0,0,0,0,45,99,112,117,95,108,97,103,95,109,97,120,32,60,61,32,109,46,115,112,99,95,116,105,109,101,32,38,38,32,109,46,115,112,99,95,116,105,109,101,32,60,61,32,48,0,0,0,78,105,110,116,101,110,100,111,32,78,69,83,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,83,110,101,115,95,83,112,99,46,99,112,112,0,0,0,0,0,72,69,83,0,0,0,0,0,87,97,118,101,32,52,0,0,78,69,83,77,26,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,83,97,112,95,65,112,117,46,104,0,0,0,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,98,108,97,114,103,103,95,99,111,109,109,111,110,46,104,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,116,111,116,97,108,95,115,97,109,112,108,101,115,32,37,32,50,32,61,61,32,48,0,0,83,113,117,97,114,101,32,50,0,0,0,0,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,114,101,103,32,60,32,114,101,103,95,99,111,117,110,116,0,0,0,0,0,0,83,65,80,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,66,108,105,112,95,66,117,102,102,101,114,46,104,0,0,0,0,115,105,122,101,32,37,32,112,97,103,101,95,115,105,122,101,32,61,61,32,48,0,0,0,108,97,115,116,95,116,105,109,101,32,62,61,32,48,0,0,87,97,118,101,32,49,0,0,102,97,108,115,101,0,0,0,65,116,97,114,105,32,88,76,0,0,0,0,0,0,0,0,87,97,118,101,32,52,0,0,40,117,110,115,105,103,110,101,100,41,32,111,112,99,111,100,101,32,60,61,32,48,120,70,70,0,0,0,0,0,0,0,111,115,99,45,62,108,97,115,116,95,116,105,109,101,32,62,61,32,101,110,100,95,116,105,109,101,0,0,0,0,0,0,87,97,118,101,32,49,0,0,70,77,32,52,0,0,0,0,99,111,117,110,116,32,61,61,32,40,108,111,110,103,41,32,115,97,109,112,108,101,95,98,117,102,95,115,105,122,101,0,87,97,118,101,0,0,0,0,82,79,77,32,100,97,116,97,32,109,105,115,115,105,110,103,0,0,0,0,0,0,0,0,102,97,108,115,101,0,0,0,101,110,100,95,116,105,109,101,32,62,61,32,108,97,115,116,95,116,105,109,101,0,0,0,66,101,101,112,101,114,0,0,101,110,100,95,116,105,109,101,32,62,61,32,108,97,115,116,95,116,105,109,101,0,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,40,117,110,115,105,103,110,101,100,41,32,114,101,103,32,60,61,32,112,97,103,101,95,99,111,117,110,116,0,0,0,0,45,114,101,109,97,105,110,32,60,61,32,101,110,118,95,112,101,114,105,111,100,0,0,0,68,65,84,69,0,0,0,0,99,108,111,99,107,115,95,101,109,117,108,97,116,101,100,0,86,111,105,99,101,32,52,0,40,117,110,115,105,103,110,101,100,41,32,105,110,100,101,120,32,60,32,111,115,99,95,99,111,117,110,116,0,0,0,0,78,65,77,69,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,105,32,60,32,111,115,99,95,99,111,117,110,116,0,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,65,85,84,72,79,82,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,78,101,115,95,70,109,101,55,95,65,112,117,46,104,0,0,0,70,77,32,49,0,0,0,0,71,97,109,101,32,71,101,97,114,0,0,0,0,0,0,0,73,110,118,97,108,105,100,32,102,97,115,116,112,108,97,121,32,118,97,108,117,101,0,0,108,97,115,116,95,116,105,109,101,32,62,61,32,116,105,109,101,0,0,0,0,0,0,0,83,101,103,97,32,77,97,115,116,101,114,32,83,121,115,116,101,109,0,0,0,0,0,0,70,65,83,84,80,76,65,89,0,0,0,0,0,0,0,0,116,111,95,102,109,95,116,105,109,101,40,32,118,103,109,95,116,105,109,101,32,41,32,60,61,32,109,105,110,95,112,97,105,114,115,0,0,0,0,0,75,83,83,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,71,109,101,95,70,105,108,101,46,99,112,112,0,0,0,0,0,70,77,32,51,0,0,0,0,83,84,69,82,69,79,0,0,68,83,80,32,51,0,0,0,77,83,88,0,0,0,0,0,83,113,117,97,114,101,32,49,0,0,0,0,0,0,0,0,98,114,114,95,111,102,102,115,101,116,32,61,61,32,98,114,114,95,98,108,111,99,107,95,115,105,122,101,0,0,0,0,114,101,103,32,43,32,40,114,95,116,48,111,117,116,32,43,32,48,120,70,48,32,45,32,48,120,49,48,48,48,48,41,32,60,32,48,120,49,48,48,0,0,0,0,0,0,0,0,110,101,119,95,99,111,117,110,116,32,60,32,114,101,115,97,109,112,108,101,114,95,115,105,122,101,0,0,0,0,0,0,40,115,105,122,101,32,38,32,49,41,32,61,61,32,48,0,85,110,115,117,112,112,111,114,116,101,100,32,112,108,97,121,101,114,32,116,121,112,101,0,87,97,118,101,32,51,0,0,69,109,117,108,97,116,105,111,110,32,101,114,114,111,114,32,40,105,108,108,101,103,97,108,32,105,110,115,116,114,117,99,116,105,111,110,41,0,0,0,71,89,77,0,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,105,32,60,32,111,115,99,95,99,111,117,110,116,0,0,0,0,0,0,0,0,75,83,83,88,0,0,0,0,110,32,60,61,32,115,105,122,101,95,0,0,0,0,0,0,83,113,117,97,114,101,32,49,0,0,0,0,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,111,115,99,95,105,110,100,101,120,32,60,32,111,115,99,95,99,111,117,110,116,0,0,0,0,0,0,0,0,68,105,103,105,109,117,115,105,99,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,67,111,114,114,117,112,116,32,102,105,108,101,32,40,105,110,118,97,108,105,100,32,108,111,97,100,47,105,110,105,116,47,112,108,97,121,32,97,100,100,114,101,115,115,41,0,0,0,40,98,108,105,112,95,108,111,110,103,41,32,40,116,105,109,101,32,62,62,32,66,76,73,80,95,66,85,70,70,69,82,95,65,67,67,85,82,65,67,89,41,32,60,32,98,108,105,112,95,98,117,102,45,62,98,117,102,102,101,114,95,115,105,122,101,95,0,0,0,0,0,75,83,67,67,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,78,101,115,95,67,112,117,46,99,112,112,0,0,0,0,0,0,101,110,100,95,116,105,109,101,32,62,61,32,108,97,115,116,95,116,105,109,101,0,0,0,72,69,83,0,0,0,0,0,83,113,117,97,114,101,32,51,0,0,0,0,0,0,0,0,115,105,122,101,32,37,32,112,97,103,101,95,115,105,122,101,32,61,61,32,48,0,0,0,84,89,80,69,0,0,0,0,85,110,107,110,111,119,110,32,102,105,108,101,32,118,101,114,115,105,111,110,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,105,110,100,101,120,32,60,32,111,115,99,95,99,111,117,110,116,0,0,0,0,87,97,118,101,32,51,0,0,115,116,97,114,116,32,37,32,112,97,103,101,95,115,105,122,101,32,61,61,32,48,0,0,40,117,110,115,105,103,110,101,100,41,32,98,97,110,107,32,60,32,48,120,49,48,48,0,110,111,105,115,101,95,108,102,115,114,0,0,0,0,0,0,80,67,32,69,110,103,105,110,101,0,0,0,0,0,0,0,70,77,32,51,0,0,0,0,98,108,105,112,95,98,117,102,46,115,97,109,112,108,101,115,95,97,118,97,105,108,40,41,32,61,61,32,112,97,105,114,95,99,111,117,110,116,0,0,83,113,117,97,114,101,32,50,0,0,0,0,0,0,0,0,73,110,118,97,108,105,100,32,116,114,97,99,107,32,99,111,117,110,116,0,0,0,0,0,83,113,117,97,114,101,32,53,0,0,0,0,0,0,0,0,115,105,122,101,32,37,32,112,97,103,101,95,115,105,122,101,32,61,61,32,48,0,0,0,40,99,101,110,116,101,114,32,38,38,32,108,101,102,116,32,38,38,32,114,105,103,104,116,41,32,124,124,32,40,33,99,101,110,116,101,114,32,38,38,32,33,108,101,102,116,32,38,38,32,33,114,105,103,104,116,41,0,0,0,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,105,110,100,101,120,32,60,32,111,115,99,95,99,111,117,110,116,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,68,97,116,97,95,82,101,97,100,101,114,46,99,112,112,0,0,72,69,83,77,0,0,0,0,87,97,118,101,32,51,0,0,40,99,101,110,116,101,114,32,38,38,32,108,101,102,116,32,38,38,32,114,105,103,104,116,41,32,124,124,32,40,33,99,101,110,116,101,114,32,38,38,32,33,108,101,102,116,32,38,38,32,33,114,105,103,104,116,41,0,0,0,0,0,0,0,99,108,111,99,107,95,114,97,116,101,32,62,32,115,97,109,112,108,101,95,114,97,116,101,0,0,0,0,0,0,0,0,102,105,110,97,108,95,101,110,100,95,116,105,109,101,32,62,61,32,108,97,115,116,95,116,105,109,101,0,0,0,0,0,83,79,78,71,83,0,0,0,40,117,110,115,105,103,110,101,100,41,32,97,100,100,114,32,60,32,114,101,103,95,99,111,117,110,116,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,67,108,97,115,115,105,99,95,69,109,117,46,99,112,112,0,0,86,111,105,99,101,32,51,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,72,101,115,95,67,112,117,46,104,0,0,0,0,0,0,0,0,71,100,51,32,0,0,0,0,73,110,118,97,108,105,100,32,109,117,115,105,99,32,97,100,100,114,101,115,115,0,0,0,115,116,97,116,101,32,61,61,32,38,115,116,97,116,101,95,0,0,0,0,0,0,0,0,65,89,0,0,0,0,0,0,40,115,104,111,114,116,41,32,105,32,61,61,32,45,48,120,56,48,48,48,0,0,0,0,86,71,77,0,0,0,0,0,87,97,118,101,32,49,0,0,77,85,83,73,67,0,0,0,83,113,117,97,114,101,32,52,0,0,0,0,0,0,0,0,72,101,97,100,101,114,32,97,100,100,101,100,32,98,121,32,89,77,65,77,80,0,0,0,90,88,32,83,112,101,99,116,114,117,109,0,0,0,0,0,102,97,108,115,101,0,0,0,82,101,97,100,32,101,114,114,111,114,0,0,0,0,0,0,86,71,90,0,0,0,0,0,73,110,118,97,108,105,100,32,112,108,97,121,32,97,100,100,114,101,115,115,0,0,0,0,83,113,117,97,114,101,32,51,0,0,0,0,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,105,110,100,101,120,32,60,32,111,115,99,95,99,111,117,110,116,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,75,115,115,95,83,99,99,95,65,112,117,46,104,0,0,0,0,85,110,107,110,111,119,110,32,80,101,114,115,111,110,0,0,77,105,115,115,105,110,103,32,116,114,97,99,107,32,100,97,116,97,0,0,0,0,0,0,115,97,109,112,108,101,95,114,97,116,101,0,0,0,0,0,83,101,103,97,32,83,77,83,47,71,101,110,101,115,105,115,0,0,0,0,0,0,0,0,80,76,65,89,69,82,0,0,83,97,119,32,87,97,118,101,0,0,0,0,0,0,0,0,108,97,115,116,95,116,105,109,101,32,62,61,32,48,0,0,69,109,117,108,97,116,105,111,110,32,101,114,114,111,114,32,40,105,108,108,101,103,97,108,32,105,110,115,116,114,117,99,116,105,111,110,41,0,0,0,85,110,107,110,111,119,110,32,80,117,98,108,105,115,104,101,114,0,0,0,0,0,0,0,90,88,65,89,69,77,85,76,0,0,0,0,0,0,0,0,85,110,107,110,111,119,110,32,115,116,114,101,97,109,32,101,118,101,110,116,0,0,0,0,40,117,110,115,105,103,110,101,100,41,32,97,100,100,114,32,60,32,114,101,103,95,99,111,117,110,116,0,0,0,0,0,100,97,116,97,32,33,61,32,102,105,108,101,95,100,97,116,97,46,98,101,103,105,110,40,41,0,0,0,0,0,0,0,70,77,32,50,0,0,0,0,86,103,109,32,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,83,112,99,95,70,105,108,116,101,114,46,99,112,112,0,0,0,120,105,100,54,0,0,0,0,73,110,118,97,108,105,100,32,105,110,105,116,32,97,100,100,114,101,115,115,0,0,0,0,68,83,80,32,50,0,0,0,83,99,97,110,108,105,110,101,32,105,110,116,101,114,114,117,112,116,32,117,110,115,117,112,112,111,114,116,101,100,0,0,85,110,107,110,111,119,110,32,71,97,109,101,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,77,117,115,105,99,95,69,109,117,46,104,0,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,83,112,99,95,68,115,112,46,99,112,112,0,0,0,0,0,0,85,115,101,32,102,117,108,108,32,101,109,117,108,97,116,111,114,32,102,111,114,32,112,108,97,121,98,97,99,107,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,83,112,99,95,67,112,117,46,99,112,112,0,0,0,0,0,0,67,111,114,114,117,112,116,32,83,80,67,32,102,105,108,101,0,0,0,0,0,0,0,0,73,78,73,84,0,0,0,0,87,97,118,101,32,56,0,0,87,97,118,101,32,50,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,83,97,112,95,67,112,117,46,99,112,112,0,0,0,0,0,0,71,66,83,0,0,0,0,0,77,105,115,115,105,110,103,32,102,105,108,101,32,100,97,116,97,0,0,0,0,0,0,0,85,110,107,110,111,119,110,32,83,111,110,103,0,0,0,0,33,115,97,109,112,108,101,95,114,97,116,101,40,41,0,0,67,111,114,114,117,112,116,32,102,105,108,101,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,65,121,95,69,109,117,46,99,112,112,0,0,0,0,0,0,0,101,109,117,95,116,105,109,101,32,62,61,32,111,117,116,95,116,105,109,101,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,78,101,115,95,86,114,99,54,95,65,112,117,46,99,112,112,0,83,80,67,0,0,0,0,0,83,65,80,13,10,0,0,0,87,97,118,101,32,55,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,78,101,115,95,79,115,99,115,46,99,112,112,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,78,101,115,95,78,97,109,99,111,95,65,112,117,46,99,112,112,0,0,0,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,78,101,115,95,70,109,101,55,95,65,112,117,46,99,112,112,0,69,120,116,114,97,32,102,105,108,101,32,100,97,116,97,0,71,89,77,0,0,0,0,0,71,97,109,101,32,66,111,121,0,0,0,0,0,0,0,0,115,116,97,114,116,32,37,32,112,97,103,101,95,115,105,122,101,32,61,61,32,48,0,0,40,117,110,115,105,103,110,101,100,32,108,111,110,103,41,32,112,111,115,32,60,61,32,40,117,110,115,105,103,110,101,100,32,108,111,110,103,41,32,102,105,108,101,95,115,105,122,101,32,45,32,50,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,78,101,115,95,65,112,117,46,99,112,112,0,0,0,0,0,0,111,117,116,95,99,111,117,110,116,32,37,32,115,116,101,114,101,111,32,61,61,32,48,0,83,113,117,97,114,101,32,50,0,0,0,0,0,0,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,83,117,112,101,114,32,78,105,110,116,101,110,100,111,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,75,115,115,95,67,112,117,46,99,112,112,0,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,69,102,102,101,99,116,115,95,66,117,102,102,101,114,46,99,112,112,0,0,0,0,0,0,0,87,97,118,101,32,54,0,0,77,117,108,116,105,112,108,101,32,68,65,84,65,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,0,87,97,118,101,32,50,0,0,83,101,103,97,32,71,101,110,101,115,105,115,0,0,0,0,71,66,83,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,65,121,95,65,112,117,46,104,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,72,101,115,95,67,112,117,46,99,112,112,0,0,0,0,0,0,33,98,117,102,95,114,101,109,97,105,110,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,72,101,115,95,65,112,117,46,99,112,112,0,0,0,0,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,70,77,32,50,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,98,108,97,114,103,103,95,101,110,100,105,97,110,46,104,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,68,117,97,108,95,82,101,115,97,109,112,108,101,114,46,99,112,112,0,0,0,0,0,0,0,89,77,50,52,49,51,32,70,77,32,115,111,117,110,100,32,105,115,110,39,116,32,115,117,112,112,111,114,116,101,100,0,83,78,69,83,45,83,80,67,55,48,48,32,83,111,117,110,100,32,70,105,108,101,32,68,97,116,97,0,0,0,0,0,87,97,118,101,32,53,0,0,66,97,110,107,32,100,97,116,97,32,109,105,115,115,105,110,103,0,0,0,0,0,0,0,73,110,118,97,108,105,100,32,115,105,122,101,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,71,98,95,67,112,117,46,99,112,112,0,0,0,0,0,0,0,80,97,99,107,101,100,32,71,89,77,32,102,105,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,71,98,95,65,112,117,46,99,112,112,0,0,0,0,0,0,0,108,97,115,116,95,116,105,109,101,32,62,61,32,116,105,109,101,0,0,0,0,0,0,0,99,117,114,114,101,110,116,95,116,114,97,99,107,40,41,32,62,61,32,48,0,0,0,0,110,32,62,61,32,48,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,103,109,101,46,99,112,112,0,0,87,97,118,101,32,50,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,65,121,95,67,112,117,46,99,112,112,0,0,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,83,109,115,95,65,112,117,46,99,112,112,0,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,89,109,50,54,49,50,95,69,109,117,46,99,112,112,0,0,0,42,40,118,111,108,97,116,105,108,101,32,99,104,97,114,42,41,32,38,105,32,33,61,32,48,0,0,0,0,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,65,121,95,65,112,117,46,99,112,112,0,0,0,0,0,0,0,78,111,105,115,101,0,0,0,40,100,97,116,97,32,124,124,32,33,115,105,122,101,41,32,38,38,32,111,117,116,0,0,87,97,118,101,32,52,0,0,86,111,105,99,101,32,49,0,69,120,99,101,115,115,105,118,101,32,100,97,116,97,32,115,105,122,101,0,0,0,0,0,73,110,118,97,108,105,100,32,97,100,100,114,101,115,115,0,40,99,104,46,99,101,110,116,101,114,32,38,38,32,99,104,46,108,101,102,116,32,38,38,32,99,104,46,114,105,103,104,116,41,32,124,124,32,40,33,99,104,46,99,101,110,116,101,114,32,38,38,32,33,99,104,46,108,101,102,116,32,38,38,32,33,99,104,46,114,105,103,104,116,41,0,0,0,0,0,86,111,105,99,101,32,50,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,77,117,108,116,105,95,66,117,102,102,101,114,46,99,112,112,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,98,108,97,114,103,103,95,99,111].concat([109,109,111,110,46,104,0,0,83,113,117,97,114,101,32,51,0,0,0,0,0,0,0,0,87,97,118,101,32,51,0,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,78,101,115,95,65,112,117,46,104,0,0,0,0,0,0,0,0,33,40,99,111,117,110,116,32,38,32,49,41,0,0,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,85,110,107,110,111,119,110,32,104,101,97,100,101,114,32,100,97,116,97,0,0,0,0,0,71,89,77,88,0,0,0,0,115,97,109,112,108,101,95,114,97,116,101,40,41,0,0,0,107,101,114,110,101,108,95,117,110,105,116,32,62,32,48,0,47,85,115,101,114,115,47,100,115,118,101,110,115,115,111,110,47,68,101,118,101,108,111,112,109,101,110,116,47,104,111,109,101,47,103,97,109,101,45,109,117,115,105,99,45,101,109,117,45,114,101,97,100,45,111,110,108,121,47,103,109,101,47,66,108,105,112,95,66,117,102,102,101,114,46,99,112,112,0,0,40,105,32,62,62,32,49,41,32,61,61,32,45,48,120,51,70,70,70,70,70,70,70,0,103,109,101,95,111,112,101,110,95,100,97,116,97,0,0,0,114,101,97,100,0,0,0,0,111,112,101,114,97,116,111,114,91,93,0,0,0,0,0,0,111,112,101,114,97,116,111,114,91,93,0,0,0,0,0,0,111,112,101,114,97,116,111,114,91,93,0,0,0,0,0,0,111,112,101,114,97,116,111,114,91,93,0,0,0,0,0,0,99,108,111,99,107,95,114,97,116,101,95,102,97,99,116,111,114,0,0,0,0,0,0,0,99,111,117,110,116,95,99,108,111,99,107,115,0,0,0,0,111,102,102,115,101,116,95,114,101,115,97,109,112,108,101,100,0,0,0,0,0,0,0,0,111,102,102,115,101,116,95,114,101,115,97,109,112,108,101,100,0,0,0,0,0,0,0,0,111,102,102,115,101,116,95,114,101,115,97,109,112,108,101,100,0,0,0,0,0,0,0,0,115,101,116,95,116,101,109,112,111,0,0,0,0,0,0,0,115,101,116,95,103,97,105,110,0,0,0,0,0,0,0,0,112,114,101,95,108,111,97,100,0,0,0,0,0,0,0,0,102,105,108,108,95,98,117,102,0,0,0,0,0,0,0,0,112,108,97,121,0,0,0,0,115,101,116,95,115,97,109,112,108,101,95,114,97,116,101,0,109,117,116,101,95,118,111,105,99,101,115,0,0,0,0,0,101,110,100,95,102,114,97,109,101,0,0,0,0,0,0,0,99,112,117,95,114,101,97,100,0,0,0,0,0,0,0,0,112,108,97,121,0,0,0,0,99,112,117,95,119,114,105,116,101,95,104,105,103,104,0,0,115,101,116,95,111,117,116,112,117,116,0,0,0,0,0,0,115,97,118,101,95,101,120,116,114,97,0,0,0,0,0,0,114,117,110,95,117,110,116,105,108,95,0,0,0,0,0,0,108,111,97,100,95,109,101,109,95,0,0,0,0,0,0,0,119,114,105,116,101,0,0,0,105,110,105,116,0,0,0,0,114,117,110,0,0,0,0,0,115,111,102,116,95,114,101,115,101,116,95,99,111,109,109,111,110,0,0,0,0,0,0,0,115,101,116,95,111,117,116,112,117,116,0,0,0,0,0,0,114,117,110,95,117,110,116,105,108,0,0,0,0,0,0,0,101,110,100,95,102,114,97,109,101,0,0,0,0,0,0,0,119,114,105,116,101,95,103,103,115,116,101,114,101,111,0,0,119,114,105,116,101,95,100,97,116,97,0,0,0,0,0,0,111,115,99,95,111,117,116,112,117,116,0,0,0,0,0,0,101,110,100,95,102,114,97,109,101,0,0,0,0,0,0,0,119,114,105,116,101,0,0,0,114,117,110,0,0,0,0,0,111,115,99,95,111,117,116,112,117,116,0,0,0,0,0,0,102,105,108,108,95,98,117,102,102,101,114,0,0,0,0,0,109,97,112,95,99,111,100,101,0,0,0,0,0,0,0,0,101,110,100,95,102,114,97,109,101,0,0,0,0,0,0,0,119,114,105,116,101,95,114,101,103,105,115,116,101,114,0,0,114,117,110,95,117,110,116,105,108,95,0,0,0,0,0,0,111,115,99,95,111,117,116,112,117,116,0,0,0,0,0,0,109,97,112,95,109,101,109,0,114,117,110,0,0,0,0,0,114,117,110,95,117,110,116,105,108,0,0,0,0,0,0,0,101,110,100,95,102,114,97,109,101,0,0,0,0,0,0,0,115,101,116,95,109,109,114,0,114,117,110,0,0,0,0,0,101,110,100,95,102,114,97,109,101,0,0,0,0,0,0,0,111,115,99,95,111,117,116,112,117,116,0,0,0,0,0,0,98,101,103,105,110,95,102,114,97,109,101,0,0,0,0,0,109,97,112,95,99,111,100,101,0,0,0,0,0,0,0,0,114,117,110,0,0,0,0,0,114,117,110,95,117,110,116,105,108,0,0,0,0,0,0,0,101,110,100,95,102,114,97,109,101,0,0,0,0,0,0,0,119,114,105,116,101,95,114,101,103,105,115,116,101,114,0,0,114,101,97,100,95,114,101,103,105,115,116,101,114,0,0,0,111,115,99,95,111,117,116,112,117,116,0,0,0,0,0,0,114,117,110,0,0,0,0,0,114,117,110,95,117,110,116,105,108,0,0,0,0,0,0,0,101,110,100,95,102,114,97,109,101,0,0,0,0,0,0,0,119,114,105,116,101,95,100,97,116,97,95,0,0,0,0,0,111,115,99,95,111,117,116,112,117,116,0,0,0,0,0,0,111,115,99,95,111,117,116,112,117,116,0,0,0,0,0,0,119,114,105,116,101,0,0,0,114,101,97,100,95,115,97,109,112,108,101,115,0,0,0,0,112,108,97,121,95,102,114,97,109,101,95,0,0,0,0,0,114,101,97,100,95,115,97,109,112,108,101,115,0,0,0,0,101,110,100,95,102,114,97,109,101,0,0,0,0,0,0,0,111,115,99,95,111,117,116,112,117,116,0,0,0,0,0,0,111,115,99,95,111,117,116,112,117,116,0,0,0,0,0,0,112,108,97,121,95,102,114,97,109,101,0,0,0,0,0,0,119,114,105,116,101,95,111,115,99,0,0,0,0,0,0,0,114,117,110,95,117,110,116,105,108,0,0,0,0,0,0,0,101,110,100,95,102,114,97,109,101,0,0,0,0,0,0,0,111,115,99,95,111,117,116,112,117,116,0,0,0,0,0,0,114,117,110,95,117,110,116,105,108,0,0,0,0,0,0,0,101,110,100,95,102,114,97,109,101,0,0,0,0,0,0,0,115,101,116,95,114,97,116,101,0,0,0,0,0,0,0,0,119,114,105,116,101,49,0,0,119,114,105,116,101,48,0,0,115,107,105,112,0,0,0,0,112,108,97,121,95,0,0,0,109,117,116,101,95,118,111,105,99,101,115,95,0,0,0,0,115,101,116,95,98,117,102,102,101,114,0,0,0,0,0,0,118,111,108,117,109,101,95,117,110,105,116,0,0,0,0,0,66,108,105,112,95,66,117,102,102,101,114,0,0,0,0,0,101,110,100,95,102,114,97,109,101,0,0,0,0,0,0,0,115,101,116,95,115,97,109,112,108,101,95,114,97,116,101,0,114,101,109,111,118,101,95,115,105,108,101,110,99,101,0,0,114,117,110,0,0,0,0,0,103,101,116,95,100,97,116,97,0,0,0,0,0,0,0,0,98,108,97,114,103,103,95,118,101,114,105,102,121,95,98,121,116,101,95,111,114,100,101,114,0,0,0,0,0,0,0,0,78,69,83,77,26,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,65,0,0,0,0,0,0,0,0,32,78,0,0,0,0,0,0,216,38,0,0,88,39,0,0,168,24,0,0,152,17,0,0,88,13,0,0,224,10,0,0,96,8,0,0,224,5,0,0,1,2,4,6,0,0,0,0,40,71,52,54,38,84,84,104,72,71,69,86,85,101,34,70,40,71,52,54,38,84,84,116,72,71,69,86,85,101,34,56,40,71,52,54,38,68,84,102,72,71,69,86,85,69,34,67,40,71,52,54,38,68,84,117,72,71,69,86,85,85,34,54,40,71,52,54,38,84,82,69,72,71,69,86,85,85,34,197,56,71,52,54,38,68,82,68,72,71,69,86,85,85,34,52,56,71,69,71,37,100,82,73,72,71,86,103,69,85,34,131,40,71,52,54,36,83,67,64,72,71,69,86,52,84,34,96,8,16,32,48,64,80,96,112,1,1,0,0,0,1,0,0,2,1,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,1,0,0,120,0,0,0,16,40,0,0,176,38,0,0,32,6,0,0,128,27,0,0,56,19,0,0,232,13,0,0,120,11,0,0,184,8,0,0,56,6,0,0,208,3,0,0,232,6,0,0,0,28,0,0,72,19,0,0,240,13,0,0,128,11,0,0,192,8,0,0,88,6,0,0,216,3,0,0,13,12,12,12,12,12,12,12,12,12,12,12,12,16,16,16,0,0,1,2,3,4,5,6,7,8,9,10,11,11,11,11,1,1,0,0,2,1,0,0,3,1,0,0,0,1,0,0,5,1,0,0,6,1,0,0,7,1,0,0,4,1,0,0,96,9,0,0,112,29,0,0,0,20,0,0,184,14,0,0,192,11,0,0,80,9,0,0,152,6,0,0,24,4,0,0,0,6,2,8,3,3,5,5,3,2,2,2,4,4,6,6,3,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,6,6,2,8,3,3,5,5,4,2,2,2,4,4,6,6,3,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,6,6,2,8,3,3,5,5,3,2,2,2,3,4,6,6,3,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,6,6,2,8,3,3,5,5,4,2,2,2,5,4,6,6,3,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4,3,6,2,6,4,4,4,4,2,5,2,5,5,5,5,5,2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4,3,5,2,5,4,4,4,4,2,4,2,4,4,4,4,4,2,6,2,8,3,3,5,5,2,2,2,2,4,4,6,6,3,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,2,6,2,8,3,3,5,5,2,2,2,2,4,4,6,6,3,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,85,85,0,0,0,0,0,0,4,2,0,0,0,0,0,0,64,16,32,8,0,0,0,0,112,20,0,0,144,15,0,0,216,11,0,0,88,9,0,0,200,6,0,0,0,0,0,0,1,1,0,0,2,1,0,0,0,1,0,0,0,2,0,0,1,3,0,0,3,1,0,0,4,1,0,0,5,1,0,0,6,1,0,0,7,1,0,0,8,1,0,0,9,1,0,0,10,1,0,0,11,1,0,0,12,1,0,0,13,1,0,0,112,20,0,0,144,15,0,0,216,11,0,0,88,9,0,0,200,6,0,0,224,25,0,0,112,25,0,0,200,22,0,0,112,20,0,0,144,15,0,0,216,11,0,0,88,9,0,0,200,6,0,0,184,26,0,0,224,25,0,0,112,25,0,0,72,2,0,0,184,0,0,0,32,40,0,0,208,38,0,0,216,35,0,0,152,33,0,0,224,30,0,0,104,29,0,0,112,20,0,0,144,15,0,0,216,11,0,0,88,9,0,0,200,6,0,0,184,26,0,0,224,25,0,0,112,25,0,0,112,20,0,0,144,15,0,0,216,11,0,0,88,9,0,0,200,6,0,0,72,2,0,0,184,0,0,0,32,40,0,0,208,38,0,0,216,35,0,0,152,33,0,0,224,30,0,0,104,29,0,0,0,0,0,0,0,6,2,8,3,3,5,5,3,2,2,2,4,4,6,6,3,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,6,6,2,8,3,3,5,5,4,2,2,2,4,4,6,6,3,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,6,6,2,8,3,3,5,5,3,2,2,2,3,4,6,6,3,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,6,6,2,8,3,3,5,5,4,2,2,2,5,4,6,6,3,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4,3,6,2,6,4,4,4,4,2,5,2,5,5,5,5,5,2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4,3,5,2,5,4,4,4,4,2,4,2,4,4,4,4,4,2,6,2,8,3,3,5,5,2,2,2,2,4,4,6,6,3,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,2,6,2,8,3,3,5,5,2,2,2,2,4,4,6,6,3,5,0,8,4,4,6,6,2,4,2,7,4,4,7,7,64,64,64,128,64,64,128,160,0,1,0,0,1,1,0,0,2,1,0,0,3,1,0,0,4,1,0,0,5,1,0,0,6,1,0,0,7,1,0,0,120,13,0,0,192,32,0,0,176,21,0,0,64,16,0,0,120,12,0,0,232,9,0,0,240,6,0,0,96,4,0,0,195,1,0,195,9,0,0,0,211,160,245,123,211,161,241,201,211,160,219,162,201,0,0,0,4,10,7,6,4,4,7,4,4,11,7,6,4,4,7,4,13,10,7,6,4,4,7,4,12,11,7,6,4,4,7,4,12,10,16,6,4,4,7,4,12,11,16,6,4,4,7,4,12,10,13,6,11,11,10,4,12,11,13,6,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,7,7,7,7,7,7,4,7,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,11,10,10,10,17,11,7,11,11,10,10,8,17,17,7,11,11,10,10,11,17,11,7,11,11,4,10,11,17,8,7,11,11,10,10,19,17,11,7,11,11,4,10,4,17,8,7,11,11,10,10,4,17,11,7,11,11,6,10,4,17,8,7,11,0,1,0,0,1,1,0,0,2,1,0,0,3,1,0,0,0,3,0,0,1,3,0,0,168,16,0,0,192,33,0,0,24,22,0,0,96,16,0,0,152,12,0,0,240,9,0,0,1,7,3,4,6,4,6,7,3,2,2,2,7,5,7,6,4,7,7,4,6,4,6,7,2,5,2,2,7,5,7,6,7,7,3,4,4,4,6,7,4,2,2,2,5,5,7,6,4,7,7,2,4,4,6,7,2,5,2,2,5,5,7,6,7,7,3,4,8,4,6,7,3,2,2,2,4,5,7,6,4,7,7,5,2,4,6,7,2,5,3,2,2,5,7,6,7,7,2,2,4,4,6,7,4,2,2,2,7,5,7,6,4,7,7,17,4,4,6,7,2,5,4,2,7,5,7,6,4,7,2,7,4,4,4,7,2,2,2,2,5,5,5,6,4,7,7,8,4,4,4,7,2,5,2,2,5,5,5,6,2,7,2,7,4,4,4,7,2,2,2,2,5,5,5,6,4,7,7,8,4,4,4,7,2,5,2,2,5,5,5,6,2,7,2,17,4,4,6,7,2,2,2,2,5,5,7,6,4,7,7,17,2,4,6,7,2,5,3,2,2,5,7,6,2,7,2,17,4,4,6,7,2,2,2,2,5,5,7,6,4,7,7,17,2,4,6,7,2,5,4,2,2,5,7,6,0,0,6,0,7,0,8,0,10,0,12,0,14,0,17,0,20,0,23,0,28,0,33,0,39,0,47,0,56,0,66,0,79,0,93,0,111,0,132,0,157,0,187,0,222,0,8,1,58,1,118,1,188,1,17,2,117,2,235,2,121,3,33,4,72,18,0,0,232,34,0,0,112,22,0,0,176,16,0,0,176,12,0,0,16,10,0,0,96,7,0,0,136,4,0,0,1,1,0,0,2,1,0,0,0,1,0,0,0,3,0,0,88,19,0,0,160,22,0,0,216,16,0,0,184,12,0,0,10,4,6,8,0,0,0,0,132,64,67,170,45,120,146,60,96,89,89,176,52,184,46,218,0,1,0,0,1,1,0,0,2,1,0,0,0,3,0,0,96,25,0,0,72,37,0,0,168,23,0,0,24,17,0,0,243,205,0,0,237,94,251,118,24,250,0,0,0,0,0,0,243,205,0,0,237,86,251,118,205,0,0,24,247,0,0,0,4,10,7,6,4,4,7,4,4,11,7,6,4,4,7,4,13,10,7,6,4,4,7,4,12,11,7,6,4,4,7,4,12,10,16,6,4,4,7,4,12,11,16,6,4,4,7,4,12,10,13,6,11,11,10,4,12,11,13,6,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,7,7,7,7,7,7,4,7,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4,11,10,10,10,17,11,7,11,11,10,10,8,17,17,7,11,11,10,10,11,17,11,7,11,11,4,10,11,17,8,7,11,11,10,10,19,17,11,7,11,11,4,10,4,17,8,7,11,11,10,10,4,17,11,7,11,11,6,10,4,17,8,7,11,0,0,0,0,88,71,0,0,120,0,0,0,240,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,71,0,0,174,0,0,0,6,1,0,0,186,0,0,0,78,0,0,0,18,0,0,0,4,0,0,0,6,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,71,0,0,130,0,0,0,166,0,0,0,196,0,0,0,52,0,0,0,42,0,0,0,102,0,0,0,24,0,0,0,74,0,0,0,60,0,0,0,46,0,0,0,54,0,0,0,50,0,0,0,14,0,0,0,2,0,0,0,4,0,0,0,72,0,0,0,50,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,71,0,0,230,0,0,0,182,0,0,0,196,0,0,0,8,0,0,0,42,0,0,0,2,0,0,0,214,0,0,0,54,0,0,0,60,0,0,0,46,0,0,0,2,0,0,0,52,0,0,0,10,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,71,0,0,160,0,0,0,86,0,0,0,196,0,0,0,8,0,0,0,42,0,0,0,2,0,0,0,24,0,0,0,74,0,0,0,60,0,0,0,46,0,0,0,54,0,0,0,50,0,0,0,14,0,0,0,2,0,0,0,4,0,0,0,72,0,0,0,50,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,71,0,0,34,0,0,0,12,0,0,0,196,0,0,0,16,0,0,0,42,0,0,0,24,0,0,0,24,0,0,0,74,0,0,0,60,0,0,0,46,0,0,0,54,0,0,0,50,0,0,0,14,0,0,0,2,0,0,0,4,0,0,0,72,0,0,0,50,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,71,0,0,8,0,0,0,104,0,0,0,196,0,0,0,56,0,0,0,42,0,0,0,82,0,0,0,24,0,0,0,74,0,0,0,60,0,0,0,46,0,0,0,54,0,0,0,50,0,0,0,14,0,0,0,2,0,0,0,4,0,0,0,72,0,0,0,50,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,71,0,0,20,0,0,0,26,1,0,0,196,0,0,0,8,0,0,0,88,0,0,0,14,0,0,0,24,0,0,0,74,0,0,0,60,0,0,0,46,0,0,0,54,0,0,0,50,0,0,0,14,0,0,0,2,0,0,0,4,0,0,0,72,0,0,0,50,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,72,0,0,76,0,0,0,162,0,0,0,6,0,0,0,6,0,0,0,42,0,0,0,2,0,0,0,214,0,0,0,54,0,0,0,102,0,0,0,56,0,0,0,46,0,0,0,20,0,0,0,10,0,0,0,44,0,0,0,8,0,0,0,50,0,0,0,44,0,0,0,40,0,0,0,10,0,0,0,22,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,72,0,0,136,0,0,0,254,0,0,0,196,0,0,0,38,0,0,0,42,0,0,0,6,0,0,0,24,0,0,0,74,0,0,0,60,0,0,0,46,0,0,0,54,0,0,0,50,0,0,0,14,0,0,0,2,0,0,0,4,0,0,0,72,0,0,0,50,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,72,0,0,140,0,0,0,94,0,0,0,196,0,0,0,62,0,0,0,42,0,0,0,84,0,0,0,24,0,0,0,74,0,0,0,60,0,0,0,46,0,0,0,54,0,0,0,50,0,0,0,14,0,0,0,2,0,0,0,4,0,0,0,72,0,0,0,50,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,72,0,0,106,0,0,0,112,0,0,0,196,0,0,0,12,0,0,0,42,0,0,0,100,0,0,0,24,0,0,0,74,0,0,0,60,0,0,0,46,0,0,0,54,0,0,0,50,0,0,0,14,0,0,0,2,0,0,0,4,0,0,0,72,0,0,0,50,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,72,0,0,88,0,0,0,42,0,0,0,196,0,0,0,8,0,0,0,40,0,0,0,26,0,0,0,24,0,0,0,74,0,0,0,60,0,0,0,46,0,0,0,54,0,0,0,50,0,0,0,14,0,0,0,2,0,0,0,4,0,0,0,72,0,0,0,50,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,72,0,0,122,0,0,0,126,0,0,0,224,0,0,0,8,0,0,0,42,0,0,0,2,0,0,0,16,1,0,0,124,0,0,0,60,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,72,0,0,98,0,0,0,24,1,0,0,196,0,0,0,26,0,0,0,42,0,0,0,64,0,0,0,24,0,0,0,74,0,0,0,60,0,0,0,46,0,0,0,54,0,0,0,50,0,0,0,14,0,0,0,2,0,0,0,4,0,0,0,72,0,0,0,50,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,72,0,0,250,0,0,0,64,0,0,0,196,0,0,0,8,0,0,0,28,0,0,0,48,0,0,0,214,0,0,0,54,0,0,0,60,0,0,0,56,0,0,0,14,0,0,0,20,0,0,0,10,0,0,0,8,0,0,0,2,0,0,0,24,0,0,0,36,0,0,0,40,0,0,0,20,0,0,0,28,0,0,0,76,0,0,0,6,0,0,0,176,254,255,255,112,72,0,0,128,0,0,0,52,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,72,0,0,100,0,0,0,50,0,0,0,196,0,0,0,8,0,0,0,12,0,0,0,90,0,0,0,214,0,0,0,54,0,0,0,60,0,0,0,46,0,0,0,30,0,0,0,52,0,0,0,12,0,0,0,54,0,0,0,18,0,0,0,10,0,0,0,34,0,0,0,60,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,72,0,0,152,0,0,0,200,0,0,0,196,0,0,0,8,0,0,0,32,0,0,0,66,0,0,0,214,0,0,0,54,0,0,0,60,0,0,0,56,0,0,0,46,0,0,0,20,0,0,0,10,0,0,0,44,0,0,0,20,0,0,0,44,0,0,0,44,0,0,0,40,0,0,0,18,0,0,0,4,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,72,0,0,108,0,0,0,26,0,0,0,176,0,0,0,18,0,0,0,42,0,0,0,62,0,0,0,214,0,0,0,54,0,0,0,60,0,0,0,56,0,0,0,46,0,0,0,20,0,0,0,10,0,0,0,44,0,0,0,8,0,0,0,68,0,0,0,44,0,0,0,40,0,0,0,10,0,0,0,22,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,72,0,0,18,1,0,0,202,0,0,0,22,0,0,0,4,0,0,0,42,0,0,0,22,0,0,0,214,0,0,0,54,0,0,0,60,0,0,0,56,0,0,0,46,0,0,0,20,0,0,0,10,0,0,0,44,0,0,0,14,0,0,0,66,0,0,0,44,0,0,0,40,0,0,0,14,0,0,0,48,0,0,0,92,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,73,0,0,236,0,0,0,10,0,0,0,80,0,0,0,28,0,0,0,42,0,0,0,52,0,0,0,214,0,0,0,54,0,0,0,60,0,0,0,56,0,0,0,46,0,0,0,20,0,0,0,10,0,0,0,44,0,0,0,12,0,0,0,48,0,0,0,44,0,0,0,40,0,0,0,8,0,0,0,16,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,73,0,0,194,0,0,0,10,1,0,0,196,0,0,0,8,0,0,0,54,0,0,0,98,0,0,0,214,0,0,0,54,0,0,0,60,0,0,0,46,0,0,0,42,0,0,0,52,0,0,0,10,0,0,0,36,0,0,0,6,0,0,0,22,0,0,0,96,0,0,0,40,0,0,0,8,0,0,0,192,254,255,255,48,73,0,0,82,0,0,0,134,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,73,0,0,96,0,0,0,30,1,0,0,18,0,0,0,36,0,0,0,42,0,0,0,30,0,0,0,214,0,0,0,54,0,0,0,60,0,0,0,56,0,0,0,46,0,0,0,20,0,0,0,10,0,0,0,44,0,0,0,16,0,0,0,32,0,0,0,44,0,0,0,40,0,0,0,12,0,0,0,6,0,0,0,60,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,73,0,0,154,0,0,0,62,0,0,0,196,0,0,0,8,0,0,0,68,0,0,0,80,0,0,0,24,0,0,0,74,0,0,0,60,0,0,0,46,0,0,0,54,0,0,0,50,0,0,0,14,0,0,0,2,0,0,0,4,0,0,0,72,0,0,0,50,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,73,0,0,90,0,0,0,232,0,0,0,196,0,0,0,8,0,0,0,58,0,0,0,8,0,0,0,214,0,0,0,54,0,0,0,60,0,0,0,56,0,0,0,46,0,0,0,20,0,0,0,10,0,0,0,44,0,0,0,10,0,0,0,2,0,0,0,44,0,0,0,40,0,0,0,2,0,0,0,30,0,0,0,56,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,73,0,0,234,0,0,0,156,0,0,0,74,0,0,0,4,0,0,0,8,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,73,0,0,168,0,0,0,36,0,0,0,94,0,0,0,86,0,0,0,14,0,0,0,64,0,0,0,6,0,0,0,10,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,73,0,0,70,0,0,0,46,0,0,0,34,0,0,0,14,0,0,0,70,0,0,0,40,0,0,0,34,0,0,0,32,0,0,0,38,0,0,0,38,0,0,0,12,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,73,0,0,0,1,0,0,210,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,73,0,0,114,0,0,0,4,0,0,0,72,0,0,0,86,0,0,0,16,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,73,0,0,238,0,0,0,192,0,0,0,34,0,0,0,4,0,0,0,78,0,0,0,26,0,0,0,24,0,0,0,172,0,0,0,18,0,0,0,46,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,74,0,0,28,1,0,0,66,0,0,0,196,0,0,0,8,0,0,0,42,0,0,0,2,0,0,0,214,0,0,0,54,0,0,0,60,0,0,0,56,0,0,0,46,0,0,0,20,0,0,0,10,0,0,0,44,0,0,0,2,0,0,0,2,0,0,0,44,0,0,0,40,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,6,0,0,0,176,254,255,255,8,74,0,0,198,0,0,0,222,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,74,0,0,2,1,0,0,14,0,0,0,34,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,74,0,0,188,0,0,0,118,0,0,0,2,0,0,0,86,0,0,0,14,0,0,0,64,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,74,0,0,144,0,0,0,212,0,0,0,2,0,0,0,86,0,0,0,2,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,74,0,0,180,0,0,0,178,0,0,0,196,0,0,0,8,0,0,0,42,0,0,0,2,0,0,0,214,0,0,0,54,0,0,0,60,0,0,0,56,0,0,0,46,0,0,0,20,0,0,0,10,0,0,0,44,0,0,0,2,0,0,0,2,0,0,0,44,0,0,0,40,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,57,78,115,102,101,95,70,105,108,101,0,0,0,0,0,0,57,77,117,115,105,99,95,69,109,117,0,0,0,0,0,0,57,71,109,101,95,73,110,102,111,95,0,0,0,0,0,0,56,86,103,109,95,70,105,108,101,0,0,0,0,0,0,0,56,83,112,99,95,70,105,108,101,0,0,0,0,0,0,0,56,83,97,112,95,70,105,108,101,0,0,0,0,0,0,0,56,78,115,102,101,95,69,109,117,0,0,0,0,0,0,0,56,78,115,102,95,70,105,108,101,0,0,0,0,0,0,0,56,75,115,115,95,70,105,108,101,0,0,0,0,0,0,0,56,72,101,115,95,70,105,108,101,0,0,0,0,0,0,0,56,71,121,109,95,70,105,108,101,0,0,0,0,0,0,0,56,71,109,101,95,70,105,108,101,0,0,0,0,0,0,0,56,71,98,115,95,70,105,108,101,0,0,0,0,0,0,0,55,86,103,109,95,69,109,117,0,0,0,0,0,0,0,0,55,83,112,99,95,69,109,117,0,0,0,0,0,0,0,0,55,83,97,112,95,69,109,117,0,0,0,0,0,0,0,0,55,83,97,112,95,67,112,117,0,0,0,0,0,0,0,0,55,78,115,102,95,69,109,117,0,0,0,0,0,0,0,0,55,78,101,115,95,67,112,117,0,0,0,0,0,0,0,0,55,75,115,115,95,69,109,117,0,0,0,0,0,0,0,0,55,75,115,115,95,67,112,117,0,0,0,0,0,0,0,0,55,72,101,115,95,69,109,117,0,0,0,0,0,0,0,0,55,72,101,115,95,67,112,117,0,0,0,0,0,0,0,0,55,71,121,109,95,69,109,117,0,0,0,0,0,0,0,0,55,71,98,115,95,69,109,117,0,0,0,0,0,0,0,0,55,65,121,95,70,105,108,101,0,0,0,0,0,0,0,0,54,71,98,95,67,112,117,0,54,65,121,95,69,109,117,0,54,65,121,95,67,112,117,0,49,54,82,101,109,97,105,110,105,110,103,95,82,101,97,100,101,114,0,0,0,0,0,0,49,53,77,101,109,95,70,105,108,101,95,82,101,97,100,101,114,0,0,0,0,0,0,0,49,52,69,102,102,101,99,116,115,95,66,117,102,102,101,114,0,0,0,0,0,0,0,0,49,52,68,117,97,108,95,82,101,115,97,109,112,108,101,114,0,0,0,0,0,0,0,0,49,51,83,117,98,115,101,116,95,82,101,97,100,101,114,0,49,51,83,116,101,114,101,111,95,66,117,102,102,101,114,0,49,50,86,103,109,95,69,109,117,95,73,109,112,108,0,0,49,50,77,117,108,116,105,95,66,117,102,102,101,114,0,0,49,49,70,105,108,101,95,82,101,97,100,101,114,0,0,0,49,49,68,97,116,97,95,82,101,97,100,101,114,0,0,0,49,49,67,108,97,115,115,105,99,95,69,109,117,0,0,0,0,0,0,0,240,67,0,0,0,0,0,0,0,68,0,0,0,0,0,0,16,68,0,0,80,71,0,0,0,0,0,0,0,0,0,0,32,68,0,0,136,71,0,0,0,0,0,0,0,0,0,0,72,68,0,0,136,71,0,0,0,0,0,0,0,0,0,0,112,68,0,0,152,71,0,0,0,0,0,0,0,0,0,0,152,68,0,0,72,71,0,0,0,0,0,0,0,0,0,0,192,68,0,0,200,71,0,0,0,0,0,0,0,0,0,0,208,68,0,0,88,72,0,0,0,0,0,0,0,0,0,0,224,68,0,0,184,71,0,0,0,0,0,0,0,0,0,0,240,68,0,0,200,71,0,0,0,0,0,0,0,0,0,0,0,69,0,0,200,71,0,0,0,0,0,0,0,0,0,0,16,69,0,0,200,71,0,0,0,0,0,0,0,0,0,0,32,69,0,0,184,72,0,0,0,0,0,0,0,0,0,0,48,69,0,0,200,71,0,0,0,0,0,0,0,0,0,0,64,69,0,0,200,71,0,0,0,0,0,0,0,0,0,0,80,69,0,0,200,71,0,0,0,0,0,0,0,0,0,0,96,69,0,0,200,71,0,0,0,0,0,0,0,0,0,0,112,69,0,0,0,0,0,0,128,69,0,0,200,71,0,0,0,0,0,0,0,0,0,0,144,69,0,0,8,74,0,0,0,0,0,0,0,0,0,0,160,69,0,0,184,71,0,0,0,0,0,0,160,56,0,0,176,69,0,0,0,0,0,0,2,0,0,0,176,72,0,0,0,80,1,0,72,74,0,0,2,0,0,0,0,0,0,0,192,69,0,0,160,56,0,0,208,69,0,0,0,0,0,0,2,0,0,0,216,72,0,0,0,80,1,0,72,74,0,0,2,0,0,0,0,0,0,0,224,69,0,0,160,56,0,0,240,69,0,0,0,0,0,0,2,0,0,0,0,73,0,0,0,80,1,0,72,74,0,0,2,0,0,0,0,0,0,0,0,70,0,0,160,56,0,0,16,70,0,0,0,0,0,0,2,0,0,0,40,73,0,0,0,80,1,0,72,74,0,0,2,0,0,0,0,0,0,0,32,70,0,0,160,56,0,0,48,70,0,0,0,0,0,0,2,0,0,0,184,71,0,0,2,0,0,0,224,73,0,0,0,64,1,0,160,56,0,0,64,70,0,0,0,0,0,0,2,0,0,0,128,73,0,0,0,80,1,0,72,74,0,0,2,0,0,0,0,0,0,0,80,70,0,0,200,71,0,0,0,0,0,0,0,0,0,0,96,70,0,0,160,56,0,0,104,70,0,0,0,0,0,0,2,0,0,0,168,73,0,0,0,80,1,0,72,74,0,0,2,0,0,0,0,0,0,0,112,70,0,0,0,0,0,0,120,70,0,0,64,74,0,0,0,0,0,0,0,0,0,0,144,70,0,0,48,74,0,0,0,0,0,0,0,0,0,0,168,70,0,0,40,74,0,0,0,0,0,0,0,0,0,0,192,70,0,0,0,0,0,0,216,70,0,0,64,74,0,0,0,0,0,0,0,0,0,0,232,70,0,0,40,74,0,0,0,0,0,0,160,56,0,0,248,70,0,0,0,0,0,0,2,0,0,0,72,74,0,0,2,0,0,0,224,73,0,0,0,80,1,0,0,0,0,0,8,71,0,0,0,0,0,0,24,71,0,0,64,74,0,0,0,0,0,0,0,0,0,0,40,71,0,0,0,0,0,0,56,71,0,0,184,71,0,0,0,0,0,0,83,78,69,83,45,83,80,67,55,48,48,32,83,111,117,110,100,32,70,105,108,101,32,68,97,116,97,32,118,48,46,51,48,26,26,0,0,0,0,0,255,0,245,246,241,245,254,254,4,3,14,14,26,26,14,22,2,3,0,1,244,0,1,1,7,6,14,14,27,14,14,23,5,6,3,4,255,3,4,4,10,9,14,14,26,251,14,23,8,9,6,7,2,6,7,7,13,12,14,14,27,252,14,24,11,12,9,10,5,9,10,10,16,15,14,14,254,252,14,24,14,15,12,13,8,12,13,13,19,18,14,14,254,220,14,24,17,18,15,16,11,15,16,16,22,21,14,14,28,253,14,25,20,21,18,19,14,18,19,19,25,24,14,14,14,29,14,25,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,0,1,2,3,4,6,8,12,17,24,34,48,68,96,136,192,85,110,101,120,112,101,99,116,101,100,32,101,110,100,32,111,102,32,102,105,108,101,0,0,0,1,2,3,4,5,6,7,7,8,9,10,11,12,13,14,15,15,16,17,18,19,20,20,21,22,23,24,24,25,26,27,27,28,29,30,31,31,32,33,33,34,35,36,36,37,38,38,39,40,41,41,42,43,43,44,45,45,46,47,47,48,48,49,50,50,51,52,52,53,53,54,55,55,56,56,57,58,58,59,59,60,60,61,61,62,63,63,64,64,65,65,66,66,67,67,68,68,69,70,70,71,71,72,72,73,73,74,74,75,75,75,76,76,77,77,78,78,79,79,80,80,81,81,82,82,82,83,0,2,3,4,6,8,11,16,23,32,45,64,90,128,180,255,0,0,0,0,0,0,0,1,2,3,3,3,3,3,3,3,64,50,39,31,24,19,15,12,9,7,5,4,3,2,1,0,21,1,25,61,42,62,38,2,4,0,8,0,16,0,32,0,64,0,96,0,128,0,160,0,202,0,254,0,124,1,252,1,250,2,248,3,242,7,228,15,114,1,25,5,110,1,25,5,106,1,24,5,102,1,24,5,98,1,24,5,95,1,24,5,91,1,24,5,87,1,23,5,83,1,23,5,80,1,23,5,76,1,22,5,72,1,22,5,69,1,21,5,65,1,20,5,62,1,20,5,58,1,19,5,55,1,18,5,51,1,17,5,48,1,17,5,44,1,16,5,41,1,15,5,37,1,14,5,34,1,13,5,30,1,12,5,27,1,11,5,24,1,10,5,20,1,8,5,17,1,7,5,14,1,6,5,11,1,4,5,7,1,3,5,4,1,2,5,1,1,0,5,254,0,255,4,251,0,253,4,248,0,251,4,245,0,250,4,242,0,248,4,239,0,246,4,236,0,245,4,233,0,243,4,230,0,241,4,227,0,239,4,224,0,237,4,221,0,235,4,218,0,233,4,215,0,231,4,212,0,229,4,210,0,227,4,207,0,224,4,204,0,222,4,201,0,220,4,199,0,217,4,196,0,215,4,193,0,213,4,191,0,210,4,188,0,208,4,186,0,205,4,183,0,203,4,180,0,200,4,178,0,197,4,175,0,195,4,173,0,192,4,171,0,189,4,168,0,186,4,166,0,183,4,163,0,181,4,161,0,178,4,159,0,175,4,156,0,172,4,154,0,169,4,152,0,166,4,150,0,162,4,147,0,159,4,145,0,156,4,143,0,153,4,141,0,150,4,139,0,146,4,137,0,143,4,134,0,140,4,132,0,136,4,130,0,133,4,128,0,129,4,126,0,126,4,124,0,122,4,122,0,119,4,120,0,115,4,118,0,112,4,117,0,108,4,115,0,104,4,113,0,101,4,111,0,97,4,109,0,93,4,107,0,89,4,106,0,85,4,104,0,82,4,102,0,78,4,100,0,74,4,99,0,70,4,97,0,66,4,95,0,62,4,94,0,58,4,92,0,54,4,90,0,50,4,89,0,46,4,87,0,42,4,86,0,37,4,84,0,33,4,83,0,29,4,81,0,25,4,80,0,21,4,78,0,16,4,77,0,12,4,76,0,8,4,74,0,3,4,73,0,255,3,71,0,251,3,70,0,246,3,69,0,242,3,67,0,237,3,66,0,233,3,65,0,229,3,64,0,224,3,62,0,220,3,61,0,215,3,60,0,210,3,59,0,206,3,58,0,201,3,56,0,197,3,55,0,192,3,54,0,187,3,53,0,183,3,52,0,178,3,51,0,173,3,50,0,169,3,49,0,164,3,48,0,159,3,47,0,155,3,46,0,150,3,45,0,145,3,44,0,140,3,43,0,136,3,42,0,131,3,41,0,126,3,40,0,121,3,39,0,116,3,38,0,112,3,37,0,107,3,36,0,102,3,36,0,97,3,35,0,92,3,34,0,87,3,33,0,83,3,32,0,78,3,32,0,73,3,31,0,68,3,30,0,63,3,29,0,58,3,29,0,53,3,28,0,48,3,27,0,43,3,27,0,38,3,26,0,34,3,25,0,29,3,24,0,24,3,24,0,19,3,23,0,14,3,23,0,9,3,22,0,4,3,21,0,255,2,21,0,250,2,20,0,245,2,20,0,240,2,19,0,235,2,19,0,230,2,18,0,225,2,17,0,220,2,17,0,216,2,16,0,211,2,16,0,206,2,15,0,201,2,15,0,196,2,15,0,191,2,14,0,186,2,14,0,181,2,13,0,176,2,13,0,171,2,12,0,166,2,12,0,162,2,11,0,157,2,11,0,152,2,11,0,147,2,10,0,142,2,10,0,137,2,10,0,132,2,9,0,128,2,9,0,123,2,9,0,118,2,8,0,113,2,8,0,108,2,8,0,103,2,7,0,99,2,7,0,94,2,7,0,89,2,6,0,84,2,6,0,80,2,6,0,75,2,6,0,70,2,5,0,65,2,5,0,61,2,5,0,56,2,5,0,51,2,4,0,47,2,4,0,42,2,4,0,38,2,4,0,33,2,4,0,28,2,3,0,24,2,3,0,19,2,3,0,15,2,3,0,10,2,3,0,5,2,2,0,1,2,2,0,252,1,2,0,248,1,2,0,243,1])
.concat([2,0,239,1,2,0,235,1,2,0,230,1,1,0,226,1,1,0,221,1,1,0,217,1,1,0,213,1,1,0,208,1,1,0,204,1,1,0,200,1,1,0,195,1,1,0,191,1,1,0,187,1,1,0,183,1,0,0,178,1,0,0,174,1,0,0,170,1,0,0,166,1,0,0,162,1,0,0,158,1,0,0,154,1,0,0,149,1,0,0,145,1,0,0,141,1,0,0,137,1,0,0,133,1,0,0,129,1,0,0,125,1,0,0,122,1,0,0,118,1,172,1,124,1,84,1,64,1,30,1,254,0,226,0,214,0,190,0,160,0,142,0,128,0,106,0,84,0,72,0,54,0,142,1,98,1,60,1,42,1,20,1,236,0,210,0,198,0,176,0,148,0,132,0,118,0,98,0,78,0,66,0,50,0,32,4,0,0,0,0,0,0,10,0,0,0,16,0,0,0,48,10,0,0,1,0,0,0,0,1,0,0,0,2,0,0,0,4,0,0,0,0,0,0,152,26,0,0,1,0,0,0,28,0,0,0,26,0,0,0,192,25,0,0,1,0,0,0,152,26,0,0,1,0,0,0,28,0,0,0,26,0,0,0,88,25,0,0,1,0,0,0,224,32,0,0,1,0,0,0,8,0,0,0,30,0,0,0,208,30,0,0,0,0,0,0,80,16,0,0,0,0,0,0,12,0,0,0,20,0,0,0,192,15,0,0,1,0,0,0,80,14,0,0,0,0,0,0,40,0,0,0,18,0,0,0,224,13,0,0,1,0,0,0,80,19,0,0,0,1,0,0,38,0,0,0,2,0,0,0,224,18,0,0,3,0,0,0,96,22,0,0,0,1,0,0,32,0,0,0,22,0,0,0,168,21,0,0,1,0,0,0,200,33,0,0,1,0,0,0,34,0,0,0,14,0,0,0,240,31,0,0,0,0,0,0,248,31,0,0,0,0,0,0,36,0,0,0,4,0,0,0,216,33,0,0,1,0,0,0,128,63,0,255,191,255,63,0,255,191,127,255,159,255,191,255,255,0,0,191,0,119,128,255,255,255,255,255,255,255,255,255,10,254,20,2,40,4,80,6,160,8,60,10,14,12,26,14,12,16,24,18,48,20,96,22,192,24,72,26,16,28,32,30,69,139,90,154,228,130,27,120,0,0,170,150,137,14,224,128,42,73,61,186,20,160,172,197,0,0,81,187,156,78,123,255,244,253,87,50,55,217,66,34,0,0,91,60,159,27,135,154,111,39,175,123,229,104,10,217,0,0,154,197,156,78,123,255,234,33,120,79,221,237,36,20,0,0,119,177,209,54,193,103,82,87,70,61,89,244,135,164,0,0,126,68,156,78,123,255,117,245,6,151,16,195,36,187,0,0,123,122,224,96,18,15,247,116,28,229,57,61,115,193,0,0,122,179,255,78,123,255,152,25,0,0,0,0,0,0,6,0,0,0,24,0,0,0,56,25,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,6,12,2,0,0,3,0,0,7,12,2,0,0,3,0,0,0,0,0,15,15,11,0,0,7,0,0,0,0,0,0,64,64,112,192,0,96,11,16,64,64,112,192,0,96,11,16,64,64,112,192,0,96,11,16,64,64,112,192,0,96,11,16,64,64,112,192,0,96,11,160,64,64,112,192,0,96,11,160,75,75,123,203,11,107,0,11,64,64,112,192,0,96,11,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,11,0,128,128,128,128,0,0,11,0,128,128,128,128,0,0,11,0,208,208,208,208,0,0,11,0,208,208,208,208,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,15,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,6,12,2,0,0,3,0,0,7,12,2,0,0,3,0,0,0,0,0,15,15,11,0,0,7,0,0,0,0,0,0,64,64,112,192,0,96,11,16,64,64,112,192,0,96,11,16,64,64,112,192,0,96,11,16,64,64,112,192,0,96,11,16,64,64,112,192,0,96,11,160,64,64,112,192,0,96,11,160,75,75,123,203,11,107,0,11,64,64,112,192,0,96,11,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,11,0,128,128,128,128,0,0,11,0,128,128,128,128,0,0,11,0,208,208,208,208,0,0,11,0,208,208,208,208,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,15,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,7,0,0,0,255,15,0,0,255,15,0,0,255,7,0,0,255,7,0,0,255,7,0,0,255,3,0,0,255,3,0,0,255,3,0,0,255,1,0,0,255,1,0,0,255,1,0,0,255,0,0,0,255,0,0,0,255,0,0,0,127,0,0,0,127,0,0,0,127,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,31,0,0,0,31,0,0,0,31,0,0,0,15,0,0,0,15,0,0,0,15,0,0,0,7,0,0,0,7,0,0,0,7,0,0,0,1,0,0,0,0,0,0,0,24,0,0,0,12,0,0,0,26,0,0,0,16,0,0,0,22,0,0,0,10,0,0,0,20,0,0,0,28,0,0,0,0,1,2,3,4,6,12,24,31,4,1,0,0,0,0,0,128,191,0,0,191,0,63,0,0,191,127,255,159,0,191,0,255,0,0,191,119,243,241,0,0,0,0,0,0,0,0,0,172,221,218,72,54,2,207,22,44,4,229,44,172,221,218,72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3,4,4,4,5,5,6,6,7,8,8,8,8,1,1,1,1,2,2,2,2,2,3,3,3,4,4,4,5,5,6,6,7,8,8,9,10,11,12,13,14,16,16,16,16,2,2,2,2,2,3,3,3,4,4,4,5,5,6,6,7,8,8,9,10,11,12,13,14,16,17,19,20,22,22,22,22])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function ___assert_fail(condition, filename, line, func) {
      ABORT = true;
      throw 'Assertion failed: ' + Pointer_stringify(condition) + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + stackTrace();
    }
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  var _floor=Math_floor;
  Module["_memcpy"] = _memcpy; 
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  var _cos=Math_cos;
  var _llvm_pow_f64=Math_pow;
  var _sin=Math_sin;
  function ___gxx_personality_v0() {
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }
  var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function ___cxa_pure_virtual() {
      ABORT = true;
      throw 'Pure virtual function called!';
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  var _fabs=Math_abs;
  function _fmod(x, y) {
      return x % y;
    }
  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }
  function ___cxa_guard_release() {}
  Module["_strlen"] = _strlen;function _strrchr(ptr, chr) {
      var ptr2 = ptr + _strlen(ptr);
      do {
        if (HEAP8[(ptr2)] == chr) return ptr2;
        ptr2--;
      } while (ptr2 >= ptr);
      return 0;
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  function _toupper(chr) {
      if (chr >= 97 && chr <= 122) {
        return chr - 97 + 65;
      } else {
        return chr;
      }
    }
  var _llvm_memset_p0i8_i64=_memset;
  function _log10(x) {
      return Math.log(x) / Math.LN10;
    }
  Module["_memcmp"] = _memcmp;
  Module["_strncpy"] = _strncpy;
  function _abort() {
      Module['abort']();
    }
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }function ___errno_location() {
      return ___errno_state;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            ['experimental-webgl', 'webgl'].some(function(webglId) {
              return ctx = canvas.getContext(webglId, contextAttributes);
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var Math_min = Math.min;
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vid(index,a1,a2) {
  try {
    Module["dynCall_vid"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_i(index) {
  try {
    return Module["dynCall_i"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.__ZTVN10__cxxabiv117__class_type_infoE|0;var n=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;var o=+env.NaN;var p=+env.Infinity;var q=0;var r=0;var s=0;var t=0;var u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0.0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=global.Math.floor;var O=global.Math.abs;var P=global.Math.sqrt;var Q=global.Math.pow;var R=global.Math.cos;var S=global.Math.sin;var T=global.Math.tan;var U=global.Math.acos;var V=global.Math.asin;var W=global.Math.atan;var X=global.Math.atan2;var Y=global.Math.exp;var Z=global.Math.log;var _=global.Math.ceil;var $=global.Math.imul;var aa=env.abort;var ab=env.assert;var ac=env.asmPrintInt;var ad=env.asmPrintFloat;var ae=env.min;var af=env.invoke_viiiii;var ag=env.invoke_vid;var ah=env.invoke_i;var ai=env.invoke_vi;var aj=env.invoke_vii;var ak=env.invoke_iiii;var al=env.invoke_ii;var am=env.invoke_viii;var an=env.invoke_v;var ao=env.invoke_iiiii;var ap=env.invoke_viiiiii;var aq=env.invoke_iii;var ar=env.invoke_viiii;var as=env._strncmp;var at=env.___assert_fail;var au=env.___cxa_throw;var av=env._abort;var aw=env._toupper;var ax=env._fflush;var ay=env._sysconf;var az=env._fabs;var aA=env._floor;var aB=env.___setErrNo;var aC=env._llvm_eh_exception;var aD=env._exit;var aE=env._strrchr;var aF=env._log10;var aG=env._sin;var aH=env.___cxa_pure_virtual;var aI=env._time;var aJ=env.___cxa_is_number_type;var aK=env.___cxa_does_inherit;var aL=env.___cxa_guard_acquire;var aM=env.__ZSt9terminatev;var aN=env.___cxa_find_matching_catch;var aO=env.__ZSt18uncaught_exceptionv;var aP=env._cos;var aQ=env._llvm_pow_f64;var aR=env.___cxa_call_unexpected;var aS=env.___cxa_allocate_exception;var aT=env.___errno_location;var aU=env.___gxx_personality_v0;var aV=env._sbrk;var aW=env._fmod;var aX=env.___cxa_guard_release;var aY=env.__exit;var aZ=env.___resumeException;var a_=env._strcmp;var a$=0.0;
// EMSCRIPTEN_START_FUNCS
function kH(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0;h=i;i=i+88|0;j=h|0;k=h+80|0;l=f;kI(l,g);g=j;f=l+520|0;sg(g|0,f|0,80)|0;c[l+516>>2]=j;f=0;g=k;m=l+608|0;sg(g|0,m|0,8)|0;m=c[j+76>>2]|0;g=e[l+600>>1]|0;n=e[l+602>>1]|0;o=e[l+604>>1]|0;p=e[l+606>>1]|0;q=d[l+615|0]|0;L1:while(1){r=c[j+(g>>>13<<2)>>2]|0;r=r+(g&8191)|0;s=r;r=s+1|0;t=d[s]|0;g=g+1|0;u=d[13424+t|0]|0;s=m+u|0;m=s;if((s|0)>=0){if((m|0)>=(u|0)){v=11;break}}u=d[(c[j+(g>>>13<<2)>>2]|0)+(g&8191)|0]|0;L9:do{switch(t|0){case 0:case 64:case 73:case 82:case 91:case 100:case 109:case 127:{continue L1;break};case 8:{s=d[l+622|0]|0;a[l+622|0]=a[k+6|0]|0;a[k+6|0]=s&255;s=d[l+623|0]|0;a[l+623|0]=q&255;q=s;continue L1;break};case 211:{g=g+1|0;k8(l,m+(c[j+72>>2]|0)|0,u+((d[k+6|0]|0)<<8)|0,d[k+6|0]|0);continue L1;break};case 46:{g=g+1|0;a[k+4|0]=u&255;continue L1;break};case 62:{g=g+1|0;a[k+6|0]=u&255;continue L1;break};case 58:{s=g2(r)|0;g=g+2|0;a[k+6|0]=a[(c[j+(s>>>13<<2)>>2]|0)+(s&8191)|0]|0;continue L1;break};case 32:{g=g+1|0;if((q&64|0)!=0){v=2;break L9}else{g=g+((u&255)<<24>>24)&65535;continue L1}break};case 40:{g=g+1|0;if((q&64|0)!=0){g=g+((u&255)<<24>>24)&65535;continue L1}else{v=2;break L9}break};case 48:{g=g+1|0;if((q&1|0)!=0){v=2;break L9}else{g=g+((u&255)<<24>>24)&65535;continue L1}break};case 56:{g=g+1|0;if((q&1|0)!=0){g=g+((u&255)<<24>>24)&65535;continue L1}else{v=2;break L9}break};case 24:{g=g+1|0;g=g+((u&255)<<24>>24)&65535;continue L1;break};case 16:{s=(d[k+1|0]|0)-1|0;a[k+1|0]=s&255;g=g+1|0;if((s|0)!=0){g=g+((u&255)<<24>>24)&65535;continue L1}else{v=2;break L9}break};case 194:{if((q&64|0)!=0){v=4;break L9}else{g=g2(r)|0;continue L1}break};case 202:{if((q&64|0)!=0){g=g2(r)|0;continue L1}else{v=4;break L9}break};case 210:{if((q&1|0)!=0){v=4;break L9}else{g=g2(r)|0;continue L1}break};case 218:{if((q&1|0)!=0){g=g2(r)|0;continue L1}else{v=4;break L9}break};case 226:{if((q&4|0)!=0){v=4;break L9}else{g=g2(r)|0;continue L1}break};case 234:{if((q&4|0)!=0){g=g2(r)|0;continue L1}else{v=4;break L9}break};case 242:{if((q&128|0)!=0){v=4;break L9}else{g=g2(r)|0;continue L1}break};case 250:{if((q&128|0)!=0){g=g2(r)|0;continue L1}else{v=4;break L9}break};case 195:{g=g2(r)|0;continue L1;break};case 233:{g=e[k+4>>1]|0;continue L1;break};case 192:{if((q&64|0)!=0){m=m-6|0;continue L1}else{v=85;break L9}break};case 200:{if((q&64|0)!=0){v=85;break L9}else{m=m-6|0;continue L1}break};case 208:{if((q&1|0)!=0){m=m-6|0;continue L1}else{v=85;break L9}break};case 216:{if((q&1|0)!=0){v=85;break L9}else{m=m-6|0;continue L1}break};case 224:{if((q&4|0)!=0){m=m-6|0;continue L1}else{v=85;break L9}break};case 232:{if((q&4|0)!=0){v=85;break L9}else{m=m-6|0;continue L1}break};case 240:{if((q&128|0)!=0){m=m-6|0;continue L1}else{v=85;break L9}break};case 248:{if((q&128|0)!=0){v=85;break L9}else{m=m-6|0;continue L1}break};case 201:{v=85;break};case 196:{if((q&64|0)!=0){v=3;break L9}else{v=111;break L9}break};case 204:{if((q&64|0)!=0){v=111;break L9}else{v=3;break L9}break};case 212:{if((q&1|0)!=0){v=3;break L9}else{v=111;break L9}break};case 220:{if((q&1|0)!=0){v=111;break L9}else{v=3;break L9}break};case 228:{if((q&4|0)!=0){v=3;break L9}else{v=111;break L9}break};case 236:{if((q&4|0)!=0){v=111;break L9}else{v=3;break L9}break};case 244:{if((q&128|0)!=0){v=3;break L9}else{v=111;break L9}break};case 252:{if((q&128|0)!=0){v=111;break L9}else{v=3;break L9}break};case 205:{v=111;break};case 255:{if(g>>>0>65535>>>0){v=113;break L1}v=115;break};case 199:case 207:case 215:case 223:case 231:case 239:case 247:{v=115;break};case 245:{u=((d[k+6|0]|0)<<8)+q|0;v=118;break};case 197:case 213:case 229:{u=e[k-24+(t>>>3)>>1]|0;v=118;break};case 241:{q=d[(c[j+(n>>>13<<2)>>2]|0)+(n&8191)|0]|0;a[k+6|0]=a[(c[j+((n+1|0)>>>13<<2)>>2]|0)+(n+1&8191)|0]|0;n=n+2&65535;continue L1;break};case 193:case 209:case 225:{b[k-24+(t>>>3)>>1]=(g2((c[j+(n>>>13<<2)>>2]|0)+(n&8191)|0)|0)&65535;n=n+2&65535;continue L1;break};case 150:case 134:{q=q&-2;v=122;break};case 158:case 142:{v=122;break};case 214:case 198:{q=q&-2;v=124;break};case 222:case 206:{v=124;break};case 144:case 145:case 146:case 147:case 148:case 149:case 151:case 128:case 129:case 130:case 131:case 132:case 133:case 135:{q=q&-2;v=126;break};case 152:case 153:case 154:case 155:case 156:case 157:case 159:case 136:case 137:case 138:case 139:case 140:case 141:case 143:{v=126;break};case 190:{u=d[(c[j+((e[k+4>>1]|0)>>13<<2)>>2]|0)+(b[k+4>>1]&8191)|0]|0;v=133;break};case 254:{g=g+1|0;v=133;break};case 184:case 185:case 186:case 187:case 188:case 189:case 191:{u=d[k-184+(t^1)|0]|0;v=133;break};case 57:{u=n;v=138;break};case 9:case 25:case 41:{u=e[k-1+(t>>>3)>>1]|0;v=138;break};case 39:{s=d[k+6|0]|0;if((s|0)>153){q=q|1}w=96&-(q&1);if((q&16|0)!=0){v=143}else{if((s&15|0)>9){v=143}}if((v|0)==143){v=0;w=w|6}if((q&2|0)!=0){w=-w|0}s=s+w|0;q=q&3|((d[k+6|0]|0)^s)&16|(d[l+(s&255)|0]|0);a[k+6|0]=s&255;continue L1;break};case 52:{u=(d[(c[j+((e[k+4>>1]|0)>>13<<2)>>2]|0)+(b[k+4>>1]&8191)|0]|0)+1|0;c[j+76>>2]=m;k6(l,e[k+4>>1]|0,u);v=149;break};case 4:case 12:case 20:case 28:case 36:case 44:case 60:{s=k+(t>>>3^1)|0;w=(a[s]|0)+1&255;a[s]=w;u=w&255;v=149;break};case 53:{u=(d[(c[j+((e[k+4>>1]|0)>>13<<2)>>2]|0)+(b[k+4>>1]&8191)|0]|0)-1|0;c[j+76>>2]=m;k6(l,e[k+4>>1]|0,u);v=154;break};case 5:case 13:case 21:case 29:case 37:case 45:case 61:{w=k+(t>>>3^1)|0;s=(a[w]|0)-1&255;a[w]=s;u=s&255;v=154;break};case 3:case 19:case 35:{s=k+(t>>>3)|0;b[s>>1]=(b[s>>1]|0)+1&65535;continue L1;break};case 51:{n=n+1&65535;continue L1;break};case 11:case 27:case 43:{s=k-1+(t>>>3)|0;b[s>>1]=(b[s>>1]|0)-1&65535;continue L1;break};case 59:{n=n-1&65535;continue L1;break};case 166:{u=d[(c[j+((e[k+4>>1]|0)>>13<<2)>>2]|0)+(b[k+4>>1]&8191)|0]|0;v=164;break};case 230:{g=g+1|0;v=164;break};case 160:case 161:case 162:case 163:case 164:case 165:case 167:{u=d[k-160+(t^1)|0]|0;v=164;break};case 182:{u=d[(c[j+((e[k+4>>1]|0)>>13<<2)>>2]|0)+(b[k+4>>1]&8191)|0]|0;v=168;break};case 246:{g=g+1|0;v=168;break};case 176:case 177:case 178:case 179:case 180:case 181:case 183:{u=d[k-176+(t^1)|0]|0;v=168;break};case 174:{u=d[(c[j+((e[k+4>>1]|0)>>13<<2)>>2]|0)+(b[k+4>>1]&8191)|0]|0;v=172;break};case 238:{g=g+1|0;v=172;break};case 168:case 169:case 170:case 171:case 172:case 173:case 175:{u=d[k-168+(t^1)|0]|0;v=172;break};case 112:case 113:case 114:case 115:case 116:case 117:case 119:{c[j+76>>2]=m;k6(l,e[k+4>>1]|0,d[k-112+(t^1)|0]|0);continue L1;break};case 65:case 66:case 67:case 68:case 69:case 71:case 72:case 74:case 75:case 76:case 77:case 79:case 80:case 81:case 83:case 84:case 85:case 87:case 88:case 89:case 90:case 92:case 93:case 95:case 96:case 97:case 98:case 99:case 101:case 103:case 104:case 105:case 106:case 107:case 108:case 111:case 120:case 121:case 122:case 123:case 124:case 125:{a[k+(t>>>3&7^1)|0]=a[k+(t&7^1)|0]|0;continue L1;break};case 6:case 14:case 22:case 30:case 38:{a[k+(t>>>3^1)|0]=u&255;g=g+1|0;continue L1;break};case 54:{g=g+1|0;c[j+76>>2]=m;k6(l,e[k+4>>1]|0,u);continue L1;break};case 70:case 78:case 86:case 94:case 102:case 110:case 126:{a[k-8+(t>>>3^1)|0]=a[(c[j+((e[k+4>>1]|0)>>13<<2)>>2]|0)+(b[k+4>>1]&8191)|0]|0;continue L1;break};case 1:case 17:case 33:{b[k+(t>>>3)>>1]=(g2(r)|0)&65535;g=g+2|0;continue L1;break};case 49:{n=g2(r)|0;g=g+2|0;continue L1;break};case 42:{s=g2(r)|0;g=g+2|0;b[k+4>>1]=(g2((c[j+(s>>>13<<2)>>2]|0)+(s&8191)|0)|0)&65535;continue L1;break};case 50:{s=g2(r)|0;g=g+2|0;c[j+76>>2]=m;k6(l,s,d[k+6|0]|0);continue L1;break};case 34:{s=g2(r)|0;g=g+2|0;g3((c[j+36+(s>>>13<<2)>>2]|0)+(s&8191)|0,e[k+4>>1]|0);continue L1;break};case 2:case 18:{c[j+76>>2]=m;k6(l,e[k+(t>>>3)>>1]|0,d[k+6|0]|0);continue L1;break};case 10:case 26:{a[k+6|0]=a[(c[j+((e[k-1+(t>>>3)>>1]|0)>>13<<2)>>2]|0)+(b[k-1+(t>>>3)>>1]&8191)|0]|0;continue L1;break};case 249:{n=e[k+4>>1]|0;continue L1;break};case 7:{s=d[k+6|0]|0;s=s<<1|s>>>7;q=q&196|s&41;a[k+6|0]=s&255;continue L1;break};case 15:{s=d[k+6|0]|0;q=q&196|s&1;s=s<<7|s>>>1;q=q|s&40;a[k+6|0]=s&255;continue L1;break};case 23:{s=(d[k+6|0]|0)<<1|q&1;q=q&196|s&40|s>>>8;a[k+6|0]=s&255;continue L1;break};case 31:{s=q<<7|(d[k+6|0]|0)>>1;q=q&196|s&40|a[k+6|0]&1;a[k+6|0]=s&255;continue L1;break};case 47:{s=~(d[k+6|0]|0);q=q&197|s&40|18;a[k+6|0]=s&255;continue L1;break};case 63:{q=q&197^1|q<<4&16|a[k+6|0]&40;continue L1;break};case 55:{q=q&196|1|a[k+6|0]&40;continue L1;break};case 219:{g=g+1|0;a[k+6|0]=(k9(l,m+(c[j+72>>2]|0)|0,u+((d[k+6|0]|0)<<8)|0)|0)&255;continue L1;break};case 227:{s=g2((c[j+(n>>>13<<2)>>2]|0)+(n&8191)|0)|0;g3((c[j+36+(n>>>13<<2)>>2]|0)+(n&8191)|0,e[k+4>>1]|0);b[k+4>>1]=s&65535;continue L1;break};case 235:{s=e[k+4>>1]|0;b[k+4>>1]=b[k+2>>1]|0;b[k+2>>1]=s&65535;continue L1;break};case 217:{s=e[l+616>>1]|0;b[l+616>>1]=b[k>>1]|0;b[k>>1]=s&65535;s=e[l+618>>1]|0;b[l+618>>1]=b[k+2>>1]|0;b[k+2>>1]=s&65535;s=e[l+620>>1]|0;b[l+620>>1]=b[k+4>>1]|0;b[k+4>>1]=s&65535;continue L1;break};case 243:{a[l+624|0]=0;a[l+625|0]=0;continue L1;break};case 251:{a[l+624|0]=1;a[l+625|0]=1;continue L1;break};case 118:{v=199;break L1;break};case 203:{g=g+1|0;switch(u|0){case 6:{m=m+7|0;u=e[k+4>>1]|0;v=202;break L9;break};case 0:case 1:case 2:case 3:case 4:case 5:case 7:{s=k+(u^1)|0;w=d[s]|0;w=w<<1&255|w>>>7;q=d[l+w|0]|0|w&1;a[s]=w&255;continue L1;break};case 22:{m=m+7|0;u=e[k+4>>1]|0;v=205;break L9;break};case 16:case 17:case 18:case 19:case 20:case 21:case 23:{w=k-16+(u^1)|0;s=(d[w]|0)<<1|q&1;q=d[l+s|0]|0;a[w]=s&255;continue L1;break};case 38:{m=m+7|0;u=e[k+4>>1]|0;v=208;break L9;break};case 32:case 33:case 34:case 35:case 36:case 37:case 39:{s=k-32+(u^1)|0;w=(d[s]|0)<<1;q=d[l+w|0]|0;a[s]=w&255;continue L1;break};case 54:{m=m+7|0;u=e[k+4>>1]|0;v=211;break L9;break};case 48:case 49:case 50:case 51:case 52:case 53:case 55:{w=k-48+(u^1)|0;s=(d[w]|0)<<1|1;q=d[l+s|0]|0;a[w]=s&255;continue L1;break};case 14:{m=m+7|0;u=e[k+4>>1]|0;v=214;break L9;break};case 8:case 9:case 10:case 11:case 12:case 13:case 15:{s=k-8+(u^1)|0;w=d[s]|0;q=w&1;w=w<<7&255|w>>>1;q=q|(d[l+w|0]|0);a[s]=w&255;continue L1;break};case 30:{m=m+7|0;u=e[k+4>>1]|0;v=217;break L9;break};case 24:case 25:case 26:case 27:case 28:case 29:case 31:{w=k-24+(u^1)|0;s=d[w]|0;x=s&1;s=q<<7&255|s>>>1;q=d[l+s|0]|0|x;a[w]=s&255;continue L1;break};case 46:{u=e[k+4>>1]|0;m=m+7|0;v=220;break L9;break};case 40:case 41:case 42:case 43:case 44:case 45:case 47:{s=k-40+(u^1)|0;w=d[s]|0;q=w&1;w=w&128|w>>>1;q=q|(d[l+w|0]|0);a[s]=w&255;continue L1;break};case 62:{m=m+7|0;u=e[k+4>>1]|0;v=223;break L9;break};case 56:case 57:case 58:case 59:case 60:case 61:case 63:{w=k-56+(u^1)|0;s=d[w]|0;q=s&1;s=s>>>1;q=q|(d[l+s|0]|0);a[w]=s&255;continue L1;break};case 70:case 78:case 86:case 94:case 102:case 110:case 118:case 126:{m=m+4|0;y=d[(c[j+((e[k+4>>1]|0)>>13<<2)>>2]|0)+(b[k+4>>1]&8191)|0]|0;q=q&1;break};case 64:case 65:case 66:case 67:case 68:case 69:case 71:case 72:case 73:case 74:case 75:case 76:case 77:case 79:case 80:case 81:case 82:case 83:case 84:case 85:case 87:case 88:case 89:case 90:case 91:case 92:case 93:case 95:case 96:case 97:case 98:case 99:case 100:case 101:case 103:case 104:case 105:case 106:case 107:case 108:case 109:case 111:case 112:case 113:case 114:case 115:case 116:case 117:case 119:case 120:case 121:case 122:case 123:case 124:case 125:case 127:{y=d[k+(u&7^1)|0]|0;q=q&1|y&40;break};case 134:case 142:case 150:case 158:case 166:case 174:case 182:case 190:case 198:case 206:case 214:case 222:case 230:case 238:case 246:case 254:{m=m+7|0;s=d[(c[j+((e[k+4>>1]|0)>>13<<2)>>2]|0)+(b[k+4>>1]&8191)|0]|0;w=1<<(u>>>3&7);s=s|w;if((u&64|0)==0){s=s^w}c[j+76>>2]=m;k6(l,e[k+4>>1]|0,s);continue L1;break};case 192:case 193:case 194:case 195:case 196:case 197:case 199:case 200:case 201:case 202:case 203:case 204:case 205:case 207:case 208:case 209:case 210:case 211:case 212:case 213:case 215:case 216:case 217:case 218:case 219:case 220:case 221:case 223:case 224:case 225:case 226:case 227:case 228:case 229:case 231:case 232:case 233:case 234:case 235:case 236:case 237:case 239:case 240:case 241:case 242:case 243:case 244:case 245:case 247:case 248:case 249:case 250:case 251:case 252:case 253:case 255:{s=k+(u&7^1)|0;a[s]=(d[s]|0|1<<(u>>>3&7))&255;continue L1;break};case 128:case 129:case 130:case 131:case 132:case 133:case 135:case 136:case 137:case 138:case 139:case 140:case 141:case 143:case 144:case 145:case 146:case 147:case 148:case 149:case 151:case 152:case 153:case 154:case 155:case 156:case 157:case 159:case 160:case 161:case 162:case 163:case 164:case 165:case 167:case 168:case 169:case 170:case 171:case 172:case 173:case 175:case 176:case 177:case 178:case 179:case 180:case 181:case 183:case 184:case 185:case 186:case 187:case 188:case 189:case 191:{s=k+(u&7^1)|0;a[s]=(d[s]|0)&~(1<<(u>>>3&7))&255;continue L1;break};default:{v=233;break L1}}s=y&1<<(u>>>3&7);q=q|(s&128|16|s-1>>8&68);continue L1;break};case 237:{g=g+1|0;m=m+((d[21144+u|0]|0)>>4)|0;L234:do{switch(u|0){case 114:case 122:{z=n;if(!0){v=238;break L234}v=237;break};case 66:case 82:case 98:case 74:case 90:case 106:{v=237;break};case 64:case 72:case 80:case 88:case 96:case 104:case 112:case 120:{s=k9(l,m+(c[j+72>>2]|0)|0,e[k>>1]|0)|0;a[k-8+(u>>>3^1)|0]=s&255;q=q&1|(d[l+s|0]|0);continue L1;break};case 113:{a[k+7|0]=0;v=245;break};case 65:case 73:case 81:case 89:case 97:case 105:case 121:{v=245;break};case 115:{A=n;if(!0){v=249;break L234}v=248;break};case 67:case 83:{v=248;break};case 75:case 91:{s=g2(r+1|0)|0;g=g+2|0;b[k-9+(u>>>3)>>1]=(g2((c[j+(s>>>13<<2)>>2]|0)+(s&8191)|0)|0)&65535;continue L1;break};case 123:{s=g2(r+1|0)|0;g=g+2|0;n=g2((c[j+(s>>>13<<2)>>2]|0)+(s&8191)|0)|0;continue L1;break};case 103:{s=d[(c[j+((e[k+4>>1]|0)>>13<<2)>>2]|0)+(b[k+4>>1]&8191)|0]|0;c[j+76>>2]=m;k6(l,e[k+4>>1]|0,(d[k+6|0]|0)<<4|s>>>4);s=a[k+6|0]&240|s&15;q=q&1|(d[l+s|0]|0);a[k+6|0]=s&255;continue L1;break};case 111:{s=d[(c[j+((e[k+4>>1]|0)>>13<<2)>>2]|0)+(b[k+4>>1]&8191)|0]|0;c[j+76>>2]=m;k6(l,e[k+4>>1]|0,s<<4|a[k+6|0]&15);s=a[k+6|0]&240|s>>>4;q=q&1|(d[l+s|0]|0);a[k+6|0]=s&255;continue L1;break};case 68:case 76:case 84:case 92:case 100:case 108:case 116:case 124:{t=16;q=q&-2;u=d[k+6|0]|0;a[k+6|0]=0;v=127;break L9;break};case 169:case 185:{B=-1;if(!0){v=258;break L234}v=257;break};case 161:case 177:{v=257;break};case 168:case 184:{C=-1;if(!0){v=269;break L234}v=268;break};case 160:case 176:{v=268;break};case 171:case 187:{D=-1;if(!0){v=277;break L234}v=276;break};case 163:case 179:{v=276;break};case 170:case 186:{E=-1;if(!0){v=284;break L234}v=283;break};case 162:case 178:{v=283;break};case 71:{a[l+627|0]=a[k+6|0]|0;continue L1;break};case 79:{a[l+626|0]=a[k+6|0]|0;f=1;continue L1;break};case 87:{a[k+6|0]=a[l+627|0]|0;v=292;break};case 95:{a[k+6|0]=a[l+626|0]|0;f=1;v=292;break};case 69:case 77:case 85:case 93:case 101:case 109:case 117:case 125:{a[l+624|0]=a[l+625|0]|0;v=85;break L9;break};case 70:case 78:case 102:case 110:{a[l+628|0]=0;continue L1;break};case 86:case 118:{a[l+628|0]=1;continue L1;break};case 94:case 126:{a[l+628|0]=2;continue L1;break};default:{f=1;continue L1}}}while(0);if((v|0)==237){v=0;z=e[k+((u>>>3&6)>>>0)>>1]|0;v=238}else if((v|0)==245){v=0;k8(l,m+(c[j+72>>2]|0)|0,e[k>>1]|0,d[k-8+(u>>>3^1)|0]|0);continue L1}else if((v|0)==248){v=0;A=e[k-8+(u>>>3)>>1]|0;v=249}else if((v|0)==257){v=0;B=1;v=258}else if((v|0)==268){v=0;C=1;v=269}else if((v|0)==276){v=0;D=1;v=277}else if((v|0)==283){v=0;E=1;v=284}else if((v|0)==292){v=0;q=q&1|(d[l+(d[k+6|0]|0)|0]|0)&-5|(d[l+625|0]|0)<<2&4;continue L1}if((v|0)==238){v=0;s=z+(q&1)|0;q=~u>>>2&2;if((q|0)!=0){s=-s|0}s=s+(e[k+4>>1]|0)|0;z=z^(e[k+4>>1]|0);z=z^s;q=q|(s>>>16&1|z>>>8&16|s>>>8&168|(z+32768|0)>>>14&4);b[k+4>>1]=s&65535;if((s&65535)<<16>>16!=0){continue L1}else{q=q|64;continue L1}}else if((v|0)==249){v=0;s=g2(r+1|0)|0;g=g+2|0;g3((c[j+36+(s>>>13<<2)>>2]|0)+(s&8191)|0,A);continue L1}else if((v|0)==258){v=0;s=e[k+4>>1]|0;b[k+4>>1]=s+B&65535;w=d[(c[j+(s>>>13<<2)>>2]|0)+(s&8191)|0]|0;s=(d[k+6|0]|0)-w|0;q=q&1|2|((w^(d[k+6|0]|0))&16^s)&144;if((s&255)<<24>>24==0){q=q|64}s=s-((q&16)>>4)|0;q=q|s&8;q=q|s<<4&32;s=k|0;w=(b[s>>1]|0)-1&65535;b[s>>1]=w;if(w<<16>>16==0){continue L1}q=q|4;do{if((q&64|0)==0){if(u>>>0<176>>>0){break}g=g-2|0;m=m+5|0;continue L1}}while(0);continue L1}else if((v|0)==269){v=0;w=e[k+4>>1]|0;b[k+4>>1]=w+C&65535;s=d[(c[j+(w>>>13<<2)>>2]|0)+(w&8191)|0]|0;w=e[k+2>>1]|0;b[k+2>>1]=w+C&65535;c[j+76>>2]=m;k6(l,w,s);s=s+(d[k+6|0]|0)|0;q=q&193|s&8|s<<4&32;s=k|0;w=(b[s>>1]|0)-1&65535;b[s>>1]=w;if(w<<16>>16==0){continue L1}q=q|4;if(u>>>0<176>>>0){continue L1}else{g=g-2|0;m=m+5|0;continue L1}}else if((v|0)==277){v=0;w=e[k+4>>1]|0;b[k+4>>1]=w+D&65535;s=d[(c[j+(w>>>13<<2)>>2]|0)+(w&8191)|0]|0;w=k+1|0;x=(a[w]|0)-1&255;a[w]=x;w=x&255;q=s>>6&2|(d[l+w|0]|0)&-5;do{if((w|0)!=0){if(u>>>0<176>>>0){break}g=g-2|0;m=m+5|0}}while(0);k8(l,m+(c[j+72>>2]|0)|0,e[k>>1]|0,s);continue L1}else if((v|0)==284){v=0;w=e[k+4>>1]|0;b[k+4>>1]=w+E&65535;x=k9(l,m+(c[j+72>>2]|0)|0,e[k>>1]|0)|0;F=k+1|0;G=(a[F]|0)-1&255;a[F]=G;F=G&255;q=x>>6&2|(d[l+F|0]|0)&-5;do{if((F|0)!=0){if(u>>>0<176>>>0){break}g=g-2|0;m=m+5|0}}while(0);c[j+76>>2]=m;k6(l,w,x);continue L1}break};case 221:{H=o;v=300;break};case 253:{H=p;v=300;break};default:{v=379;break L1}}}while(0);L311:do{if((v|0)==2){v=0;m=m-5|0;continue L1}else if((v|0)==3){v=0;m=m-7|0;v=4}else if((v|0)==85){v=0;g=g2((c[j+(n>>>13<<2)>>2]|0)+(n&8191)|0)|0;n=n+2&65535;continue L1}else if((v|0)==111){v=0;F=g+2|0;g=g2(r)|0;n=n-2&65535;g3((c[j+36+(n>>>13<<2)>>2]|0)+(n&8191)|0,F);continue L1}else if((v|0)==115){v=0;u=g;g=t&56;v=118}else if((v|0)==122){v=0;u=d[(c[j+((e[k+4>>1]|0)>>13<<2)>>2]|0)+(b[k+4>>1]&8191)|0]|0;v=127}else if((v|0)==124){v=0;g=g+1|0;v=127}else if((v|0)==126){v=0;u=d[k+(t&7^1)|0]|0;v=127}else if((v|0)==138){v=0;F=(e[k+4>>1]|0)+u|0;u=u^(e[k+4>>1]|0);b[k+4>>1]=F&65535;q=q&196|F>>>16|F>>>8&40|(u^F)>>>8&16;continue L1}else if((v|0)==300){v=0;g=g+1|0;F=d[(c[j+(g>>>13<<2)>>2]|0)+(g&8191)|0]|0;m=m+(a[21144+u|0]&15)|0;L322:do{switch(u|0){case 150:case 134:{q=q&-2;v=302;break};case 158:case 142:{v=302;break};case 148:case 132:{q=q&-2;v=304;break};case 156:case 140:{v=304;break};case 149:case 133:{q=q&-2;v=306;break};case 157:case 141:{v=306;break};case 57:{I=n;v=310;break};case 41:{I=H;v=310;break};case 9:case 25:{I=e[k-1+(u>>>3)>>1]|0;v=310;break};case 166:{g=g+1|0;u=d[(c[j+((H+((F&255)<<24>>24)&65535)>>13<<2)>>2]|0)+(H+((F&255)<<24>>24)&65535&8191)|0]|0;v=164;break L311;break};case 164:{u=H>>>8;v=164;break L311;break};case 165:{u=H&255;v=164;break L311;break};case 182:{g=g+1|0;u=d[(c[j+((H+((F&255)<<24>>24)&65535)>>13<<2)>>2]|0)+(H+((F&255)<<24>>24)&65535&8191)|0]|0;v=168;break L311;break};case 180:{u=H>>>8;v=168;break L311;break};case 181:{u=H&255;v=168;break L311;break};case 174:{g=g+1|0;u=d[(c[j+((H+((F&255)<<24>>24)&65535)>>13<<2)>>2]|0)+(H+((F&255)<<24>>24)&65535&8191)|0]|0;v=172;break L311;break};case 172:{u=H>>>8;v=172;break L311;break};case 173:{u=H&255;v=172;break L311;break};case 190:{g=g+1|0;u=d[(c[j+((H+((F&255)<<24>>24)&65535)>>13<<2)>>2]|0)+(H+((F&255)<<24>>24)&65535&8191)|0]|0;v=133;break L311;break};case 188:{u=H>>>8;v=133;break L311;break};case 189:{u=H&255;v=133;break L311;break};case 112:case 113:case 114:case 115:case 116:case 117:case 119:{u=d[k-112+(u^1)|0]|0;if(!0){v=326;break L322}v=325;break};case 54:{v=325;break};case 68:case 76:case 84:case 92:case 124:{a[k-8+(u>>>3^1)|0]=H>>>8&255;continue L1;break};case 100:case 109:{continue L1;break};case 69:case 77:case 85:case 93:case 125:{a[k-8+(u>>>3^1)|0]=H&255;continue L1;break};case 70:case 78:case 86:case 94:case 102:case 110:case 126:{g=g+1|0;a[k-8+(u>>>3^1)|0]=a[(c[j+((H+((F&255)<<24>>24)&65535)>>13<<2)>>2]|0)+(H+((F&255)<<24>>24)&65535&8191)|0]|0;continue L1;break};case 38:{g=g+1|0;v=334;break};case 101:{F=H&255;v=334;break};case 96:case 97:case 98:case 99:case 103:{F=d[k-96+(u^1)|0]|0;v=334;break};case 46:{g=g+1|0;v=338;break};case 108:{F=H>>>8;v=338;break};case 104:case 105:case 106:case 107:case 111:{F=d[k-104+(u^1)|0]|0;v=338;break};case 249:{n=H;continue L1;break};case 34:{s=g2(r+1|0)|0;g=g+2|0;g3((c[j+36+(s>>>13<<2)>>2]|0)+(s&8191)|0,H);continue L1;break};case 33:{H=g2(r+1|0)|0;g=g+2|0;break};case 42:{s=g2(r+1|0)|0;H=g2((c[j+(s>>>13<<2)>>2]|0)+(s&8191)|0)|0;g=g+2|0;break};case 203:{u=H+((F&255)<<24>>24)&65535;g=g+1|0;F=d[(c[j+(g>>>13<<2)>>2]|0)+(g&8191)|0]|0;g=g+1|0;switch(F|0){case 6:{v=202;break L311;break};case 22:{v=205;break L311;break};case 38:{v=208;break L311;break};case 54:{v=211;break L311;break};case 14:{v=214;break L311;break};case 30:{v=217;break L311;break};case 46:{v=220;break L311;break};case 62:{v=223;break L311;break};case 70:case 78:case 86:case 94:case 102:case 110:case 118:case 126:{s=(d[(c[j+(u>>>13<<2)>>2]|0)+(u&8191)|0]|0)&1<<(F>>>3&7);q=q&1|16|s&128|s-1>>8&68;continue L1;break};case 134:case 142:case 150:case 158:case 166:case 174:case 182:case 190:case 198:case 206:case 214:case 222:case 230:case 238:case 246:case 254:{s=d[(c[j+(u>>>13<<2)>>2]|0)+(u&8191)|0]|0;G=1<<(F>>>3&7);s=s|G;if((F&64|0)==0){s=s^G}c[j+76>>2]=m;k6(l,u,s);continue L1;break};default:{f=1;continue L1}}break};case 35:{H=H+1&65535;break};case 43:{H=H-1&65535;break};case 52:{H=H+((F&255)<<24>>24)&65535;g=g+1|0;u=(d[(c[j+(H>>>13<<2)>>2]|0)+(H&8191)|0]|0)+1|0;c[j+76>>2]=m;k6(l,H,u);v=149;break L311;break};case 53:{H=H+((F&255)<<24>>24)&65535;g=g+1|0;u=(d[(c[j+(H>>>13<<2)>>2]|0)+(H&8191)|0]|0)-1|0;c[j+76>>2]=m;k6(l,H,u);v=154;break L311;break};case 36:{H=H+256&65535;u=H>>>8;v=366;break};case 44:{u=H+1&255;H=H&65280|u;v=366;break};case 37:{H=H-256&65535;u=H>>>8;v=371;break};case 45:{u=H-1&255;H=H&65280|u;v=371;break};case 229:{u=H;v=118;break L311;break};case 225:{H=g2((c[j+(n>>>13<<2)>>2]|0)+(n&8191)|0)|0;n=n+2&65535;break};case 233:{g=H;continue L1;break};case 227:{s=g2((c[j+(n>>>13<<2)>>2]|0)+(n&8191)|0)|0;g3((c[j+36+(n>>>13<<2)>>2]|0)+(n&8191)|0,H);H=s;break};default:{f=1;g=g-1|0;continue L1}}}while(0);if((v|0)==302){v=0;g=g+1|0;t=u;u=d[(c[j+((H+((F&255)<<24>>24)&65535)>>13<<2)>>2]|0)+(H+((F&255)<<24>>24)&65535&8191)|0]|0;v=127;break}else if((v|0)==304){v=0;t=u;u=H>>>8;v=127;break}else if((v|0)==306){v=0;t=u;u=H&255;v=127;break}else if((v|0)==310){v=0;x=H+I|0;I=I^H;H=x&65535;q=q&196|x>>>16|x>>>8&40|(I^x)>>>8&16}else if((v|0)==325){v=0;g=g+1|0;u=d[(c[j+(g>>>13<<2)>>2]|0)+(g&8191)|0]|0;v=326}else if((v|0)==334){v=0;H=H&255|F<<8}else if((v|0)==338){v=0;H=H&65280|F}else if((v|0)==366){v=0;if((t|0)==221){o=H;v=149;break}else{p=H;v=149;break}}else if((v|0)==371){v=0;if((t|0)==221){o=H;v=154;break}else{p=H;v=154;break}}if((v|0)==326){v=0;g=g+1|0;c[j+76>>2]=m;k6(l,H+((F&255)<<24>>24)&65535,u);continue L1}if((t|0)==221){o=H;continue L1}else{p=H;continue L1}}}while(0);if((v|0)==4){v=0;g=g+2|0;continue}else if((v|0)==118){v=0;n=n-2&65535;g3((c[j+36+(n>>>13<<2)>>2]|0)+(n&8191)|0,u);continue}else if((v|0)==127){v=0;r=u+(q&1)|0;u=u^(d[k+6|0]|0);q=t>>>3&2;if((q|0)!=0){r=-r|0}r=r+(d[k+6|0]|0)|0;u=u^r;q=q|(u&16|(u+128|0)>>>6&4|(d[l+(r&511)|0]|0)&-5);a[k+6|0]=r&255;continue}else if((v|0)==133){v=0;r=(d[k+6|0]|0)-u|0;q=2|u&40|r>>8&1;u=u^(d[k+6|0]|0);q=q|(((r^(d[k+6|0]|0))&u)>>>5&4|(u&16^r)&144);if((r&255)<<24>>24!=0){continue}else{q=q|64;continue}}else if((v|0)==149){v=0;q=q&1|(u&15)-1&16|(d[l+(u&255)|0]|0)&-5;if((u|0)!=128){continue}else{q=q|4;continue}}else if((v|0)==154){v=0;q=q&1|2|(u&15)+1&16|(d[l+(u&255)|0]|0)&-5;if((u|0)!=127){continue}else{q=q|4;continue}}else if((v|0)==164){v=0;r=k+6|0;a[r]=(d[r]|0)&u&255;q=d[l+(d[k+6|0]|0)|0]|0|16;continue}else if((v|0)==168){v=0;r=k+6|0;a[r]=(d[r]|0|u)&255;q=d[l+(d[k+6|0]|0)|0]|0;continue}else if((v|0)==172){v=0;r=k+6|0;a[r]=((d[r]|0)^u)&255;q=d[l+(d[k+6|0]|0)|0]|0;continue}else if((v|0)==202){v=0;r=d[(c[j+(u>>>13<<2)>>2]|0)+(u&8191)|0]|0;r=r<<1&255|r>>>7;q=d[l+r|0]|0|r&1;c[j+76>>2]=m;k6(l,u,r);continue}else if((v|0)==205){v=0;r=(d[(c[j+(u>>>13<<2)>>2]|0)+(u&8191)|0]|0)<<1|q&1;q=d[l+r|0]|0;c[j+76>>2]=m;k6(l,u,r);continue}else if((v|0)==208){v=0;r=(d[(c[j+(u>>>13<<2)>>2]|0)+(u&8191)|0]|0)<<1;q=d[l+r|0]|0;c[j+76>>2]=m;k6(l,u,r);continue}else if((v|0)==211){v=0;r=(d[(c[j+(u>>>13<<2)>>2]|0)+(u&8191)|0]|0)<<1|1;q=d[l+r|0]|0;c[j+76>>2]=m;k6(l,u,r);continue}else if((v|0)==214){v=0;r=d[(c[j+(u>>>13<<2)>>2]|0)+(u&8191)|0]|0;q=r&1;r=r<<7&255|r>>>1;q=q|(d[l+r|0]|0);c[j+76>>2]=m;k6(l,u,r);continue}else if((v|0)==217){v=0;r=d[(c[j+(u>>>13<<2)>>2]|0)+(u&8191)|0]|0;x=r&1;r=q<<7&255|r>>>1;q=d[l+r|0]|0|x;c[j+76>>2]=m;k6(l,u,r);continue}else if((v|0)==220){v=0;r=d[(c[j+(u>>>13<<2)>>2]|0)+(u&8191)|0]|0;q=r&1;r=r&128|r>>>1;q=q|(d[l+r|0]|0);c[j+76>>2]=m;k6(l,u,r);continue}else if((v|0)==223){v=0;r=d[(c[j+(u>>>13<<2)>>2]|0)+(u&8191)|0]|0;q=r&1;r=r>>>1;q=q|(d[l+r|0]|0);c[j+76>>2]=m;k6(l,u,r);continue}}if((v|0)==11){m=m-u|0;J=g;K=J-1|0;g=K;L=m;M=j+76|0;c[M>>2]=L;N=q;O=N&255;P=k;Q=P+7|0;a[Q]=O;R=o;S=R&65535;T=l+600|0;U=T+4|0;b[U>>1]=S;V=p;W=V&65535;X=l+600|0;Y=X+6|0;b[Y>>1]=W;Z=n;_=Z&65535;$=l+600|0;aa=$+2|0;b[aa>>1]=_;ab=g;ac=ab&65535;ad=l+600|0;ae=ad|0;b[ae>>1]=ac;af=l+600|0;ag=af+8|0;ah=ag;ai=k;aj=ah;ak=ai;sg(aj|0,ak|0,8)|0;al=l+520|0;am=al;an=j;sg(am|0,an|0,80)|0;ao=l+520|0;ap=l+516|0;c[ap>>2]=ao;aq=f;ar=aq&1;i=h;return ar|0}else if((v|0)==113){m=m-11|0;J=g;K=J-1|0;g=K;L=m;M=j+76|0;c[M>>2]=L;N=q;O=N&255;P=k;Q=P+7|0;a[Q]=O;R=o;S=R&65535;T=l+600|0;U=T+4|0;b[U>>1]=S;V=p;W=V&65535;X=l+600|0;Y=X+6|0;b[Y>>1]=W;Z=n;_=Z&65535;$=l+600|0;aa=$+2|0;b[aa>>1]=_;ab=g;ac=ab&65535;ad=l+600|0;ae=ad|0;b[ae>>1]=ac;af=l+600|0;ag=af+8|0;ah=ag;ai=k;aj=ah;ak=ai;sg(aj|0,ak|0,8)|0;al=l+520|0;am=al;an=j;sg(am|0,an|0,80)|0;ao=l+520|0;ap=l+516|0;c[ap>>2]=ao;aq=f;ar=aq&1;i=h;return ar|0}else if((v|0)==199){m=m&3;J=g;K=J-1|0;g=K;L=m;M=j+76|0;c[M>>2]=L;N=q;O=N&255;P=k;Q=P+7|0;a[Q]=O;R=o;S=R&65535;T=l+600|0;U=T+4|0;b[U>>1]=S;V=p;W=V&65535;X=l+600|0;Y=X+6|0;b[Y>>1]=W;Z=n;_=Z&65535;$=l+600|0;aa=$+2|0;b[aa>>1]=_;ab=g;ac=ab&65535;ad=l+600|0;ae=ad|0;b[ae>>1]=ac;af=l+600|0;ag=af+8|0;ah=ag;ai=k;aj=ah;ak=ai;sg(aj|0,ak|0,8)|0;al=l+520|0;am=al;an=j;sg(am|0,an|0,80)|0;ao=l+520|0;ap=l+516|0;c[ap>>2]=ao;aq=f;ar=aq&1;i=h;return ar|0}else if((v|0)==233){at(4168,8432,1059,11280);return 0}else if((v|0)==379){at(4168,8432,1686,11280);return 0}return 0}function kI(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;a=(c[(c[b+516>>2]|0)+72>>2]|0)-d|0;c[(c[b+516>>2]|0)+72>>2]=d;d=(c[b+516>>2]|0)+76|0;c[d>>2]=(c[d>>2]|0)+a;return}function kJ(a){a=a|0;var b=0;b=a;kD(b+336|0);bR(b);c[b>>2]=16096;jV(b+968|0);fQ(b+66840|0);kK(b+68128|0);c[b+68920>>2]=0;g5(b,c[16]|0);g7(b,6);fh(b,13368);g6(b,13336);sf(b+68924|0,-1|0,256);return}function kK(a){a=a|0;ln(a);return}function kL(a){a=a|0;var b=0;b=a;kM(b);bT(b);return}function kM(a){a=a|0;var b=0;b=a;c[b>>2]=16096;a3[c[(c[b>>2]|0)+8>>2]&511](b);jW(b+968|0);bU(b);return}function kN(a){a=a|0;var b=0;b=a;a=c[b+68920>>2]|0;if((a|0)!=0){gI(a);sb(a)}c[b+68920>>2]=0;ff(b);return}function kO(a,b,c){a=a|0;b=b|0;c=c|0;kP(a+992|0,b);return 0}function kP(b,c){b=b|0;c=c|0;var d=0;d=b;b=c;c=4944;if((a[d+15|0]&2|0)!=0){c=4752;if((a[d+15|0]&4|0)!=0){c=4688}}ex(b+16|0,c);return}function kQ(b){b=b|0;var d=0,e=0.0;d=b;e=+hf(d)*1.4;if(a[d+1024|0]&1){e=e*1.5}fT(d+66840|0,e);kR(d+68128|0,e);if((c[d+68920>>2]|0)==0){return}gG(c[d+68920>>2]|0,e);return}function kR(a,b){a=a|0;b=+b;gJ(a+232|0,262451171875.0e-17*b);return}function kS(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0;f=b;sf(f+992|0,0,32);b=j3(f+968|0,e,16,f+992|0,0)|0;if((b|0)!=0){g=b;h=g;return h|0}b=kT(f+992|0)|0;if((b|0)!=0){g=b;h=g;return h|0}if((d[f+995|0]|0)==67){if((a[f+1006|0]|0)!=0){a[f+1006|0]=0;eT(f,672)}if((d[f+1007|0]&-16|0)!=0){b=f+1007|0;a[b]=d[b]&15;eT(f,672)}}else{b=f+1008|0;e=j1(f+968|0)|0;i=kU(16,d[f+1006|0]|0)|0;sg(b|0,e|0,i)|0;if((d[f+1006|0]|0)>16){eT(f,672)}}if((a[f+1007|0]&9|0)!=0){eT(f,224)}c[f+1028>>2]=49152;if((a[f+1007|0]&4|0)!=0){c[f+1028>>2]=0}do{if((a[f+1007|0]&2|0)!=0){if((c[f+68920>>2]|0)!=0){break}i=sa(1600)|0;gD(i);c[f+68920>>2]=i;if((i|0)==0){g=10376;h=g;return h|0}else{break}}}while(0);he(f,8);g=b3(f,3579545)|0;h=g;return h|0}function kT(a){a=a|0;var b=0,d=0,e=0;b=a;do{if((sj(b|0,5432,4)|0)!=0){if((sj(b|0,5208,4)|0)==0){break}d=c[2]|0;e=d;return e|0}}while(0);d=0;e=d;return e|0}function kU(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((c|0)<(a|0)){d=c}else{d=a}return d|0}function kV(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;hh(b+66840|0,d);kW(b+68128|0,d);if((c[b+68920>>2]|0)==0){return}gK(c[b+68920>>2]|0,d);return}function kW(a,b){a=a|0;b=b|0;gM(a+232|0,b);return}function kX(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=b;b=d;d=a;a=g-3|0;if((a|0)>=0){kY(d+68128|0,a,b)}else{f1(d+66840|0,g,b)}if((c[d+68920>>2]|0)==0){return}if((g|0)>=4){return}gN(c[d+68920>>2]|0,g,b,e,f);return}function kY(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;if(e>>>0<5>>>0){}else{at(5624,6672,66,11544)}c[a+(e<<4)+12>>2]=d;return}function kZ(b,d){b=b|0;d=+d;var e=0;e=b;c[e+1036>>2]=~~(+(((a[e+1007|0]&64|0)!=0?71590:59659)|0)/d);return}function k_(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;g=f;f=e;e=b5(f,g)|0;if((e|0)!=0){h=e;i=h;return i|0}sf(f+1048|0,-55|0,16384);sf(f+17432|0,0,49408);e=f+1049|0;sg(e|0,13408,13)|0;e=f+1195|0;a[e]=a[13400]|0;a[e+1|0]=a[13401]|0;a[e+2|0]=a[13402]|0;a[e+3|0]=a[13403]|0;a[e+4|0]=a[13404]|0;a[e+5|0]=a[13405]|0;e=g2(f+996|0)|0;j=g2(f+998|0)|0;k=k$(j,j5(f+968|0)|0)|0;k=k$(k,65536-e|0)|0;if((k|0)!=(j|0)){eT(f,9952)}j=f+1048+e|0;e=j1(f+968|0)|0;l=e+(d[f+1006|0]|0)|0;e=k;sg(j|0,l|0,e)|0;j6(f+968|0,(-k|0)-(d[f+1006|0]|0)|0);e=k0(f)|0;l=((j5(f+968|0)|0)-k+e-1|0)/(e|0)|0;c[f+1032>>2]=a[f+1005|0]&127;if((c[f+1032>>2]|0)>(l|0)){c[f+1032>>2]=l;eT(f,9184)}a[f+66583|0]=-1;kE(f+336|0,f+69180|0,f+68924|0);kG(f+336|0,0,65536,f+1048|0,f+1048|0);fU(f+66840|0);k1(f+68128|0);if((c[f+68920>>2]|0)!=0){gH(c[f+68920>>2]|0,0,0)}b[f+938>>1]=-3200;l=f+938|0;e=(b[l>>1]|0)-1&65535;b[l>>1]=e;a[f+1048+(e&65535)|0]=-1;e=f+938|0;l=(b[e>>1]|0)-1&65535;b[e>>1]=l;a[f+1048+(l&65535)|0]=-1;a[f+950|0]=g&255;b[f+936>>1]=(g2(f+1e3|0)|0)&65535;c[f+1040>>2]=c[f+1036>>2];a[f+1024|0]=0;a[f+1025|0]=0;kQ(f);c[f+1044>>2]=0;h=0;i=h;return i|0}function k$(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((c|0)<(a|0)){d=c}else{d=a}return d|0}function k0(a){a=a|0;return 16384>>((d[a+1005|0]|0)>>7&1)|0}function k1(a){a=a|0;var b=0;b=a;c[b+80>>2]=0;a=0;while(1){if((a|0)>=5){break}sf(b+(a<<4)|0,0,12);a=a+1|0}sf(b+84|0,0,144);return}function k2(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=e;e=a;a=k0(e)|0;g=32768;do{if((b|0)!=0){if((a|0)!=8192){break}g=40960}}while(0);f=f-(d[e+1004|0]|0)|0;if(f>>>0>=(c[e+1032>>2]|0)>>>0){b=e+1048+g|0;kG(e+336|0,g,a,b,b);return}b=$(f,a)|0;f=0;while(1){if(f>>>0>=a>>>0){break}kG(e+336|0,g+f|0,8192,e+69180|0,jQ(e+968|0,b+f|0)|0);f=f+8192|0}return}function k3(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;e=c;c=d;d=b;c=c&255;b=e;if((b|0)==36864){k2(d,0,c);return}else if((b|0)==45056){k2(d,1,c);return}else{b=e&57343^38912;if((b|0)>=144){return}a[d+1024|0]=1;k4(d+68128|0,k5(d+336|0)|0,b,c);return}}function k4(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=d;d=b;if(f>>>0<144>>>0){}else{at(6200,6672,72,11144)}lp(d,c);a[d+84+f|0]=e&255;return}function k5(a){a=a|0;var b=0;b=a;return(c[(c[b+516>>2]|0)+76>>2]|0)+(c[(c[b+516>>2]|0)+72>>2]|0)|0}function k6(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b;b=d;d=e;a[k7(f,b)|0]=d&255;if((b&c[f-336+1028>>2]|0)!=32768){return}k3(f-336|0,b,d);return}function k7(a,b){a=a|0;b=b|0;var d=0;d=b;return(c[(c[a+516>>2]|0)+36+(d>>>13<<2)>>2]|0)+(d&8191)|0}function k8(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=d;d=f;d=d&255;f=b-336|0;L632:do{switch(e&255|0){case 160:{c[f+1044>>2]=d&15;return};case 161:{hq(f+66840|0,g,c[f+1044>>2]|0,d);return};case 6:{do{if((c[f+68920>>2]|0)!=0){if((a[f+1007|0]&4|0)==0){break}gT(c[f+68920>>2]|0,g,d);return}}while(0);return};case 126:case 127:{if((c[f+68920>>2]|0)!=0){gU(c[f+68920>>2]|0,g,d);return}else{return}break};case 254:{k2(f,0,d);return};case 241:{if((d|0)==0){break L632}return};case 240:case 168:{break};default:{return}}}while(0);return}function k9(a,b,c){a=a|0;b=b|0;c=c|0;return 0}function la(d,f,g){d=d|0;f=f|0;g=g|0;var h=0;g=f;f=d;while(1){d=k5(f+336|0)|0;if((d|0)>=(c[g>>2]|0)){break}d=kU(c[g>>2]|0,c[f+1040>>2]|0)|0;kH(f+336|0,kU(c[g>>2]|0,c[f+1040>>2]|0)|0)|0;if((e[f+936>>1]|0|0)==65535){lb(f+336|0,d)}d=k5(f+336|0)|0;if((d|0)>=(c[f+1040>>2]|0)){d=f+1040|0;c[d>>2]=(c[d>>2]|0)+(c[f+1036>>2]|0);if((e[f+936>>1]|0|0)==65535){if(!(a[f+1025|0]&1)){a[f+1025|0]=1;if(a[f+1024|0]&1){kQ(f)}}d=f+938|0;h=(b[d>>1]|0)-1&65535;b[d>>1]=h;a[f+1048+(h&65535)|0]=-1;h=f+938|0;d=(b[h>>1]|0)-1&65535;b[h>>1]=d;a[f+1048+(d&65535)|0]=-1;b[f+936>>1]=(g2(f+1002|0)|0)&65535}}}c[g>>2]=k5(f+336|0)|0;d=f+1040|0;c[d>>2]=(c[d>>2]|0)-(c[g>>2]|0);lc(f+336|0,-(c[g>>2]|0)|0);hy(f+66840|0,c[g>>2]|0);ld(f+68128|0,c[g>>2]|0);if((c[f+68920>>2]|0)==0){return 0}gS(c[f+68920>>2]|0,c[g>>2]|0);return 0}function lb(a,b){a=a|0;b=b|0;var d=0;d=a;c[(c[d+516>>2]|0)+76>>2]=b-(c[(c[d+516>>2]|0)+72>>2]|0);return}function lc(a,b){a=a|0;b=b|0;var d=0;d=(c[a+516>>2]|0)+76|0;c[d>>2]=(c[d>>2]|0)+b;return}function ld(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if((d|0)>(c[b+80>>2]|0)){lp(b,d)}a=b+80|0;c[a>>2]=(c[a>>2]|0)-d;if((c[b+80>>2]|0)>=0){return}at(6856,6672,82,11128);return}function le(){var a=0,b=0,c=0;a=hB(77376)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;kJ(b);c=b}return c|0}function lf(){var a=0,b=0,c=0;a=hB(336)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;lg(b);c=b}return c|0}function lg(a){a=a|0;lh(a);return}function lh(a){a=a|0;var b=0;b=a;hE(b);c[b>>2]=15264;g5(b,c[16]|0);return}function li(a){a=a|0;lm(a);return}function lj(a){a=a|0;var b=0;b=a;li(b);bT(b);return}function lk(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;b=a5[c[(c[a>>2]|0)+12>>2]&127](a,d+316|0,16)|0;if((b|0)==0){e=kT(d+316|0)|0;f=e;return f|0}if((b|0)==19344){g=c[2]|0}else{g=b}e=g;f=e;return f|0}function ll(a,b,c){a=a|0;b=b|0;c=c|0;kP(a+316|0,b);return 0}function lm(a){a=a|0;fO(a);return}function ln(a){a=a|0;var b=0;b=a;gX(b+232|0);lo(b,0);return}function lo(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;a=0;while(1){if((a|0)>=5){break}c[b+(a<<4)+12>>2]=d;a=a+1|0}return}function lp(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=e;e=b;b=0;while(1){if((b|0)>=5){break}g=e+(b<<4)|0;h=c[g+12>>2]|0;if((h|0)!=0){fX(h);i=((a[e+84+((b<<1)+129)|0]&15)<<8)+(d[e+84+((b<<1)+128)|0]|0)+1|0;j=0;if((d[e+227|0]&1<<b|0)!=0){if((i|0)>((((fY(h)|0)+524288|0)>>>0)/262144|0|0)){j=(a[e+84+(b+138)|0]&15)<<3}}k=e+84+(b<<5)|0;if((b|0)==4){k=k-32|0}l=$(a[k+(c[g+4>>2]|0)|0]|0,j)|0;m=l-(c[g+8>>2]|0)|0;if((m|0)!=0){c[g+8>>2]=l;gB(e+232|0,c[e+80>>2]|0,m,h)}m=(c[e+80>>2]|0)+(c[g>>2]|0)|0;if((m|0)<(f|0)){if((j|0)!=0){l=c[g+4>>2]|0;n=a[k+l|0]|0;l=l+1&31;do{o=a[k+l|0]|0;l=l+1&31;p=o-n|0;if((p|0)!=0){n=o;gB(e+232|0,m,$(p,j)|0,h)}m=m+i|0;}while((m|0)<(f|0));h=l-1&31;l=h;c[g+4>>2]=h;c[g+8>>2]=$(a[k+l|0]|0,j)|0}else{h=(f-m+i-1|0)/(i|0)|0;c[g+4>>2]=(c[g+4>>2]|0)+h&31;m=m+($(h,i)|0)|0}}c[g>>2]=m-f}b=b+1|0}c[e+80>>2]=f;return}function lq(a){a=a|0;var b=0;b=a;lr(b+20|0,b+1992|0);lr(b+64|0,b+1992|0);ls(b+112|0);lt(b+712|0);lu(b+1304|0);fR(b+1992|0);h[b+1936>>3]=1.0;c[b+1372>>2]=b;c[b+1364>>2]=0;c[b+1984>>2]=0;c[b>>2]=b+20;c[b+4>>2]=b+64;c[b+8>>2]=b+712;c[b+12>>2]=b+112;c[b+16>>2]=b+1304;lv(b,0);lw(b,1.0);lx(b,0,0);return}function lr(a,b){a=a|0;b=b|0;lS(a,b);return}function ls(a){a=a|0;lR(a);return}function lt(a){a=a|0;lQ(a);return}function lu(a){a=a|0;lP(a);return}function lv(a,b){a=a|0;b=b|0;var c=0;c=b;b=a;a=0;while(1){if((a|0)>=5){break}lz(b,a,c);a=a+1|0}return}function lw(b,c){b=b|0;c=+c;var d=0.0,e=0;d=c;e=b;a[e+1363|0]=0;f0(e+1992|0,.00752*d);gJ(e+744|0,.00851*d);gJ(e+152|0,.00494*d);gJ(e+1376|0,.00335*d);return}function lx(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=e;e=b;a[e+1362|0]=d&1&1;lA(e,+h[e+1936>>3]);lB(e+20|0);lB(e+64|0);lC(e+712|0);lD(e+112|0);mv(e+1304|0);c[e+1944>>2]=0;c[e+1948>>2]=0;c[e+1972>>2]=0;a[e+1980|0]=0;c[e+1952>>2]=1073741824;c[e+1964>>2]=1;lE(e,0,16407,0);lE(e,0,16405,0);d=16384;while(1){if(d>>>0>16403>>>0){break}lE(e,0,d,(d&3|0)!=0?0:16);d=d+1|0}c[e+1352>>2]=f;if(!(a[e+1363|0]&1)){c[e+732>>2]=15}if(a[e+1363|0]&1){return}c[e+1324>>2]=f;return}function ly(a,b){a=a|0;b=b|0;var c=0;c=b;b=a;gL(b+1992|0,c);gM(b+744|0,c);gM(b+152|0,c);gM(b+1376|0,c);return}function lz(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;if(e>>>0<5>>>0){}else{at(192,10280,143,11256)}c[(c[a+(e<<2)>>2]|0)+8>>2]=d;return}function lA(b,d){b=b|0;d=+d;var e=0.0,f=0;e=d;f=b;h[f+1936>>3]=e;c[f+1960>>2]=a[f+1362|0]&1?8314:7458;if(e==1.0){return}c[f+1960>>2]=~~(+(c[f+1960>>2]|0)/e)&-2;return}function lB(a){a=a|0;var b=0;b=a;c[b+36>>2]=0;lN(b);return}function lC(a){a=a|0;var b=0;b=a;c[b+28>>2]=0;c[b+24>>2]=1;lO(b);return}function lD(a){a=a|0;var b=0;b=a;c[b+32>>2]=16384;lN(b);return}function lE(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=e;e=f;f=g;g=b;if(e>>>0>32>>>0){}else{at(2520,8280,285,11224)}if(f>>>0<=255>>>0){}else{at(1744,8280,286,11224)}if((e-16384|0)>>>0>23>>>0){return}lG(g,h);if(e>>>0<16404>>>0){b=(e-16384|0)>>>2;i=c[g+(b<<2)>>2]|0;j=e&3;a[i+j|0]=f&255;a[i+4+j|0]=1;if((b|0)==4){mx(g+1304|0,j,f)}else{if((j|0)==3){if((c[g+1972>>2]>>b&1|0)!=0){c[i+12>>2]=d[20960+(f>>3&31)|0]|0}if((b|0)<2){c[i+32>>2]=7}}}return}if((e|0)==16405){i=5;while(1){b=i;i=b-1|0;if((b|0)==0){break}if((f>>i&1|0)==0){c[(c[g+(i<<2)>>2]|0)+12>>2]=0}}i=a[g+1361|0]&1;a[g+1361|0]=0;b=c[g+1972>>2]|0;c[g+1972>>2]=f;if((f&16|0)!=0){if((b&16|0)==0){my(g+1304|0)}}else{c[g+1356>>2]=1073741824;i=1}if(i&1){lF(g)}}else{if((e|0)==16407){c[g+1976>>2]=f;e=((f&64|0)!=0^1)&1;i=g+1980|0;a[i]=(a[i]&1&(e&1)|0)!=0|0;c[g+1956>>2]=1073741824;c[g+1964>>2]=c[g+1964>>2]&1;c[g+1968>>2]=0;if((f&128|0)==0){c[g+1968>>2]=1;f=g+1964|0;c[f>>2]=(c[f>>2]|0)+(c[g+1960>>2]|0);if(e&1){c[g+1956>>2]=h+(c[g+1964>>2]|0)+((c[g+1960>>2]|0)*3|0)+1}}lF(g)}}return}function lF(b){b=b|0;var d=0;d=b;b=c[d+1356>>2]|0;if((a[d+1361|0]&1|a[d+1980|0]&1|0)!=0){b=0}else{if((b|0)>(c[d+1956>>2]|0)){b=c[d+1956>>2]|0}}if((b|0)==(c[d+1952>>2]|0)){return}c[d+1952>>2]=b;if((c[d+1984>>2]|0)!=0){a3[c[d+1984>>2]&511](c[d+1988>>2]|0)}return}function lG(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=d;d=b;if((e|0)>=(c[d+1944>>2]|0)){}else{at(5520,8280,150,11240)}if((e|0)==(c[d+1944>>2]|0)){return}if((c[d+1948>>2]|0)<(e|0)){b=c[d+1948>>2]|0;c[d+1948>>2]=e;mB(d+1304|0,b,e)}while(1){b=(c[d+1944>>2]|0)+(c[d+1964>>2]|0)|0;if((b|0)>(e|0)){b=e}f=d+1964|0;c[f>>2]=(c[f>>2]|0)-(b-(c[d+1944>>2]|0));mo(d+20|0,c[d+1944>>2]|0,b);mo(d+64|0,c[d+1944>>2]|0,b);ms(d+712|0,c[d+1944>>2]|0,b);mC(d+112|0,c[d+1944>>2]|0,b);c[d+1944>>2]=b;if((b|0)==(e|0)){break}c[d+1964>>2]=c[d+1960>>2];f=d+1968|0;g=c[f>>2]|0;c[f>>2]=g+1;if((g|0)==1){if(!(a[d+1362|0]&1)){f=d+1964|0;c[f>>2]=(c[f>>2]|0)-2}}else if((g|0)==3){c[d+1968>>2]=0;if((c[d+1976>>2]&128|0)!=0){f=d+1964|0;c[f>>2]=(c[f>>2]|0)+((c[d+1960>>2]|0)-(a[d+1362|0]&1?2:6))}}else if((g|0)==0){if((c[d+1976>>2]&192|0)==0){c[d+1956>>2]=b+(c[d+1960>>2]<<2)+2;a[d+1980|0]=1}h=798}else if((g|0)==2){h=798}if((h|0)==798){h=0;mj(d+20|0,32);mj(d+64|0,32);mj(d+112|0,32);mj(d+712|0,128);mm(d+20|0,-1);mm(d+64|0,0);do{if(a[d+1362|0]&1){if((c[d+1968>>2]|0)!=3){break}g=d+1964|0;c[g>>2]=(c[g>>2]|0)-2}}while(0)}mr(d+712|0);mk(d+20|0);mk(d+64|0);mk(d+112|0)}return}function lH(b,d){b=b|0;d=d|0;var e=0;e=d;d=b;if((e|0)>(c[d+1944>>2]|0)){lG(d,e)}if(a[d+1363|0]&1){lI(d+20|0,c[d+1944>>2]|0);lI(d+64|0,c[d+1944>>2]|0);lJ(d+712|0,c[d+1944>>2]|0);lK(d+112|0,c[d+1944>>2]|0);lL(d+1304|0,c[d+1944>>2]|0)}b=d+1944|0;c[b>>2]=(c[b>>2]|0)-e;if((c[d+1944>>2]|0)>=0){}else{at(4144,8280,254,11208)}b=d+1948|0;c[b>>2]=(c[b>>2]|0)-e;if((c[d+1948>>2]|0)>=0){}else{at(3168,8280,257,11208)}if((c[d+1956>>2]|0)!=1073741824){b=d+1956|0;c[b>>2]=(c[b>>2]|0)-e}if((c[d+1356>>2]|0)!=1073741824){b=d+1356|0;c[b>>2]=(c[b>>2]|0)-e}if((c[d+1952>>2]|0)==1073741824){return}b=d+1952|0;c[b>>2]=(c[b>>2]|0)-e;if((c[d+1952>>2]|0)<0){c[d+1952>>2]=0}return}function lI(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+8>>2]|0;e=c[d+20>>2]|0;c[d+20>>2]=0;if((a|0)==0){return}if((e|0)==0){return}fZ(c[d+40>>2]|0,b,-e|0,a);return}function lJ(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+8>>2]|0;e=c[d+20>>2]|0;c[d+20>>2]=0;if((a|0)==0){return}if((e|0)==0){return}gB(d+32|0,b,-e|0,a);return}function lK(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+8>>2]|0;e=c[d+20>>2]|0;c[d+20>>2]=0;if((a|0)==0){return}if((e|0)==0){return}gB(d+40|0,b,-e|0,a);return}function lL(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+8>>2]|0;e=c[d+20>>2]|0;c[d+20>>2]=0;if((a|0)==0){return}if((e|0)==0){return}gB(d+72|0,b,-e|0,a);return}function lM(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=d;d=b;lG(d,e-1|0);b=(a[d+1361|0]&1)<<7|(a[d+1980|0]&1)<<6;f=0;while(1){if((f|0)>=5){break}if((c[(c[d+(f<<2)>>2]|0)+12>>2]|0)!=0){b=b|1<<f}f=f+1|0}lG(d,e);if(!(a[d+1980|0]&1)){g=b;return g|0}b=b|64;a[d+1980|0]=0;lF(d);g=b;return g|0}function lN(a){a=a|0;var b=0;b=a;c[b+24>>2]=0;c[b+28>>2]=0;lO(b);return}function lO(a){a=a|0;var b=0;b=a;c[b+16>>2]=0;c[b+20>>2]=0;return}function lP(a){a=a|0;gX(a+72|0);return}function lQ(a){a=a|0;gX(a+32|0);return}function lR(a){a=a|0;gX(a+40|0);return}function lS(a,b){a=a|0;b=b|0;c[a+40>>2]=b;return}function lT(a,b){a=a|0;b=b|0;var e=0,f=0,g=0;e=b;b=a;a=d[b+336+(e&2047)|0]|0;do{if((e&57344|0)!=0){a=d[lU(b+336|0,e)|0]|0;if(e>>>0>32767>>>0){break}a=d[b+5576+(e&8191)|0]|0;if(e>>>0>24575>>>0){break}if((e|0)==16405){f=lM(b+2640|0,lV(b+336|0)|0)|0;g=f;return g|0}do{if((e|0)==18432){if((c[b+2628>>2]|0)==0){break}f=lW(c[b+2628>>2]|0)|0;g=f;return g|0}}while(0);a=e>>>8;}}while(0);f=a;g=f;return g|0}function lU(a,b){a=a|0;b=b|0;var d=0;d=b;return(c[(c[a+2056>>2]|0)+(d>>>11<<2)>>2]|0)+((d>>>0)%2048|0)|0}function lV(a){a=a|0;var b=0;b=a;return(c[(c[b+2056>>2]|0)+136>>2]|0)+(c[(c[b+2056>>2]|0)+132>>2]|0)|0}function lW(a){a=a|0;return d[l5(a)|0]|0|0}function lX(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;e=c;c=d;d=b;b=e^24576;if(b>>>0<8192>>>0){a[d+5576+b|0]=c&255;return}if((e&57344|0)==0){a[d+336+(e&2047)|0]=c&255;return}if((e-16384|0)>>>0<=23>>>0){lE(d+2640|0,lV(d+336|0)|0,e,c);return}b=e-24568|0;if(b>>>0>=8>>>0){nk(d,e,c);return}e=lY(d+2604|0,c<<12)|0;if((e|0)>=(lZ(d+2604|0)|0)){eT(d,3264)}l_(d+336|0,b+8<<12,4096,l$(d+2604|0,e)|0,0);return}function lY(a,b){a=a|0;b=b|0;return b&c[a+16>>2]|0}function lZ(a){a=a|0;return c[a+20>>2]|0}function l_(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=b;b=c;c=d;d=e&1;e=a;if(((f>>>0)%2048|0|0)==0){}else{at(8200,5440,92,11192)}if(((b>>>0)%2048|0|0)==0){}else{at(4120,5440,93,11192)}if((f+b|0)>>>0<=65536>>>0){}else{at(3120,5440,94,11192)}a=(f>>>0)/2048|0;f=(b>>>0)/2048|0;while(1){if((f|0)==0){break}b=a;a=b+1|0;l1(e,b,c);if(!(d&1)){c=c+2048|0}f=f-1|0}return}function l$(a,b){a=a|0;b=b|0;var d=0;d=a;a=lY(d,b)|0;b=a-(c[d+12>>2]|0)|0;if(b>>>0>((eq(d|0)|0)-4104|0)>>>0){b=0}return ce(d|0,b)|0}function l0(d,e){d=d|0;e=e|0;var f=0;f=e;e=d;c[e+2056>>2]=e+2060;a[e+2053|0]=4;a[e+2054|0]=-1;b[e+2048>>1]=0;a[e+2050|0]=0;a[e+2051|0]=0;a[e+2052|0]=0;c[e+2196>>2]=0;c[e+2192>>2]=0;c[e+2200>>2]=1073741824;c[e+2204>>2]=1073741824;c[e+2208>>2]=0;l1(e,32,f);l_(e,8192,57344,f,1);l_(e,0,8192,e|0,1);ej();return}function l1(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;c[(c[a+2056>>2]|0)+(e<<2)>>2]=d+(-(e<<11&2047)|0);return}function l2(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;h=i;i=i+144|0;j=h|0;k=f;l3(k,g);g=j;f=k+2060|0;sg(g|0,f|0,140)|0;c[k+2056>>2]=j;f=c[j+136>>2]|0;g=e[k+2048>>1]|0;l=d[k+2050|0]|0;m=d[k+2051|0]|0;n=d[k+2052|0]|0;o=(d[k+2054|0]|0)+1|256;p=d[k+2053|0]|0;q=p&76;r=p<<8;s=r;r=r|~p&2;L1070:while(1){p=c[j+(g>>>11<<2)>>2]|0;p=p+(g&2047)|0;t=p;p=t+1|0;u=d[t]|0;g=g+1|0;t=d[13072+u|0]|0;v=f+t|0;f=v;do{if((v|0)>=0){if((f|0)<(t|0)){w=942;break}f=f-t|0;g=g-1|0;c[j+136>>2]=f;x=-1;f=c[j+136>>2]|0;if((x|0)>=0){break}if((f|0)>=0){w=1232;break L1070}continue L1070}else{w=942}}while(0);L1084:do{if((w|0)==942){w=0;t=d[p]|0;L1086:do{switch(u|0){case 45:{w=1051;break};case 41:{w=1053;break};case 65:{v=t+m|0;t=((d[k+(v+1&255)|0]|0)<<8)+(d[k+(v&255)|0]|0)|0;w=1063;break};case 81:{v=(d[k+t|0]|0)+n|0;t=v+((d[k+(t+1&255)|0]|0)<<8)|0;f=f+(v>>>8)|0;w=1063;break};case 85:{t=t+m&255;w=1058;break};case 69:{w=1058;break};case 89:{t=t+n|0;w=1061;break};case 93:{t=t+m|0;w=1061;break};case 77:{w=1062;break};case 73:{w=1064;break};case 1:{v=t+m|0;t=((d[k+(v+1&255)|0]|0)<<8)+(d[k+(v&255)|0]|0)|0;w=1074;break};case 17:{v=(d[k+t|0]|0)+n|0;t=v+((d[k+(t+1&255)|0]|0)<<8)|0;f=f+(v>>>8)|0;w=1074;break};case 21:{t=t+m&255;w=1069;break};case 5:{w=1069;break};case 25:{t=t+n|0;w=1072;break};case 29:{t=t+m|0;w=1072;break};case 13:{w=1073;break};case 9:{w=1075;break};case 44:{v=g2(p)|0;g=g+2|0;q=q&-65;c[j+136>>2]=f;r=lT(k-336|0,v)|0;f=c[j+136>>2]|0;q=q|r&64;if((l&r|0)!=0){continue L1070}else{r=r<<8;continue L1070}break};case 36:{r=d[k+t|0]|0;g=g+1|0;q=q&-65;q=q|r&64;if((l&r|0)!=0){continue L1070}else{r=r<<8;continue L1070}break};case 225:{v=t+m|0;t=((d[k+(v+1&255)|0]|0)<<8)+(d[k+(v&255)|0]|0)|0;w=1091;break};case 241:{v=(d[k+t|0]|0)+n|0;t=v+((d[k+(t+1&255)|0]|0)<<8)|0;f=f+(v>>>8)|0;w=1091;break};case 245:{t=t+m&255;w=1086;break};case 229:{w=1086;break};case 249:{t=t+n|0;w=1089;break};case 253:{t=t+m|0;w=1089;break};case 237:{w=1090;break};case 233:{w=1092;break};case 235:{w=1094;break};case 97:{v=t+m|0;t=((d[k+(v+1&255)|0]|0)<<8)+(d[k+(v&255)|0]|0)|0;w=1103;break};case 113:{v=(d[k+t|0]|0)+n|0;t=v+((d[k+(t+1&255)|0]|0)<<8)|0;f=f+(v>>>8)|0;w=1103;break};case 117:{t=t+m&255;w=1098;break};case 101:{w=1098;break};case 121:{t=t+n|0;w=1101;break};case 125:{t=t+m|0;w=1101;break};case 109:{w=1102;break};case 105:{w=1104;break};case 74:{s=0;w=1108;break};case 106:{w=1108;break};case 10:{r=l<<1;s=r;l=r&255;continue L1070;break};case 42:{r=l<<1;v=s>>>8&1;s=r;r=r|v;l=r&255;continue L1070;break};case 94:{t=t+m|0;w=1112;break};case 78:{w=1112;break};case 110:{w=1113;break};case 62:{t=t+m|0;w=1119;break};case 30:{t=t+m|0;w=1117;break};case 14:{w=1117;break};case 46:{w=1118;break};case 126:{t=t+m|0;w=1114;break};case 118:{t=t+m&255;w=1126;break};case 86:{t=t+m&255;w=1124;break};case 70:{w=1124;break};case 102:{w=1125;break};case 54:{t=t+m&255;w=1131;break};case 22:{t=t+m&255;w=1129;break};case 6:{w=1129;break};case 38:{w=1130;break};case 202:{v=m-1|0;r=v;m=v&255;continue L1070;break};case 136:{v=n-1|0;r=v;n=v&255;continue L1070;break};case 246:{t=t+m&255;w=1135;break};case 230:{w=1135;break};case 214:{t=t+m&255;w=1137;break};case 198:{w=1137;break};case 254:{t=m+(g2(p)|0)|0;w=1142;break};case 238:{t=g2(p)|0;w=1142;break};case 222:{t=m+(g2(p)|0)|0;w=1145;break};case 206:{t=g2(p)|0;w=1145;break};case 170:{m=l;r=l;continue L1070;break};case 138:{l=m;r=m;continue L1070;break};case 154:{o=m+1|256;continue L1070;break};case 186:{v=o-1&255;r=v;m=v;continue L1070;break};case 72:{o=o-1|256;a[k+o|0]=l&255;continue L1070;break};case 104:{v=d[k+o|0]|0;r=v;l=v;o=o-255|256;continue L1070;break};case 64:{v=d[k+o|0]|0;g=d[k+(256|o-255)|0]|0;g=g|(d[k+(256|o-254)|0]|0)<<8;o=o-253|256;t=q;q=v&76;r=v<<8;s=r;r=r|~v&2;if(((t^q)&4|0)==0){continue L1070}a[k+2053|0]=q&255;v=(c[j+132>>2]|0)-(c[k+2200>>2]|0)|0;if((v|0)<=0){continue L1070}if((q&4|0)!=0){continue L1070}else{f=f+v|0;c[j+132>>2]=c[k+2200>>2];continue L1070}break};case 40:{v=d[k+o|0]|0;o=o-255|256;y=q^v;q=v&76;r=v<<8;s=r;r=r|~v&2;if((y&4|0)==0){continue L1070}if((q&4|0)!=0){w=1197;break L1086}else{w=1184;break L1086}break};case 8:{y=q&76;y=y|(r>>>8|r)&128;y=y|s>>>8&1;if((r&255|0)==0){y=y|2}o=o-1|256;a[k+o|0]=(y|48)&255;continue L1070;break};case 108:{t=g2(p)|0;y=c[j+(t>>>11<<2)>>2]|0;g=d[y+(t&2047)|0]|0;t=t&65280|t+1&255;g=g|(d[y+(t&2047)|0]|0)<<8;continue L1070;break};case 0:{g=g+1|0;x=4;break L1084;break};case 56:{s=-1;continue L1070;break};case 24:{s=0;continue L1070;break};case 184:{q=q&-65;continue L1070;break};case 216:{q=q&-9;continue L1070;break};case 248:{q=q|8;continue L1070;break};case 88:{if((q&4|0)!=0){q=q&-5;w=1184;break L1086}else{continue L1070}break};case 120:{if((q&4|0)!=0){continue L1070}else{q=q|4;w=1197;break L1086}break};case 28:case 60:case 92:case 124:case 220:case 252:{f=f+((t+m|0)>>>8)|0;w=1201;break};case 12:{w=1201;break};case 116:case 4:case 20:case 52:case 68:case 84:case 100:case 128:case 130:case 137:case 194:case 212:case 226:case 244:{w=1202;break};case 234:case 26:case 58:case 90:case 122:case 218:case 250:{continue L1070;break};case 242:{g=g-1|0;if(g>>>0<=65535>>>0){w=1206;break L1070}g=g&65535;continue L1070;break};case 2:case 18:case 34:case 50:case 66:case 82:case 98:case 114:case 146:case 178:case 210:{w=1207;break L1070;break};case 255:{s=s|1;w=1209;break};case 166:{w=1022;break};case 162:{w=1023;break};case 180:{t=t+m&255;w=1025;break};case 164:{w=1025;break};case 160:{w=1026;break};case 188:{t=t+m|0;f=f+(t>>>8)|0;w=1028;break};case 172:{w=1028;break};case 190:{t=t+n|0;f=f+(t>>>8)|0;w=1030;break};case 174:{w=1030;break};case 140:{z=n;w=1033;break};case 142:{z=m;w=1033;break};case 236:{y=g2(p)|0;g=g+1|0;c[j+136>>2]=f;t=lT(k-336|0,y)|0;f=c[j+136>>2]|0;w=1039;break};case 228:{t=d[k+t|0]|0;w=1038;break};case 224:{w=1038;break};case 204:{y=g2(p)|0;g=g+1|0;c[j+136>>2]=f;t=lT(k-336|0,y)|0;f=c[j+136>>2]|0;w=1043;break};case 196:{t=d[k+t|0]|0;w=1042;break};case 192:{w=1042;break};case 33:{y=t+m|0;t=((d[k+(y+1&255)|0]|0)<<8)+(d[k+(y&255)|0]|0)|0;w=1052;break};case 49:{y=(d[k+t|0]|0)+n|0;t=y+((d[k+(t+1&255)|0]|0)<<8)|0;f=f+(y>>>8)|0;w=1052;break};case 53:{t=t+m&255;w=1047;break};case 37:{w=1047;break};case 57:{t=t+n|0;w=1050;break};case 61:{t=t+m|0;w=1050;break};case 209:{y=(d[k+t|0]|0)+n|0;t=y+((d[k+(t+1&255)|0]|0)<<8)|0;f=f+(y>>>8)|0;w=965;break};case 213:{t=t+m&255;w=960;break};case 197:{w=960;break};case 232:{y=m+1|0;r=y;m=y&255;continue L1070;break};case 205:{w=964;break};case 201:{w=966;break};case 181:{y=d[k+(t+m&255)|0]|0;r=y;l=y;g=g+1|0;continue L1070;break};case 165:{y=d[k+t|0]|0;r=y;l=y;g=g+1|0;continue L1070;break};case 141:{A=g2(p)|0;g=g+2|0;if(A>>>0<=2047>>>0){a[k+A|0]=l&255;continue L1070}else{w=990;break L1086}break};case 157:{A=m+(g2(p)|0)|0;g=g+2|0;if(A>>>0<=2047>>>0){a[k+A|0]=l&255;continue L1070}else{w=990;break L1086}break};case 76:{g=g2(p)|0;continue L1070;break};case 193:{y=t+m|0;t=((d[k+(y+1&255)|0]|0)<<8)+(d[k+(y&255)|0]|0)|0;w=965;break};case 48:{y=(t&255)<<24>>24;v=g+1|0;g=v;if((r&32896|0)!=0){g=g+y&65535;f=f+(((v&255)+y|0)>>>8&1)|0;continue L1070}else{w=938;break L1086}break};case 240:{y=(t&255)<<24>>24;v=g+1|0;g=v;if((r&255)<<24>>24!=0){w=938;break L1086}else{g=g+y&65535;f=f+(((v&255)+y|0)>>>8&1)|0;continue L1070}break};case 149:{t=t+m&255;w=975;break};case 145:{A=(d[k+t|0]|0)+n+((d[k+(t+1&255)|0]|0)<<8)|0;g=g+1|0;w=990;break};case 129:{y=t+m|0;A=((d[k+(y+1&255)|0]|0)<<8)+(d[k+(y&255)|0]|0)|0;g=g+1|0;w=990;break};case 169:{g=g+1|0;l=t;r=t;continue L1070;break};case 161:{y=t+m|0;B=((d[k+(y+1&255)|0]|0)<<8)+(d[k+(y&255)|0]|0)|0;g=g+1|0;w=1004;break};case 177:{B=(d[k+t|0]|0)+n|0;f=f+(B>>>8)|0;B=B+((d[k+(t+1&255)|0]|0)<<8)|0;g=g+1|0;y=d[(c[j+(B>>>11<<2)>>2]|0)+(B&2047)|0]|0;r=y;l=y;if((B^32768)>>>0<=40959>>>0){continue L1070}else{w=1004;break L1086}break};case 185:{f=f+((t+n|0)>>>8)|0;B=(g2(p)|0)+n|0;g=g+2|0;y=d[(c[j+(B>>>11<<2)>>2]|0)+(B&2047)|0]|0;r=y;l=y;if((B^32768)>>>0<=40959>>>0){continue L1070}else{w=1004;break L1086}break};case 32:{y=g+1|0;g=g2(p)|0;a[k+(256|o-1)|0]=y>>>8&255;o=o-2|256;a[k+o|0]=y&255;continue L1070;break};case 217:{t=t+n|0;w=963;break};case 221:{t=t+m|0;w=963;break};case 176:{y=(t&255)<<24>>24;v=g+1|0;g=v;if((s&256|0)!=0){g=g+y&65535;f=f+(((v&255)+y|0)>>>8&1)|0;continue L1070}else{w=938;break L1086}break};case 144:{y=(t&255)<<24>>24;v=g+1|0;g=v;if((s&256|0)!=0){w=938;break L1086}else{g=g+y&65535;f=f+(((v&255)+y|0)>>>8&1)|0;continue L1070}break};case 148:{t=t+m&255;w=1018;break};case 132:{w=1018;break};case 150:{t=t+n&255;w=1020;break};case 134:{w=1020;break};case 182:{t=t+n&255;w=1022;break};case 16:{y=(t&255)<<24>>24;v=g+1|0;g=v;if((r&32896|0)!=0){w=938;break L1086}else{g=g+y&65535;f=f+(((v&255)+y|0)>>>8&1)|0;continue L1070}break};case 189:{f=f+((t+m|0)>>>8)|0;B=(g2(p)|0)+m|0;g=g+2|0;y=d[(c[j+(B>>>11<<2)>>2]|0)+(B&2047)|0]|0;r=y;l=y;if((B^32768)>>>0<=40959>>>0){continue L1070}else{w=1004;break L1086}break};case 80:{y=(t&255)<<24>>24;v=g+1|0;g=v;if((q&64|0)!=0){w=938;break L1086}else{g=g+y&65535;f=f+(((v&255)+y|0)>>>8&1)|0;continue L1070}break};case 112:{y=(t&255)<<24>>24;v=g+1|0;g=v;if((q&64|0)!=0){g=g+y&65535;f=f+(((v&255)+y|0)>>>8&1)|0;continue L1070}else{w=938;break L1086}break};case 208:{y=(t&255)<<24>>24;v=g+1|0;g=v;if((r&255)<<24>>24!=0){g=g+y&65535;f=f+(((v&255)+y|0)>>>8&1)|0;continue L1070}else{w=938;break L1086}break};case 133:{w=975;break};case 200:{y=n+1|0;r=y;n=y&255;continue L1070;break};case 168:{n=l;r=l;continue L1070;break};case 152:{l=n;r=n;continue L1070;break};case 173:{y=g2(p)|0;g=g+2|0;c[j+136>>2]=f;r=lT(k-336|0,y)|0;f=c[j+136>>2]|0;l=r;continue L1070;break};case 96:{g=(d[k+o|0]|0)+1|0;g=g+((d[k+(256|o-255)|0]|0)<<8)|0;o=o-254|256;continue L1070;break};case 153:{A=n+(g2(p)|0)|0;g=g+2|0;if(A>>>0<=2047>>>0){a[k+A|0]=l&255;continue L1070}else{w=990;break L1086}break};default:{w=1209}}}while(0);if((w|0)==1058){w=0;t=d[k+t|0]|0;w=1065}else if((w|0)==1061){w=0;f=f+(t>>>8)|0;w=1062}else if((w|0)==1069){w=0;t=d[k+t|0]|0;w=1076}else if((w|0)==1072){w=0;f=f+(t>>>8)|0;w=1073}else if((w|0)==1086){w=0;t=d[k+t|0]|0;w=1093}else if((w|0)==1089){w=0;f=f+(t>>>8)|0;w=1090}else if((w|0)==1098){w=0;t=d[k+t|0]|0;w=1105}else if((w|0)==1101){w=0;f=f+(t>>>8)|0;w=1102}else if((w|0)==1108){w=0;r=s>>>1&128;s=l<<8;r=r|l>>>1;l=r;continue L1070}else if((w|0)==1112){w=0;s=0;w=1113}else if((w|0)==1117){w=0;s=0;w=1118}else if((w|0)==1124){w=0;s=0;w=1125}else if((w|0)==1129){w=0;s=0;w=1130}else if((w|0)==1135){w=0;r=1;w=1138}else if((w|0)==1137){w=0;r=-1;w=1138}else if((w|0)==1142){w=0;r=1;w=1146}else if((w|0)==1145){w=0;r=-1;w=1146}else if((w|0)==1184){w=0;a[k+2053|0]=q&255;y=(c[j+132>>2]|0)-(c[k+2200>>2]|0)|0;do{if((y|0)<=0){if((f+(c[j+132>>2]|0)|0)<(c[k+2200>>2]|0)){continue L1070}else{break}}else{c[j+132>>2]=c[k+2200>>2];f=f+y|0;if((f|0)<0){continue L1070}if((y|0)>=(f+1|0)){v=j+132|0;c[v>>2]=(c[v>>2]|0)+(f+1);f=-1;continue L1070}else{break}}}while(0);continue L1070}else if((w|0)==1197){w=0;a[k+2053|0]=q&255;y=(c[j+132>>2]|0)-(c[k+2204>>2]|0)|0;c[j+132>>2]=c[k+2204>>2];f=f+y|0;if((f|0)<0){continue L1070}else{continue L1070}}else if((w|0)==1201){w=0;g=g+1|0;w=1202}else if((w|0)==1209){w=0;y=d[p-1|0]|0;v=(d[13328+(y>>>2&7)|0]|0)>>(y<<1&6)&3;if((y|0)==156){v=2}g=g+v|0;v=k+2208|0;c[v>>2]=(c[v>>2]|0)+1;if((y>>>4|0)==11){if((y|0)==179){t=d[k+t|0]|0}if((y|0)!=183){f=f+((t+n|0)>>>8)|0}}continue L1070}else if((w|0)==1022){w=0;t=d[k+t|0]|0;w=1023}else if((w|0)==1025){w=0;t=d[k+t|0]|0;w=1026}else if((w|0)==1028){w=0;y=t+((d[p+1|0]|0)<<8)|0;g=g+2|0;c[j+136>>2]=f;v=lT(k-336|0,y)|0;r=v;n=v;f=c[j+136>>2]|0;continue L1070}else if((w|0)==1030){w=0;v=t+((d[p+1|0]|0)<<8)|0;g=g+2|0;c[j+136>>2]=f;y=lT(k-336|0,v)|0;r=y;m=y;f=c[j+136>>2]|0;continue L1070}else if((w|0)==1033){w=0;y=g2(p)|0;g=g+2|0;if(y>>>0<=2047>>>0){a[k+y|0]=z&255;continue L1070}else{c[j+136>>2]=f;lX(k-336|0,y,z);f=c[j+136>>2]|0;continue L1070}}else if((w|0)==1038){w=0;w=1039}else if((w|0)==1042){w=0;w=1043}else if((w|0)==1047){w=0;t=d[k+t|0]|0;w=1054}else if((w|0)==938){w=0;f=f-1|0;continue L1070}else if((w|0)==960){w=0;t=d[k+t|0]|0;w=967}else if((w|0)==990){w=0;c[j+136>>2]=f;lX(k-336|0,A,l);f=c[j+136>>2]|0;continue L1070}else if((w|0)==963){w=0;f=f+(t>>>8)|0;w=964}else if((w|0)==1018){w=0;g=g+1|0;a[k+t|0]=n&255;continue L1070}else if((w|0)==1020){w=0;g=g+1|0;a[k+t|0]=m&255;continue L1070}else if((w|0)==1050){w=0;f=f+(t>>>8)|0;w=1051}else if((w|0)==1004){w=0;c[j+136>>2]=f;y=lT(k-336|0,B)|0;r=y;l=y;f=c[j+136>>2]|0;continue L1070}else if((w|0)==975){w=0;g=g+1|0;a[k+t|0]=l&255;continue L1070}if((w|0)==1051){w=0;g=g+1|0;t=t+((d[p+1|0]|0)<<8)|0;w=1052}else if((w|0)==1062){w=0;g=g+1|0;t=t+((d[p+1|0]|0)<<8)|0;w=1063}else if((w|0)==1073){w=0;g=g+1|0;t=t+((d[p+1|0]|0)<<8)|0;w=1074}else if((w|0)==1090){w=0;g=g+1|0;t=t+((d[p+1|0]|0)<<8)|0;w=1091}else if((w|0)==1102){w=0;g=g+1|0;t=t+((d[p+1|0]|0)<<8)|0;w=1103}else if((w|0)==1113){w=0;w=1114}else if((w|0)==1118){w=0;w=1119}else if((w|0)==1125){w=0;w=1126}else if((w|0)==1130){w=0;w=1131}else if((w|0)==1138){w=0;r=r+(d[k+t|0]|0)|0;w=1139}else if((w|0)==1146){w=0;c[j+136>>2]=f;r=r+(lT(k-336|0,t)|0)|0;g=g+2|0;lX(k-336|0,t,r&255);f=c[j+136>>2]|0;continue L1070}else if((w|0)==1202){w=0;g=g+1|0;continue L1070}else if((w|0)==1023){w=0;g=g+1|0;m=t;r=t;continue L1070}else if((w|0)==1026){w=0;g=g+1|0;n=t;r=t;continue L1070}else if((w|0)==1039){w=0;r=m-t|0;g=g+1|0;s=~r;r=r&255;continue L1070}else if((w|0)==1043){w=0;r=n-t|0;g=g+1|0;s=~r;r=r&255;continue L1070}else if((w|0)==964){w=0;g=g+1|0;t=t+((d[p+1|0]|0)<<8)|0;w=965}if((w|0)==1052){w=0;c[j+136>>2]=f;t=lT(k-336|0,t)|0;f=c[j+136>>2]|0;w=1053}else if((w|0)==1063){w=0;c[j+136>>2]=f;t=lT(k-336|0,t)|0;f=c[j+136>>2]|0;w=1064}else if((w|0)==1074){w=0;c[j+136>>2]=f;t=lT(k-336|0,t)|0;f=c[j+136>>2]|0;w=1075}else if((w|0)==1091){w=0;c[j+136>>2]=f;t=lT(k-336|0,t)|0;f=c[j+136>>2]|0;w=1092}else if((w|0)==1103){w=0;c[j+136>>2]=f;t=lT(k-336|0,t)|0;f=c[j+136>>2]|0;w=1104}else if((w|0)==1114){w=0;g=g+1|0;t=t+((d[p+1|0]|0)<<8)|0;c[j+136>>2]=f;y=lT(k-336|0,t)|0;r=s>>>1&128|y>>1;s=y<<8;w=1120}else if((w|0)==1119){w=0;g=g+1|0;t=t+((d[p+1|0]|0)<<8)|0;r=s>>>8&1;c[j+136>>2]=f;y=(lT(k-336|0,t)|0)<<1;s=y;r=r|y;w=1120}else if((w|0)==1126){w=0;y=d[k+t|0]|0;r=s>>>1&128|y>>1;s=y<<8;w=1139}else if((w|0)==1131){w=0;r=s>>>8&1;y=(d[k+t|0]|0)<<1;s=y;r=r|y;w=1139}else if((w|0)==965){w=0;c[j+136>>2]=f;t=lT(k-336|0,t)|0;f=c[j+136>>2]|0;w=966}if((w|0)==1053){w=0;w=1054}else if((w|0)==1064){w=0;w=1065}else if((w|0)==1075){w=0;w=1076}else if((w|0)==1092){w=0;w=1093}else if((w|0)==1104){w=0;w=1105}else if((w|0)==1120){w=0;g=g+1|0;lX(k-336|0,t,r&255);f=c[j+136>>2]|0;continue L1070}else if((w|0)==1139){w=0;g=g+1|0;a[k+t|0]=r&255;continue L1070}else if((w|0)==966){w=0;w=967}if((w|0)==1054){w=0;y=l&t;l=y;r=y;g=g+1|0;continue L1070}else if((w|0)==1065){w=0;y=l^t;l=y;r=y;g=g+1|0;continue L1070}else if((w|0)==1076){w=0;y=l|t;l=y;r=y;g=g+1|0;continue L1070}else if((w|0)==1093){w=0;w=1094}else if((w|0)==1105){w=0}else if((w|0)==967){w=0;r=l-t|0;g=g+1|0;s=~r;r=r&255;continue L1070}if((w|0)==1094){w=0;t=t^255}y=s>>>8&1;q=q&-65;q=q|(l^128)+y+((t&255)<<24>>24)>>2&64;v=l+t+y|0;r=v;s=v;g=g+1|0;l=r&255;continue L1070}}while(0);f=f+7|0;a[k+(256|o-1)|0]=g>>>8&255;a[k+(256|o-2)|0]=g&255;g=g2((c[j+124>>2]|0)+2042+x|0)|0;o=o-3|256;t=q&76;t=t|(r>>>8|r)&128;t=t|s>>>8&1;if((r&255|0)==0){t=t|2}t=t|32;if((x|0)!=0){t=t|16}a[k+o|0]=t&255;t=q|4;q=t;a[k+2053|0]=t&255;t=(c[j+132>>2]|0)-(c[k+2204>>2]|0)|0;if((t|0)>=0){continue}else{f=f+t|0;c[j+132>>2]=c[k+2204>>2];continue}}if((w|0)==1206){w=1207}c[j+136>>2]=f;b[k+2048>>1]=g&65535;a[k+2054|0]=o-1&255;a[k+2050|0]=l&255;a[k+2051|0]=m&255;a[k+2052|0]=n&255;n=q&76;n=n|(r>>>8|r)&128;n=n|s>>>8&1;if((r&255|0)==0){n=n|2}a[k+2053|0]=n&255;n=k+2060|0;r=j;sg(n|0,r|0,140)|0;c[k+2056>>2]=k+2060;i=h;return(f|0)<0|0}function l3(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d+2204>>2]=a;b=l4(d,a,c[d+2200>>2]|0)|0;a=(c[d+2056>>2]|0)+136|0;c[a>>2]=(c[a>>2]|0)+b;return}function l4(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=d;d=e;e=b;do{if((d|0)<(f|0)){if((a[e+2053|0]&4|0)!=0){break}f=d}}while(0);d=(c[(c[e+2056>>2]|0)+132>>2]|0)-f|0;c[(c[e+2056>>2]|0)+132>>2]=f;return d|0}function l5(a){a=a|0;var b=0;b=a;a=c[b+100>>2]&127;if((c[b+100>>2]&128|0)!=0){c[b+100>>2]=a+1|128}return b+104+a|0}function l6(a){a=a|0;var b=0;b=a;c[b+48>>2]=0;a=0;while(1){if((a|0)>=3){break}c[b+24+(a<<3)+4>>2]=0;a=a+1|0}sf(b|0,0,24);return}function l7(f,g){f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=g;g=f;if((h|0)>=(c[g+48>>2]|0)){}else{at(3200,8080,43,11760)}f=0;while(1){if((f|0)>=3){break}i=d[g+7|0]>>f;j=d[g+(f+8)|0]|0;k=d[19328+(j&15)|0]|0;l=c[g+24+(f<<3)>>2]|0;if((l|0)!=0){fX(l);do{if((i&9|0)<=1){if((j&31|0)==0){break}}}while(0);if((i&1|j&16|0)!=0){k=0}m=((a[g+((f<<1)+1)|0]&15)<<8<<4)+(d[g+(f<<1)|0]<<4)|0;if(m>>>0<50>>>0){k=0;if((m|0)==0){m=16}}n=k;if((a[g+14+f|0]|0)==0){n=0}o=n-(c[g+24+(f<<3)+4>>2]|0)|0;if((o|0)!=0){c[g+24+(f<<3)+4>>2]=n;fZ(g+56|0,c[g+48>>2]|0,o,l)}o=(c[g+48>>2]|0)+(e[g+18+(f<<1)>>1]|0)|0;if((o|0)<(h|0)){p=(n<<1)-k|0;if((k|0)!=0){do{p=-p|0;gz(g+56|0,o,p,l);o=o+m|0;}while((o|0)<(h|0));c[g+24+(f<<3)+4>>2]=p+k>>1;a[g+14+f|0]=(p|0)>0|0}else{l=((h-o+m-1|0)>>>0)/(m>>>0)|0;j=g+14+f|0;a[j]=(d[j]^l&1)&255;o=o+($(l,m)|0)|0}}b[g+18+(f<<1)>>1]=o-h&65535}f=f+1|0}c[g+48>>2]=h;return}function l8(a){a=a|0;var b=0;b=a;l9(b+232|0);ma(b,0);mb(b,1.0);mc(b);return}function l9(a){a=a|0;mh(a);return}function ma(a,b){a=a|0;b=b|0;var c=0;c=b;b=a;a=0;while(1){if((a|0)>=8){break}md(b,a,c);a=a+1|0}return}function mb(a,b){a=a|0;b=+b;mi(a+232|0,.0125*b);return}function mc(d){d=d|0;var e=0,f=0;e=d;c[e+96>>2]=0;c[e+100>>2]=0;d=0;while(1){if((d|0)>=128){break}a[e+104+d|0]=0;d=d+1|0}d=0;while(1){if((d|0)>=8){break}f=e+(d*12|0)|0;c[f>>2]=0;b[f+8>>1]=0;b[f+10>>1]=0;d=d+1|0}return}function md(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;if(e>>>0<8>>>0){}else{at(3088,2408,92,11664)}c[a+(e*12|0)+4>>2]=d;return}function me(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if((d|0)>(c[b+96>>2]|0)){mf(b,d)}if((c[b+96>>2]|0)>=(d|0)){}else{at(3144,7992,72,11632)}a=b+96|0;c[a>>2]=(c[a>>2]|0)-d;return}function mf(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=f;f=e;e=(d[f+231|0]>>4&7)+1|0;h=8-e|0;while(1){if((h|0)>=8){break}i=f+(h*12|0)|0;j=c[i+4>>2]|0;do{if((j|0)!=0){fX(j);k=bE(j,c[f+96>>2]|0)|0;l=k+(c[i>>2]|0)|0;k=bE(j,g)|0;c[i>>2]=0;if(l>>>0<k>>>0){m=f+104+((h<<3)+64)|0;if((a[m+4|0]&224|0)==0){break}n=a[m+7|0]&15;if((n|0)==0){break}o=((a[m+4|0]&3)<<16)+(d[m+2|0]<<8)+(d[m|0]|0)|0;if((o|0)<(e<<6|0)){break}p=$(((id(j,983040)|0)>>>0)/(o>>>0)|0,e)|0;o=32-((d[m+4|0]>>2&7)<<2)|0;if((o|0)==0){break}q=b[i+8>>1]|0;r=b[i+10>>1]|0;do{s=r+(d[m+6|0]|0)|0;t=d[f+104+(s>>1)|0]>>(s<<2&4);r=r+1|0;t=$(t&15,n)|0;s=t-q|0;if((s|0)!=0){q=t;mg(f+232|0,l,s,j)}l=l+p|0;if((r|0)>=(o|0)){r=0}}while(l>>>0<k>>>0);b[i+10>>1]=r&65535;b[i+8>>1]=q&65535}c[i>>2]=l-k}}while(0);h=h+1|0}c[f+96>>2]=g;return}function mg(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=d;d=e;e=f;f=a;if((g>>>16|0)<(c[e+12>>2]|0)){}else{at(5360,4040,342,10736)}d=$(d,c[f+8>>2]|0)|0;a=(c[e+8>>2]|0)+(g>>>16<<2)|0;e=g>>>10&63;g=f+168+(-e<<1)|0;h=b[g>>1]|0;i=$(h,d)|0;j=$(b[g+128>>1]|0,d)|0;k=j+(c[a+12>>2]|0)|0;h=b[g+256>>1]|0;c[a+8>>2]=i+(c[a+8>>2]|0);c[a+12>>2]=k;k=$(h,d)|0;i=$(b[g+384>>1]|0,d)|0;j=i+(c[a+20>>2]|0)|0;h=b[g+512>>1]|0;c[a+16>>2]=k+(c[a+16>>2]|0);c[a+20>>2]=j;j=$(h,d)|0;k=$(b[g+640>>1]|0,d)|0;i=k+(c[a+28>>2]|0)|0;g=f+40+(e<<1)|0;h=b[g+640>>1]|0;c[a+24>>2]=j+(c[a+24>>2]|0);c[a+28>>2]=i;i=$(h,d)|0;j=$(b[g+512>>1]|0,d)|0;e=j+(c[a+36>>2]|0)|0;h=b[g+384>>1]|0;c[a+32>>2]=i+(c[a+32>>2]|0);c[a+36>>2]=e;e=$(h,d)|0;i=$(b[g+256>>1]|0,d)|0;j=i+(c[a+44>>2]|0)|0;h=b[g+128>>1]|0;c[a+40>>2]=e+(c[a+40>>2]|0);c[a+44>>2]=j;j=$(h,d)|0;h=$(b[g>>1]|0,d)|0;d=h+(c[a+52>>2]|0)|0;c[a+48>>2]=j+(c[a+48>>2]|0);c[a+52>>2]=d;return}function mh(a){a=a|0;var b=0;b=a;bH(b|0,b+40|0,12);return}function mi(a,b){a=a|0;b=+b;bN(a|0,b*.06666666666666667);return}function mj(a,b){a=a|0;b=b|0;var e=0;e=a;if((c[e+12>>2]|0)==0){return}if(((d[e|0]|0)&b|0)!=0){return}b=e+12|0;c[b>>2]=(c[b>>2]|0)-1;return}function mk(b){b=b|0;var d=0,e=0,f=0;d=b;b=a[d|0]&15;if(a[d+7|0]&1){a[d+7|0]=0;c[d+28>>2]=b;c[d+24>>2]=15;return}e=d+28|0;f=(c[e>>2]|0)-1|0;c[e>>2]=f;if((f|0)<0){c[d+28>>2]=b;if((c[d+24>>2]|a[d|0]&32|0)!=0){c[d+24>>2]=(c[d+24>>2]|0)-1&15}}return}function ml(b){b=b|0;var d=0,e=0,f=0;d=b;if((c[d+12>>2]|0)==0){e=0;return e|0}if((a[d|0]&16|0)!=0){f=a[d|0]&15}else{f=c[d+24>>2]|0}e=f;return e|0}function mm(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0;f=e;e=b;b=d[e+1|0]|0;g=e+36|0;h=(c[g>>2]|0)-1|0;c[g>>2]=h;if((h|0)<0){a[e+5|0]=1;h=mn(e)|0;g=b&7;do{if((g|0)!=0){if((b&128|0)==0){break}if((h|0)<8){break}i=h>>g;if((b&8|0)!=0){i=f-i|0}if((h+i|0)<2048){h=h+i|0;a[e+2|0]=h&255;a[e+3|0]=((d[e+3|0]|0)&-8|h>>8&7)&255}}}while(0)}if(!(a[e+5|0]&1)){return}a[e+5|0]=0;c[e+36>>2]=b>>4&7;return}function mn(b){b=b|0;var c=0;c=b;return((a[c+3|0]&7)<<8)+(a[c+2|0]&255)|0}function mo(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=e;e=f;f=b;b=mn(f)|0;h=b+1<<1;if((c[f+8>>2]|0)==0){c[f+16>>2]=(mp(f,g+(c[f+16>>2]|0)|0,e,h)|0)-e;return}fX(c[f+8>>2]|0);i=b>>(a[f+1|0]&7);if((a[f+1|0]&8|0)!=0){i=0}j=ml(f)|0;do{if((j|0)==0){k=1384}else{if((b|0)<8){k=1384;break}if((b+i|0)>=2048){k=1384;break}l=(d[f|0]|0)>>6&3;m=1<<l;n=0;if((l|0)==3){m=2;n=j}if((c[f+32>>2]|0)<(m|0)){n=n^j}l=mq(f,n)|0;if((l|0)!=0){fZ(c[f+40>>2]|0,g,l,c[f+8>>2]|0)}g=g+(c[f+16>>2]|0)|0;if((g|0)<(e|0)){l=c[f+8>>2]|0;o=c[f+40>>2]|0;p=(n<<1)-j|0;n=c[f+32>>2]|0;do{n=n+1&7;if((n|0)==0){k=1397}else{if((n|0)==(m|0)){k=1397}}if((k|0)==1397){k=0;p=-p|0;gz(o,g,p,l)}g=g+h|0;}while((g|0)<(e|0));c[f+20>>2]=p+j>>1;c[f+32>>2]=n}}}while(0);if((k|0)==1384){if((c[f+20>>2]|0)!=0){fZ(c[f+40>>2]|0,g,-(c[f+20>>2]|0)|0,c[f+8>>2]|0);c[f+20>>2]=0}g=g+(c[f+16>>2]|0)|0;g=mp(f,g,e,h)|0}c[f+16>>2]=g-e;return}function mp(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=b;b=e;e=a;a=d-f|0;if((a|0)<=0){g=f;return g|0}d=(a+b-1|0)/(b|0)|0;c[e+32>>2]=(c[e+32>>2]|0)+d&7;f=f+($(d,b)|0)|0;g=f;return g|0}function mq(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;a=d-(c[b+20>>2]|0)|0;c[b+20>>2]=d;return a|0}function mr(b){b=b|0;var d=0;d=b;if(a[d+7|0]&1){c[d+28>>2]=a[d|0]&127}else{if((c[d+28>>2]|0)!=0){b=d+28|0;c[b>>2]=(c[b>>2]|0)-1}}if((a[d|0]&128|0)!=0){return}a[d+7|0]=0;return}function ms(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=b;b=d;d=a;a=(mn(d)|0)+1|0;if((c[d+8>>2]|0)==0){e=e+(c[d+16>>2]|0)|0;c[d+16>>2]=0;do{if((c[d+12>>2]|0)!=0){if((c[d+28>>2]|0)==0){break}if((a|0)<3){break}c[d+16>>2]=(mt(d,e,b,a)|0)-b}}while(0);return}fX(c[d+8>>2]|0);f=mq(d,mu(d)|0)|0;if((f|0)!=0){gB(d+32|0,e,f,c[d+8>>2]|0)}e=e+(c[d+16>>2]|0)|0;do{if((c[d+12>>2]|0)==0){g=1433}else{if((c[d+28>>2]|0)==0){g=1433;break}if((a|0)<3){g=1433;break}if((e|0)<(b|0)){f=c[d+8>>2]|0;h=c[d+24>>2]|0;i=1;if((h|0)>16){h=h-16|0;i=-i|0}do{j=h-1|0;h=j;if((j|0)==0){h=16;i=-i|0}else{gC(d+32|0,e,i,f)}e=e+a|0;}while((e|0)<(b|0));if((i|0)<0){h=h+16|0}c[d+24>>2]=h;c[d+20>>2]=mu(d)|0}}}while(0);if((g|0)==1433){e=b}c[d+16>>2]=e-b;return}function mt(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=b;b=e;e=a;a=d-f|0;if((a|0)<=0){g=f;return g|0}d=(a+b-1|0)/(b|0)|0;c[e+24>>2]=(c[e+24>>2]|0)+1-d&31;a=e+24|0;c[a>>2]=(c[a>>2]|0)+1;f=f+($(d,b)|0)|0;g=f;return g|0}function mu(a){a=a|0;var b=0,d=0;b=a;a=16-(c[b+24>>2]|0)|0;if((a|0)>=0){d=a;return d|0}a=(c[b+24>>2]|0)-17|0;d=a;return d|0}function mv(b){b=b|0;var d=0;d=b;c[d+24>>2]=0;c[d+48>>2]=0;c[d+32>>2]=0;c[d+36>>2]=1;c[d+40>>2]=0;a[d+44|0]=0;a[d+45|0]=1;c[d+52>>2]=1073741824;a[d+57|0]=0;a[d+56|0]=0;lO(d);c[d+28>>2]=428;return}function mw(b){b=b|0;var d=0;d=b;b=1073741824;do{if(a[d+56|0]&1){if((c[d+12>>2]|0)==0){break}b=(c[(c[d+68>>2]|0)+1948>>2]|0)+(c[d+16>>2]|0)+($(((c[d+12>>2]|0)-1<<3)+(c[d+36>>2]|0)-1|0,c[d+28>>2]|0)|0)+1|0}}while(0);if((b|0)==(c[d+52>>2]|0)){return}c[d+52>>2]=b;lF(c[d+68>>2]|0);return}function mx(e,f,g){e=e|0;f=f|0;g=g|0;var h=0;h=f;f=g;g=e;if((h|0)==0){c[g+28>>2]=b[20608+((a[g+58|0]&1)<<5)+((f&15)<<1)>>1]|0;a[g+56|0]=(f&192|0)==128|0;e=g+57|0;a[e]=(a[e]&1&(a[g+56|0]&1)|0)!=0|0;mw(g);return}if((h|0)==1){h=c[g+48>>2]|0;c[g+48>>2]=f&127;if(!(a[g+59|0]&1)){c[g+20>>2]=(c[g+48>>2]|0)-((d[19368+(c[g+48>>2]|0)|0]|0)-(d[19368+h|0]|0))}}return}function my(a){a=a|0;var b=0;b=a;mz(b);mA(b);mw(b);return}function mz(a){a=a|0;var b=0;b=a;c[b+24>>2]=((d[b+2|0]|0)<<6)+16384;c[b+12>>2]=((d[b+3|0]|0)<<4)+1;return}function mA(b){b=b|0;var d=0,e=0;d=b;if(a[d+44|0]&1){return}if((c[d+12>>2]|0)==0){return}if((c[d+60>>2]|0)!=0){}else{at(3048,7912,380,11176)}c[d+32>>2]=bb[c[d+60>>2]&127](c[d+64>>2]|0,(c[d+24>>2]|0)+32768|0)|0;c[d+24>>2]=(c[d+24>>2]|0)+1&32767;a[d+44|0]=1;b=d+12|0;e=(c[b>>2]|0)-1|0;c[b>>2]=e;if((e|0)==0){if((a[d|0]&64|0)!=0){mz(d)}else{e=(c[d+68>>2]|0)+1972|0;c[e>>2]=c[e>>2]&-17;a[d+57|0]=a[d+56|0]&1;c[d+52>>2]=1073741824;lF(c[d+68>>2]|0)}}return}function mB(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=d;d=e;e=b;b=mq(e,c[e+48>>2]|0)|0;if((c[e+8>>2]|0)!=0){fX(c[e+8>>2]|0);if((b|0)!=0){gB(e+72|0,f,b,c[e+8>>2]|0)}}else{a[e+45|0]=1}f=f+(c[e+16>>2]|0)|0;if((f|0)>=(d|0)){g=f;h=d;i=g-h|0;j=e;k=j+16|0;c[k>>2]=i;return}b=c[e+36>>2]|0;do{if(a[e+45|0]&1){if(a[e+44|0]&1){l=1505;break}m=(d-f+(c[e+28>>2]|0)-1|0)/(c[e+28>>2]|0)|0;b=((b-1+8-((m|0)%8|0)|0)%8|0)+1|0;f=f+($(m,c[e+28>>2]|0)|0)|0}else{l=1505}}while(0);if((l|0)==1505){l=c[e+8>>2]|0;m=c[e+28>>2]|0;n=c[e+40>>2]|0;o=c[e+48>>2]|0;do{if(!(a[e+45|0]&1)){p=((n&1)<<2)-2|0;n=n>>1;if((o+p|0)>>>0<=127>>>0){o=o+p|0;gC(e+72|0,f,p,l)}}f=f+m|0;p=b-1|0;b=p;if((p|0)==0){b=8;if(a[e+44|0]&1){a[e+45|0]=0;n=c[e+32>>2]|0;a[e+44|0]=0;if((l|0)==0){a[e+45|0]=1}mA(e)}else{a[e+45|0]=1}}}while((f|0)<(d|0));c[e+48>>2]=o;c[e+20>>2]=o;c[e+40>>2]=n}c[e+36>>2]=b;g=f;h=d;i=g-h|0;j=e;k=j+16|0;c[k>>2]=i;return}function mC(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;g=e;e=f;f=d;d=b[19552+((a[f+2|0]&15)<<1)>>1]|0;if((c[f+8>>2]|0)==0){g=g+(c[f+16>>2]|0)|0;c[f+16>>2]=g+($((e-g+d-1|0)/(d|0)|0,d)|0)-e;return}fX(c[f+8>>2]|0);h=ml(f)|0;if((c[f+32>>2]&1|0)!=0){i=h}else{i=0}j=i;i=mq(f,j)|0;if((i|0)!=0){gB(f+40|0,g,i,c[f+8>>2]|0)}g=g+(c[f+16>>2]|0)|0;if((g|0)<(e|0)){if((h|0)!=0){i=c[f+8>>2]|0;k=id(i,d)|0;l=bE(i,g)|0;m=c[f+32>>2]|0;n=(j<<1)-h|0;j=(a[f+2|0]&128|0)!=0?8:13;do{g=g+d|0;if((m+1&2|0)!=0){n=-n|0;gV(f+40|0,l,n,i)}l=l+k|0;m=(m<<j^m<<14)&16384|m>>1;}while((g|0)<(e|0));c[f+20>>2]=n+h>>1;c[f+32>>2]=m}else{g=g+($((e-g+d-1|0)/(d|0)|0,d)|0)|0;if((a[f+2|0]&128|0)==0){c[f+32>>2]=(c[f+32>>2]<<13^c[f+32>>2]<<14)&16384|c[f+32>>2]>>1}}}c[f+16>>2]=g-e;return}function mD(a){a=a|0;var b=0;b=a;gX(b+80|0);fR(b+640|0);mE(b,0);mF(b,1.0);mG(b);return}function mE(a,b){a=a|0;b=b|0;var c=0;c=b;b=a;a=0;while(1){if((a|0)>=3){break}mH(b,a,c);a=a+1|0}return}function mF(a,b){a=a|0;b=+b;var c=0.0,d=0;c=b;d=a;gJ(d+80|0,.006238709677419354*c);f0(d+640|0,.0064466666666666665*c);return}function mG(b){b=b|0;var d=0,e=0,f=0;d=b;c[d+72>>2]=0;b=0;while(1){if((b|0)>=3){break}e=d+(b*24|0)|0;f=0;while(1){if((f|0)>=3){break}a[e+f|0]=0;f=f+1|0}c[e+8>>2]=0;c[e+12>>2]=0;c[e+16>>2]=1;c[e+20>>2]=0;b=b+1|0}return}function mH(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;if(e>>>0<3>>>0){}else{at(1088,592,78,11744)}c[a+(e*24|0)+4>>2]=d;return}function mI(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if((d|0)>=(c[b+72>>2]|0)){}else{at(2888,7808,48,11712)}mJ(b,b|0,d);mJ(b,b+24|0,d);mK(b,d);c[b+72>>2]=d;return}function mJ(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=e;e=f;f=b;b=c[g+4>>2]|0;if((b|0)==0){return}fX(b);h=a[g|0]&15;if((a[g+2|0]&128|0)==0){h=0}i=a[g|0]&128;j=((d[g|0]|0)>>4&7)+1|0;do{if((i|0)!=0){k=1575}else{if((c[g+16>>2]|0)<(j|0)){k=1575;break}l=0}}while(0);if((k|0)==1575){l=h}k=l-(c[g+12>>2]|0)|0;l=c[f+72>>2]|0;if((k|0)!=0){m=g+12|0;c[m>>2]=(c[m>>2]|0)+k;fZ(f+640|0,l,k,b)}l=l+(c[g+8>>2]|0)|0;c[g+8>>2]=0;k=mN(g)|0;if((h|0)==0){return}if((i|0)!=0){return}if((k|0)<=4){return}if((l|0)<(e|0)){i=c[g+16>>2]|0;do{i=i+1|0;if((i|0)==16){i=0;c[g+12>>2]=h;fZ(f+640|0,l,h,b)}if((i|0)==(j|0)){c[g+12>>2]=0;fZ(f+640|0,l,-h|0,b)}l=l+k|0;}while((l|0)<(e|0));c[g+16>>2]=i}c[g+8>>2]=l-e;return}function mK(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;e=d;d=b;b=d+48|0;f=c[b+4>>2]|0;if((f|0)==0){return}fX(f);g=c[b+20>>2]|0;h=a[b|0]&63;i=c[d+72>>2]|0;j=c[b+12>>2]|0;do{if((a[b+2|0]&128|0)!=0){if((h|g|0)==0){k=1602;break}i=i+(c[b+8>>2]|0)|0;if((i|0)<(e|0)){l=(mN(b)|0)<<1;m=c[b+16>>2]|0;do{n=m-1|0;m=n;if((n|0)==0){m=7;g=0}n=(g>>3)-j|0;if((n|0)!=0){j=g>>3;gB(d+80|0,i,n,f)}i=i+l|0;g=g+h&255;}while((i|0)<(e|0));c[b+16>>2]=m;c[b+20>>2]=g}c[b+8>>2]=i-e}else{k=1602}}while(0);if((k|0)==1602){c[b+8>>2]=0;k=(g>>3)-j|0;j=g>>3;gB(d+80|0,i,k,f)}c[b+12>>2]=j;return}function mL(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0;g=d;d=e;e=b;if(g>>>0<3>>>0){}else{at(5248,7808,57,11696)}if(d>>>0<3>>>0){}else{at(4e3,7808,58,11696)}mI(e,c);a[e+(g*24|0)+d|0]=f&255;return}function mM(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if((d|0)>(c[b+72>>2]|0)){mI(b,d)}if((c[b+72>>2]|0)>=(d|0)){}else{at(3064,7808,69,11728)}a=b+72|0;c[a>>2]=(c[a>>2]|0)-d;return}function mN(b){b=b|0;var c=0;c=b;return((a[c+2|0]&15)<<8)+(d[c+1|0]|0)+1|0}function mO(){fd(22656,-1.0,80.0);return}function mP(){fd(22736,-15.0,80.0);return}function mQ(a,b){a=a|0;b=b|0;return d[lU(a+336|0,b)|0]|0|0}function mR(a){a=a|0;var b=0;b=a;mS(b+336|0);bR(b);c[b>>2]=15992;mT(b+2604|0);lq(b+2640|0);c[b+2632>>2]=0;c[b+2628>>2]=0;c[b+2636>>2]=0;g5(b,c[14]|0);g7(b,6);mU(b+2640|0,70,b);fn(b,22656);ip(b,1.4);sf(b+13768|0,-14|0,2056);return}function mS(a){a=a|0;var b=0;b=a;c[b+2056>>2]=b+2060;return}function mT(a){a=a|0;nK(a);return}function mU(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;c[e+1368>>2]=d;c[e+1364>>2]=b;return}function mV(a){a=a|0;nJ(a);return}function mW(a){a=a|0;var b=0;b=a;mX(b);bT(b);return}function mX(a){a=a|0;var b=0;b=a;c[b>>2]=15992;a3[c[(c[b>>2]|0)+8>>2]&511](b);mV(b+2604|0);bU(b);return}function mY(a){a=a|0;var b=0;b=a;a=c[b+2632>>2]|0;if((a|0)!=0){mZ(a)}c[b+2632>>2]=0;a=c[b+2628>>2]|0;if((a|0)!=0){m_(a)}c[b+2628>>2]=0;a=c[b+2636>>2]|0;if((a|0)!=0){m$(a)}c[b+2636>>2]=0;m0(b+2604|0);ff(b);return}function mZ(a){a=a|0;r6(a);return}function m_(a){a=a|0;r6(a);return}function m$(a){a=a|0;r6(a);return}function m0(a){a=a|0;cb(a|0);return}function m1(a,b,c){a=a|0;b=b|0;c=c|0;m2(a+5448|0,b);return 0}function m2(b,c){b=b|0;c=c|0;var d=0;d=b;b=c;ew(b+272|0,d+14|0,32);ew(b+784|0,d+46|0,32);ew(b+1040|0,d+78|0,32);if((a[d+123|0]|0)==0){return}ex(b+16|0,3440);return}function m3(b,d){b=b|0;d=+d;var e=0.0,f=0,g=0,i=0,j=0.0;e=d;f=b;b=g2(f+5558|0)|0;g=16666;h[f+2568>>3]=1789772.72727;c[f+2592>>2]=357366;if(a[f+2576|0]&1){c[f+2592>>2]=398964;h[f+2568>>3]=1662607.125;g=2e4;b=g2(f+5568|0)|0}if((b|0)==0){b=g}do{if((b|0)==(g|0)){if(e!=1.0){break}i=f+2640|0;j=e;lA(i,j);return}}while(0);c[f+2592>>2]=~~(+(b>>>0>>>0)*+h[f+2568>>3]/(83333.33333333333*e));i=f+2640|0;j=e;lA(i,j);return}function m4(b){b=b|0;var e=0,f=0.0,g=0,h=0,i=0,j=0,k=0,l=0;e=b;if(((d[e+5571|0]|0)&-50|0)!=0){eT(e,2840)}he(e,5);fh(e,12800);g6(e,12824);f=+hf(e);if((a[e+5571|0]&49|0)!=0){he(e,8)}do{if((a[e+5571|0]&16|0)!=0){b=m5(1048)|0;g=0;if((b|0)==0){h=0}else{g=1;g=b;l8(g);h=g}c[e+2628>>2]=h;if((c[e+2628>>2]|0)==0){i=1072;j=i;return j|0}else{f=f*.75;he(e,13);fh(e,13016);break}}}while(0);if((a[e+5571|0]&1|0)!=0){h=m6(1456)|0;g=0;if((h|0)==0){k=0}else{g=1;g=h;mD(g);k=g}c[e+2632>>2]=k;if((c[e+2632>>2]|0)==0){i=1072;j=i;return j|0}f=f*.75;he(e,8);fh(e,12984);if((a[e+5571|0]&16|0)!=0){he(e,16);fh(e,12920)}}do{if((a[e+5571|0]&32|0)!=0){k=m7(872)|0;g=0;if((k|0)==0){l=0}else{g=1;g=k;m8(g);l=g}c[e+2636>>2]=l;if((c[e+2636>>2]|0)==0){i=1072;j=i;return j|0}else{f=f*.75;he(e,8);fh(e,12888);break}}}while(0);if((c[e+2628>>2]|0)!=0){mb(c[e+2628>>2]|0,f)}if((c[e+2632>>2]|0)!=0){mF(c[e+2632>>2]|0,f)}if((c[e+2636>>2]|0)!=0){m9(c[e+2636>>2]|0,f)}lw(e+2640|0,f);i=0;j=i;return j|0}function m5(a){a=a|0;return r5(a)|0}function m6(a){a=a|0;return r5(a)|0}function m7(a){a=a|0;return r5(a)|0}function m8(a){a=a|0;ny(a);return}function m9(a,b){a=a|0;b=+b;f0(a+56|0,.001979166666666667*b);return}function na(b,e){b=b|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0;f=b;b=nb(f+2604|0,e,128,f+5448|0,0)|0;if((b|0)!=0){g=b;i=g;return i|0}eu(f,d[f+5454|0]|0);b=nc(f+5448|0)|0;if((b|0)!=0){g=b;i=g;return i|0}if((d[f+5453|0]|0)!=1){eT(f,5600)}b=m4(f)|0;if((b|0)!=0){g=b;i=g;return i|0}b=g2(f+5456|0)|0;c[f+2556>>2]=g2(f+5458|0)|0;c[f+2560>>2]=g2(f+5460|0)|0;if((b|0)==0){b=32768}if((c[f+2556>>2]|0)==0){c[f+2556>>2]=32768}if((c[f+2560>>2]|0)==0){c[f+2560>>2]=32768}do{if(b>>>0>=32768>>>0){if((c[f+2556>>2]|0)>>>0<32768>>>0){break}nd(f+2604|0,(b>>>0)%4096|0);e=(lZ(f+2604|0)|0)/4096|0;j=((b-32768|0)>>>0)/4096|0;k=0;while(1){if((k|0)>=8){break}l=k-j|0;if(l>>>0>=e>>>0){l=0}a[f+2548+k|0]=l&255;if((a[f+5560+k|0]|0)!=0){m=1794;break}k=k+1|0}if((m|0)==1794){k=f+2548|0;e=f+5560|0;sg(k|0,e|0,8)|0}a[f+2576|0]=(a[f+5570|0]&3|0)==1|0;a[f+5570|0]=0;fp(f,+ho(f));g=b3(f,~~(+h[f+2568>>3]+.5))|0;i=g;return i|0}}while(0);m=d0(f)|0;if((m|0)==0){m=5312}g=m;i=g;return i|0}function nb(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return ca(a,b,c,d,e,4104)|0}function nc(a){a=a|0;var b=0,d=0;if((sj(a|0,3776,5)|0)!=0){b=c[2]|0;d=b;return d|0}else{b=0;d=b;return d|0}return 0}function nd(a,b){a=a|0;b=b|0;cg(a,b,4096);return}function ne(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;ly(b+2640|0,d);if((c[b+2628>>2]|0)!=0){nf(c[b+2628>>2]|0,d)}if((c[b+2632>>2]|0)!=0){ng(c[b+2632>>2]|0,d)}if((c[b+2636>>2]|0)==0){return}nh(c[b+2636>>2]|0,d);return}function nf(a,b){a=a|0;b=b|0;nx(a+232|0,b);return}function ng(a,b){a=a|0;b=b|0;var c=0;c=b;b=a;gM(b+80|0,c);gL(b+640|0,c);return}function nh(a,b){a=a|0;b=b|0;gL(a+56|0,b);return}function ni(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;f=b;b=d;d=a;if((f|0)<5){lz(d+2640|0,f,b);return}f=f-5|0;do{if((c[d+2636>>2]|0)!=0){if((f|0)>=3){break}nj(c[d+2636>>2]|0,f,b);return}}while(0);do{if((c[d+2632>>2]|0)!=0){if((f|0)>=3){f=f-3|0;break}a=f-1|0;f=a;if((a|0)<0){f=2}mH(c[d+2632>>2]|0,f,b);return}}while(0);if((c[d+2628>>2]|0)==0){return}if((f|0)>=8){return}md(c[d+2628>>2]|0,f,b);return}function nj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;if(e>>>0<3>>>0){}else{at(4552,4600,77,11648)}c[a+24+(e<<3)>>2]=d;return}function nk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=b;b=d;d=a;do{if((c[d+2628>>2]|0)!=0){a=e;if((a|0)==63488){nm(c[d+2628>>2]|0,b);return}else if((a|0)==18432){a=c[d+2628>>2]|0;nl(a,lV(d+336|0)|0,b);return}else{break}}}while(0);do{if(e>>>0>=49152>>>0){if((c[d+2636>>2]|0)==0){break}a=e&57344;if((a|0)==49152){nn(c[d+2636>>2]|0,b);return}else if((a|0)==57344){a=c[d+2636>>2]|0;no(a,lV(d+336|0)|0,b);return}else{break}}}while(0);if((c[d+2632>>2]|0)!=0){a=e&4095;f=((e-36864|0)>>>0)/4096|0;do{if(f>>>0<3>>>0){if(a>>>0>=3>>>0){break}g=c[d+2632>>2]|0;mL(g,lV(d+336|0)|0,f,a,b);return}}while(0)}do{if((e|0)!=32768){if((e|0)==32769){break}do{if((e|0)!=18432){if((e|0)==63488){break}if((e|0)!=65528){return}return}}while(0);return}}while(0);return}function nl(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;e=b;mf(e,c);a[l5(e)|0]=d&255;return}function nm(a,b){a=a|0;b=b|0;c[a+100>>2]=b;return}function nn(b,c){b=b|0;c=c|0;a[b+17|0]=c&255;return}function no(b,c,e){b=b|0;c=c|0;e=e|0;var f=0;f=b;if((d[f+17|0]|0)>>>0>=14>>>0){return}else{l7(f,c);a[f+(d[f+17|0]|0)|0]=e&255;return}}function np(e,f){e=e|0;f=f|0;var g=0,h=0,i=0;g=f;f=e;e=b5(f,g)|0;if((e|0)!=0){h=e;i=h;return i|0}sf(f+336|0,0,2048);sf(f+5576|0,0,8192);l0(f+336|0,f+13768|0);l_(f+336|0,24576,8192,f+5576|0,0);e=0;while(1){if((e|0)>=8){break}lX(f,e+24568|0,d[f+2548+e|0]|0);e=e+1|0}lx(f+2640|0,a[f+2576|0]&1,(a[f+5570|0]&32|0)!=0?63:0);lE(f+2640|0,0,16405,15);lE(f+2640|0,0,16407,(a[f+5570|0]&16|0)!=0?128:0);if((c[f+2628>>2]|0)!=0){mc(c[f+2628>>2]|0)}if((c[f+2632>>2]|0)!=0){mG(c[f+2632>>2]|0)}if((c[f+2636>>2]|0)!=0){l6(c[f+2636>>2]|0)}c[f+2600>>2]=4;c[f+2596>>2]=0;c[f+2588>>2]=(c[f+2592>>2]|0)/12|0;b[f+2578>>1]=24568;a[f+847|0]=95;a[f+846|0]=-9;a[f+2390|0]=-3;b[f+2384>>1]=c[f+2556>>2]&65535;a[f+2386|0]=g&255;a[f+2387|0]=a[f+2576|0]&1;h=0;i=h;return i|0}function nq(d,f,g){d=d|0;f=f|0;g=g|0;var h=0,i=0;g=f;f=d;nr(f+336|0,0);while(1){d=lV(f+336|0)|0;if((d|0)>=(c[g>>2]|0)){break}d=ns(c[f+2588>>2]|0,c[g>>2]|0)|0;d=nt(d,(lV(f+336|0)|0)+32767|0)|0;if(l2(f+336|0,d)|0){if((e[f+2384>>1]|0|0)!=24568){eT(f,5128);h=f+2384|0;b[h>>1]=(b[h>>1]|0)+1&65535}else{c[f+2600>>2]=1;if((e[f+2578>>1]|0|0)!=24568){h=f+2384|0;i=f+2578|0;b[h>>1]=b[i>>1]|0;b[h+2>>1]=b[i+2>>1]|0;b[h+4>>1]=b[i+4>>1]|0;b[h+6>>1]=b[i+6>>1]|0;b[f+2578>>1]=24568}else{nr(f+336|0,d)}}}d=lV(f+336|0)|0;if((d|0)>=(c[f+2588>>2]|0)){d=((c[f+2592>>2]|0)+(c[f+2596>>2]|0)|0)/12|0;c[f+2596>>2]=(c[f+2592>>2]|0)-(d*12|0);i=f+2588|0;c[i>>2]=(c[i>>2]|0)+d;do{if((c[f+2600>>2]|0)!=0){d=f+2600|0;i=(c[d>>2]|0)-1|0;c[d>>2]=i;if((i|0)!=0){break}if((e[f+2384>>1]|0|0)!=24568){i=f+2578|0;d=f+2384|0;b[i>>1]=b[d>>1]|0;b[i+2>>1]=b[d+2>>1]|0;b[i+4>>1]=b[d+4>>1]|0;b[i+6>>1]=b[d+6>>1]|0}b[f+2384>>1]=c[f+2560>>2]&65535;d=f+2390|0;i=a[d]|0;a[d]=i-1&255;a[f+336+((i&255)+256)|0]=95;i=f+2390|0;d=a[i]|0;a[i]=d-1&255;a[f+336+((d&255)+256)|0]=-9}}while(0)}}if((nu(f+336|0)|0)!=0){nv(f+336|0);eT(f,5128)}c[g>>2]=lV(f+336|0)|0;d=f+2588|0;c[d>>2]=(c[d>>2]|0)-(c[g>>2]|0);if((c[f+2588>>2]|0)<0){c[f+2588>>2]=0}lH(f+2640|0,c[g>>2]|0);if((c[f+2628>>2]|0)!=0){me(c[f+2628>>2]|0,c[g>>2]|0)}if((c[f+2632>>2]|0)!=0){mM(c[f+2632>>2]|0,c[g>>2]|0)}if((c[f+2636>>2]|0)==0){return 0}nw(c[f+2636>>2]|0,c[g>>2]|0);return 0}function nr(a,b){a=a|0;b=b|0;var d=0;d=a;c[(c[d+2056>>2]|0)+136>>2]=b-(c[(c[d+2056>>2]|0)+132>>2]|0);return}function ns(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((c|0)<(a|0)){d=c}else{d=a}return d|0}function nt(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((c|0)<(a|0)){d=c}else{d=a}return d|0}function nu(a){a=a|0;return c[a+2208>>2]|0}function nv(a){a=a|0;c[a+2208>>2]=0;return}function nw(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if((d|0)>(c[b+48>>2]|0)){l7(b,d)}if((c[b+48>>2]|0)>=(d|0)){}else{at(4728,4600,115,11776)}a=b+48|0;c[a>>2]=(c[a>>2]|0)-d;return}function nx(a,b){a=a|0;b=b|0;bM(a|0,b);return}function ny(a){a=a|0;var b=0;b=a;fR(b+56|0);nz(b,0);m9(b,1.0);l6(b);return}function nz(a,b){a=a|0;b=b|0;var c=0;c=b;b=a;a=0;while(1){if((a|0)>=3){break}nj(b,a,c);a=a+1|0}return}function nA(){var a=0,b=0,c=0;a=hB(15824)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;mR(b);c=b}return c|0}function nB(){var a=0,b=0,c=0;a=hB(448)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;nC(b);c=b}return c|0}function nC(a){a=a|0;nD(a);return}function nD(a){a=a|0;var b=0;b=a;hE(b);c[b>>2]=15176;g5(b,c[14]|0);return}function nE(a){a=a|0;nI(a);return}function nF(a){a=a|0;var b=0;b=a;nE(b);bT(b);return}function nG(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;e=a;a=b;b=a5[c[(c[a>>2]|0)+12>>2]&127](a,e+316|0,128)|0;if((b|0)==0){if(((d[e+439|0]|0)&-50|0)!=0){eT(e,2840)}eu(e,d[e+322|0]|0);f=nc(e+316|0)|0;g=f;return g|0}if((b|0)==19344){h=c[2]|0}else{h=b}f=h;g=f;return g|0}function nH(a,b,c){a=a|0;b=b|0;c=c|0;m2(a+316|0,b);return 0}function nI(a){a=a|0;fO(a);return}function nJ(a){a=a|0;iX(a);return}function nK(a){a=a|0;iZ(a);return}function nL(){mO();mP();return}function nM(b){b=b|0;var c=0;c=b;eO(c+1152|0);nN(c+1160|0);ei(c+1168|0);nO(c+1176|0);a[c+1188|0]=0;return}function nN(a){a=a|0;oi(a);return}function nO(a){a=a|0;oh(a);return}function nP(a){a=a|0;og(a);return}function nQ(a){a=a|0;var b=0;b=a;nR(b+1176|0);ek(b+1168|0);nP(b+1160|0);eI(b+1152|0);return}function nR(a){a=a|0;of(a);return}function nS(b,d){b=b|0;d=d|0;var e=0;e=b;a[e+1188|0]=d&1&1;a[e+6|0]=(eq(e+1168|0)|0)&255;do{if((a[e+6|0]|0)!=0){if(a[e+1188|0]&1){break}return}}while(0);a[e+6|0]=c[e+1184>>2]&255;return}function nT(b,c){b=b|0;c=c|0;var e=0,f=0;e=c;c=b;if(a[c+1188|0]&1){f=e;return f|0}if(e>>>0>=(eq(c+1168|0)|0)>>>0){f=e;return f|0}e=d[ce(c+1168|0,e)|0]|0;f=e;return f|0}function nU(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;g=i;i=i+80|0;h=g|0;j=g+8|0;k=g+16|0;l=g+32|0;m=g+40|0;n=g+48|0;o=g+64|0;p=e;e=f;f=b;b=p;q=a5[c[(c[b>>2]|0)+12>>2]&127](b,h|0,4)|0;if((q|0)!=0){if((q|0)==19344){r=c[2]|0}else{r=q}s=r;t=s;i=g;return t|0}if((sj(h|0,2608,4)|0)!=0){s=c[2]|0;t=s;i=g;return t|0}eS(f+1152|0);nV(f+1160|0);cb(f+1168|0);nW(f+1176|0);h=f|0;r=h;sg(r|0,12008,128)|0;r=0;while(1){if((r|0)==3){u=2177;break}q=p;v=a5[c[(c[q>>2]|0)+12>>2]&127](q,j|0,8)|0;if((v|0)!=0){u=2069;break}q=ji(j|0)|0;b=ji(j+4|0)|0;if((b|0)==1701669236){w=n0(f+1176|0,(q|0)/4|0)|0;if((w|0)!=0){u=2126;break}x=p;y=c[(c[x>>2]|0)+12>>2]|0;z=n1(f+1176|0)|0;A=(n2(f+1176|0)|0)<<2;B=a5[y&127](x,z,A)|0;if((B|0)!=0){u=2130;break}}else if((b|0)==1096040772){r=2;if((e|0)!=0){cp(n,p,q);cu(o,h,128,n);A=ev(e,o)|0;if((A|0)!=0){s=A;C=1}else{C=0}cM(o);cK(n);A=C;if((A|0)==1){u=2190;break}else if((A|0)!=0){u=2201;break}}else{A=p;D=bb[c[(c[A>>2]|0)+20>>2]&127](A,q)|0;if((D|0)!=0){u=2150;break}}}else if((b|0)==1752462689){eO(l);nN(m);A=nY(p,q,l,m)|0;if((A|0)!=0){s=A;C=1}else{A=nZ(m)|0;if((A|0)>3){n_(c[(n$(m,3)|0)>>2]|0,f+896|0,256)}if((A|0)>2){n_(c[(n$(m,2)|0)>>2]|0,f+640|0,256)}if((A|0)>1){n_(c[(n$(m,1)|0)>>2]|0,f+384|0,256)}if((A|0)>0){n_(c[(n$(m,0)|0)>>2]|0,f+128|0,256)}C=6}nP(m);eI(l);A=C;if((A|0)==1){u=2182;break}else if((A|0)!=6){u=2200;break}}else if((b|0)==1330007625){if((q|0)<8){u=2073;break}a[k+8|0]=1;a[k+9|0]=0;A=p;z=c[(c[A>>2]|0)+12>>2]|0;x=nX(q,16)|0;E=a5[z&127](A,k,x)|0;if((E|0)!=0){u=2076;break}if((q|0)>16){x=p;F=bb[c[(c[x>>2]|0)+20>>2]&127](x,q-16|0)|0;if((F|0)!=0){u=2081;break}}r=1;a[f+122|0]=a[k+6|0]|0;a[f+123|0]=a[k+7|0]|0;a[f+6|0]=a[k+8|0]|0;c[f+1184>>2]=d[k+8|0]|0;a[f+7|0]=a[k+9|0]|0;x=f+8|0;A=k|0;a[x]=a[A]|0;a[x+1|0]=a[A+1|0]|0;a[x+2|0]=a[A+2|0]|0;a[x+3|0]=a[A+3|0]|0;a[x+4|0]=a[A+4|0]|0;a[x+5|0]=a[A+5|0]|0}else if((b|0)==1263419714){if((q|0)>8){u=2086;break}A=p;G=a5[c[(c[A>>2]|0)+12>>2]&127](A,f+112|0,q)|0;if((G|0)!=0){u=2089;break}}else if((b|0)==1818389620){H=nY(p,q,f+1152|0,f+1160|0)|0;if((H|0)!=0){u=2135;break}}else if((b|0)==1145980238){r=3}else if((b|0)==1953721456){I=cc(f+1168|0,q)|0;if((I|0)!=0){u=2140;break}b=p;A=c[(c[b>>2]|0)+12>>2]|0;x=ce(f+1168|0,0)|0;J=a5[A&127](b,x,q)|0;if((J|0)!=0){u=2144;break}}else{x=p;K=bb[c[(c[x>>2]|0)+20>>2]&127](x,q)|0;if((K|0)!=0){u=2173;break}}}if((u|0)==2182){t=s;i=g;return t|0}else if((u|0)==2190){t=s;i=g;return t|0}else if((u|0)==2200){return 0}else if((u|0)==2201){return 0}else if((u|0)==2144){s=J;t=s;i=g;return t|0}else if((u|0)==2150){s=D;t=s;i=g;return t|0}else if((u|0)==2086){s=7688;t=s;i=g;return t|0}else if((u|0)==2081){s=F;t=s;i=g;return t|0}else if((u|0)==2089){s=G;t=s;i=g;return t|0}else if((u|0)==2073){s=7688;t=s;i=g;return t|0}else if((u|0)==2076){s=E;t=s;i=g;return t|0}else if((u|0)==2140){s=I;t=s;i=g;return t|0}else if((u|0)==2069){s=v;t=s;i=g;return t|0}else if((u|0)==2126){s=w;t=s;i=g;return t|0}else if((u|0)==2130){s=B;t=s;i=g;return t|0}else if((u|0)==2173){s=K;t=s;i=g;return t|0}else if((u|0)==2177){s=0;t=s;i=g;return t|0}else if((u|0)==2135){s=H;t=s;i=g;return t|0}return 0}function nV(a){a=a|0;var b=0;b=a;a=c[b>>2]|0;c[b>>2]=0;c[b+4>>2]=0;r6(a);return}function nW(a){a=a|0;var b=0;b=a;a=c[b>>2]|0;c[b>>2]=0;c[b+4>>2]=0;r6(a);return}function nX(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((c|0)<(a|0)){d=c}else{d=a}return d|0}function nY(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;g=d;d=e;e=f;f=eU(d,g+1|0)|0;if((f|0)!=0){h=f;i=h;return i|0}a[os(d,g)|0]=0;f=b;b=c[(c[f>>2]|0)+12>>2]|0;j=os(d,0)|0;k=a5[b&127](f,j,g)|0;if((k|0)!=0){h=k;i=h;return i|0}k=ot(e,128)|0;if((k|0)!=0){h=k;i=h;return i|0}k=0;j=0;while(1){if((j|0)>=(g|0)){l=2235;break}if((nZ(e)|0)<=(k|0)){m=ot(e,k<<1)|0;if((m|0)!=0){l=2225;break}}f=os(d,j)|0;b=k;k=b+1|0;c[(n$(e,b)|0)>>2]=f;while(1){if((j|0)<(g|0)){n=(a[os(d,j)|0]|0)!=0}else{n=0}if(!n){break}j=j+1|0}j=j+1|0}if((l|0)==2225){h=m;i=h;return i|0}else if((l|0)==2235){h=ot(e,k)|0;i=h;return i|0}return 0}function nZ(a){a=a|0;return c[a+4>>2]|0}function n_(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;e=c;c=d;a[e+(c-1)|0]=0;sk(e|0,b|0,c-1|0)|0;return}function n$(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if(d>>>0<=(c[b+4>>2]|0)>>>0){}else{at(5216,3864,58,10632);return 0}return(c[b>>2]|0)+(d<<2)|0}function n0(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=b;b=a;a=r7(c[b>>2]|0,d<<2)|0;do{if((a|0)==0){if((d|0)==0){break}e=3016;f=e;return f|0}}while(0);c[b>>2]=a;c[b+4>>2]=d;e=0;f=e;return f|0}function n1(a){a=a|0;return c[a>>2]|0}function n2(a){a=a|0;return c[a+4>>2]|0}function n3(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;b=a;a=nT(b,d)|0;if(a>>>0<(n2(b+1176|0)|0)>>>0){d=ji(n4(b+1176|0,a)|0)|0;if((d|0)>0){c[e+4>>2]=d}}if(a>>>0<(nZ(b+1160|0)|0)>>>0){ex(e+528|0,c[(n$(b+1160|0,a)|0)>>2]|0)}ew(e+272|0,b+128|0,256);ew(e+784|0,b+384|0,256);ew(e+1040|0,b+640|0,256);ew(e+1552|0,b+896|0,256);return 0}function n4(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if(d>>>0<=(c[b+4>>2]|0)>>>0){}else{at(5216,3864,58,10632);return 0}return(c[b>>2]|0)+(d<<2)|0}function n5(b){b=b|0;var d=0;d=b;mR(d);c[d>>2]=15072;nM(d+15824|0);a[d+17016|0]=0;g5(d,c[12]|0);return}function n6(a){a=a|0;var b=0;b=a;n7(b);bT(b);return}function n7(a){a=a|0;var b=0;b=a;c[b>>2]=15072;nQ(b+15824|0);mX(b);return}function n8(b){b=b|0;var c=0;c=b;if(!(a[c+17016|0]&1)){n9(c+15824|0)}mY(c);return}function n9(a){a=a|0;var b=0;b=a;eS(b+1152|0);nV(b+1160|0);cb(b+1168|0);nW(b+1176|0);return}function oa(a,b,c){a=a|0;b=b|0;c=c|0;return n3(a+15824|0,b,c)|0}function ob(b,c){b=b|0;c=c|0;var d=0,e=0,f=0;d=c;c=b;if(a[c+17016|0]&1){e=na(c,d)|0;f=e;return f|0}else{a[c+17016|0]=1;b=nU(c+15824|0,d,c)|0;a[c+17016|0]=0;oc(c,0);e=b;f=e;return f|0}return 0}function oc(a,b){a=a|0;b=b|0;var c=0;c=a;nS(c+15824|0,b&1);eu(c,d[c+15830|0]|0);return}function od(a){a=a|0;var b=0;b=a;oc(b,1);ch(b);return}function oe(a,b){a=a|0;b=b|0;var c=0;c=a;return np(c,nT(c+15824|0,b)|0)|0}function of(a){a=a|0;r6(c[a>>2]|0);return}function og(a){a=a|0;r6(c[a>>2]|0);return}function oh(a){a=a|0;var b=0;b=a;c[b>>2]=0;c[b+4>>2]=0;return}function oi(a){a=a|0;var b=0;b=a;c[b>>2]=0;c[b+4>>2]=0;return}function oj(){var a=0,b=0,c=0;a=hB(17024)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;n5(b);c=b}return c|0}function ok(){var a=0,b=0,c=0;a=hB(1512)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;ol(b);c=b}return c|0}function ol(a){a=a|0;om(a);return}function om(a){a=a|0;var b=0;b=a;hE(b);c[b>>2]=14544;nM(b+316|0);g5(b,c[12]|0);return}function on(a){a=a|0;or(a);return}function oo(a){a=a|0;var b=0;b=a;on(b);bT(b);return}function op(a,b){a=a|0;b=b|0;var c=0,e=0,f=0;c=a;a=nU(c+316|0,b,0)|0;if((a|0)!=0){e=a;f=e;return f|0}nS(c+316|0,0);eu(c,d[c+322|0]|0);e=0;f=e;return f|0}function oq(a,b,c){a=a|0;b=b|0;c=c|0;return n3(a+316|0,b,c)|0}function or(a){a=a|0;var b=0;b=a;c[b>>2]=14544;nQ(b+316|0);fO(b);return}function os(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if(d>>>0<=(c[b+4>>2]|0)>>>0){}else{at(5216,3864,58,10632);return 0}return(c[b>>2]|0)+d|0}function ot(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=b;b=a;a=r7(c[b>>2]|0,d<<2)|0;do{if((a|0)==0){if((d|0)==0){break}e=3016;f=e;return f|0}}while(0);c[b>>2]=a;c[b+4>>2]=d;e=0;f=e;return f|0}function ou(a){a=a|0;var b=0;b=a;fR(b|0);ov(12,2,b+816|0);ov(264,64,b+818|0);ov(67584,16384,b+882|0);return}function ov(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;e=b;b=c;c=d;d=1;do{f=0;g=0;do{f=f|(d&1)<<g;d=d>>>1^e&-(d&1);h=g;g=h+1|0;}while((h|0)<7);g=c;c=g+1|0;a[g]=f&255;g=b-1|0;b=g;}while((g|0)!=0);return}function ow(a){a=a|0;var b=0;b=a;c[b+80>>2]=0;a=0;while(1){if((a|0)>=4){break}ox(b,a,0);a=a+1|0}return}function ox(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;if(e>>>0<4>>>0){}else{at(5176,3784,73,11160)}c[a+(e*20|0)+16>>2]=d;return}function oy(a,b){a=a|0;b=b|0;var d=0;d=a;c[d+80>>2]=b;c[d+84>>2]=0;c[d+88>>2]=0;c[d+92>>2]=0;c[d+96>>2]=0;c[d+100>>2]=0;b=0;while(1){if((b|0)>=4){break}sf(d+(b*20|0)|0,0,16);b=b+1|0}return}function oz(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;f=e;e=b;oA(e);b=c[e+80>>2]|0;g=b+882|0;h=131071;if((c[e+100>>2]&128|0)!=0){h=511;g=b+818|0}i=e+96|0;c[i>>2]=(c[i>>2]|0)%(h|0)|0;i=0;while(1){if((i|0)>=4){break}j=e+(i*20|0)|0;k=(c[e+84>>2]|0)+(c[j+8>>2]|0)|0;l=c[j+12>>2]|0;m=c[j+16>>2]|0;if((m|0)!=0){fX(m);n=d[j+1|0]|0;o=(n&15)<<1;do{if((o|0)!=0){if((n&16|0)!=0){p=2399;break}if((n&160|0)==160){if((l|0)<74){p=2399;break}}q=0;r=f;if((c[e+100>>2]&d[12784+i|0]|0)!=0){q=c[j+52>>2]|0;r=(c[e+84>>2]|0)+(c[j+48>>2]|0)|0;if((a[j+3|0]|0)!=0){s=j+4|0;c[s>>2]=(c[s>>2]|0)-o;o=-o|0}}if((k|0)<(f|0)){p=2410}else{if((r|0)<(f|0)){p=2410}}if((p|0)==2410){p=0;s=12776;t=16;u=a[j+2|0]&1;v=1;if((n&32|0)==0){s=g;t=h;u=c[e+96>>2]|0;if((n&64|0)!=0){s=b+816|0;t=15;u=c[e+92>>2]|0}v=(l|0)%(t|0)|0;u=(u+(c[j+8>>2]|0)|0)%(t|0)|0}v=v-t|0;w=377253537;x=0;if((n&128|0)==0){w=oB(w,((c[j+8>>2]|0)+(c[e+88>>2]|0)|0)%31|0)|0;x=(l|0)%31|0}y=c[j+4>>2]|0;do{if((r|0)<(k|0)){z=-y|0;if((o|0)<0){z=z+o|0}if((z|0)!=0){y=y+(z-o)|0;o=-o|0;fZ(b|0,r,z,m)}}while(1){if((r|0)>(k|0)){break}r=r+q|0}z=f;if((z|0)>(r|0)){z=r}while(1){if((k|0)>=(z|0)){break}if((w&1|0)!=0){A=o&-(d[s+(u>>3)|0]>>(u&7)&1);B=u+v|0;u=B;if((B|0)<0){u=u+t|0}B=A-y|0;if((B|0)!=0){y=A;fZ(b|0,k,B,m)}}w=oB(w,x)|0;k=k+l|0}if((k|0)<(f|0)){C=1}else{C=(r|0)<(f|0)}}while(C);a[j+2|0]=u&255;c[j+4>>2]=y}a[j+3|0]=0;if((o|0)<0){r=j+4|0;c[r>>2]=(c[r>>2]|0)-o;a[j+3|0]=1}}else{p=2399}}while(0);if((p|0)==2399){p=0;if((n&16|0)==0){o=o>>1}r=o-(c[j+4>>2]|0)|0;if((r|0)!=0){c[j+4>>2]=o;fZ(b|0,c[e+84>>2]|0,r,m)}}}r=f-k|0;if((r|0)>0){x=(r+l-1|0)/(l|0)|0;r=j+2|0;a[r]=(d[r]^x)&255;k=k+($(x,l)|0)|0}c[j+8>>2]=k-f;i=i+1|0}i=f-(c[e+84>>2]|0)|0;c[e+84>>2]=f;c[e+92>>2]=((c[e+92>>2]|0)+i|0)%15|0;c[e+88>>2]=((c[e+88>>2]|0)+i|0)%31|0;f=e+96|0;c[f>>2]=(c[f>>2]|0)+i;return}function oA(a){a=a|0;var b=0,e=0,f=0,g=0,h=0;b=a;a=28;if((c[b+100>>2]&1|0)!=0){a=114}e=0;while(1){if((e|0)>=4){break}f=b+(e*20|0)|0;g=d[f|0]|0;h=$(g+1|0,a)|0;if((c[b+100>>2]&(d[12792+e|0]|0)|0)!=0){h=g+4|0;if((e&1|0)!=0){h=(g<<8)+(d[f-20|0]|0)+7|0;if((c[b+100>>2]&(d[12792+(e-1)|0]|0)|0)==0){h=$(h-6|0,a)|0}}}c[f+12>>2]=h;e=e+1|0}return}function oB(a,b){a=a|0;b=b|0;var c=0;c=a;a=b;return c<<a&2147483647|c>>>((31-a|0)>>>0)|0}function oC(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=e;e=f;f=b;oz(f,d);d=(g^53760)>>>1;if((d|0)<4){a[f+(d*20|0)+(g&1)|0]=e&255;return}if((g|0)==53768){c[f+100>>2]=e}else{if((g|0)==53769){c[f+8>>2]=0;c[f+28>>2]=0;c[f+48>>2]=0;c[f+68>>2]=0}}return}function oD(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if((d|0)>(c[b+84>>2]|0)){oz(b,d)}a=b+84|0;c[a>>2]=(c[a>>2]|0)-d;return}function oE(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;e=c;c=d;d=b;a[d+1428+e|0]=c&255;if((e>>>8|0)!=210){return}o$(d,e,c);return}function oF(a,b){a=a|0;b=b|0;var c=0;c=b;return d[a+1428+c|0]|0|0}function oG(d,e){d=d|0;e=e|0;var f=0;f=d;c[f+8>>2]=f+12;c[f+28>>2]=e;a[f+5|0]=4;a[f+6|0]=-1;b[f>>1]=0;a[f+2|0]=0;a[f+3|0]=0;a[f+4|0]=0;c[f+16>>2]=0;c[f+12>>2]=0;c[f+20>>2]=1073741824;c[f+24>>2]=1073741824;ej();return}function oH(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;h=i;i=i+8|0;j=h|0;k=f;f=0;oI(k,g);g=j;l=k+12|0;c[g>>2]=c[l>>2];c[g+4>>2]=c[l+4>>2];c[k+8>>2]=j;l=c[j+4>>2]|0;g=c[k+28>>2]|0;m=e[k>>1]|0;n=d[k+2|0]|0;o=d[k+3|0]|0;p=d[k+4|0]|0;q=(d[k+6|0]|0)+1|256;r=d[k+5|0]|0;s=r&76;t=r<<8;u=t;t=t|~r&2;L3:while(1){r=c[k+24>>2]|0;do{if((s&4|0)==0){if((r|0)<=(c[k+20>>2]|0)){break}r=c[k+20>>2]|0}}while(0);v=d[g+m|0]|0;m=m+1|0;r=g+m|0;w=d[12520+v|0]|0;x=l+w|0;l=x;do{if((x|0)>=0){if((l|0)<(w|0)){y=11;break}l=l-w|0;m=m-1|0;c[j+4>>2]=l;z=-1;l=c[j+4>>2]|0;if((z|0)>=0){break}if((l|0)>=0){y=290;break L3}continue L3}else{y=11}}while(0);L21:do{if((y|0)==11){y=0;w=d[r]|0;L23:do{switch(v|0){case 181:{x=d[g+(w+o&255)|0]|0;t=x;n=x;m=m+1|0;continue L3;break};case 165:{x=d[g+w|0]|0;t=x;n=x;m=m+1|0;continue L3;break};case 208:{x=(w&255)<<24>>24;A=m+1|0;m=A;if((t&255)<<24>>24!=0){m=m+x|0;l=l+(((A&255)+x|0)>>>8&1)|0;continue L3}else{y=4;break L23}break};case 32:{x=m+1|0;m=g2(r)|0;a[g+(256|q-1)|0]=x>>>8&255;q=q-2|256;a[g+q|0]=x&255;continue L3;break};case 76:{m=g2(r)|0;continue L3;break};case 232:{x=o+1|0;t=x;o=x&255;continue L3;break};case 16:{x=(w&255)<<24>>24;A=m+1|0;m=A;if((t&32896|0)!=0){y=4;break L23}else{m=m+x|0;l=l+(((A&255)+x|0)>>>8&1)|0;continue L3}break};case 193:{x=w+o|0;w=((d[g+(x+1&255)|0]|0)<<8)+(d[g+(x&255)|0]|0)|0;y=34;break};case 209:{x=(d[g+w|0]|0)+p|0;w=x+((d[g+(w+1&255)|0]|0)<<8)|0;l=l+(x>>>8)|0;y=34;break};case 213:{w=w+o&255;y=29;break};case 197:{y=29;break};case 217:{w=w+p|0;y=32;break};case 221:{w=w+o|0;y=32;break};case 205:{y=33;break};case 201:{y=35;break};case 48:{x=(w&255)<<24>>24;A=m+1|0;m=A;if((t&32896|0)!=0){m=m+x|0;l=l+(((A&255)+x|0)>>>8&1)|0;continue L3}else{y=4;break L23}break};case 240:{x=(w&255)<<24>>24;A=m+1|0;m=A;if((t&255)<<24>>24!=0){y=4;break L23}else{m=m+x|0;l=l+(((A&255)+x|0)>>>8&1)|0;continue L3}break};case 149:{w=w+o&255;y=44;break};case 133:{y=44;break};case 200:{x=p+1|0;t=x;p=x&255;continue L3;break};case 168:{p=n;t=n;continue L3;break};case 152:{n=p;t=p;continue L3;break};case 173:{m=m+2|0;t=oF(k-336|0,g2(r)|0)|0;n=t;continue L3;break};case 96:{m=(d[g+q|0]|0)+1|0;m=m+((d[g+(256|q-255)|0]|0)<<8)|0;q=q-254|256;continue L3;break};case 153:{B=p+(g2(r)|0)|0;m=m+2|0;if(B>>>0<=2047>>>0){a[g+B|0]=n&255;continue L3}else{y=59;break L23}break};case 141:{B=g2(r)|0;m=m+2|0;if(B>>>0<=2047>>>0){a[g+B|0]=n&255;continue L3}else{y=59;break L23}break};case 157:{B=o+(g2(r)|0)|0;m=m+2|0;if(B>>>0<=2047>>>0){a[g+B|0]=n&255;continue L3}else{y=59;break L23}break};case 145:{B=(d[g+w|0]|0)+p+((d[g+(w+1&255)|0]|0)<<8)|0;m=m+1|0;y=59;break};case 129:{x=w+o|0;B=((d[g+(x+1&255)|0]|0)<<8)+(d[g+(x&255)|0]|0)|0;m=m+1|0;y=59;break};case 169:{m=m+1|0;n=w;t=w;continue L3;break};case 161:{x=w+o|0;C=((d[g+(x+1&255)|0]|0)<<8)+(d[g+(x&255)|0]|0)|0;m=m+1|0;y=73;break};case 177:{C=(d[g+w|0]|0)+p|0;l=l+(C>>>8)|0;C=C+((d[g+(w+1&255)|0]|0)<<8)|0;m=m+1|0;x=d[g+C|0]|0;t=x;n=x;if((C^32768)>>>0<=40959>>>0){continue L3}else{y=73;break L23}break};case 185:{l=l+((w+p|0)>>>8)|0;C=(g2(r)|0)+p|0;m=m+2|0;x=d[g+C|0]|0;t=x;n=x;if((C^32768)>>>0<=40959>>>0){continue L3}else{y=73;break L23}break};case 189:{l=l+((w+o|0)>>>8)|0;C=(g2(r)|0)+o|0;m=m+2|0;x=d[g+C|0]|0;t=x;n=x;if((C^32768)>>>0<=40959>>>0){continue L3}else{y=73;break L23}break};case 80:{x=(w&255)<<24>>24;A=m+1|0;m=A;if((s&64|0)!=0){y=4;break L23}else{m=m+x|0;l=l+(((A&255)+x|0)>>>8&1)|0;continue L3}break};case 112:{x=(w&255)<<24>>24;A=m+1|0;m=A;if((s&64|0)!=0){m=m+x|0;l=l+(((A&255)+x|0)>>>8&1)|0;continue L3}else{y=4;break L23}break};case 176:{x=(w&255)<<24>>24;A=m+1|0;m=A;if((u&256|0)!=0){m=m+x|0;l=l+(((A&255)+x|0)>>>8&1)|0;continue L3}else{y=4;break L23}break};case 144:{x=(w&255)<<24>>24;A=m+1|0;m=A;if((u&256|0)!=0){y=4;break L23}else{m=m+x|0;l=l+(((A&255)+x|0)>>>8&1)|0;continue L3}break};case 148:{w=w+o&255;y=87;break};case 132:{y=87;break};case 150:{w=w+p&255;y=89;break};case 134:{y=89;break};case 182:{w=w+p&255;y=91;break};case 166:{y=91;break};case 162:{y=92;break};case 180:{w=w+o&255;y=94;break};case 164:{y=94;break};case 160:{y=95;break};case 188:{w=w+o|0;l=l+(w>>>8)|0;y=97;break};case 172:{y=97;break};case 190:{w=w+p|0;l=l+(w>>>8)|0;y=99;break};case 174:{y=99;break};case 140:{D=p;y=102;break};case 142:{D=o;y=102;break};case 236:{x=g2(r)|0;m=m+1|0;c[j+4>>2]=l;w=oF(k-336|0,x)|0;l=c[j+4>>2]|0;y=108;break};case 228:{w=d[g+w|0]|0;y=107;break};case 224:{y=107;break};case 204:{x=g2(r)|0;m=m+1|0;c[j+4>>2]=l;w=oF(k-336|0,x)|0;l=c[j+4>>2]|0;y=112;break};case 196:{w=d[g+w|0]|0;y=111;break};case 192:{y=111;break};case 33:{x=w+o|0;w=((d[g+(x+1&255)|0]|0)<<8)+(d[g+(x&255)|0]|0)|0;y=121;break};case 49:{x=(d[g+w|0]|0)+p|0;w=x+((d[g+(w+1&255)|0]|0)<<8)|0;l=l+(x>>>8)|0;y=121;break};case 53:{w=w+o&255;y=116;break};case 37:{y=116;break};case 57:{w=w+p|0;y=119;break};case 61:{w=w+o|0;y=119;break};case 45:{y=120;break};case 41:{y=122;break};case 65:{x=w+o|0;w=((d[g+(x+1&255)|0]|0)<<8)+(d[g+(x&255)|0]|0)|0;y=132;break};case 81:{x=(d[g+w|0]|0)+p|0;w=x+((d[g+(w+1&255)|0]|0)<<8)|0;l=l+(x>>>8)|0;y=132;break};case 85:{w=w+o&255;y=127;break};case 69:{y=127;break};case 89:{w=w+p|0;y=130;break};case 93:{w=w+o|0;y=130;break};case 77:{y=131;break};case 73:{y=133;break};case 1:{x=w+o|0;w=((d[g+(x+1&255)|0]|0)<<8)+(d[g+(x&255)|0]|0)|0;y=143;break};case 17:{x=(d[g+w|0]|0)+p|0;w=x+((d[g+(w+1&255)|0]|0)<<8)|0;l=l+(x>>>8)|0;y=143;break};case 21:{w=w+o&255;y=138;break};case 5:{y=138;break};case 25:{w=w+p|0;y=141;break};case 29:{w=w+o|0;y=141;break};case 13:{y=142;break};case 9:{y=144;break};case 44:{m=m+2|0;s=s&-65;t=oF(k-336|0,g2(r)|0)|0;s=s|t&64;if((n&t|0)!=0){continue L3}else{t=t<<8;continue L3}break};case 36:{t=d[g+w|0]|0;m=m+1|0;s=s&-65;s=s|t&64;if((n&t|0)!=0){continue L3}else{t=t<<8;continue L3}break};case 225:{x=w+o|0;w=((d[g+(x+1&255)|0]|0)<<8)+(d[g+(x&255)|0]|0)|0;y=160;break};case 241:{x=(d[g+w|0]|0)+p|0;w=x+((d[g+(w+1&255)|0]|0)<<8)|0;l=l+(x>>>8)|0;y=160;break};case 245:{w=w+o&255;y=155;break};case 229:{y=155;break};case 249:{w=w+p|0;y=158;break};case 253:{w=w+o|0;y=158;break};case 237:{y=159;break};case 233:{y=161;break};case 235:{y=163;break};case 97:{x=w+o|0;w=((d[g+(x+1&255)|0]|0)<<8)+(d[g+(x&255)|0]|0)|0;y=172;break};case 113:{x=(d[g+w|0]|0)+p|0;w=x+((d[g+(w+1&255)|0]|0)<<8)|0;l=l+(x>>>8)|0;y=172;break};case 117:{w=w+o&255;y=167;break};case 101:{y=167;break};case 121:{w=w+p|0;y=170;break};case 125:{w=w+o|0;y=170;break};case 109:{y=171;break};case 105:{y=173;break};case 74:{u=0;y=177;break};case 106:{y=177;break};case 10:{t=n<<1;u=t;n=t&255;continue L3;break};case 42:{t=n<<1;x=u>>>8&1;u=t;t=t|x;n=t&255;continue L3;break};case 94:{w=w+o|0;y=181;break};case 78:{y=181;break};case 110:{y=182;break};case 62:{w=w+o|0;y=188;break};case 30:{w=w+o|0;y=186;break};case 14:{y=186;break};case 46:{y=187;break};case 126:{w=w+o|0;y=183;break};case 118:{w=w+o&255;y=195;break};case 86:{w=w+o&255;y=193;break};case 70:{y=193;break};case 102:{y=194;break};case 54:{w=w+o&255;y=200;break};case 22:{w=w+o&255;y=198;break};case 6:{y=198;break};case 38:{y=199;break};case 202:{x=o-1|0;t=x;o=x&255;continue L3;break};case 136:{x=p-1|0;t=x;p=x&255;continue L3;break};case 246:{w=w+o&255;y=204;break};case 230:{y=204;break};case 214:{w=w+o&255;y=206;break};case 198:{y=206;break};case 254:{w=o+(g2(r)|0)|0;y=211;break};case 238:{w=g2(r)|0;y=211;break};case 222:{w=o+(g2(r)|0)|0;y=214;break};case 206:{w=g2(r)|0;y=214;break};case 170:{o=n;t=n;continue L3;break};case 138:{n=o;t=o;continue L3;break};case 154:{q=o+1|256;continue L3;break};case 186:{x=q-1&255;t=x;o=x;continue L3;break};case 72:{q=q-1|256;a[g+q|0]=n&255;continue L3;break};case 104:{x=d[g+q|0]|0;t=x;n=x;q=q-255|256;continue L3;break};case 64:{x=d[g+q|0]|0;m=d[g+(256|q-255)|0]|0;m=m|(d[g+(256|q-254)|0]|0)<<8;q=q-253|256;w=s;s=x&76;t=x<<8;u=t;t=t|~x&2;a[k+5|0]=s&255;if(((w^s)&4|0)!=0){x=c[k+24>>2]|0;do{if((s&4|0)==0){if((x|0)<=(c[k+20>>2]|0)){break}x=c[k+20>>2]|0}}while(0);A=(c[j>>2]|0)-x|0;c[j>>2]=x;l=l+A|0}continue L3;break};case 40:{A=d[g+q|0]|0;q=q-255|256;E=s^A;s=A&76;t=A<<8;u=t;t=t|~A&2;if((E&4|0)==0){continue L3}if((s&4|0)!=0){y=265;break L23}else{y=252;break L23}break};case 8:{E=s&76;E=E|(t>>>8|t)&128;E=E|u>>>8&1;if((t&255|0)==0){E=E|2}q=q-1|256;a[g+q|0]=(E|48)&255;continue L3;break};case 108:{w=g2(r)|0;m=d[g+w|0]|0;w=w&65280|w+1&255;m=m|(d[g+w|0]|0)<<8;continue L3;break};case 0:{if((m-1|0)>>>0>=65279>>>0){y=276;break L3}m=m+1|0;z=4;break L21;break};case 56:{u=-1;continue L3;break};case 24:{u=0;continue L3;break};case 184:{s=s&-65;continue L3;break};case 216:{s=s&-9;continue L3;break};case 248:{s=s|8;continue L3;break};case 88:{if((s&4|0)!=0){s=s&-5;y=252;break L23}else{continue L3}break};case 120:{if((s&4|0)!=0){continue L3}else{s=s|4;y=265;break L23}break};case 28:case 60:case 92:case 124:case 220:case 252:{l=l+((w+o|0)>>>8)|0;y=269;break};case 12:{y=269;break};case 116:case 4:case 20:case 52:case 68:case 84:case 100:case 128:case 130:case 137:case 194:case 212:case 226:case 244:{y=270;break};case 234:case 26:case 58:case 90:case 122:case 218:case 250:{continue L3;break};default:{y=272;break L3}}}while(0);if((y|0)==4){y=0;l=l-1|0;continue L3}else if((y|0)==29){y=0;w=d[g+w|0]|0;y=36}else if((y|0)==32){y=0;l=l+(w>>>8)|0;y=33}else if((y|0)==44){y=0;m=m+1|0;a[g+w|0]=n&255;continue L3}else if((y|0)==59){y=0;c[j+4>>2]=l;oE(k-336|0,B,n);l=c[j+4>>2]|0;continue L3}else if((y|0)==73){y=0;c[j+4>>2]=l;E=oF(k-336|0,C)|0;t=E;n=E;l=c[j+4>>2]|0;continue L3}else if((y|0)==87){y=0;m=m+1|0;a[g+w|0]=p&255;continue L3}else if((y|0)==89){y=0;m=m+1|0;a[g+w|0]=o&255;continue L3}else if((y|0)==91){y=0;w=d[g+w|0]|0;y=92}else if((y|0)==94){y=0;w=d[g+w|0]|0;y=95}else if((y|0)==97){y=0;E=w+((d[r+1|0]|0)<<8)|0;m=m+2|0;c[j+4>>2]=l;A=oF(k-336|0,E)|0;t=A;p=A;l=c[j+4>>2]|0;continue L3}else if((y|0)==99){y=0;A=w+((d[r+1|0]|0)<<8)|0;m=m+2|0;c[j+4>>2]=l;E=oF(k-336|0,A)|0;t=E;o=E;l=c[j+4>>2]|0;continue L3}else if((y|0)==102){y=0;E=g2(r)|0;m=m+2|0;if(E>>>0<=2047>>>0){a[g+E|0]=D&255;continue L3}else{c[j+4>>2]=l;oE(k-336|0,E,D);l=c[j+4>>2]|0;continue L3}}else if((y|0)==107){y=0;y=108}else if((y|0)==111){y=0;y=112}else if((y|0)==116){y=0;w=d[g+w|0]|0;y=123}else if((y|0)==119){y=0;l=l+(w>>>8)|0;y=120}else if((y|0)==127){y=0;w=d[g+w|0]|0;y=134}else if((y|0)==130){y=0;l=l+(w>>>8)|0;y=131}else if((y|0)==138){y=0;w=d[g+w|0]|0;y=145}else if((y|0)==141){y=0;l=l+(w>>>8)|0;y=142}else if((y|0)==155){y=0;w=d[g+w|0]|0;y=162}else if((y|0)==158){y=0;l=l+(w>>>8)|0;y=159}else if((y|0)==167){y=0;w=d[g+w|0]|0;y=174}else if((y|0)==170){y=0;l=l+(w>>>8)|0;y=171}else if((y|0)==177){y=0;t=u>>>1&128;u=n<<8;t=t|n>>>1;n=t;continue L3}else if((y|0)==181){y=0;u=0;y=182}else if((y|0)==186){y=0;u=0;y=187}else if((y|0)==193){y=0;u=0;y=194}else if((y|0)==198){y=0;u=0;y=199}else if((y|0)==204){y=0;t=1;y=207}else if((y|0)==206){y=0;t=-1;y=207}else if((y|0)==211){y=0;t=1;y=215}else if((y|0)==214){y=0;t=-1;y=215}else if((y|0)==252){y=0;a[k+5|0]=s&255;E=(c[j>>2]|0)-(c[k+20>>2]|0)|0;do{if((E|0)<=0){if((l+(c[j>>2]|0)|0)<(c[k+20>>2]|0)){continue L3}else{break}}else{c[j>>2]=c[k+20>>2];l=l+E|0;if((l|0)<0){continue L3}if((E|0)>=(l+1|0)){A=j|0;c[A>>2]=(c[A>>2]|0)+(l+1);l=-1;c[k+20>>2]=c[j>>2];continue L3}else{break}}}while(0);continue L3}else if((y|0)==265){y=0;a[k+5|0]=s&255;E=(c[j>>2]|0)-(c[k+24>>2]|0)|0;c[j>>2]=c[k+24>>2];l=l+E|0;if((l|0)<0){continue L3}else{continue L3}}else if((y|0)==269){y=0;m=m+1|0;y=270}if((y|0)==33){y=0;m=m+1|0;w=w+((d[r+1|0]|0)<<8)|0;y=34}else if((y|0)==92){y=0;m=m+1|0;o=w;t=w;continue L3}else if((y|0)==95){y=0;m=m+1|0;p=w;t=w;continue L3}else if((y|0)==108){y=0;t=o-w|0;m=m+1|0;u=~t;t=t&255;continue L3}else if((y|0)==112){y=0;t=p-w|0;m=m+1|0;u=~t;t=t&255;continue L3}else if((y|0)==120){y=0;m=m+1|0;w=w+((d[r+1|0]|0)<<8)|0;y=121}else if((y|0)==131){y=0;m=m+1|0;w=w+((d[r+1|0]|0)<<8)|0;y=132}else if((y|0)==142){y=0;m=m+1|0;w=w+((d[r+1|0]|0)<<8)|0;y=143}else if((y|0)==159){y=0;m=m+1|0;w=w+((d[r+1|0]|0)<<8)|0;y=160}else if((y|0)==171){y=0;m=m+1|0;w=w+((d[r+1|0]|0)<<8)|0;y=172}else if((y|0)==182){y=0;y=183}else if((y|0)==187){y=0;y=188}else if((y|0)==194){y=0;y=195}else if((y|0)==199){y=0;y=200}else if((y|0)==207){y=0;t=t+(d[g+w|0]|0)|0;y=208}else if((y|0)==215){y=0;c[j+4>>2]=l;t=t+(oF(k-336|0,w)|0)|0;m=m+2|0;oE(k-336|0,w,t&255);l=c[j+4>>2]|0;continue L3}else if((y|0)==270){y=0;m=m+1|0;continue L3}if((y|0)==34){y=0;c[j+4>>2]=l;w=oF(k-336|0,w)|0;l=c[j+4>>2]|0;y=35}else if((y|0)==121){y=0;c[j+4>>2]=l;w=oF(k-336|0,w)|0;l=c[j+4>>2]|0;y=122}else if((y|0)==132){y=0;c[j+4>>2]=l;w=oF(k-336|0,w)|0;l=c[j+4>>2]|0;y=133}else if((y|0)==143){y=0;c[j+4>>2]=l;w=oF(k-336|0,w)|0;l=c[j+4>>2]|0;y=144}else if((y|0)==160){y=0;c[j+4>>2]=l;w=oF(k-336|0,w)|0;l=c[j+4>>2]|0;y=161}else if((y|0)==172){y=0;c[j+4>>2]=l;w=oF(k-336|0,w)|0;l=c[j+4>>2]|0;y=173}else if((y|0)==183){y=0;m=m+1|0;w=w+((d[r+1|0]|0)<<8)|0;c[j+4>>2]=l;E=oF(k-336|0,w)|0;t=u>>>1&128|E>>1;u=E<<8;y=189}else if((y|0)==188){y=0;m=m+1|0;w=w+((d[r+1|0]|0)<<8)|0;t=u>>>8&1;c[j+4>>2]=l;E=(oF(k-336|0,w)|0)<<1;u=E;t=t|E;y=189}else if((y|0)==195){y=0;E=d[g+w|0]|0;t=u>>>1&128|E>>1;u=E<<8;y=208}else if((y|0)==200){y=0;t=u>>>8&1;E=(d[g+w|0]|0)<<1;u=E;t=t|E;y=208}if((y|0)==35){y=0;y=36}else if((y|0)==122){y=0;y=123}else if((y|0)==133){y=0;y=134}else if((y|0)==144){y=0;y=145}else if((y|0)==161){y=0;y=162}else if((y|0)==173){y=0;y=174}else if((y|0)==189){y=0;m=m+1|0;oE(k-336|0,w,t&255);l=c[j+4>>2]|0;continue L3}else if((y|0)==208){y=0;m=m+1|0;a[g+w|0]=t&255;continue L3}if((y|0)==36){y=0;t=n-w|0;m=m+1|0;u=~t;t=t&255;continue L3}else if((y|0)==123){y=0;E=n&w;n=E;t=E;m=m+1|0;continue L3}else if((y|0)==134){y=0;E=n^w;n=E;t=E;m=m+1|0;continue L3}else if((y|0)==145){y=0;E=n|w;n=E;t=E;m=m+1|0;continue L3}else if((y|0)==162){y=0;y=163}else if((y|0)==174){y=0}if((y|0)==163){y=0;w=w^255}E=u>>>8&1;s=s&-65;s=s|(n^128)+E+((w&255)<<24>>24)>>2&64;A=n+w+E|0;t=A;u=A;m=m+1|0;n=t&255;continue L3}}while(0);l=l+7|0;a[g+(256|q-1)|0]=m>>>8&255;a[g+(256|q-2)|0]=m&255;m=g2(g+65530+z|0)|0;q=q-3|256;w=s&76;w=w|(t>>>8|t)&128;w=w|u>>>8&1;if((t&255|0)==0){w=w|2}w=w|32;if((z|0)!=0){w=w|16}a[g+q|0]=w&255;s=s&-9;s=s|4;a[k+5|0]=s&255;w=(c[j>>2]|0)-(c[k+24>>2]|0)|0;c[j>>2]=c[k+24>>2];l=l+w|0}if((y|0)==272){if(v>>>0<=255>>>0){}else{at(2488,7544,935,11152);return 0}f=1;m=m-1|0}else if((y|0)==276){m=m-1|0}c[j+4>>2]=l;b[k>>1]=m&65535;a[k+6|0]=q-1&255;a[k+2|0]=n&255;a[k+3|0]=o&255;a[k+4|0]=p&255;p=s&76;p=p|(t>>>8|t)&128;p=p|u>>>8&1;if((t&255|0)==0){p=p|2}a[k+5|0]=p&255;p=k+12|0;t=j;c[p>>2]=c[t>>2];c[p+4>>2]=c[t+4>>2];c[k+8>>2]=k+12;i=h;return f&1|0}function oI(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d+24>>2]=a;b=oJ(d,a,c[d+20>>2]|0)|0;a=(c[d+8>>2]|0)+4|0;c[a>>2]=(c[a>>2]|0)+b;return}function oJ(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=d;d=e;e=b;do{if((d|0)<(f|0)){if((a[e+5|0]&4|0)!=0){break}f=d}}while(0);d=(c[c[e+8>>2]>>2]|0)-f|0;c[c[e+8>>2]>>2]=f;return d|0}function oK(a){a=a|0;var b=0;b=a;oL(b+336|0);bR(b);c[b>>2]=15888;ow(b+964|0);ow(b+1068|0);ou(b+67224|0);g5(b,c[10]|0);fh(b,12488);g6(b,12456);g7(b,6);return}function oL(a){a=a|0;var b=0;b=a;c[b+8>>2]=b+12;return}function oM(a){a=a|0;var b=0;b=a;oN(b);bT(b);return}function oN(a){a=a|0;bU(a);return}function oO(a,b,c){a=a|0;b=b|0;c=c|0;oP(a+368|0,b);return 0}function oP(a,b){a=a|0;b=b|0;var c=0;c=a;a=b;ex(a+272|0,c+289|0);ex(a+784|0,c+33|0);ex(a+1040|0,c+545|0);return}function oQ(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=d;d=e;e=b;c[e+948>>2]=f+d;c[e+372>>2]=0;c[e+388>>2]=66;a[e+400|0]=0;c[e+376>>2]=-1;c[e+380>>2]=-1;c[e+384>>2]=-1;c[e+396>>2]=312;b=oR(f,d,e+368|0)|0;if((b|0)!=0){g=b;h=g;return h|0}eT(e,c[e+372>>2]|0);eu(e,c[e+392>>2]|0);he(e,4<<(a[e+400|0]&1));oS(e+67224|0,+hf(e));g=b3(e,1773447)|0;h=g;return h|0}function oR(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=b;b=e;e=f;c[e+24>>2]=1;a[e+33|0]=0;a[e+289|0]=0;a[e+545|0]=0;do{if((b|0)>=16){if((sj(g|0,7896,5)|0)!=0){break}f=g+b-5|0;g=g+5|0;while(1){if(g>>>0<f>>>0){if((d[g|0]|0|0)!=255){h=1}else{h=(d[g+1|0]|0|0)!=255}i=h}else{i=0}if(!i){j=402;break}k=g;while(1){if(k>>>0<f>>>0){l=(d[k]|0|0)!=13}else{l=0}if(!l){break}k=k+1|0}m=g;while(1){if(g>>>0<k>>>0){n=(d[g]|0|0)>32}else{n=0}if(!n){break}g=g+1|0}o=g-m|0;while(1){if(g>>>0<k>>>0){p=(d[g]|0|0)<=32}else{p=0}if(!p){break}g=g+1|0}if((o|0)>0){if((as(7520,m|0,o|0)|0)!=0){if((as(6832,m|0,o|0)|0)!=0){if((as(6504,m|0,o|0)|0)!=0){if((as(6192,m|0,o|0)|0)!=0){if((as(5592,m|0,o|0)|0)!=0){if((as(4928,m|0,o|0)|0)!=0){if((as(4776,m|0,o|0)|0)!=0){if((as(4592,m|0,o|0)|0)!=0){if((as(4544,m|0,o|0)|0)!=0){if((as(4480,m|0,o|0)|0)==0){o6(g,k,32,e+545|0)}}else{o6(g,k,256,e+289|0)}}else{o6(g,k,256,e+33|0)}}else{c[e+28>>2]=o5(g,k)|0;if((c[e+28>>2]|0)<=0){j=383;break}}}else{a[e+32|0]=1}}else{q=d[g]|0;c[e+20>>2]=q;if((q|0)==68){j=376;break}else if(!((q|0)==67|(q|0)==66)){j=377;break}}}else{c[e+24>>2]=o5(g,k)|0;if((c[e+24>>2]|0)<=0){j=371;break}}}else{c[e+16>>2]=o4(g)|0;if((c[e+16>>2]|0)>>>0>65535>>>0){j=367;break}}}else{c[e+12>>2]=o4(g)|0;if((c[e+12>>2]|0)>>>0>65535>>>0){j=363;break}}}else{c[e+8>>2]=o4(g)|0;if((c[e+8>>2]|0)>>>0>65535>>>0){j=359;break}}}g=k+2|0}if((j|0)==359){r=7144;s=r;return s|0}else if((j|0)==363){r=6600;s=r;return s|0}else if((j|0)==367){r=6408;s=r;return s|0}else if((j|0)==371){r=5808;s=r;return s|0}else if((j|0)==376){r=5288;s=r;return s|0}else if((j|0)==377){r=5096;s=r;return s|0}else if((j|0)==383){r=4704;s=r;return s|0}else if((j|0)==402){do{if((d[g|0]|0|0)==255){if((d[g+1|0]|0|0)!=255){break}c[e>>2]=g+2;r=0;s=r;return s|0}}while(0);r=4320;s=r;return s|0}}}while(0);r=c[2]|0;s=r;return s|0}function oS(a,b){a=a|0;b=+b;f0(a|0,.008333333333333333*b);return}function oT(a,b){a=a|0;b=b|0;gL(a+67224|0,b);return}function oU(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0;g=c;c=b;b=g-4|0;if((b|0)>=0){ox(c+1068|0,b,f);return}else{ox(c+964|0,g,a[c+400|0]&1?e:d);return}}function oV(a,b){a=a|0;b=+b;c[a+952>>2]=~~(114.0/b);return}function oW(c,e){c=c|0;e=e|0;var f=0,g=0;f=c;b[f+336>>1]=e&65535;e=254;do{if((d[f+342|0]|0|0)==254){if((d[f+1939|0]|0|0)!=(e|0)){break}a[f+342|0]=-1}}while(0);c=f+342|0;g=a[c]|0;a[c]=g-1&255;a[f+1428+((g&255)+256)|0]=e&255;g=f+342|0;c=a[g]|0;a[g]=c-1&255;a[f+1428+((c&255)+256)|0]=e&255;e=f+342|0;c=a[e]|0;a[e]=c-1&255;a[f+1428+((c&255)+256)|0]=-2;return}function oX(a,b){a=a|0;b=b|0;var c=0;c=a;oW(c,b);oH(c+336|0,2134080)|0;return}function oY(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=b;b=a;a=b5(b,e)|0;if((a|0)!=0){f=a;g=f;return g|0}sf(b+1172|0,0,66048);a=c[b+368>>2]|0;while(1){if(((c[b+948>>2]|0)-a|0)<5){break}h=g2(a)|0;i=g2(a+2|0)|0;a=a+4|0;if(i>>>0<h>>>0){j=438;break}k=i-h+1|0;if((k|0)>((c[b+948>>2]|0)-a|0)){j=440;break}i=b+1428+h|0;h=a;l=k;sg(i|0,h|0,l)|0;a=a+k|0;do{if(((c[b+948>>2]|0)-a|0)>=2){if((d[a|0]|0|0)!=255){break}if((d[a+1|0]|0|0)!=255){break}a=a+2|0}}while(0)}if((j|0)==438){eT(b,560)}else if((j|0)==440){eT(b,560)}oy(b+964|0,b+67224|0);oy(b+1068|0,b+67224|0);oG(b+336|0,b+1428|0);c[b+960>>2]=0;oZ(b,e);c[b+960>>2]=-1;c[b+956>>2]=o_(b)|0;f=0;g=f;return g|0}function oZ(b,d){b=b|0;d=d|0;var e=0;e=d;d=b;b=c[d+388>>2]|0;if((b|0)==66){a[d+338|0]=e&255;oX(d,c[d+376>>2]|0);return}else if((b|0)==67){a[d+338|0]=112;a[d+339|0]=c[d+384>>2]&255;a[d+340|0]=c[d+384>>2]>>8&255;oX(d,(c[d+380>>2]|0)+3|0);a[d+338|0]=0;a[d+339|0]=e&255;oX(d,(c[d+380>>2]|0)+3|0);return}else{return}}function o_(a){a=a|0;var b=0;b=a;return $(c[b+396>>2]|0,c[b+952>>2]|0)|0}function o$(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=d;d=e;e=b;if((f^53760)>>>0<=9>>>0){b=o0(e+336|0)|0;oC(e+964|0,b&c[e+960>>2],f,d);return}do{if((f^53776)>>>0<=9>>>0){if(!(a[e+400|0]&1)){break}b=o0(e+336|0)|0;oC(e+1068|0,b&c[e+960>>2],f^16,d);return}}while(0);do{if((f&-17|0)==53775){if((d|0)!=3){break}return}}while(0);return}function o0(a){a=a|0;var b=0;b=a;return(c[(c[b+8>>2]|0)+4>>2]|0)+(c[c[b+8>>2]>>2]|0)|0}function o1(b,d,f){b=b|0;d=d|0;f=f|0;var g=0,h=0,i=0,j=0;f=d;d=b;o2(d+336|0,0);while(1){b=o0(d+336|0)|0;if((b|0)>=(c[f>>2]|0)){break}if(oH(d+336|0,c[f>>2]|0)|0){g=476;break}if((e[d+336>>1]|0|0)>65279){g=476;break}if((e[d+336>>1]|0|0)==65279){if((c[d+956>>2]|0)<=(c[f>>2]|0)){o2(d+336|0,c[d+956>>2]|0);b=o_(d)|0;h=d+956|0;c[h>>2]=(c[h>>2]|0)+b;o3(d)}else{o2(d+336|0,c[f>>2]|0)}}}if((g|0)==476){i=144;j=i;return j|0}c[f>>2]=o0(d+336|0)|0;g=d+956|0;c[g>>2]=(c[g>>2]|0)-(c[f>>2]|0);if((c[d+956>>2]|0)<0){c[d+956>>2]=0}oD(d+964|0,c[f>>2]|0);if(a[d+400|0]&1){oD(d+1068|0,c[f>>2]|0)}i=0;j=i;return j|0}function o2(a,b){a=a|0;b=b|0;var d=0;d=a;c[(c[d+8>>2]|0)+4>>2]=b-(c[c[d+8>>2]>>2]|0);return}function o3(a){a=a|0;var b=0;b=a;a=c[b+388>>2]|0;if((a|0)==66){oW(b,c[b+380>>2]|0);return}else if((a|0)==67){oW(b,(c[b+380>>2]|0)+6|0);return}else{return}}function o4(a){a=a|0;var b=0,c=0,e=0,f=0,g=0,h=0,i=0;b=a;a=0;c=4;while(1){e=c;c=e-1|0;if((e|0)==0){f=504;break}e=b;b=e+1|0;g=eV(d[e]|0)|0;if((g|0)>15){f=502;break}a=(a<<4)+g|0}if((f|0)==502){h=-1;i=h;return i|0}else if((f|0)==504){h=a;i=h;return i|0}return 0}function o5(a,b){a=a|0;b=b|0;var c=0,e=0,f=0,g=0,h=0,i=0;c=a;a=b;if(c>>>0>=a>>>0){e=-1;f=e;return f|0}b=0;while(1){if(c>>>0>=a>>>0){g=515;break}h=c;c=h+1|0;i=(d[h]|0)-48|0;if(i>>>0>9>>>0){g=513;break}b=(b*10|0)+i|0}if((g|0)==515){e=b;f=e;return f|0}else if((g|0)==513){e=-1;f=e;return f|0}return 0}function o6(b,c,e,f){b=b|0;c=c|0;e=e|0;f=f|0;var g=0,h=0,i=0;g=b;b=c;c=e;e=f;f=g;h=g;g=h+1|0;if((d[h]|0|0)==34){f=f+1|0;while(1){if(g>>>0<b>>>0){i=(d[g]|0|0)!=34}else{i=0}if(!i){break}g=g+1|0}}else{g=b}c=o7(c-1|0,g-f|0)|0;a[e+c|0]=0;g=e;e=f;f=c;sg(g|0,e|0,f)|0;return}function o7(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((c|0)<(a|0)){d=c}else{d=a}return d|0}function o8(){var a=0,b=0,c=0;a=hB(84496)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;oK(b);c=b}return c|0}function o9(){var a=0,b=0,c=0;a=hB(896)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;pa(b);c=b}return c|0}function pa(a){a=a|0;pb(a);return}function pb(a){a=a|0;var b=0;b=a;hE(b);c[b>>2]=14984;g5(b,c[10]|0);return}function pc(a){a=a|0;pg(a);return}function pd(a){a=a|0;var b=0;b=a;pc(b);bT(b);return}function pe(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=a;a=oR(b,d,e+316|0)|0;if((a|0)!=0){f=a;g=f;return g|0}eu(e,c[e+340>>2]|0);f=0;g=f;return g|0}function pf(a,b,c){a=a|0;b=b|0;c=c|0;oP(a+316|0,b);return 0}function pg(a){a=a|0;fO(a);return}function ph(b){b=b|0;var e=0,f=0;e=b;sf(e+1868|0,0,66640);pV(e|0,e+2716|0);c[e+2008>>2]=256;a[e+2138|0]=-1;a[e+2139|0]=-64;b=0;while(1){if((b|0)>=128){break}f=d[12176+b|0]|0;a[e+2204+(b<<1)|0]=f>>4&255;a[e+2204+((b<<1)+1)|0]=f&15;b=b+1|0}b=e+1612|0;sg(b|0,19072,256)|0;pi(e);return 0}function pi(a){a=a|0;var b=0;b=a;sf(b+2716|0,-1|0,65536);pm(b);pq(b,15);pX(b|0);return}function pj(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;c[b+2008>>2]=d;if((d|0)==0){d=1}a=((d>>1)+4096|0)/(d|0)|0;if((a|0)<4){a=4}c[b+1920>>2]=a;c[b+1896>>2]=a<<3;c[b+1872>>2]=a<<3;return}function pk(b){b=b|0;var e=0,f=0;e=b;b=0;while(1){if((b|0)>=3){break}f=e+1868+(b*24|0)|0;c[f+8>>2]=((d[e+1940+(b+10)|0]|0)-1&255)+1;c[f+16>>2]=(d[e+1941|0]|0)>>b&1;c[f+20>>2]=a[e+1956+(b+13)|0]&15;b=b+1|0}pj(e,c[e+2008>>2]|0);return}function pl(b,c){b=b|0;c=c|0;var d=0,e=0;d=b;b=d+1940|0;e=c;sg(b|0,e|0,16)|0;e=d+1956|0;b=d+1940|0;sg(e|0,b|0,16)|0;a[d+1956|0]=0;a[d+1957|0]=0;a[d+1966|0]=0;a[d+1967|0]=0;a[d+1968|0]=0;return}function pm(a){a=a|0;var b=0;b=a;c[b+2072>>2]=0;pl(b,b+2956|0);sf(b+2460|0,-1|0,256);sf(b+68252|0,-1|0,256);return}function pn(b){b=b|0;var c=0;c=b;pE(c,a[c+1941|0]&128);pk(c);return}function po(b){b=b|0;var d=0,e=0;d=b;c[d+2020>>2]=0;a[d+2004|0]=0;c[d+2e3>>2]=0;c[d+1996>>2]=0;c[d+1996>>2]=33;b=0;while(1){if((b|0)>=3){break}e=d+1868+(b*24|0)|0;c[e>>2]=1;c[e+12>>2]=0;b=b+1|0}pn(d);c[d+2024>>2]=0;pp(d);return}function pp(a){a=a|0;var d=0,e=0;d=a;a=d+2040|0;while(1){if(a>>>0>=(d+2056|0)>>>0){break}e=a;a=e+2|0;b[e>>1]=0}c[d+2036>>2]=a;c[d+2028>>2]=0;pR(d|0,0,0);return}function pq(b,d){b=b|0;d=d|0;var e=0;e=d;d=b;b=0;while(1){if((b|0)>=3){break}a[d+1956+(b+13)|0]=e&255;b=b+1|0}sf(d+1972|0,0,24);c[d+1972>>2]=65472;a[d+1940|0]=10;a[d+1941|0]=-80;b=0;while(1){if((b|0)>=4){break}a[d+1956+(b+4)|0]=0;b=b+1|0}po(d);return}function pr(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0;f=e;e=a;a=b;do{if((f|0)>=35){if((sj(a|0,19032,27)|0)!=0){break}if((f|0)<65920){g=7496;h=g;return h|0}else{c[e+1972>>2]=((d[a+38|0]|0)<<8)+(d[a+37|0]|0);c[e+1976>>2]=d[a+39|0]|0;c[e+1980>>2]=d[a+40|0]|0;c[e+1984>>2]=d[a+41|0]|0;c[e+1988>>2]=d[a+42|0]|0;c[e+1992>>2]=d[a+43|0]|0;b=e+2716|0;i=a+256|0;sg(b|0,i|0,65536)|0;pm(e);p_(e|0,a+65792|0);po(e);g=0;h=g;return h|0}}}while(0);g=2208;h=g;return h|0}function ps(a){a=a|0;var b=0,c=0;b=a;if(((pt(b|0,108)|0)&32|0)!=0){return}a=(pt(b|0,109)|0)<<8;c=a+(((pt(b|0,125)|0)&15)<<11)|0;if((c|0)>65536){c=65536}sf(b+2716+a|0,-1|0,c-a|0);return}function pt(a,b){a=a|0;b=b|0;var c=0;c=b;if(c>>>0<128>>>0){}else{at(1008,480,161,10576);return 0}return d[a+c|0]|0|0}function pu(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=d;d=e;e=a;if((d&1|0)==0){}else{at(5080,3680,279,10920)}a=e+2024|0;c[a>>2]=c[a>>2]&31;if((f|0)==0){pp(e);return}a=f+(d<<1)|0;c[e+2028>>2]=f;c[e+2032>>2]=a;d=e+2040|0;while(1){if(d>>>0<(c[e+2036>>2]|0)>>>0){g=f>>>0<a>>>0}else{g=0}if(!g){break}h=d;d=h+2|0;i=f;f=i+2|0;b[i>>1]=b[h>>1]|0}if(f>>>0>=a>>>0){f=pv(e|0)|0;a=(pv(e|0)|0)+32|0;while(1){if(d>>>0>=(c[e+2036>>2]|0)>>>0){break}g=d;d=g+2|0;h=f;f=h+2|0;b[h>>1]=b[g>>1]|0}if(f>>>0<=a>>>0){}else{at(2984,3680,303,10920)}}pR(e|0,f,(a-f|0)/2|0);return}function pv(a){a=a|0;return a+1580|0}function pw(a){a=a|0;var d=0,e=0,f=0,g=0,h=0;d=a;a=c[d+2032>>2]|0;e=px(d|0)|0;do{if((c[d+2028>>2]|0)>>>0<=e>>>0){if(e>>>0>a>>>0){break}a=e;e=pv(d|0)|0}}while(0);f=d+2040|0;g=c[d+2028>>2]|0;h=g+((py(d)|0)<<1)|0;while(1){if(h>>>0>=a>>>0){break}g=f;f=g+2|0;b[g>>1]=b[h>>1]|0;h=h+2|0}h=pv(d|0)|0;while(1){if(h>>>0>=e>>>0){break}a=f;f=a+2|0;b[a>>1]=b[h>>1]|0;h=h+2|0}c[d+2036>>2]=f;if(f>>>0<=(d+2072|0)>>>0){return}at(2336,3680,334,10936);return}function px(a){a=a|0;return c[a+1568>>2]|0}function py(a){a=a|0;return c[a+2024>>2]>>5<<1|0}function pz(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;b=a;if((e&1|0)==0){}else{at(1656,3680,339,10896);return 0}if((e|0)!=0){pu(b,d,e);pO(b,e<<4)}e=c[b+2020>>2]|0;c[b+2020>>2]=0;return e|0}function pA(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=b;b=a;if((d|0)<=128e3){e=d;f=pz(b,e,0)|0;return f|0}pu(b,0,0);a=d;d=(d&3)+64e3|0;a=a-d<<4;c[b+2012>>2]=0;c[b+2016>>2]=0;g=(c[b+1996>>2]|0)+(c[b+2e3>>2]|0)|0;c[b+1996>>2]=a-(c[b+2e3>>2]|0)+127;pO(b,a);c[b+1996>>2]=(c[b+1996>>2]|0)-127+g;pB(b|0,92,c[b+2016>>2]&~c[b+2012>>2]);pB(b|0,76,c[b+2012>>2]|0);ps(b);e=d;f=pz(b,e,0)|0;return f|0}function pB(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=d;d=e;e=b;if(f>>>0<128>>>0){}else{at(1008,480,185,10984)}a[e+f|0]=d&255;b=f&15;if((b|0)<2){pC(e,b^f);return}if((b|0)==12){if((f|0)==76){c[e+300>>2]=d&255}if((f|0)==124){a[e+124|0]=0}}return}function pC(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=d;d=b;b=a[d+e|0]|0;f=a[d+(e+1)|0]|0;g=$(b,f)|0;if((g|0)<(c[d+1564>>2]|0)){b=b^b>>7;f=f^f>>7}g=d+308+((e>>4)*140|0)|0;e=c[g+136>>2]|0;c[g+128>>2]=b&e;c[g+132>>2]=f&e;return}function pD(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;a=b;b=((d-(c[a>>2]|0)|0)/(c[a+4>>2]|0)|0)+1|0;d=$(b,c[a+4>>2]|0)|0;e=a|0;c[e>>2]=(c[e>>2]|0)+d;if((c[a+16>>2]|0)==0){f=a;return f|0}d=(c[a+12>>2]|0)+b|0;e=b-(((c[a+8>>2]|0)-(c[a+12>>2]|0)-1&255)+1)|0;if((e|0)>=0){b=(e|0)/(c[a+8>>2]|0)|0;c[a+20>>2]=(c[a+20>>2]|0)+1+b&15;d=e-($(b,c[a+8>>2]|0)|0)|0}c[a+12>>2]=d&255;f=a;return f|0}function pE(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=b;b=a;if((c[b+2072>>2]|0)==(d|0)){return}c[b+2072>>2]=d;if((d|0)!=0){a=b+2140|0;e=b+68188|0;sg(a|0,e|0,64)|0}e=b+68188|0;if((d|0)!=0){f=b+2076|0}else{f=b+2140|0}b=f;sg(e|0,b|0,64)|0;return}function pF(b,d){b=b|0;d=d|0;var e=0;e=b;b=d-(a[e+1612+(a[e+1942|0]&127)|0]|0)-(c[e+1996>>2]|0)|0;if((b|0)>=0){d=(b&-32)+32|0;b=e+1996|0;c[b>>2]=(c[b>>2]|0)+d;pS(e|0,d)}return pt(e|0,a[e+1942|0]&127)|0}function pG(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=d;d=e;e=f;f=b;switch(e|0){case 10:case 11:case 12:{b=f+1868+((e-10|0)*24|0)|0;h=(g-1&255)+1|0;if((c[b+8>>2]|0)!=(h|0)){b=pH(f,b,d)|0;c[b+8>>2]=h}return};case 13:case 14:case 15:{if((g|0)<4096){c[(pH(f,f+1868+((e-13|0)*24|0)|0,d-1|0)|0)+20>>2]=0}return};case 8:case 9:{a[f+1956+e|0]=g&255;return};case 0:{return};case 1:{if((g&16|0)!=0){a[f+1960|0]=0;a[f+1961|0]=0}if((g&32|0)!=0){a[f+1962|0]=0;a[f+1963|0]=0}e=0;while(1){if((e|0)>=3){break}h=f+1868+(e*24|0)|0;b=g>>e&1;if((c[h+16>>2]|0)!=(b|0)){h=pH(f,h,d)|0;c[h+16>>2]=b;if((b|0)!=0){c[h+12>>2]=0;c[h+20>>2]=0}}e=e+1|0}pE(f,g&128);return};default:{return}}}function pH(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=b;b=d;if((b|0)<(c[e>>2]|0)){f=e;return f|0}e=pD(a,e,b)|0;f=e;return f|0}function pI(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b;b=c;c=d;d=a;if((c|0)==3){pJ(d,e,b);return}else{pG(d,e,b,c);return}}function pJ(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0;g=e;e=b;b=f-(a[e+1612+(d[e+1942|0]|0)|0]|0)-(c[e+1996>>2]|0)|0;if((b|0)>=0){f=(b&-32)+32|0;b=e+1996|0;c[b>>2]=(c[b>>2]|0)+f;pS(e|0,f)}else{if((c[e+1996>>2]|0)==127){f=d[e+1942|0]|0;if((f|0)==76){b=g&~(pt(e|0,92)|0);h=e+2012|0;c[h>>2]=c[h>>2]|b}if((f|0)==92){f=e+2016|0;c[f>>2]=c[f>>2]|g;f=e+2012|0;c[f>>2]=c[f>>2]&~g}}}if((d[e+1942|0]|0)<=127){pB(e|0,d[e+1942|0]|0,g);return}else{return}}function pK(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0;h=e;e=f;f=g;g=b;if((e|0)<64){a[g+2140+e|0]=h&255;if((c[g+2072>>2]|0)!=0){a[g+2716+(e+65472)|0]=a[g+2076+e|0]|0}return}else{if((d[g+2716+(e+65472)|0]|0|0)==(h&255|0)){}else{at(2152,7416,406,10904)}a[g+2716+(e+65472)|0]=-1;pL(g,h,e+65472-65536|0,f);return}}function pL(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=c;c=d;d=e;e=b;a[e+2716+c|0]=f&255;b=c-240|0;if((b|0)<0){return}if((b|0)<16){a[e+1940+b|0]=f&255;do{if((b|0)!=2){if((b|0)>=4){if((b|0)<=7){break}}pI(e,f,d,b)}}while(0)}else{b=b-65232|0;if((b|0)>=0){pK(e,f,b,d)}}return}function pM(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0;f=b;b=e;e=a;a=d[e+2716+f|0]|0;g=f-240|0;if((g|0)<0){h=a;return h|0}g=g-16|0;if(g>>>0>=65280>>>0){g=g+3|0;if(g>>>0<3>>>0){f=e+1868+(g*24|0)|0;if((b|0)>=(c[f>>2]|0)){f=pD(e,f,b)|0}a=c[f+20>>2]|0;c[f+20>>2]=0}else{if((g|0)<0){a=pN(e,g+13|0,b)|0}else{if((g-65283|0)<256){}else{at(5e3,7416,496,10880);return 0}a=pM(e,g-65283|0,b)|0}}}h=a;return h|0}function pN(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0;e=b;b=a;a=d[b+1956+e|0]|0;e=e-2|0;if(e>>>0>1>>>0){f=a;return f|0}a=d[b+1942|0]|0;if((e|0)==1){a=pF(b,c)|0}f=a;return f|0}function pO(a,b){a=a|0;b=b|0;var d=0,e=0;d=b;b=a;if((d|0)>(c[b+2e3>>2]|0)){a=d;pP(b,a)|0}a=b+2e3|0;c[a>>2]=(c[a>>2]|0)-d;a=b+2024|0;c[a>>2]=(c[a>>2]|0)+d;if(-11<=(c[b+2e3>>2]|0)){if((c[b+2e3>>2]|0)<=0){}else{e=829}}else{e=829}if((e|0)==829){at(3616,7416,545,10864)}e=0;while(1){if((e|0)>=3){break}pH(b,b+1868+(e*24|0)|0,0)|0;e=e+1|0}if((c[b+1996>>2]|0)<0){e=-29-(c[b+1996>>2]|0)|0;if((e|0)>=0){d=(e&-32)+32|0;e=b+1996|0;c[e>>2]=(c[e>>2]|0)+d;pS(b|0,d)}}if((c[b+2028>>2]|0)==0){return}pw(b);return}function pP(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;f=e;e=b;b=(c[e+2e3>>2]|0)-f|0;if((b|0)<=0){}else{at(2968,2256,163,10952);return 0}c[e+2e3>>2]=f;g=e+1996|0;c[g>>2]=(c[g>>2]|0)+b;g=e+1868|0;c[g>>2]=(c[g>>2]|0)+b;g=e+1892|0;c[g>>2]=(c[g>>2]|0)+b;g=e+1916|0;c[g>>2]=(c[g>>2]|0)+b;g=e+2716|0;h=c[e+1976>>2]|0;i=c[e+1980>>2]|0;j=c[e+1984>>2]|0;k=g+(c[e+1972>>2]|0)|0;l=g+257+(c[e+1992>>2]|0)|0;m=c[e+1988>>2]|0;n=c[e+1988>>2]<<8;o=c[e+1988>>2]<<3&256;p=c[e+1988>>2]<<4&2048|~c[e+1988>>2]&2;L969:while(1){q=d[k]|0;r=b+(d[e+2204+q|0]|0)|0;b=r;if((r|0)>0){s=849;break}r=k+1|0;k=r;t=d[r]|0;L972:do{switch(q|0){case 143:{s=880;break};case 230:{t=i+o|0;k=k-1|0;s=901;break};case 247:{t=(g2(g+(t+o)|0)|0)+j|0;s=901;break};case 231:{t=g2(g+((t+i&255)+o)|0)|0;s=901;break};case 246:{t=t+j|0;s=899;break};case 245:{t=t+i|0;s=898;break};case 229:{s=898;break};case 244:{t=t+i&255;t=t+o|0;s=901;break};case 191:{r=i+o|0;i=i+1&255;u=pM(e,r,b-1|0)|0;p=u;h=u;continue L969;break};case 232:{h=t;p=t;break};case 249:{t=t+j&255;s=905;break};case 196:{k=k+1|0;u=o+t|0;a[g+u|0]=h&255;u=u-240|0;if(u>>>0<16>>>0){r=u-2|0;a[e+1940+u|0]=h&255;if((r|0)==1){pJ(e,h,b)}else{if(r>>>0>1>>>0){pG(e,h,b,u)}}}continue L969;break};case 111:{u=l-g|0;k=g+(g2(l)|0)|0;l=l+2|0;if((u|0)<511){continue L969}else{k=g+((d[l-257|0]<<8)+(d[g+((u&255)+256)|0]|0))|0;l=l-256|0;continue L969}break};case 240:{k=k+1|0;k=k+((t&255)<<24>>24)|0;if((p&255)<<24>>24!=0){k=k+(-((t&255)<<24>>24)|0)|0;b=b-2|0;continue L969}else{continue L969}break};case 208:{k=k+1|0;k=k+((t&255)<<24>>24)|0;if((p&255)<<24>>24!=0){continue L969}else{k=k+(-((t&255)<<24>>24)|0)|0;b=b-2|0;continue L969}break};case 228:{k=k+1|0;u=b|0;r=o+t|0;v=r-253|0;if(v>>>0<3>>>0){w=e+1868+(v*24|0)|0;if((u|0)>=(c[w>>2]|0)){w=pD(e,w,u)|0}v=c[w+20>>2]|0;p=v;h=v;c[w+20>>2]=0}else{w=d[g+r|0]|0;p=w;h=w;w=r-240|0;if(w>>>0<16>>>0){r=pN(e,w,u)|0;p=r;h=r}}continue L969;break};case 63:{r=k-g+2|0;k=g+(g2(k)|0)|0;u=l-2|0;l=u;w=u-g|0;if((w|0)>256){g3(l,r)}else{a[g+((w&255)+256)|0]=r&255;a[l+1|0]=r>>8&255;l=l+256|0}continue L969;break};case 250:{r=b-2|0;w=o+t|0;u=w-253|0;if(u>>>0<3>>>0){v=e+1868+(u*24|0)|0;if((r|0)>=(c[v>>2]|0)){v=pD(e,v,r)|0}x=c[v+20>>2]|0;c[v+20>>2]=0}else{x=d[g+w|0]|0;v=w-240|0;if(v>>>0<16>>>0){x=pN(e,v,r)|0}}t=x+8192|0;s=880;break};case 248:{s=905;break};case 233:{t=g2(k)|0;k=k+1|0;t=pM(e,t,b|0)|0;s=914;break};case 205:{s=914;break};case 251:{t=t+i&255;s=916;break};case 235:{s=916;break};case 236:{r=g2(k)|0;k=k+2|0;v=b|0;w=r;r=w-253|0;if(r>>>0<3>>>0){u=e+1868+(r*24|0)|0;if((v|0)>=(c[u>>2]|0)){u=pD(e,u,v)|0}r=c[u+20>>2]|0;p=r;j=r;c[u+20>>2]=0}else{u=d[g+w|0]|0;p=u;j=u;u=w-240|0;if(u>>>0<16>>>0){w=pN(e,u,v)|0;p=w;j=w}}continue L969;break};case 141:{j=t;p=t;break};case 198:{t=i+o|0;k=k-1|0;s=941;break};case 215:{t=(g2(g+(t+o)|0)|0)+j|0;s=941;break};case 199:{t=g2(g+((t+i&255)+o)|0)|0;s=941;break};case 214:{t=t+j|0;s=939;break};case 213:{t=t+i|0;s=938;break};case 197:{s=938;break};case 212:{t=t+i&255;t=t+o|0;s=941;break};case 204:{y=j;s=944;break};case 201:{y=i;s=944;break};case 217:{t=t+j&255;s=946;break};case 216:{s=946;break};case 219:{t=t+i&255;s=948;break};case 203:{s=948;break};case 125:{h=i;p=i;continue L969;break};case 221:{h=j;p=j;continue L969;break};case 93:{i=h;p=h;continue L969;break};case 253:{j=h;p=h;continue L969;break};case 157:{w=l-257-g|0;p=w;i=w;continue L969;break};case 189:{l=g+257+i|0;continue L969;break};case 175:{pL(e,h+8192|0,o+i|0,b|0);i=i+1|0;continue L969;break};case 38:{t=i+o|0;k=k-1|0;s=965;break};case 55:{t=(g2(g+(t+o)|0)|0)+j|0;s=965;break};case 39:{t=g2(g+((t+i&255)+o)|0)|0;s=965;break};case 54:{t=t+j|0;s=962;break};case 53:{t=t+i|0;s=961;break};case 37:{s=961;break};case 52:{t=t+i&255;s=964;break};case 36:{s=964;break};case 40:{s=966;break};case 57:{t=pM(e,o+j|0,b-2|0)|0;z=i+o|0;s=970;break};case 41:{t=pM(e,o+t|0,b-3|0)|0;s=969;break};case 56:{s=969;break};case 6:{t=i+o|0;k=k-1|0;s=980;break};case 23:{t=(g2(g+(t+o)|0)|0)+j|0;s=980;break};case 7:{t=g2(g+((t+i&255)+o)|0)|0;s=980;break};case 22:{t=t+j|0;s=977;break};case 21:{t=t+i|0;s=976;break};case 5:{s=976;break};case 20:{t=t+i&255;s=979;break};case 4:{s=979;break};case 8:{s=981;break};case 25:{t=pM(e,o+j|0,b-2|0)|0;A=i+o|0;s=985;break};case 9:{t=pM(e,o+t|0,b-3|0)|0;s=984;break};case 24:{s=984;break};case 70:{t=i+o|0;k=k-1|0;s=995;break};case 87:{t=(g2(g+(t+o)|0)|0)+j|0;s=995;break};case 71:{t=g2(g+((t+i&255)+o)|0)|0;s=995;break};case 86:{t=t+j|0;s=992;break};case 85:{t=t+i|0;s=991;break};case 69:{s=991;break};case 84:{t=t+i&255;s=994;break};case 68:{s=994;break};case 72:{s=996;break};case 89:{t=pM(e,o+j|0,b-2|0)|0;B=i+o|0;s=1e3;break};case 73:{t=pM(e,o+t|0,b-3|0)|0;s=999;break};case 88:{s=999;break};case 102:{t=i+o|0;k=k-1|0;s=1010;break};case 119:{t=(g2(g+(t+o)|0)|0)+j|0;s=1010;break};case 103:{t=g2(g+((t+i&255)+o)|0)|0;s=1010;break};case 118:{t=t+j|0;s=1007;break};case 117:{t=t+i|0;s=1006;break};case 101:{s=1006;break};case 116:{t=t+i&255;s=1009;break};case 100:{s=1009;break};case 104:{s=1011;break};case 121:{t=pM(e,o+j|0,b-2|0)|0;p=(pM(e,o+i|0,b-1|0)|0)-t|0;n=~p;p=p&255;continue L969;break};case 105:{t=pM(e,o+t|0,b-3|0)|0;s=1014;break};case 120:{s=1014;break};case 62:{t=t+o|0;s=1017;break};case 30:{t=g2(k)|0;k=k+1|0;s=1017;break};case 200:{s=1018;break};case 126:{t=t+o|0;s=1021;break};case 94:{t=g2(k)|0;k=k+1|0;s=1021;break};case 173:{s=1022;break};case 185:case 153:{k=k-1|0;t=pM(e,o+j|0,b-2|0)|0;C=i+o|0;s=1026;break};case 169:case 137:{t=pM(e,o+t|0,b-3|0)|0;s=1025;break};case 184:case 152:{s=1025;break};case 134:case 166:{t=i+o|0;k=k-1|0;s=1036;break};case 151:case 183:{t=(g2(g+(t+o)|0)|0)+j|0;s=1036;break};case 135:case 167:{t=g2(g+((t+i&255)+o)|0)|0;s=1036;break};case 150:case 182:{t=t+j|0;s=1033;break};case 149:case 181:{t=t+i|0;s=1032;break};case 133:case 165:{s=1032;break};case 148:case 180:{t=t+i&255;s=1035;break};case 132:case 164:{s=1035;break};case 168:case 136:{s=1037;break};case 188:{p=h+1|0;h=p&255;continue L969;break};case 61:{p=i+1|0;i=p&255;continue L969;break};case 252:{p=j+1|0;j=p&255;continue L969;break};case 156:{p=h-1|0;h=p&255;continue L969;break};case 29:{p=i-1|0;i=p&255;continue L969;break};case 220:{p=j-1|0;j=p&255;continue L969;break};case 155:case 187:{t=t+i&255;s=1050;break};case 139:case 171:{s=1050;break};case 140:case 172:{t=g2(k)|0;k=k+1|0;s=1052;break};case 92:{n=0;s=1054;break};case 124:{s=1054;break};case 28:{n=0;s=1056;break};case 60:{s=1056;break};case 11:{n=0;t=t+o|0;s=1063;break};case 27:{n=0;s=1059;break};case 59:{s=1059;break};case 43:{s=1060;break};case 12:{n=0;s=1062;break};case 44:{s=1062;break};case 75:{n=0;t=t+o|0;s=1070;break};case 91:{n=0;s=1066;break};case 123:{s=1066;break};case 107:{s=1067;break};case 76:{n=0;s=1069;break};case 108:{s=1069;break};case 159:{w=h>>4|h<<4&255;h=w;p=w;continue L969;break};case 186:{h=pM(e,o+t|0,b-2|0)|0;p=h&127|h>>1;j=pM(e,o+(t+1&255)|0,b|0)|0;p=p|j;break};case 218:{pL(e,h,o+t|0,b-1|0);pL(e,j+8192|0,o+(t+1&255)|0,b|0);break};case 58:case 26:{t=t+o|0;w=pM(e,t,b-3|0)|0;w=w+((q>>>4&2)-1)|0;p=(w>>1|w)&127;pL(e,w,t,b-2|0);t=(t+1&255)+o|0;w=(w>>8)+(pM(e,t,b-1|0)|0)&255;p=p|w;pL(e,w,t,b|0);break};case 122:case 154:{w=pM(e,o+t|0,b-2|0)|0;v=pM(e,o+(t+1&255)|0,b|0)|0;if((q|0)==154){w=(w^255)+1|0;v=v^255}w=w+h|0;u=j+v+(w>>8)|0;r=v^j^u;m=m&-73|r>>1&8|r+128>>2&64;n=u;h=w&255;u=u&255;j=u;p=(w>>1|w)&127|u;break};case 90:{u=h-(pM(e,o+t|0,b-1|0)|0)|0;p=(u>>1|u)&127;u=j+(u>>8)|0;u=u-(pM(e,o+(t+1&255)|0,b|0)|0)|0;p=p|u;n=~u;p=p&255;break};case 207:{u=$(j,h)|0;h=u&255;p=(u>>>1|u)&127;j=u>>>8;p=p|j;continue L969;break};case 158:{u=(j<<8)+h|0;m=m&-73;if((j|0)>=(i|0)){m=m|64}if((j&15|0)>=(i&15|0)){m=m|8}if((j|0)<(i<<1|0)){h=(u>>>0)/(i>>>0)|0;j=u-($(h,i)|0)|0}else{h=255-(((u-(i<<9)|0)>>>0)/((256-i|0)>>>0)|0)|0;j=i+(((u-(i<<9)|0)>>>0)%((256-i|0)>>>0)|0)|0}p=h&255;h=h&255;continue L969;break};case 223:{if((h|0)>153){s=1090}else{if((n&256|0)!=0){s=1090}}if((s|0)==1090){s=0;h=h+96|0;n=256}if((h&15|0)>9){s=1093}else{if((m&8|0)!=0){s=1093}}if((s|0)==1093){s=0;h=h+6|0}p=h;h=h&255;continue L969;break};case 190:{if((h|0)>153){s=1097}else{if((n&256|0)==0){s=1097}}if((s|0)==1097){s=0;h=h-96|0;n=0}if((h&15|0)>9){s=1100}else{if((m&8|0)==0){s=1100}}if((s|0)==1100){s=0;h=h-6|0}p=h;h=h&255;continue L969;break};case 47:{k=k+((t&255)<<24>>24)|0;break};case 48:{k=k+1|0;k=k+((t&255)<<24>>24)|0;if((p&2176|0)!=0){continue L969}else{k=k+(-((t&255)<<24>>24)|0)|0;b=b-2|0;continue L969}break};case 16:{k=k+1|0;k=k+((t&255)<<24>>24)|0;if((p&2176|0)!=0){k=k+(-((t&255)<<24>>24)|0)|0;b=b-2|0;continue L969}else{continue L969}break};case 176:{k=k+1|0;k=k+((t&255)<<24>>24)|0;if((n&256|0)!=0){continue L969}else{k=k+(-((t&255)<<24>>24)|0)|0;b=b-2|0;continue L969}break};case 144:{k=k+1|0;k=k+((t&255)<<24>>24)|0;if((n&256|0)!=0){k=k+(-((t&255)<<24>>24)|0)|0;b=b-2|0;continue L969}else{continue L969}break};case 112:{k=k+1|0;k=k+((t&255)<<24>>24)|0;if((m&64|0)!=0){continue L969}else{k=k+(-((t&255)<<24>>24)|0)|0;b=b-2|0;continue L969}break};case 80:{k=k+1|0;k=k+((t&255)<<24>>24)|0;if((m&64|0)!=0){k=k+(-((t&255)<<24>>24)|0)|0;b=b-2|0;continue L969}else{continue L969}break};case 3:case 35:case 67:case 99:case 131:case 163:case 195:case 227:{k=k+1|0;if(((pM(e,o+t|0,b-4|0)|0)>>(q>>>5)&1|0)!=0){s=846;break L972}else{b=b-2|0;break L972}break};case 19:case 51:case 83:case 115:case 147:case 179:case 211:case 243:{k=k+1|0;if(((pM(e,o+t|0,b-4|0)|0)>>(q>>>5)&1|0)!=0){b=b-2|0;break L972}else{s=846;break L972}break};case 222:{t=t+i&255;s=1128;break};case 46:{s=1128;break};case 110:{u=(pM(e,o+t|0,b-4|0)|0)-1|0;pL(e,u+8192|0,o+(t&255)|0,b-3|0);k=k+1|0;if((u|0)!=0){s=846;break L972}else{b=b-2|0;break L972}break};case 254:{j=j-1&255;k=k+1|0;k=k+((t&255)<<24>>24)|0;if((j|0)!=0){continue L969}else{k=k+(-((t&255)<<24>>24)|0)|0;b=b-2|0;continue L969}break};case 31:{k=g+((g2(k)|0)+i)|0;s=1145;break};case 95:{s=1145;break};case 15:{u=k-g|0;k=g+(g2(g+65502|0)|0)|0;w=l-2|0;l=w;r=w-g|0;if((r|0)>256){g3(l,u)}else{a[g+((r&255)+256)|0]=u&255;a[l+1|0]=u>>8&255;l=l+256|0}u=m&-164;u=u|n>>8&1;u=u|o>>3&32;u=u|(p>>4|p)&128;if((p&255)<<24>>24==0){u=u|2}m=(m|16)&-5;r=l-1|0;l=r;a[r]=u&255;if((l-g|0)==256){l=l+256|0}continue L969;break};case 79:{u=k-g+1|0;k=g+(65280|t)|0;r=l-2|0;l=r;w=r-g|0;if((w|0)>256){g3(l,u)}else{a[g+((w&255)+256)|0]=u&255;a[l+1|0]=u>>8&255;l=l+256|0}continue L969;break};case 1:case 17:case 33:case 49:case 65:case 81:case 97:case 113:case 129:case 145:case 161:case 177:case 193:case 209:case 225:case 241:{u=k-g|0;k=g+(g2(g+(65502-(q>>>3))|0)|0)|0;w=l-2|0;l=w;r=w-g|0;if((r|0)>256){g3(l,u)}else{a[g+((r&255)+256)|0]=u&255;a[l+1|0]=u>>8&255;l=l+256|0}continue L969;break};case 127:{D=d[l]|0;k=g+(g2(l+1|0)|0)|0;l=l+3|0;s=1166;break};case 142:{u=l;l=u+1|0;D=d[u]|0;if((l-g|0)==513){D=d[l-257|0]|0;l=l-256|0}s=1166;break};case 13:{u=m&-164;u=u|n>>8&1;u=u|o>>3&32;u=u|(p>>4|p)&128;if((p&255)<<24>>24==0){u=u|2}r=l-1|0;l=r;a[r]=u&255;if((l-g|0)==256){l=l+256|0}continue L969;break};case 45:{u=l-1|0;l=u;a[u]=h&255;if((l-g|0)==256){l=l+256|0}continue L969;break};case 77:{u=l-1|0;l=u;a[u]=i&255;if((l-g|0)==256){l=l+256|0}continue L969;break};case 109:{u=l-1|0;l=u;a[u]=j&255;if((l-g|0)==256){l=l+256|0}continue L969;break};case 174:{u=l;l=u+1|0;h=d[u]|0;if((l-g|0)==513){h=d[l-257|0]|0;l=l-256|0}continue L969;break};case 206:{u=l;l=u+1|0;i=d[u]|0;if((l-g|0)==513){i=d[l-257|0]|0;l=l-256|0}continue L969;break};case 238:{u=l;l=u+1|0;j=d[u]|0;if((l-g|0)==513){j=d[l-257|0]|0;l=l-256|0}continue L969;break};case 2:case 34:case 66:case 98:case 130:case 162:case 194:case 226:case 18:case 50:case 82:case 114:case 146:case 178:case 210:case 242:{u=1<<(q>>>5);r=~u;if((q&16|0)!=0){u=0}t=t+o|0;pL(e,(pM(e,t,b-1|0)|0)&r|u,t,b|0);break};case 14:case 78:{t=g2(k)|0;k=k+2|0;u=pM(e,t,b-2|0)|0;p=h-u&255;u=u&~h;if((q|0)==14){u=u|h}pL(e,u,t,b|0);continue L969;break};case 74:{n=n&(pQ(e,k,b|0)|0);k=k+2|0;continue L969;break};case 106:{n=n&~(pQ(e,k,b|0)|0);k=k+2|0;continue L969;break};case 10:{n=n|(pQ(e,k,b-1|0)|0);k=k+2|0;continue L969;break};case 42:{n=n|~(pQ(e,k,b-1|0)|0);k=k+2|0;continue L969;break};case 138:{n=n^(pQ(e,k,b-1|0)|0);k=k+2|0;continue L969;break};case 234:{t=g2(k)|0;k=k+2|0;u=pM(e,t&8191,b-1|0)|0;u=u^1<<(t>>>13);pL(e,u,t&8191,b|0);continue L969;break};case 202:{t=g2(k)|0;k=k+2|0;u=pM(e,t&8191,b-2|0)|0;r=t>>>13;u=u&~(1<<r)|(n>>8&1)<<r;pL(e,u+8192|0,t&8191,b|0);continue L969;break};case 170:{n=pQ(e,k,b|0)|0;k=k+2|0;continue L969;break};case 96:{n=0;continue L969;break};case 128:{n=-1;continue L969;break};case 237:{n=n^256;continue L969;break};case 224:{m=m&-73;continue L969;break};case 32:{o=0;continue L969;break};case 64:{o=256;continue L969;break};case 160:{m=m|4;continue L969;break};case 192:{m=m&-5;continue L969;break};case 0:{continue L969;break};case 255:{u=k-g-1|0;if(u>>>0<65536>>>0){s=1215;break L969}u=u&65535;k=g+u|0;continue L969;break};case 239:{s=1216;break L969;break};default:{s=1217;break L969}}}while(0);do{if((s|0)==880){s=0;u=d[k+1|0]|0;k=k+2|0;r=o+u|0;a[g+r|0]=t&255;r=r-240|0;if(r>>>0<16>>>0){a[e+1940+r|0]=t&255;if((-788594688<<r|0)<0){pI(e,t,b,r)}}continue L969}else if((s|0)==898){s=0;s=899}else if((s|0)==905){s=0;r=b|0;u=o+t|0;w=u-253|0;if(w>>>0<3>>>0){v=e+1868+(w*24|0)|0;if((r|0)>=(c[v>>2]|0)){v=pD(e,v,r)|0}w=c[v+20>>2]|0;p=w;i=w;c[v+20>>2]=0}else{v=d[g+u|0]|0;p=v;i=v;v=u-240|0;if(v>>>0<16>>>0){u=pN(e,v,r)|0;p=u;i=u}}}else if((s|0)==914){s=0;i=t;p=t}else if((s|0)==916){s=0;k=k+1|0;u=b|0;r=o+t|0;v=r-253|0;if(v>>>0<3>>>0){w=e+1868+(v*24|0)|0;if((u|0)>=(c[w>>2]|0)){w=pD(e,w,u)|0}v=c[w+20>>2]|0;p=v;j=v;c[w+20>>2]=0}else{w=d[g+r|0]|0;p=w;j=w;w=r-240|0;if(w>>>0<16>>>0){r=pN(e,w,u)|0;p=r;j=r}}continue L969}else if((s|0)==938){s=0;s=939}else if((s|0)==944){s=0;pL(e,y,g2(k)|0,b|0);k=k+2|0;continue L969}else if((s|0)==946){s=0;pL(e,i,t+o|0,b|0)}else if((s|0)==948){s=0;pL(e,j,t+o|0,b|0)}else if((s|0)==961){s=0;s=962}else if((s|0)==964){s=0;t=t+o|0;s=965}else if((s|0)==969){s=0;r=k+1|0;k=k+2|0;z=(d[r]|0)+o|0;s=970}else if((s|0)==976){s=0;s=977}else if((s|0)==979){s=0;t=t+o|0;s=980}else if((s|0)==984){s=0;r=k+1|0;k=k+2|0;A=(d[r]|0)+o|0;s=985}else if((s|0)==991){s=0;s=992}else if((s|0)==994){s=0;t=t+o|0;s=995}else if((s|0)==999){s=0;r=k+1|0;k=k+2|0;B=(d[r]|0)+o|0;s=1e3}else if((s|0)==1006){s=0;s=1007}else if((s|0)==1009){s=0;t=t+o|0;s=1010}else if((s|0)==1014){s=0;r=k+1|0;k=r;p=(pM(e,o+(d[r]|0)|0,b-1|0)|0)-t|0;n=~p;p=p&255}else if((s|0)==1017){s=0;t=pM(e,t,b|0)|0;s=1018}else if((s|0)==1021){s=0;t=pM(e,t,b|0)|0;s=1022}else if((s|0)==1025){s=0;r=k+1|0;k=r;C=(d[r]|0)+o|0;s=1026}else if((s|0)==1032){s=0;s=1033}else if((s|0)==1035){s=0;t=t+o|0;s=1036}else if((s|0)==1050){s=0;t=t+o|0;s=1052}else if((s|0)==1054){s=0;p=n>>1&128|h>>1;n=h<<8;h=p;continue L969}else if((s|0)==1056){s=0;r=n>>8&1;n=h<<1;p=n|r;h=p&255;continue L969}else if((s|0)==1059){s=0;t=t+i&255;s=1060}else if((s|0)==1062){s=0;t=g2(k)|0;k=k+1|0;s=1063}else if((s|0)==1066){s=0;t=t+i&255;s=1067}else if((s|0)==1069){s=0;t=g2(k)|0;k=k+1|0;s=1070}else if((s|0)==1128){s=0;r=b-4|0;u=o+t|0;w=u-253|0;if(w>>>0<3>>>0){v=e+1868+(w*24|0)|0;if((r|0)>=(c[v>>2]|0)){v=pD(e,v,r)|0}E=c[v+20>>2]|0;c[v+20>>2]=0}else{E=d[g+u|0]|0;v=u-240|0;if(v>>>0<16>>>0){E=pN(e,v,r)|0}}k=k+1|0;if((E|0)!=(h|0)){s=846;break}else{b=b-2|0;break}}else if((s|0)==1145){s=0;k=g+(g2(k)|0)|0;continue L969}else if((s|0)==1166){s=0;m=D;n=D<<8;o=D<<3&256;p=D<<4&2048|~D&2;continue L969}}while(0);if((s|0)==899){s=0;r=k+1|0;k=r;t=t+(d[r]<<8)|0;s=901}else if((s|0)==846){s=0;k=k+(a[k]|0)|0}else if((s|0)==939){s=0;r=k+1|0;k=r;t=t+(d[r]<<8)|0;s=941}else if((s|0)==962){s=0;r=k+1|0;k=r;t=t+(d[r]<<8)|0;s=965}else if((s|0)==970){s=0;p=t&(pM(e,z,b-1|0)|0);pL(e,p,z,b|0);continue}else if((s|0)==977){s=0;r=k+1|0;k=r;t=t+(d[r]<<8)|0;s=980}else if((s|0)==985){s=0;p=t|(pM(e,A,b-1|0)|0);pL(e,p,A,b|0);continue}else if((s|0)==992){s=0;r=k+1|0;k=r;t=t+(d[r]<<8)|0;s=995}else if((s|0)==1e3){s=0;p=t^(pM(e,B,b-1|0)|0);pL(e,p,B,b|0);continue}else if((s|0)==1007){s=0;r=k+1|0;k=r;t=t+(d[r]<<8)|0;s=1010}else if((s|0)==1018){s=0;p=i-t|0;n=~p;p=p&255}else if((s|0)==1022){s=0;p=j-t|0;n=~p;p=p&255}else if((s|0)==1026){s=0;p=pM(e,C,b-1|0)|0;s=1038}else if((s|0)==1033){s=0;r=k+1|0;k=r;t=t+(d[r]<<8)|0;s=1036}else if((s|0)==1052){s=0;p=(q>>>4&2)-1|0;p=p+(pM(e,t,b-1|0)|0)|0;pL(e,p,t,b|0)}else if((s|0)==1060){s=0;t=t+o|0;s=1063}else if((s|0)==1067){s=0;t=t+o|0;s=1070}if((s|0)==901){s=0;r=pM(e,t,b|0)|0;p=r;h=r}else if((s|0)==941){s=0;pL(e,h,t,b|0)}else if((s|0)==965){s=0;t=pM(e,t,b|0)|0;s=966}else if((s|0)==980){s=0;t=pM(e,t,b|0)|0;s=981}else if((s|0)==995){s=0;t=pM(e,t,b|0)|0;s=996}else if((s|0)==1010){s=0;t=pM(e,t,b|0)|0;s=1011}else if((s|0)==1036){s=0;t=pM(e,t,b|0)|0;s=1037}else if((s|0)==1063){s=0;p=n>>8&1;r=(pM(e,t,b-1|0)|0)<<1;n=r;p=p|r;pL(e,p,t,b|0)}else if((s|0)==1070){s=0;r=pM(e,t,b-1|0)|0;p=n>>1&128|r>>1;n=r<<8;pL(e,p,t,b|0)}if((s|0)==966){s=0;r=h&t;h=r;p=r}else if((s|0)==981){s=0;r=h|t;h=r;p=r}else if((s|0)==996){s=0;r=h^t;h=r;p=r}else if((s|0)==1011){s=0;p=h-t|0;n=~p;p=p&255}else if((s|0)==1037){s=0;C=-1;p=h;s=1038}do{if((s|0)==1038){s=0;if(q>>>0>=160>>>0){t=t^255}r=t^p;p=p+(t+(n>>8&1))|0;r=r^p;m=m&-73|r>>1&8|r+128>>2&64;n=p;if((C|0)<0){h=p&255;break}else{pL(e,p,C,b|0);break}}}while(0);k=k+1|0}if((s|0)==849){b=b-(d[e+2204+(d[k]|0)|0]|0)|0}else if((s|0)==1215){s=1216}else if((s|0)==1217){at(992,2256,1200,10952);return 0}if((s|0)==1216){k=k-1|0;b=0;c[e+2020>>2]=1632}c[e+1972>>2]=k-g&65535;c[e+1992>>2]=l-257-g&255;c[e+1976>>2]=h&255;c[e+1980>>2]=i&255;c[e+1984>>2]=j&255;j=m&-164;j=j|n>>8&1;j=j|o>>3&32;j=j|(p>>4|p)&128;if((p&255)<<24>>24==0){j=j|2}c[e+1988>>2]=j&255;j=e+2e3|0;c[j>>2]=(c[j>>2]|0)+b;j=e+1996|0;c[j>>2]=(c[j>>2]|0)-b;j=e+1868|0;c[j>>2]=(c[j>>2]|0)-b;j=e+1892|0;c[j>>2]=(c[j>>2]|0)-b;j=e+1916|0;c[j>>2]=(c[j>>2]|0)-b;if((c[e+2e3>>2]|0)<=(f|0)){f=e+1868|0;e=f+72|0;f=e|0;e=f+4|0;return e|0}at(456,2256,1220,10952);return 0}function pQ(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=g2(b)|0;return(pM(a,d&8191,c|0)|0)>>(d>>>13)<<8&256|0}function pR(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;b=d;d=a;if((b&1|0)==0){}else{at(2040,7304,78,11032)}if((e|0)==0){e=d+1580|0;b=16}c[d+1576>>2]=e;c[d+1568>>2]=e;c[d+1572>>2]=e+(b<<1);return}function pS(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;g=e;e=(c[g+280>>2]|0)+f|0;f=e>>5;c[g+280>>2]=e&31;if((f|0)==0){return}e=c[g+1556>>2]|0;h=e+(d[g+93|0]<<8)|0;i=d[g+45|0]>>1|d[g+61|0];j=a[g+108|0]&31;k=a[g+12|0]|0;l=a[g+28|0]|0;m=$(k,l)|0;if((m|0)<(c[g+1564>>2]|0)){k=-k|0}do{m=g+260|0;n=c[m>>2]^1;c[m>>2]=n;if((n|0)!=0){n=g+300|0;c[n>>2]=c[n>>2]&~c[g+264>>2];c[g+264>>2]=c[g+300>>2];c[g+304>>2]=d[g+92|0]|0}pT(g,1);pT(g,2);pT(g,3);if((c[c[g+1428+(j<<2)>>2]>>2]&c[21656+(j<<2)>>2]|0)==0){c[g+268>>2]=(c[g+268>>2]<<13^c[g+268>>2]<<14)&16384^c[g+268>>2]>>1}n=0;m=0;o=0;p=0;q=0;r=g+308|0;s=g|0;t=1;do{u=d[e+(c[r+104>>2]|0)|0]|0;v=c[r+112>>2]|0;w=(g2(s+2|0)|0)&16383;if((d[g+45|0]&t|0)!=0){w=w+(($(n>>5,w)|0)>>10)|0}x=v-1|0;v=x;if((x|0)>=0){c[r+112>>2]=v;if((v|0)==4){c[r+104>>2]=g2(h+(d[s+4|0]<<2)|0)|0;c[r+108>>2]=1;c[r+96>>2]=r;u=0}c[r+120>>2]=0;c[r+124>>2]=0;c[r+100>>2]=(v&3|0)!=0?16384:0;w=0}v=c[r+120>>2]|0;x=0;a[s+8|0]=v>>4&255;if((v|0)!=0){y=(c[r+100>>2]|0)>>>3&510;z=19584+(y<<1)|0;A=20604+(-y<<1)|0;y=(c[r+96>>2]|0)+((c[r+100>>2]|0)>>>12<<2)|0;if((i&t|0)!=0){x=(c[g+268>>2]<<1&65535)<<16>>16;if((d[g+61|0]&t|0)==0){x=($(b[z>>1]|0,c[y>>2]|0)|0)>>11;x=x+(($(b[z+2>>1]|0,c[y+4>>2]|0)|0)>>11)|0;x=x+(($(b[A+2>>1]|0,c[y+8>>2]|0)|0)>>11)|0;x=(x&65535)<<16>>16;x=x+(($(b[A>>1]|0,c[y+12>>2]|0)|0)>>11)|0;if(((x&65535)<<16>>16|0)!=(x|0)){x=x>>31^32767}x=x&-2}x=($(x,v)|0)>>11&-2}else{B=$(b[z>>1]|0,c[y>>2]|0)|0;C=B+($(b[z+2>>1]|0,c[y+4>>2]|0)|0)|0;z=C+($(b[A+2>>1]|0,c[y+8>>2]|0)|0)|0;x=z+($(b[A>>1]|0,c[y+12>>2]|0)|0)>>11;x=($(x,v)|0)>>11}y=$(x,c[r+128>>2]|0)|0;A=$(x,c[r+132>>2]|0)|0;m=m+y|0;o=o+A|0;if((d[g+77|0]&t|0)!=0){p=p+y|0;q=q+A|0}}n=x;a[s+9|0]=x>>8&255;if((a[g+108|0]&128|0)!=0){D=1263}else{if((u&3|0)==1){D=1263}}if((D|0)==1263){D=0;c[r+116>>2]=0;v=0}if((c[g+260>>2]|0)!=0){if((c[g+304>>2]&t|0)!=0){c[r+116>>2]=0}if((c[g+264>>2]&t|0)!=0){c[r+112>>2]=5;c[r+116>>2]=1;x=g+124|0;a[x]=d[x]&~t&255}}L1495:do{if((c[r+112>>2]|0)!=0){D=1309}else{do{if((c[r+116>>2]|0)==0){v=v-8|0;c[r+120>>2]=v;if((v|0)<=0){c[r+120>>2]=0;break L1495}else{break}}else{x=d[s+5|0]|0;A=d[s+6|0]|0;if((x|0)>=128){if((c[r+116>>2]|0)>2){v=v-1|0;v=v-(v>>8)|0;E=A&31;c[r+124>>2]=v;if((c[c[g+1428+(E<<2)>>2]>>2]&c[21656+(E<<2)>>2]|0)!=0){D=1310;break L1495}else{c[r+120>>2]=v;D=1310;break L1495}}if((c[r+116>>2]|0)==2){v=v-1|0;v=v-(v>>8)|0;E=(x>>3&14)+16|0}else{E=((x&15)<<1)+1|0;v=v+((E|0)<31?32:1024)|0}}else{A=d[s+7|0]|0;x=A>>5;if((x|0)<4){v=A<<4;E=31}else{E=A&31;if((x|0)==4){v=v-32|0}else{if((x|0)<6){v=v-1|0;v=v-(v>>8)|0}else{v=v+32|0;do{if((x|0)>6){if((c[r+124>>2]|0)>>>0<1536>>>0){break}v=v-24|0}}while(0)}}}}do{if((v>>8|0)==(A>>5|0)){if((c[r+116>>2]|0)!=2){break}c[r+116>>2]=3}}while(0);c[r+124>>2]=v;if(v>>>0>2047>>>0){v=(v|0)<0?0:2047;if((c[r+116>>2]|0)==1){c[r+116>>2]=2}}if((c[c[g+1428+(E<<2)>>2]>>2]&c[21656+(E<<2)>>2]|0)==0){c[r+120>>2]=v}}}while(0);D=1309}}while(0);if((D|0)==1309){D=0;D=1310}if((D|0)==1310){D=0;v=c[r+100>>2]|0;A=(v&16383)+w|0;if((A|0)>32767){A=32767}c[r+100>>2]=A;if((v|0)>=16384){v=(d[e+((c[r+104>>2]|0)+(c[r+108>>2]|0)&65535)|0]<<8)+(d[e+((c[r+104>>2]|0)+(c[r+108>>2]|0)+1&65535)|0]|0)|0;A=c[r+108>>2]|0;x=A+2|0;A=x;if((x|0)>=9){x=(c[r+104>>2]|0)+9&65535;if((A|0)==9){}else{at(4968,7304,471,11e3)}if((u&1|0)!=0){x=g2(h+((d[s+4|0]<<2)+2)|0)|0;if((c[r+112>>2]|0)==0){y=g+124|0;a[y]=(d[y]|t)&255}}c[r+104>>2]=x;A=1}c[r+108>>2]=A;A=u>>4;x=d[12424+A|0]|0;y=d[A+12440|0]|0;A=c[r+96>>2]|0;z=A+16|0;while(1){if(A>>>0>=z>>>0){break}C=(v&65535)<<16>>16>>x<<y;B=u&12;F=c[A+44>>2]|0;G=c[A+40>>2]>>1;if((B|0)>=8){C=C+F|0;C=C-G|0;if((B|0)==8){C=C+(G>>4)|0;C=C+((F*-3|0)>>6)|0}else{C=C+((F*-13|0)>>7)|0;C=C+((G*3|0)>>4)|0}}else{if((B|0)!=0){C=C+(F>>1)|0;C=C+(-F>>5)|0}}if(((C&65535)<<16>>16|0)!=(C|0)){C=C>>31^32767}C=(C<<1&65535)<<16>>16;F=C;c[A>>2]=F;c[A+48>>2]=F;A=A+4|0;v=v<<4}if(A>>>0>=(r+48|0)>>>0){A=r|0}c[r+96>>2]=A}}t=t<<1;s=s+16|0;r=r+140|0;}while((t|0)<256);t=c[g+272>>2]|0;r=e+((d[g+109|0]<<8)+t&65535)|0;if((t|0)==0){c[g+276>>2]=(a[g+125|0]&15)<<11}t=t+4|0;if((t|0)>=(c[g+276>>2]|0)){t=0}c[g+272>>2]=t;t=((g2(r|0)|0)&65535)<<16>>16;s=((g2(r+2|0)|0)&65535)<<16>>16;n=c[g+256>>2]|0;v=n+8|0;n=v;if(v>>>0>=(g+192|0)>>>0){n=g+128|0}c[g+256>>2]=n;v=t;c[n+64>>2]=v;c[n>>2]=v;v=s;c[n+68>>2]=v;c[n+4>>2]=v;t=$(t,a[g+127|0]|0)|0;s=$(s,a[g+127|0]|0)|0;t=t+($(c[n+8>>2]|0,a[g+15|0]|0)|0)|0;s=s+($(c[n+12>>2]|0,a[g+15|0]|0)|0)|0;t=t+($(c[n+16>>2]|0,a[g+31|0]|0)|0)|0;s=s+($(c[n+20>>2]|0,a[g+31|0]|0)|0)|0;t=t+($(c[n+24>>2]|0,a[g+47|0]|0)|0)|0;s=s+($(c[n+28>>2]|0,a[g+47|0]|0)|0)|0;t=t+($(c[n+32>>2]|0,a[g+63|0]|0)|0)|0;s=s+($(c[n+36>>2]|0,a[g+63|0]|0)|0)|0;t=t+($(c[n+40>>2]|0,a[g+79|0]|0)|0)|0;s=s+($(c[n+44>>2]|0,a[g+79|0]|0)|0)|0;t=t+($(c[n+48>>2]|0,a[g+95|0]|0)|0)|0;s=s+($(c[n+52>>2]|0,a[g+95|0]|0)|0)|0;t=t+($(c[n+56>>2]|0,a[g+111|0]|0)|0)|0;s=s+($(c[n+60>>2]|0,a[g+111|0]|0)|0)|0;if((a[g+108|0]&32|0)==0){n=(p>>7)+(($(t,a[g+13|0]|0)|0)>>14)|0;v=(q>>7)+(($(s,a[g+13|0]|0)|0)>>14)|0;if(((n&65535)<<16>>16|0)!=(n|0)){n=n>>31^32767}if(((v&65535)<<16>>16|0)!=(v|0)){v=v>>31^32767}g3(r|0,n);g3(r+2|0,v)}v=$(m,k)|0;r=v+($(t,a[g+44|0]|0)|0)>>14;t=$(o,l)|0;v=t+($(s,a[g+60|0]|0)|0)>>14;if(((r&65535)<<16>>16|0)!=(r|0)){r=r>>31^32767}if(((v&65535)<<16>>16|0)!=(v|0)){v=v>>31^32767}if((a[g+108|0]&64|0)!=0){r=0;v=0}s=c[g+1568>>2]|0;b[s>>1]=r&65535;b[s+2>>1]=v&65535;s=s+4|0;if(s>>>0>=(c[g+1572>>2]|0)>>>0){s=g+1580|0;c[g+1572>>2]=g+1612}c[g+1568>>2]=s;s=f-1|0;f=s;}while((s|0)!=0);return}function pT(a,b){a=a|0;b=b|0;var d=0,e=0;d=b;b=a;a=c[b+284+(d<<2)>>2]|0;e=a;a=e-1|0;if((e&7|0)==0){a=a-(6-d)|0}c[b+284+(d<<2)>>2]=a;return}function pU(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;c[b+1560>>2]=d;a=0;while(1){if((a|0)>=8){break}c[b+308+(a*140|0)+136>>2]=(d>>a&1)-1;pC(b,a<<4);a=a+1|0}return}function pV(a,b){a=a|0;b=b|0;var d=0;d=a;c[d+1556>>2]=b;pU(d,0);pW(d,0);pR(d,0,0);pX(d);d=32768;if(((d&65535)<<16>>16|0)!=(d|0)){d=d>>31^32767}if((d|0)==32767){}else{at(3600,7304,658,10992)}d=-32769;if(((d&65535)<<16>>16|0)!=(d|0)){d=d>>31^32767}if((d|0)==-32768){ej();return}at(2952,7304,659,10992);ej();return}function pW(a,b){a=a|0;b=b|0;c[a+1564>>2]=b&1?0:-16384;return}function pX(a){a=a|0;p_(a,20992);return}function pY(a){a=a|0;var b=0;b=a;if((c[b+1556>>2]|0)!=0){}else{at(2248,7304,667,11008)}c[b+268>>2]=16384;c[b+256>>2]=b+128;c[b+260>>2]=1;c[b+272>>2]=0;c[b+280>>2]=0;pZ(b);return}function pZ(a){a=a|0;var b=0,d=0,e=0;b=a;c[b+284>>2]=1;c[b+288>>2]=0;c[b+292>>2]=-32;c[b+296>>2]=11;a=2;d=1;while(1){if((d|0)>=32){break}c[b+1428+(d<<2)>>2]=b+284+(a<<2);e=a-1|0;a=e;if((e|0)==0){a=3}d=d+1|0}c[b+1428>>2]=b+284;c[b+1548>>2]=b+292;return}function p_(a,b){a=a|0;b=b|0;var e=0,f=0;e=a;a=e|0;f=b;sg(a|0,f|0,128)|0;sf(e+128|0,0,1428);f=8;while(1){a=f-1|0;f=a;if((a|0)<0){break}a=e+308+(f*140|0)|0;c[a+108>>2]=1;c[a+96>>2]=a}c[e+300>>2]=d[e+76|0]|0;pU(e,c[e+1560>>2]|0);pY(e);return}function p$(a){a=a|0;var b=0;b=a;fg(b);c[b>>2]=15800;p0(b+328|0);qE(b+1920|0);g5(b,c[8]|0);fh(b,12392);ip(b,1.4);return}function p0(a){a=a|0;qq(a);return}function p1(a){a=a|0;qC(a);return}function p2(a){a=a|0;var b=0;b=a;p3(b);bT(b);return}function p3(a){a=a|0;var b=0;b=a;c[b>>2]=15800;p1(b+328|0);fj(b);return}function p4(a){a=a|0;var b=0;b=a;a=p5(c[b+320>>2]|0,66048)|0;return(c[b+316>>2]|0)+a|0}function p5(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((c|0)<(a|0)){d=c}else{d=a}return d|0}function p6(a){a=a|0;return p7(0,(c[a+320>>2]|0)-66048|0)|0}function p7(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((a|0)<(c|0)){d=c}else{d=a}return d|0}function p8(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;c=a;a=qa(c)|0;d=p4(c)|0;p9(a,d,p6(c)|0,b);return 0}function p9(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=b;b=e;e=f;f=g;g=0;i=0;while(1){if((i|0)>=3){break}j=(d[h+169+i|0]|0)-48|0;if(j>>>0>9>>>0){k=1442;break}g=g*10|0;g=g+j|0;i=i+1|0}if((k|0)==1442){do{if((i|0)==1){if((a[h+176|0]|0)==0){if((a[h+177|0]|0)!=0){break}}g=0}}while(0)}if((g|0)!=0){if((g|0)>8191){k=1451}}else{k=1451}if((k|0)==1451){g=g2(h+169|0)|0}if((g|0)<8191){c[f+4>>2]=g*1e3|0}if((a[h+176|0]|0)<32){l=1}else{l=((a[h+176|0]|0)-48|0)>>>0<=9>>>0}g=l&1;ew(f+784|0,h+176+g|0,32-g|0);ew(f+528|0,h+46|0,32);ew(f+272|0,h+78|0,32);ew(f+1552|0,h+110|0,16);ew(f+1296|0,h+126|0,32);if((e|0)==0){return}qA(b,e,f);return}function qa(a){a=a|0;return c[a+316>>2]|0}function qb(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0.0;c=b;b=a;a=ph(b+1956|0)|0;if((a|0)!=0){d=a;e=d;return e|0}ec(b,0);do{if((c|0)!=32e3){a=dP(b+328|0,3200)|0;if((a|0)!=0){d=a;e=d;return e|0}else{a=b+328|0;f=32.0e3/+(c|0);+dQ(a,f,.9965,1.0);break}}}while(0);d=0;e=d;return e|0}function qc(a,b){a=a|0;b=b|0;var c=0;c=b&1;b=a;cj(b,c&1);qd(b+1920|0,c&1);return}function qd(b,c){b=b|0;c=c|0;a[b+8|0]=c&1&1;return}function qe(a,b){a=a|0;b=b|0;var c=0;c=b;b=a;b0(b,c);qf(b+1956|0,c);return}function qf(a,b){a=a|0;b=b|0;pU(a|0,b);return}function qg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=b;b=d;d=a;c[d+316>>2]=e;c[d+320>>2]=b;he(d,8);if((b|0)<65920){f=c[2]|0;g=f;return g|0}else{f=qh(e)|0;g=f;return g|0}return 0}function qh(a){a=a|0;var b=0,d=0;if((sj(a|0,9144,27)|0)!=0){b=c[2]|0;d=b;return d|0}else{b=0;d=b;return d|0}return 0}function qi(a,b){a=a|0;b=+b;pj(a+1956|0,~~(b*256.0));return}function qj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b6(d,b)|0;if((a|0)!=0){e=a;f=e;return f|0}dO(d+328|0);qD(d+1920|0);a=pr(d+1956|0,c[d+316>>2]|0,c[d+320>>2]|0)|0;if((a|0)!=0){e=a;f=e;return f|0}qk(d+1920|0,~~(+hf(d)*256.0));ps(d+1956|0);e=0;f=e;return f|0}function qk(a,b){a=a|0;b=b|0;c[a>>2]=b;return}function ql(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=b;b=c;c=a;a=pz(c+1956|0,d,b)|0;if((a|0)!=0){e=a;f=e;return f|0}qF(c+1920|0,b,d);e=0;f=e;return f|0}function qm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+128|0;e=d|0;f=b;b=a;if((fl(b)|0)!=32e3){f=~~(+(f|0)*+c2(b+328|0))&-2;f=f-(dS(b+328|0,f)|0)|0}do{if((f|0)>0){a=pA(b+1956|0,f)|0;if((a|0)!=0){g=a;h=g;i=d;return h|0}else{qD(b+1920|0);break}}}while(0);g=a5[c[(c[b>>2]|0)+64>>2]&127](b,64,e|0)|0;h=g;i=d;return h|0}function qn(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=b;b=c;c=a;if((fl(c)|0)==32e3){e=ql(c,d,b)|0;f=e;return f|0}a=d;while(1){if((a|0)<=0){g=1539;break}a=a-(qo(c+328|0,b+(d-a<<1)|0,a)|0)|0;if((a|0)>0){h=qp(c+328|0)|0;i=ql(c,h,c6(c+328|0)|0)|0;if((i|0)!=0){g=1535;break}c7(c+328|0,h)}}if((g|0)==1535){e=i;f=e;return f|0}else if((g|0)==1539){e=0;f=e;return f|0}return 0}function qo(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=d;d=e;e=a;a=f;g=c9(e|0)|0;h=c[e+8>>2]|0;i=(c[e+28>>2]|0)>>>((c[e+16>>2]|0)>>>0);j=e+52+((c[e+16>>2]|0)*48|0)|0;k=(c[e+12>>2]|0)-(c[e+16>>2]|0)|0;l=c[e+32>>2]|0;d=d>>1;if(((h-g|0)/2|0|0)>=48){h=h-96|0;do{d=d-1|0;m=0;n=0;o=g;if((d|0)<0){p=1547;break}p=12;while(1){if((p|0)==0){break}q=b[j>>1]|0;m=m+($(q,b[o>>1]|0)|0)|0;n=n+($(q,b[o+2>>1]|0)|0)|0;q=b[j+2>>1]|0;j=j+4|0;m=m+($(q,b[o+4>>1]|0)|0)|0;n=n+($(q,b[o+6>>1]|0)|0)|0;o=o+8|0;p=p-1|0}k=k-1|0;m=m>>15;n=n>>15;g=g+((i<<1&2)<<1)|0;i=i>>>1;g=g+(l<<1)|0;if((k|0)==0){j=e+52|0;i=c[e+28>>2]|0;k=c[e+12>>2]|0}b[a>>1]=m&65535;b[a+2>>1]=n&65535;a=a+4|0;}while(g>>>0<=h>>>0)}c[e+16>>2]=(c[e+12>>2]|0)-k;k=((c[e+8>>2]|0)-g|0)/2|0;c[e+8>>2]=dc(e|0,k)|0;sh(c9(e|0)|0,g|0,k<<1|0);return(a-f|0)/2|0|0}function qp(a){a=a|0;var b=0;b=a;a=dk(b|0)|0;return(a-(c[b+8>>2]|0)|0)/2|0|0}function qq(a){a=a|0;var b=0;b=a;dM(b,24,b+52|0);return}function qr(){var a=0,b=0,c=0;a=hB(70464)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;p$(b);c=b}return c|0}function qs(){var a=0,b=0,c=0;a=hB(584)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;qt(b);c=b}return c|0}function qt(a){a=a|0;qu(a);return}function qu(a){a=a|0;var b=0;b=a;hE(b);c[b>>2]=14896;ei(b+572|0);g5(b,c[8]|0);return}function qv(a){a=a|0;qz(a);return}function qw(a){a=a|0;var b=0;b=a;qv(b);bT(b);return}function qx(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;d=b;b=a;a=d;e=a6[c[(c[a>>2]|0)+16>>2]&31](a)|0;if((e|0)<65920){f=c[2]|0;g=f;return g|0}a=d;h=a5[c[(c[a>>2]|0)+12>>2]&127](a,b+316|0,256)|0;if((h|0)!=0){f=h;g=f;return g|0}h=qh(b+316|0)|0;if((h|0)!=0){f=h;g=f;return g|0}h=e-66048|0;do{if((h|0)>0){e=cc(b+572|0,h)|0;if((e|0)!=0){f=e;g=f;return g|0}e=d;a=bb[c[(c[e>>2]|0)+20>>2]&127](e,65792)|0;if((a|0)!=0){f=a;g=f;return g|0}a=d;e=c[(c[a>>2]|0)+12>>2]|0;i=cd(b+572|0)|0;j=eq(b+572|0)|0;k=a5[e&127](a,i,j)|0;if((k|0)!=0){f=k;g=f;return g|0}else{break}}}while(0);f=0;g=f;return g|0}function qy(a,b,c){a=a|0;b=b|0;c=c|0;c=a;a=cd(c+572|0)|0;p9(c+316|0,a,eq(c+572|0)|0,b);return 0}function qz(a){a=a|0;var b=0;b=a;c[b>>2]=14896;ek(b+572|0);fO(b);return}function qA(b,c,e){b=b|0;c=c|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;i=i+264|0;g=f|0;h=b;b=c;c=e;e=h+b|0;do{if((b|0)>=8){if((sj(h|0,7136,4)|0)!=0){break}j=ji(h+4|0)|0;k=h+8|0;if((e-k|0)>(j|0)){e=k+j|0}j=0;l=0;while(1){if((e-k|0)<4){break}m=d[k|0]|0;n=((d[k+3|0]|0)<<8)+(d[k+2|0]|0)|0;if((d[k+1|0]|0|0)!=0){o=n}else{o=0}p=o;k=k+4|0;if((p|0)>(e-k|0)){q=1649;break}r=0;switch(m|0){case 1:{r=c+528|0;break};case 2:{r=c+272|0;break};case 3:{r=c+784|0;break};case 4:{r=c+1552|0;break};case 7:{r=c+1296|0;break};case 20:{j=n;break};case 19:{l=qB(p,256)|0;sg(g+5|0,k|0,l)|0;break};default:{do{if((m|0)<1){q=1664}else{if((m|0)>7){if((m|0)<16){q=1664;break}}if((m|0)>20){if((m|0)<48){q=1664;break}}if((m|0)>54){q=1664}}}while(0);if((q|0)==1664){q=0}}}if((r|0)!=0){ew(r,k,p)}k=k+p|0;m=k;while(1){if((k-h&3|0)!=0){s=k>>>0<e>>>0}else{s=0}if(!s){break}n=k;k=n+1|0;if((d[n]|0|0)!=0){q=1673;break}}if((q|0)==1673){q=0;k=m}}k=g+5|0;if((j|0)!=0){p=k-1|0;k=p;a[p]=32;p=4;while(1){r=p;p=r-1|0;if((r|0)==0){break}r=k-1|0;k=r;a[r]=((j|0)%10|0)+48&255;j=(j|0)/10|0}l=l+5|0}if((l|0)==0){i=f;return}ew(c+1040|0,k,l);i=f;return}}while(0);i=f;return}function qB(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((c|0)<(a|0)){d=c}else{d=a}return d|0}function qC(a){a=a|0;dN(a);return}function qD(a){a=a|0;sf(a+12|0,0,24);return}function qE(b){b=b|0;var d=0;d=b;a[d+8|0]=1;c[d>>2]=256;c[d+4>>2]=8;qD(d);return}function qF(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;g=e;e=f;f=d;if((e&1|0)==0){}else{at(1600,7056,32,11952)}d=c[f>>2]|0;if(!(a[f+8|0]&1)){if((d|0)!=256){h=g+(e<<1)|0;while(1){if(g>>>0>=h>>>0){break}i=($(b[g>>1]|0,d)|0)>>8;if(((i&65535)<<16>>16|0)!=(i|0)){i=i>>31^32767}j=g;g=j+2|0;b[j>>1]=i&65535}}return}h=c[f+4>>2]|0;i=f+36|0;do{j=i-12|0;i=j;k=c[j+8>>2]|0;j=c[i+4>>2]|0;l=c[i>>2]|0;m=0;while(1){if((m|0)>=(e|0)){break}n=(b[g+(m<<1)>>1]|0)+l|0;l=(b[g+(m<<1)>>1]|0)*3|0;o=n-j|0;j=n;n=k>>10;k=k+(($(o,d)|0)-(k>>h))|0;if(((n&65535)<<16>>16|0)!=(n|0)){n=n>>31^32767}b[g+(m<<1)>>1]=n&65535;m=m+2|0}c[i>>2]=l;c[i+4>>2]=j;c[i+8>>2]=k;g=g+2|0;}while((i|0)!=(f+12|0));return}function qG(b){b=b|0;var d=0,e=0,f=0;d=i;i=i+80|0;e=d|0;f=b;qH(f);c[f>>2]=15672;c[f+336>>2]=15768;a[f+3488|0]=0;c[f+3480>>2]=0;g5(f,c[6]|0);g6(f,12312);g7(f,1);fd(e,-14.0,80.0);fn(f,e);i=d;return}function qH(a){a=a|0;var b=0;b=a;bR(b);cT(b+336|0);c[b>>2]=17008;c[b+336>>2]=17104;ro(b+1240|0);rp(b+1252|0);bu(b+1264|0);gD(b+1312|0);gX(b+2912|0);return}function qI(a){a=a|0;var b=0;b=a;c[b>>2]=17008;c[b+336>>2]=17104;gI(b+1312|0);bv(b+1264|0);rk(b+1252|0);rl(b+1240|0);cY(b+336|0);bU(b);return}function qJ(a){a=a|0;var b=0;b=a;qL(b);bT(b);return}function qK(a){a=a|0;qJ(a-336|0);return}function qL(a){a=a|0;qI(a);return}function qM(a){a=a|0;qL(a-336|0);return}function qN(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=b;b=a;if((d|0)!=0){c[d>>2]=0}a=(ji((qO(b)|0)+20|0)|0)-44|0;if((a|0)<0){e=0;f=e;return f|0}g=(c[b+1204>>2]|0)+64+a|0;a=qP(g,(c[b+1212>>2]|0)-g|0)|0;if((a|0)==0){e=0;f=e;return f|0}if((d|0)!=0){c[d>>2]=a+12}e=g;f=e;return f|0}function qO(a){a=a|0;return c[a+1204>>2]|0}function qP(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;do{if((a|0)<12){d=0}else{if((sj(c|0,6400,4)|0)!=0){d=0;break}if((ji(c+4|0)|0)>>>0>=512>>>0){d=0;break}b=ji(c+8|0)|0;if((b|0)>(a-12|0)){d=0;break}else{d=b;break}}}while(0);return d|0}function qQ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;d=i;i=i+8|0;e=d|0;f=b;b=a;qR(qO(b)|0,f);a=qN(b,e)|0;if((a|0)==0){i=d;return 0}qS(a+12|0,a+(c[e>>2]|0)|0,f);i=d;return 0}function qR(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;b=(((ji(d+24|0)|0)*10|0)>>>0)/441|0;if((b|0)<=0){return}e=ji(d+32|0)|0;do{if((e|0)>0){if((ji(d+28|0)|0)==0){f=1818;break}c[a+12>>2]=(e*10|0|0)/441|0;c[a+8>>2]=b-(c[a+12>>2]|0)}else{f=1818}}while(0);if((f|0)==1818){c[a+4>>2]=b;c[a+8>>2]=b;c[a+12>>2]=0}return}function qS(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=a;a=b;b=c;d=rg(d,a,b+528|0)|0;d=rg(d,a,b+272|0)|0;d=rg(d,a,b+16|0)|0;d=rg(d,a,b+784|0)|0;d=rh(d,a,b+1040|0)|0;d=rg(d,a,b+1552|0)|0;d=rh(d,a,b+1296|0)|0;return}function qT(a,b){a=a|0;b=+b;var d=0;d=a;if((c[d+3480>>2]|0)==0){return}c[d+3484>>2]=~~(44100.0*b+.5);c[d+1200>>2]=~~+N(4096.0/+(c[d+3484>>2]|0)*+(c[d+3480>>2]|0)+.5);c[d+1196>>2]=~~+N(+h[d+3472>>3]*4096.0/+(c[d+3484>>2]|0)+.5)+2;return}function qU(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=b;b=a;a=by(b+1264|0,c,33)|0;if((a|0)!=0){d=a;e=d;return e|0}d=bY(b,c)|0;e=d;return e|0}function qV(a,b){a=a|0;b=b|0;var c=0;c=b;b=a;gK(b+1312|0,c);gM(b+2912|0,c);return}function qW(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=b;if((f|0)>=4){return}gN(a+1312|0,f,c,d,e);return}function qX(b,c){b=b|0;c=c|0;var d=0,e=0,f=0.0;d=c;c=b;b$(c,d);qY(c+2912|0,c+1264|0);if(!(a[c+3489|0]&1)){return}if((d&128|0)!=0){e=0}else{e=c+1264|0}je(c+1312|0,e);if(qZ(c+1240|0)|0){if((d&64|0)!=0){f=0.0}else{f=+hf(c)*.001306640625}gJ(c+2912|0,f);gi(c+1240|0,d)}if(q_(c+1252|0)|0){e=d&63;if((d&32|0)!=0){e=e|480}if((d&64|0)!=0){e=e|15872}rN(c+1252|0,e)}return}function qY(a,b){a=a|0;b=b|0;var d=0;d=a;c[d>>2]=b;c[d+4>>2]=0;return}function qZ(a){a=a|0;return(c[a+4>>2]|0)!=-1|0}function q_(a){a=a|0;return(c[a+4>>2]|0)!=-1|0}function q$(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=d;d=e;e=b;if((d|0)<=64){g=c[2]|0;h=g;return h|0}b=f;i=q0(b)|0;if((i|0)!=0){g=i;h=g;return h|0}c[e+3480>>2]=ji(b+12|0)|0;if((c[e+3480>>2]|0)==0){c[e+3480>>2]=3579545}bz(e+1264|0,c[e+3480>>2]|0);c[e+1204>>2]=f;c[e+1212>>2]=f+d;c[e+1208>>2]=c[e+1212>>2];if((ji(b+28|0)|0)!=0){d=(ji(b+28|0)|0)+28|0;c[e+1208>>2]=(c[e+1204>>2]|0)+d}he(e,4);d=q1(e)|0;if((d|0)!=0){g=d;h=g;return h|0}fh(e,a[e+3489|0]&1?12360:12344);g=b3(e,c[e+3480>>2]|0)|0;h=g;return h|0}function q0(a){a=a|0;var b=0,d=0;if((sj(a|0,7048,4)|0)!=0){b=c[2]|0;d=b;return d|0}else{b=0;d=b;return d|0}return 0}function q1(b){b=b|0;var d=0,e=0,f=0,g=0,j=0.0,k=0.0,l=0,m=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=b;c[e>>2]=ji((qO(g)|0)+44|0)|0;c[f>>2]=ji((qO(g)|0)+16|0)|0;do{if((c[f>>2]|0)!=0){if((ji((qO(g)|0)+8|0)|0)>>>0>=272>>>0){break}rD(g,f,e)}}while(0);a[g+3489|0]=0;h[g+3472>>3]=+(dt(g+1264|0)|0)*1.5;do{if((c[e>>2]|0)!=0){a[g+3489|0]=1;if(a[g+3488|0]&1){h[g+3472>>3]=+(c[e>>2]|0)/144.0}b=g+336|0;j=+h[g+3472>>3];k=j/+(dt(g+1264|0)|0);j=+hf(g)*3.0;+jb(b,k,.99,j);b=gb(g+1240|0,+h[g+3472>>3],+(c[e>>2]|0))|0;if((b|0)!=0){l=b;m=l;i=d;return m|0}else{q2(g+1240|0,1);he(g,8);break}}}while(0);do{if(!(a[g+3489|0]&1)){if((c[f>>2]|0)==0){break}a[g+3489|0]=1;if(a[g+3488|0]&1){h[g+3472>>3]=+(c[f>>2]|0)/72.0}e=g+336|0;j=+h[g+3472>>3];k=j/+(dt(g+1264|0)|0);j=+hf(g)*3.0;+jb(e,k,.99,j);e=rK(g+1252|0,+h[g+3472>>3],+(c[f>>2]|0))|0;if((e|0)==2){l=9112;m=l;i=d;return m|0}if((((e|0)!=0^1)&1|0)==0){l=8400;m=l;i=d;return m|0}else{q3(g+1252|0,1);he(g,8);break}}}while(0);do{if(a[g+3489|0]&1){f=du(g+1264|0)|0;e=c_(g+336|0,($(f,dt(g+1264|0)|0)|0)/1e3|0)|0;if((e|0)!=0){l=e;m=l;i=d;return m|0}else{gG(g+1312|0,+hf(g)*.405);break}}else{q2(g+1240|0,0);q3(g+1252|0,0);gG(g+1312|0,+hf(g))}}while(0);l=0;m=l;i=d;return m|0}function q2(a,b){a=a|0;b=b|0;c[a+4>>2]=b&1?0:-1;return}function q3(a,b){a=a|0;b=b|0;c[a+4>>2]=b&1?0:-1;return}function q4(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=b;b=b5(f,e)|0;if((b|0)!=0){g=b;h=g;return h|0}b=g2((qO(f)|0)+40|0)|0;gH(f+1312|0,b,d[(qO(f)|0)+42|0]|0);c[f+1236>>2]=-1;c[f+1220>>2]=(c[f+1204>>2]|0)+64;c[f+1224>>2]=c[f+1220>>2];c[f+1228>>2]=c[f+1220>>2];c[f+1232>>2]=-1;c[f+1216>>2]=0;if((ji((qO(f)|0)+8|0)|0)>>>0>=336>>>0){b=ji((qO(f)|0)+52|0)|0;if((b|0)!=0){e=f+1220|0;c[e>>2]=(c[e>>2]|0)+(b+52-64)}}if(a[f+3489|0]&1){if(q_(f+1252|0)|0){rL(f+1252|0)}if(qZ(f+1240|0)|0){gd(f+1240|0)}c[f+1192>>2]=0;bw(f+1264|0,1);c3(f+336|0)}g=0;h=g;return h|0}function q5(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;b=a;c[e>>2]=ru(b,($(d,c[b+3484>>2]|0)|0)/1e3|0)|0;gS(b+1312|0,c[e>>2]|0);return 0}function q6(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0;e=c;c=d;d=b;if(a[d+3489|0]&1){db(d+336|0,e,c,d+1264|0);f=0;g=f;return g|0}else{f=b7(d,e,c)|0;g=f;return g|0}return 0}function q7(){var a=0,b=0,c=0;a=hB(3496)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;qG(b);c=b}return c|0}function q8(){var a=0,b=0,c=0;a=hB(392)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;q9(b);c=b}return c|0}function q9(a){a=a|0;ra(a);return}function ra(a){a=a|0;var b=0;b=a;hE(b);c[b>>2]=14808;ei(b+380|0);g5(b,c[6]|0);return}function rb(a){a=a|0;rf(a);return}function rc(a){a=a|0;var b=0;b=a;rb(b);bT(b);return}function rd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;d=i;i=i+16|0;e=d|0;f=b;b=a;a=f;g=a6[c[(c[a>>2]|0)+16>>2]&31](a)|0;if((g|0)<=64){h=c[2]|0;j=h;i=d;return j|0}a=f;k=a5[c[(c[a>>2]|0)+12>>2]&127](a,b+316|0,64)|0;if((k|0)!=0){h=k;j=h;i=d;return j|0}k=q0(b+316|0)|0;if((k|0)!=0){h=k;j=h;i=d;return j|0}k=(ji(b+336|0)|0)-44|0;a=g-64-k|0;do{if((k|0)>0){if((a|0)<12){break}g=f;l=bb[c[(c[g>>2]|0)+20>>2]&127](g,k)|0;if((l|0)!=0){h=l;j=h;i=d;return j|0}l=f;g=a5[c[(c[l>>2]|0)+12>>2]&127](l,e|0,12)|0;if((g|0)!=0){h=g;j=h;i=d;return j|0}g=qP(e|0,a)|0;do{if((g|0)!=0){l=cc(b+380|0,g)|0;if((l|0)!=0){h=l;j=h;i=d;return j|0}l=f;m=c[(c[l>>2]|0)+12>>2]|0;n=cd(b+380|0)|0;o=eq(b+380|0)|0;p=a5[m&127](l,n,o)|0;if((p|0)!=0){h=p;j=h;i=d;return j|0}else{break}}}while(0)}}while(0);h=0;j=h;i=d;return j|0}function re(a,b,c){a=a|0;b=b|0;c=c|0;c=b;b=a;qR(b+316|0,c);if((eq(b+380|0)|0)==0){return 0}a=cd(b+380|0)|0;qS(a,cf(b+380|0)|0,c);return 0}function rf(a){a=a|0;var b=0;b=a;c[b>>2]=14808;ek(b+380|0);fO(b);return}function rg(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=b;return ri(rh(a,d,c)|0,d)|0}function rh(b,c,e){b=b|0;c=c|0;e=e|0;var f=0,g=0,h=0,i=0;f=b;b=e;e=ri(f,c)|0;c=((e-f|0)/2|0)-1|0;if((c|0)<=0){g=e;return g|0}c=rj(c,255)|0;a[b+c|0]=0;h=0;while(1){if((h|0)>=(c|0)){break}if((a[f+((h<<1)+1)|0]|0)!=0){i=63}else{i=d[f+(h<<1)|0]|0}a[b+h|0]=i&255;h=h+1|0}g=e;return g|0}function ri(a,b){a=a|0;b=b|0;var c=0,e=0,f=0;c=a;a=b;do{if((a-c|0)<2){e=2064;break}c=c+2|0;}while((d[c-2|0]|0|(d[c-1|0]|0)|0)!=0);if((e|0)==2064){f=c;return f|0}f=c;return f|0}function rj(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((c|0)<(a|0)){d=c}else{d=a}return d|0}function rk(a){a=a|0;rn(a);return}function rl(a){a=a|0;rm(a);return}function rm(a){a=a|0;gc(a);return}function rn(a){a=a|0;rJ(a);return}function ro(a){a=a|0;rr(a);return}function rp(a){a=a|0;rq(a);return}function rq(a){a=a|0;var b=0;b=a;rI(b);c[b+4>>2]=-1;c[b+8>>2]=0;return}function rr(a){a=a|0;var b=0;b=a;jz(b);c[b+4>>2]=-1;c[b+8>>2]=0;return}function rs(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;d=a;a=rt(d,b)|0;b=c[d+1232>>2]|0;c[d+1232>>2]=e;if((b|0)>=0){gC(d+2912|0,a,e-b|0,d+1264|0);return}else{b=d+1232|0;c[b>>2]=c[b>>2]|c[d+1236>>2];return}}function rt(a,b){a=a|0;b=b|0;return($(b,c[a+1200>>2]|0)|0)>>12|0}function ru(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=b;b=a;a=c[b+1216>>2]|0;f=c[b+1220>>2]|0;if(f>>>0>=(c[b+1212>>2]|0)>>>0){jl(b);if(f>>>0>(c[b+1212>>2]|0)>>>0){eT(b,1512)}}while(1){if((a|0)<(e|0)){g=f>>>0<(c[b+1212>>2]|0)>>>0}else{g=0}if(!g){break}h=f;f=h+1|0;switch(d[h]|0|0){case 102:{f=c[b+1208>>2]|0;break};case 98:{a=a+735|0;break};case 99:{a=a+882|0;break};case 79:{h=f;f=h+1|0;gT(b+1312|0,rt(b,a)|0,d[h]|0);break};case 80:{h=f;f=h+1|0;gU(b+1312|0,rt(b,a)|0,d[h]|0);break};case 97:{a=a+(((d[f+1|0]|0)<<8)+(d[f|0]|0))|0;f=f+2|0;break};case 100:{h=f;f=h+1|0;a=a+(d[h]|0)|0;break};case 81:{if((rv(b+1252|0,rw(b,a)|0)|0)!=0){rM(b+1252|0,d[f|0]|0,d[f+1|0]|0)}f=f+2|0;break};case 82:{if((d[f|0]|0|0)==42){rs(b,a,d[f+1|0]|0)}else{if((rx(b+1240|0,rw(b,a)|0)|0)!=0){if((d[f|0]|0|0)==43){c[b+1236>>2]=((d[f+1|0]|0)>>7&1)-1;h=b+1232|0;c[h>>2]=c[h>>2]|c[b+1236>>2]}gg(b+1240|0,d[f|0]|0,d[f+1|0]|0)}}f=f+2|0;break};case 83:{if((rx(b+1240|0,rw(b,a)|0)|0)!=0){gh(b+1240|0,d[f|0]|0,d[f+1|0]|0)}f=f+2|0;break};case 103:{h=d[f+1|0]|0;i=ji(f+2|0)|0;f=f+6|0;if((h|0)==0){c[b+1224>>2]=f}f=f+i|0;break};case 224:{c[b+1228>>2]=(c[b+1224>>2]|0)+((d[f+3|0]|0)<<24)+((d[f+2|0]|0)<<16)+((d[f+1|0]|0)<<8)+(d[f|0]|0);f=f+4|0;break};default:{i=d[f-1|0]|0;h=i&240;if((h|0)==128){j=b+1228|0;k=c[j>>2]|0;c[j>>2]=k+1;rs(b,a,d[k]|0);a=a+(i&15)|0}else if((h|0)==112){a=a+((i&15)+1)|0}else if((h|0)==80){f=f+2|0}else{f=f+((ry(i)|0)-1)|0;eT(b,6952)}}}}a=a-e|0;c[b+1220>>2]=f;c[b+1216>>2]=a;return rt(b,e)|0}function rv(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=b;b=a;a=d-(c[b+4>>2]|0)|0;do{if((a|0)>0){if((c[b+4>>2]|0)>=0){c[b+4>>2]=d;e=c[b+8>>2]|0;f=b+8|0;c[f>>2]=(c[f>>2]|0)+(a<<1<<1);rO(b,a,e);break}g=0;h=g;return h|0}}while(0);g=1;h=g;return h|0}function rw(a,b){a=a|0;b=b|0;var d=0;d=a;a=$(b,c[d+1196>>2]|0)|0;return a+(c[d+1192>>2]|0)>>12|0}function rx(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=b;b=a;a=d-(c[b+4>>2]|0)|0;do{if((a|0)>0){if((c[b+4>>2]|0)>=0){c[b+4>>2]=d;e=c[b+8>>2]|0;f=b+8|0;c[f>>2]=(c[f>>2]|0)+(a<<1<<1);gl(b,a,e);break}g=0;h=g;return h|0}}while(0);g=1;h=g;return h|0}function ry(a){a=a|0;var b=0;switch(a>>4|0){case 12:case 13:{b=4;break};case 3:case 4:{b=2;break};case 14:case 15:{b=5;break};case 5:case 10:case 11:{b=3;break};default:{b=1}}return b|0}function rz(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b;b=e;e=a;a=d>>1;d=((a<<12|0)/(c[e+1196>>2]|0)|0)-1|0;if((rw(e,d)|0)<=(a|0)){}else{at(4792,3464,243,11680);return 0}g=a;while(1){h=rw(e,d)|0;g=h;if((h|0)>=(a|0)){break}d=d+1|0}if(qZ(e+1240|0)|0){rA(e+1240|0,b);sf(b|0,0,g<<1<<1|0)}else{if(q_(e+1252|0)|0){rB(e+1252|0,b)}}ru(e,d)|0;rx(e+1240|0,g)|0;rv(e+1252|0,g)|0;b=$(d,c[e+1196>>2]|0)|0;c[e+1192>>2]=b+(c[e+1192>>2]|0)-(g<<12);gS(e+1312|0,f);return g<<1|0}function rA(a,b){a=a|0;b=b|0;var d=0;d=a;if(qZ(d)|0){}else{at(2920,3464,72,11368)}c[d+8>>2]=b;c[d+4>>2]=0;return}function rB(a,b){a=a|0;b=b|0;var d=0;d=a;if(q_(d)|0){}else{at(2920,3464,72,11368)}c[d+8>>2]=b;c[d+4>>2]=0;return}function rC(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return rz(a-336|0,b,c,d)|0}function rD(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=b;b=e;e=a;a=(c[e+1204>>2]|0)+64|0;L2450:while(1){if(a>>>0>=(c[e+1212>>2]|0)>>>0){g=2182;break}switch(d[a]|0|0){case 102:{g=2171;break L2450;break};case 80:case 100:{a=a+2|0;break};case 97:{a=a+3|0;break};case 103:{a=a+((ji(a+3|0)|0)+7)|0;break};case 81:{g=2175;break L2450;break};case 82:case 83:{g=2176;break L2450;break};case 84:{g=2177;break L2450;break};default:{a=a+(ry(d[a]|0)|0)|0}}}if((g|0)==2171){return}else if((g|0)==2175){c[b>>2]=0;return}else if((g|0)==2176){c[b>>2]=c[f>>2];c[f>>2]=0;return}else if((g|0)==2177){c[f>>2]=0;c[b>>2]=0;return}else if((g|0)==2182){return}}function rE(a){a=a|0;qI(a);return}function rF(a){a=a|0;var b=0;b=a;rE(b);bT(b);return}function rG(a){a=a|0;rE(a-336|0);return}function rH(a){a=a|0;rF(a-336|0);return}function rI(a){a=a|0;return}function rJ(a){a=a|0;return}function rK(a,b,c){a=a|0;b=+b;c=+c;return 2}function rL(a){a=a|0;return}function rM(a,b,c){a=a|0;b=b|0;c=c|0;return}function rN(a,b){a=a|0;b=b|0;return}function rO(a,b,c){a=a|0;b=b|0;c=c|0;return}function rP(a){a=a|0;return}function rQ(a){a=a|0;rP(a|0);return}function rR(a){a=a|0;return}function rS(a){a=a|0;return}function rT(a){a=a|0;rP(a|0);sb(a);return}function rU(a){a=a|0;rP(a|0);sb(a);return}function rV(a){a=a|0;rP(a|0);sb(a);return}function rW(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+56|0;f=e|0;if((a|0)==(b|0)){g=1;i=e;return g|0}if((b|0)==0){g=0;i=e;return g|0}h=r_(b,18328,18312,-1)|0;b=h;if((h|0)==0){g=0;i=e;return g|0}sf(f|0,0,56);c[f>>2]=b;c[f+8>>2]=a;c[f+12>>2]=-1;c[f+48>>2]=1;bc[c[(c[h>>2]|0)+28>>2]&31](b,f,c[d>>2]|0,1);if((c[f+24>>2]|0)!=1){g=0;i=e;return g|0}c[d>>2]=c[f+16>>2];g=1;i=e;return g|0}function rX(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((c[d+8>>2]|0)!=(b|0)){return}b=d+16|0;g=c[b>>2]|0;if((g|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((g|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function rY(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((b|0)!=(c[d+8>>2]|0)){g=c[b+8>>2]|0;bc[c[(c[g>>2]|0)+28>>2]&31](g,d,e,f);return}g=d+16|0;b=c[g>>2]|0;if((b|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function rZ(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((b|0)==(c[d+8>>2]|0)){g=d+16|0;h=c[g>>2]|0;if((h|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((h|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}h=d+24|0;if((c[h>>2]|0)!=2){return}c[h>>2]=f;return}h=c[b+12>>2]|0;g=b+16+(h<<3)|0;i=c[b+20>>2]|0;j=i>>8;if((i&1|0)==0){k=j}else{k=c[(c[e>>2]|0)+j>>2]|0}j=c[b+16>>2]|0;bc[c[(c[j>>2]|0)+28>>2]&31](j,d,e+k|0,(i&2|0)!=0?f:2);if((h|0)<=1){return}h=d+54|0;i=e;k=b+24|0;while(1){b=c[k+4>>2]|0;j=b>>8;if((b&1|0)==0){l=j}else{l=c[(c[i>>2]|0)+j>>2]|0}j=c[k>>2]|0;bc[c[(c[j>>2]|0)+28>>2]&31](j,d,e+l|0,(b&2|0)!=0?f:2);if((a[h]&1)!=0){m=2268;break}b=k+8|0;if(b>>>0<g>>>0){k=b}else{m=2269;break}}if((m|0)==2268){return}else if((m|0)==2269){return}}function r_(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+56|0;g=f|0;h=c[a>>2]|0;j=a+(c[h-8>>2]|0)|0;k=c[h-4>>2]|0;h=k;c[g>>2]=d;c[g+4>>2]=a;c[g+8>>2]=b;c[g+12>>2]=e;e=g+16|0;b=g+20|0;a=g+24|0;l=g+28|0;m=g+32|0;n=g+40|0;sf(e|0,0,39);if((k|0)==(d|0)){c[g+48>>2]=1;ba[c[(c[k>>2]|0)+20>>2]&7](h,g,j,j,1,0);i=f;return((c[a>>2]|0)==1?j:0)|0}a0[c[(c[k>>2]|0)+24>>2]&31](h,g,j,1,0);j=c[g+36>>2]|0;if((j|0)==0){if((c[n>>2]|0)!=1){o=0;i=f;return o|0}if((c[l>>2]|0)!=1){o=0;i=f;return o|0}o=(c[m>>2]|0)==1?c[b>>2]|0:0;i=f;return o|0}else if((j|0)==1){do{if((c[a>>2]|0)!=1){if((c[n>>2]|0)!=0){o=0;i=f;return o|0}if((c[l>>2]|0)!=1){o=0;i=f;return o|0}if((c[m>>2]|0)==1){break}else{o=0}i=f;return o|0}}while(0);o=c[e>>2]|0;i=f;return o|0}else{o=0;i=f;return o|0}return 0}function r$(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)==(c[d>>2]|0)){do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=c[b+12>>2]|0;k=b+16+(j<<3)|0;L2611:do{if((j|0)>0){l=d+52|0;m=d+53|0;n=d+54|0;o=b+8|0;p=d+24|0;q=e;r=0;s=b+16|0;t=0;L2613:while(1){a[l]=0;a[m]=0;u=c[s+4>>2]|0;v=u>>8;if((u&1|0)==0){w=v}else{w=c[(c[q>>2]|0)+v>>2]|0}v=c[s>>2]|0;ba[c[(c[v>>2]|0)+20>>2]&7](v,d,e,e+w|0,2-(u>>>1&1)|0,g);if((a[n]&1)!=0){x=t;y=r;break}do{if((a[m]&1)==0){z=t;A=r}else{if((a[l]&1)==0){if((c[o>>2]&1|0)==0){x=1;y=r;break L2613}else{z=1;A=r;break}}if((c[p>>2]|0)==1){B=2316;break L2611}if((c[o>>2]&2|0)==0){B=2316;break L2611}else{z=1;A=1}}}while(0);u=s+8|0;if(u>>>0<k>>>0){r=A;s=u;t=z}else{x=z;y=A;break}}if(y){C=x;B=2315}else{D=x;B=2312}}else{D=0;B=2312}}while(0);do{if((B|0)==2312){c[h>>2]=e;k=d+40|0;c[k>>2]=(c[k>>2]|0)+1;if((c[d+36>>2]|0)!=1){C=D;B=2315;break}if((c[d+24>>2]|0)!=2){C=D;B=2315;break}a[d+54|0]=1;if(D){B=2316}else{B=2317}}}while(0);if((B|0)==2315){if(C){B=2316}else{B=2317}}if((B|0)==2316){c[i>>2]=3;return}else if((B|0)==2317){c[i>>2]=4;return}}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}C=c[b+12>>2]|0;D=b+16+(C<<3)|0;x=c[b+20>>2]|0;y=x>>8;if((x&1|0)==0){E=y}else{E=c[(c[e>>2]|0)+y>>2]|0}y=c[b+16>>2]|0;a0[c[(c[y>>2]|0)+24>>2]&31](y,d,e+E|0,(x&2|0)!=0?f:2,g);x=b+24|0;if((C|0)<=1){return}C=c[b+8>>2]|0;do{if((C&2|0)==0){b=d+36|0;if((c[b>>2]|0)==1){break}if((C&1|0)==0){E=d+54|0;y=e;A=x;while(1){if((a[E]&1)!=0){B=2357;break}if((c[b>>2]|0)==1){B=2358;break}z=c[A+4>>2]|0;w=z>>8;if((z&1|0)==0){F=w}else{F=c[(c[y>>2]|0)+w>>2]|0}w=c[A>>2]|0;a0[c[(c[w>>2]|0)+24>>2]&31](w,d,e+F|0,(z&2|0)!=0?f:2,g);z=A+8|0;if(z>>>0<D>>>0){A=z}else{B=2359;break}}if((B|0)==2357){return}else if((B|0)==2358){return}else if((B|0)==2359){return}}A=d+24|0;y=d+54|0;E=e;i=x;while(1){if((a[y]&1)!=0){B=2354;break}if((c[b>>2]|0)==1){if((c[A>>2]|0)==1){B=2355;break}}z=c[i+4>>2]|0;w=z>>8;if((z&1|0)==0){G=w}else{G=c[(c[E>>2]|0)+w>>2]|0}w=c[i>>2]|0;a0[c[(c[w>>2]|0)+24>>2]&31](w,d,e+G|0,(z&2|0)!=0?f:2,g);z=i+8|0;if(z>>>0<D>>>0){i=z}else{B=2356;break}}if((B|0)==2354){return}else if((B|0)==2355){return}else if((B|0)==2356){return}}}while(0);G=d+54|0;F=e;C=x;while(1){if((a[G]&1)!=0){B=2352;break}x=c[C+4>>2]|0;i=x>>8;if((x&1|0)==0){H=i}else{H=c[(c[F>>2]|0)+i>>2]|0}i=c[C>>2]|0;a0[c[(c[i>>2]|0)+24>>2]&31](i,d,e+H|0,(x&2|0)!=0?f:2,g);x=C+8|0;if(x>>>0<D>>>0){C=x}else{B=2353;break}}if((B|0)==2352){return}else if((B|0)==2353){return}}function r0(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)!=(c[d>>2]|0)){h=c[b+8>>2]|0;a0[c[(c[h>>2]|0)+24>>2]&31](h,d,e,f,g);return}do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=d+52|0;a[j]=0;k=d+53|0;a[k]=0;l=c[b+8>>2]|0;ba[c[(c[l>>2]|0)+20>>2]&7](l,d,e,e,1,g);if((a[k]&1)==0){m=0;n=2372}else{if((a[j]&1)==0){m=1;n=2372}}L2713:do{if((n|0)==2372){c[h>>2]=e;j=d+40|0;c[j>>2]=(c[j>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){n=2375;break}a[d+54|0]=1;if(m){break L2713}}else{n=2375}}while(0);if((n|0)==2375){if(m){break}}c[i>>2]=4;return}}while(0);c[i>>2]=3;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function r1(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){return}g=d+28|0;if((c[g>>2]|0)==1){return}c[g>>2]=f;return}if((c[d>>2]|0)!=(b|0)){return}do{if((c[d+16>>2]|0)!=(e|0)){b=d+20|0;if((c[b>>2]|0)==(e|0)){break}c[d+32>>2]=f;c[b>>2]=e;b=d+40|0;c[b>>2]=(c[b>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){break}a[d+54|0]=1}}while(0);c[d+44>>2]=4;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function r2(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((b|0)!=(c[d+8>>2]|0)){i=d+52|0;j=a[i]&1;k=d+53|0;l=a[k]&1;m=c[b+12>>2]|0;n=b+16+(m<<3)|0;a[i]=0;a[k]=0;o=c[b+20>>2]|0;p=o>>8;if((o&1|0)==0){q=p}else{q=c[(c[f>>2]|0)+p>>2]|0}p=c[b+16>>2]|0;ba[c[(c[p>>2]|0)+20>>2]&7](p,d,e,f+q|0,(o&2|0)!=0?g:2,h);L2762:do{if((m|0)>1){o=d+24|0;q=b+8|0;p=d+54|0;r=f;s=b+24|0;do{if((a[p]&1)!=0){break L2762}do{if((a[i]&1)==0){if((a[k]&1)==0){break}if((c[q>>2]&1|0)==0){break L2762}}else{if((c[o>>2]|0)==1){break L2762}if((c[q>>2]&2|0)==0){break L2762}}}while(0);a[i]=0;a[k]=0;t=c[s+4>>2]|0;u=t>>8;if((t&1|0)==0){v=u}else{v=c[(c[r>>2]|0)+u>>2]|0}u=c[s>>2]|0;ba[c[(c[u>>2]|0)+20>>2]&7](u,d,e,f+v|0,(t&2|0)!=0?g:2,h);s=s+8|0;}while(s>>>0<n>>>0)}}while(0);a[i]=j;a[k]=l;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;l=c[f>>2]|0;if((l|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((l|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;l=c[e>>2]|0;if((l|0)==2){c[e>>2]=g;w=g}else{w=l}if(!((c[d+48>>2]|0)==1&(w|0)==1)){return}a[d+54|0]=1;return}function r3(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0;if((b|0)!=(c[d+8>>2]|0)){i=c[b+8>>2]|0;ba[c[(c[i>>2]|0)+20>>2]&7](i,d,e,f,g,h);return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;h=c[f>>2]|0;if((h|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((h|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;h=c[e>>2]|0;if((h|0)==2){c[e>>2]=g;j=g}else{j=h}if(!((c[d+48>>2]|0)==1&(j|0)==1)){return}a[d+54|0]=1;return}function r4(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0;if((c[d+8>>2]|0)!=(b|0)){return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g;i=g}else{i=b}if(!((c[d+48>>2]|0)==1&(i|0)==1)){return}a[d+54|0]=1;return}function r5(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,aw=0,ax=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aJ=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[5514]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=22096+(h<<2)|0;j=22096+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[5514]=e&~(1<<g)}else{if(l>>>0<(c[5518]|0)>>>0){av();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{av();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[5516]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=22096+(p<<2)|0;m=22096+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[5514]=e&~(1<<r)}else{if(l>>>0<(c[5518]|0)>>>0){av();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{av();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[5516]|0;if((l|0)!=0){q=c[5519]|0;d=l>>>3;l=d<<1;f=22096+(l<<2)|0;k=c[5514]|0;h=1<<d;do{if((k&h|0)==0){c[5514]=k|h;s=f;t=22096+(l+2<<2)|0}else{d=22096+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[5518]|0)>>>0){s=g;t=d;break}av();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[5516]=m;c[5519]=e;n=i;return n|0}l=c[5515]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[22360+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[5518]|0;if(r>>>0<i>>>0){av();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){av();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){av();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){av();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){av();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{av();return 0}}}while(0);L3052:do{if((e|0)!=0){f=d+28|0;i=22360+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[5515]=c[5515]&~(1<<c[f>>2]);break L3052}else{if(e>>>0<(c[5518]|0)>>>0){av();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L3052}}}while(0);if(v>>>0<(c[5518]|0)>>>0){av();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[5518]|0)>>>0){av();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[5518]|0)>>>0){av();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[5516]|0;if((f|0)!=0){e=c[5519]|0;i=f>>>3;f=i<<1;q=22096+(f<<2)|0;k=c[5514]|0;g=1<<i;do{if((k&g|0)==0){c[5514]=k|g;y=q;z=22096+(f+2<<2)|0}else{i=22096+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[5518]|0)>>>0){y=l;z=i;break}av();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[5516]=p;c[5519]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[5515]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[22360+(A<<2)>>2]|0;L2860:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L2860}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[22360+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[5516]|0)-g|0)>>>0){o=g;break}q=K;m=c[5518]|0;if(q>>>0<m>>>0){av();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){av();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){av();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){av();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){av();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{av();return 0}}}while(0);L2910:do{if((e|0)!=0){i=K+28|0;m=22360+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[5515]=c[5515]&~(1<<c[i>>2]);break L2910}else{if(e>>>0<(c[5518]|0)>>>0){av();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L2910}}}while(0);if(L>>>0<(c[5518]|0)>>>0){av();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[5518]|0)>>>0){av();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[5518]|0)>>>0){av();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=22096+(e<<2)|0;r=c[5514]|0;j=1<<i;do{if((r&j|0)==0){c[5514]=r|j;O=m;P=22096+(e+2<<2)|0}else{i=22096+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[5518]|0)>>>0){O=d;P=i;break}av();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=22360+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[5515]|0;l=1<<Q;if((m&l|0)==0){c[5515]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=2632;break}else{l=l<<1;m=j}}if((T|0)==2632){if(S>>>0<(c[5518]|0)>>>0){av();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[5518]|0;if(m>>>0<i>>>0){av();return 0}if(j>>>0<i>>>0){av();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[5516]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[5519]|0;if(S>>>0>15>>>0){R=J;c[5519]=R+o;c[5516]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[5516]=0;c[5519]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[5517]|0;if(o>>>0<J>>>0){S=J-o|0;c[5517]=S;J=c[5520]|0;K=J;c[5520]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[5502]|0)==0){J=ay(30)|0;if((J-1&J|0)==0){c[5504]=J;c[5503]=J;c[5505]=-1;c[5506]=-1;c[5507]=0;c[5625]=0;c[5502]=(aI(0)|0)&-16^1431655768;break}else{av();return 0}}}while(0);J=o+48|0;S=c[5504]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[5624]|0;do{if((O|0)!=0){P=c[5622]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L3119:do{if((c[5625]&4|0)==0){O=c[5520]|0;L3121:do{if((O|0)==0){T=2662}else{L=O;P=22504;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=2662;break L3121}else{P=M}}if((P|0)==0){T=2662;break}L=R-(c[5517]|0)&Q;if(L>>>0>=2147483647>>>0){W=0;break}m=aV(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=2671}}while(0);do{if((T|0)==2662){O=aV(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[5503]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[5622]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647>>>0)){W=0;break}m=c[5624]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=aV($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=2671}}while(0);L3141:do{if((T|0)==2671){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=2682;break L3119}do{if((Z|0)!=-1&_>>>0<2147483647>>>0&_>>>0<J>>>0){g=c[5504]|0;O=K-_+g&-g;if(O>>>0>=2147483647>>>0){ac=_;break}if((aV(O|0)|0)==-1){aV(m|0)|0;W=Y;break L3141}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=2682;break L3119}}}while(0);c[5625]=c[5625]|4;ad=W;T=2679}else{ad=0;T=2679}}while(0);do{if((T|0)==2679){if(S>>>0>=2147483647>>>0){break}W=aV(S|0)|0;Z=aV(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=2682}}}while(0);do{if((T|0)==2682){ad=(c[5622]|0)+aa|0;c[5622]=ad;if(ad>>>0>(c[5623]|0)>>>0){c[5623]=ad}ad=c[5520]|0;L3161:do{if((ad|0)==0){S=c[5518]|0;if((S|0)==0|ab>>>0<S>>>0){c[5518]=ab}c[5626]=ab;c[5627]=aa;c[5629]=0;c[5523]=c[5502];c[5522]=-1;S=0;do{Y=S<<1;ac=22096+(Y<<2)|0;c[22096+(Y+3<<2)>>2]=ac;c[22096+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32>>>0);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[5520]=ab+ae;c[5517]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[5521]=c[5506]}else{S=22504;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=2694;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==2694){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[5520]|0;Y=(c[5517]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[5520]=Z+ai;c[5517]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[5521]=c[5506];break L3161}}while(0);if(ab>>>0<(c[5518]|0)>>>0){c[5518]=ab}S=ab+aa|0;Y=22504;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=2704;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==2704){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[5520]|0)){J=(c[5517]|0)+K|0;c[5517]=J;c[5520]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[5519]|0)){J=(c[5516]|0)+K|0;c[5516]=J;c[5519]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L3196:do{if(X>>>0<256>>>0){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=22096+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[5518]|0)>>>0){av();return 0}if((c[U+12>>2]|0)==(Z|0)){break}av();return 0}}while(0);if((Q|0)==(U|0)){c[5514]=c[5514]&~(1<<V);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[5518]|0)>>>0){av();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){am=m;break}av();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){an=0;break}else{ao=O;ap=e}}else{ao=L;ap=g}while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[5518]|0)>>>0){av();return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[5518]|0)>>>0){av();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){av();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;an=P;break}else{av();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=22360+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[5515]=c[5515]&~(1<<c[P>>2]);break L3196}else{if(m>>>0<(c[5518]|0)>>>0){av();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[m+20>>2]=an}if((an|0)==0){break L3196}}}while(0);if(an>>>0<(c[5518]|0)>>>0){av();return 0}c[an+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[5518]|0)>>>0){av();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[5518]|0)>>>0){av();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=ar|1;c[ab+(ar+W)>>2]=ar;J=ar>>>3;if(ar>>>0<256>>>0){V=J<<1;X=22096+(V<<2)|0;P=c[5514]|0;m=1<<J;do{if((P&m|0)==0){c[5514]=P|m;as=X;at=22096+(V+2<<2)|0}else{J=22096+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[5518]|0)>>>0){as=U;at=J;break}av();return 0}}while(0);c[at>>2]=_;c[as+12>>2]=_;c[ab+(W+8)>>2]=as;c[ab+(W+12)>>2]=X;break}V=ac;m=ar>>>8;do{if((m|0)==0){au=0}else{if(ar>>>0>16777215>>>0){au=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;au=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=22360+(au<<2)|0;c[ab+(W+28)>>2]=au;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[5515]|0;Q=1<<au;if((X&Q|0)==0){c[5515]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((au|0)==31){aw=0}else{aw=25-(au>>>1)|0}Q=ar<<aw;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}ax=X+16+(Q>>>31<<2)|0;m=c[ax>>2]|0;if((m|0)==0){T=2777;break}else{Q=Q<<1;X=m}}if((T|0)==2777){if(ax>>>0<(c[5518]|0)>>>0){av();return 0}else{c[ax>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[5518]|0;if(X>>>0<$>>>0){av();return 0}if(m>>>0<$>>>0){av();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=22504;while(1){az=c[W>>2]|0;if(az>>>0<=Y>>>0){aA=c[W+4>>2]|0;aB=az+aA|0;if(aB>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=az+(aA-39)|0;if((W&7|0)==0){aC=0}else{aC=-W&7}W=az+(aA-47+aC)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aD=0}else{aD=-_&7}_=aa-40-aD|0;c[5520]=ab+aD;c[5517]=_;c[ab+(aD+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[5521]=c[5506];c[ac+4>>2]=27;c[W>>2]=c[5626];c[W+4>>2]=c[5627];c[W+8>>2]=c[5628];c[W+12>>2]=c[5629];c[5626]=ab;c[5627]=aa;c[5629]=0;c[5628]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<aB>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<aB>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256>>>0){K=W<<1;Z=22096+(K<<2)|0;S=c[5514]|0;m=1<<W;do{if((S&m|0)==0){c[5514]=S|m;aE=Z;aF=22096+(K+2<<2)|0}else{W=22096+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[5518]|0)>>>0){aE=Q;aF=W;break}av();return 0}}while(0);c[aF>>2]=ad;c[aE+12>>2]=ad;c[ad+8>>2]=aE;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aG=0}else{if(_>>>0>16777215>>>0){aG=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aG=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=22360+(aG<<2)|0;c[ad+28>>2]=aG;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[5515]|0;Q=1<<aG;if((Z&Q|0)==0){c[5515]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aG|0)==31){aH=0}else{aH=25-(aG>>>1)|0}Q=_<<aH;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aJ=Z+16+(Q>>>31<<2)|0;m=c[aJ>>2]|0;if((m|0)==0){T=2812;break}else{Q=Q<<1;Z=m}}if((T|0)==2812){if(aJ>>>0<(c[5518]|0)>>>0){av();return 0}else{c[aJ>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[5518]|0;if(Z>>>0<m>>>0){av();return 0}if(_>>>0<m>>>0){av();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[5517]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[5517]=_;ad=c[5520]|0;Q=ad;c[5520]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(aT()|0)>>2]=12;n=0;return n|0}
function bd(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function be(){return i|0}function bf(a){a=a|0;i=a}function bg(a,b){a=a|0;b=b|0;if((q|0)==0){q=a;r=b}}function bh(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function bi(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function bj(a){a=a|0;D=a}function bk(a){a=a|0;E=a}function bl(a){a=a|0;F=a}function bm(a){a=a|0;G=a}function bn(a){a=a|0;H=a}function bo(a){a=a|0;I=a}function bp(a){a=a|0;J=a}function bq(a){a=a|0;K=a}function br(a){a=a|0;L=a}function bs(a){a=a|0;M=a}function bt(){c[4562]=m+8;c[4564]=m+8;c[4566]=n+8;c[4570]=n+8;c[4574]=n+8;c[4578]=n+8;c[4582]=n+8;c[4586]=n+8;c[4590]=n+8;c[4594]=n+8;c[4598]=n+8;c[4602]=n+8;c[4606]=n+8;c[4610]=n+8;c[4614]=n+8;c[4618]=n+8;c[4622]=n+8;c[4626]=n+8;c[4630]=m+8;c[4632]=n+8;c[4636]=n+8;c[4640]=n+8;c[4652]=m+8;c[4662]=m+8;c[4672]=m+8;c[4682]=m+8;c[4700]=n+8;c[4704]=m+8;c[4714]=m+8;c[4716]=n+8;c[4720]=n+8;c[4724]=n+8;c[4728]=m+8;c[4730]=n+8;c[4734]=n+8;c[4746]=m+8;c[4748]=n+8;c[4752]=m+8;c[4754]=n+8}function bu(a){a=a|0;var b=0;b=a;c[b>>2]=2147483647;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;c[b+24>>2]=0;c[b+16>>2]=0;c[b+20>>2]=0;c[b+28>>2]=0;c[b+32>>2]=16;c[b+36>>2]=0;b=-2147483646;if((b>>1|0)==-1073741823){}else{at(10536,10456,45,11888)}b=98304;if(((b&65535)<<16>>16|0)==-32768){return}at(6464,10456,49,11888);return}function bv(a){a=a|0;var b=0;b=a;if((c[b+12>>2]|0)==1){return}r6(c[b+8>>2]|0);return}function bw(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;c[d+4>>2]=0;c[d+16>>2]=0;c[d+40>>2]=0;if((c[d+8>>2]|0)==0){return}if((b|0)!=0){e=c[d+12>>2]|0}else{e=bx(d)|0}sf(c[d+8>>2]|0,0,e+18<<2|0);return}function bx(a){a=a|0;return(c[a+4>>2]|0)>>>16|0}function by(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=b;b=d;d=a;if((c[d+12>>2]|0)==1){at(4584,10456,83,11920);return 0}a=65453;if((b|0)!=0){f=(($(e,b+1|0)|0)+999|0)/1e3|0;if((f|0)>=(a|0)){at(4584,10456,95,11920);return 0}a=f}do{if((c[d+12>>2]|0)!=(a|0)){f=r7(c[d+8>>2]|0,a+18<<2)|0;if((f|0)!=0){c[d+8>>2]=f;break}g=3424;h=g;return h|0}}while(0);c[d+12>>2]=a;if((c[d+12>>2]|0)!=1){}else{at(2792,10456,107,11920);return 0}c[d+24>>2]=e;c[d+36>>2]=((a*1e3|0|0)/(e|0)|0)-1;if((b|0)!=0){if((c[d+36>>2]|0)==(b|0)){}else{at(2192,10456,113,11920);return 0}}if((c[d+28>>2]|0)!=0){bz(d,c[d+28>>2]|0)}bA(d,c[d+32>>2]|0);bw(d,1);g=0;h=g;return h|0}function bz(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d+28>>2]=a;c[d>>2]=bB(d,a)|0;return}function bA(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=b;b=a;c[b+32>>2]=d;a=31;if((d|0)<=0){e=a;f=b+20|0;c[f>>2]=e;return}a=13;g=(d<<16|0)/(c[b+24>>2]|0)|0;do{d=g>>1;g=d;if((d|0)!=0){d=a-1|0;a=d;h=(d|0)!=0}else{h=0}}while(h);e=a;f=b+20|0;c[f>>2]=e;return}function bB(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=~~+N(+(c[d+24>>2]|0)/+(b|0)*65536.0+.5);if((a|0)>0){e=0;f=a;return f|0}if((c[d+24>>2]|0)==0){e=1;f=a;return f|0}at(1536,10456,127,10648);return 0}function bC(a,b){a=a|0;b=b|0;var d=0;d=a;a=$(b,c[d>>2]|0)|0;b=d+4|0;c[b>>2]=(c[b>>2]|0)+a;a=bx(d)|0;if((a|0)<=(c[d+12>>2]|0)){return}at(904,10456,147,11904);return}function bD(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if((d|0)<=(bx(b)|0)){}else{at(400,10456,152,11936)}a=b+4|0;c[a>>2]=(c[a>>2]|0)-(d<<16);return}function bE(a,b){a=a|0;b=b|0;var d=0;d=a;a=$(b,c[d>>2]|0)|0;return a+(c[d+4>>2]|0)|0}function bF(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if((c[b>>2]|0)==0){at(4584,10456,167,10672);return 0}if((d|0)>(c[b+12>>2]|0)){d=c[b+12>>2]|0}return(((d<<16)-(c[b+4>>2]|0)+(c[b>>2]|0)-1|0)>>>0)/((c[b>>2]|0)>>>0)|0|0}function bG(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if((d|0)==0){return}bD(b,d);a=(bx(b)|0)+18|0;sh(c[b+8>>2]|0,(c[b+8>>2]|0)+(d<<2)|0,a<<2|0);sf((c[b+8>>2]|0)+(a<<2)|0,0,d<<2|0);return}function bH(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;c[e+24>>2]=b;c[e+28>>2]=d;h[e+16>>3]=0.0;c[e+32>>2]=0;c[e>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;return}function bI(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0.0,i=0.0;e=b;b=d;d=a;f=144.0/+(b|0)+.85;i=+(c[d+12>>2]|0)*.5;if((c[d+16>>2]|0)!=0){f=i/+(c[d+16>>2]|0)}bJ(e,b,64.0*f,+h[d>>3],+(c[d+8>>2]|0)*f/i);i=3.141592653589793/+(b-1|0);d=b;while(1){b=d;d=b-1|0;if((b|0)==0){break}f=.5400000214576721- +R(+(d|0)*i)*.46000000834465027;b=e+(d<<2)|0;g[b>>2]=+g[b>>2]*f}return}function bJ(a,b,c,d,e){a=a|0;b=b|0;c=+c;d=+d;e=+e;var f=0,h=0.0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0;f=a;a=b;h=d;d=e;if(d>=.999){d=.999}if(h<-300.0){h=-300.0}if(h>5.0){h=5.0}e=+Q(+10.0,+(1220703125.0e-14*h/(1.0-d)));h=+Q(+e,+(4096.0-4096.0*d));i=.0003834951969714103/c;b=0;while(1){if((b|0)>=(a|0)){break}c=+((b-a<<1)+1|0)*i;j=c*4096.0;k=j*d;l=4096.0;if(k!=0.0){l=l*(+S(k)/k)}m=+R(c);n=e*(e-m-m)+1.0;if(n>1.0e-13){l=l*d+((+R(j-c)*e- +R(j))*h- +R(k-c)*e+ +R(k))/n}g[f+(b<<2)>>2]=l;b=b+1|0}return}function bK(a){a=a|0;var d=0,e=0,f=0,g=0,h=0;d=a;a=bL(d)|0;e=64;while(1){f=e;e=f-1|0;if((f|0)<32){break}f=62-e|0;g=c[d+32>>2]|0;h=1;while(1){if((h|0)>=(a|0)){break}g=g-(b[(c[d+24>>2]|0)+(h+e<<1)>>1]|0)|0;g=g-(b[(c[d+24>>2]|0)+(h+f<<1)>>1]|0)|0;h=h+64|0}if((e|0)==(f|0)){g=(g|0)/2|0}h=(c[d+24>>2]|0)+(a-64+e<<1)|0;b[h>>1]=(b[h>>1]|0)+((g&65535)<<16>>16)&65535}return}function bL(a){a=a|0;return(c[a+28>>2]<<5)+1|0}function bM(a,d){a=a|0;d=d|0;var e=0,f=0,j=0,k=0,l=0.0,m=0.0,n=0.0;e=i;i=i+2432|0;f=e|0;j=a;a=(c[j+28>>2]|0)-1<<5;bI(d,f+256|0,a);d=64;while(1){k=d;d=k-1|0;if((k|0)==0){break}g[f+(a+64+d<<2)>>2]=+g[f+(a+64-1-d<<2)>>2]}d=0;while(1){if((d|0)>=64){break}g[f+(d<<2)>>2]=0.0;d=d+1|0}l=0.0;d=0;while(1){if((d|0)>=(a|0)){break}l=l+ +g[f+(d+64<<2)>>2];d=d+1|0}m=16384.0/l;c[j+32>>2]=32768;l=0.0;n=0.0;a=bL(j)|0;d=0;while(1){if((d|0)>=(a|0)){break}k=~~+N((n-l)*m+.5);b[(c[j+24>>2]|0)+(d<<1)>>1]=k;l=l+ +g[f+(d<<2)>>2];n=n+ +g[f+(d+64<<2)>>2];d=d+1|0}bK(j);n=+h[j+16>>3];if(n==0.0){i=e;return}h[j+16>>3]=0.0;bN(j,n);i=e;return}function bN(a,d){a=a|0;d=+d;var e=0,f=0,g=0.0,j=0,k=0,l=0,m=0;e=i;i=i+24|0;f=e|0;g=d;j=a;if(g==+h[j+16>>3]){i=e;return}if((c[j+32>>2]|0)==0){bO(f,-8.0);bM(j,f)}h[j+16>>3]=g;d=g*1073741824.0/+(c[j+32>>2]|0);if(d>0.0){f=0;while(1){if(d>=2.0){break}f=f+1|0;d=d*2.0}if((f|0)!=0){a=j+32|0;c[a>>2]=c[a>>2]>>f;if((c[j+32>>2]|0)>0){}else{at(10440,10456,381,11872)}a=(1<<f-1)+32768|0;k=32768>>f;l=bL(j)|0;while(1){m=l;l=m-1|0;if((m|0)==0){break}b[(c[j+24>>2]|0)+(l<<1)>>1]=((b[(c[j+24>>2]|0)+(l<<1)>>1]|0)+a>>f)-k&65535}bK(j)}}c[j+8>>2]=~~+N(d+.5);i=e;return}function bO(a,b){a=a|0;b=+b;bP(a,b);return}function bP(a,b){a=a|0;b=+b;var d=0;d=a;h[d>>3]=b;c[d+8>>2]=0;c[d+12>>2]=44100;c[d+16>>2]=0;return}function bQ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;c[e+8>>2]=b;c[e+12>>2]=d;return 0}function bR(a){a=a|0;var b=0;b=a;fg(b);c[b>>2]=17296;c[b+316>>2]=0;c[b+320>>2]=0;c[b+332>>2]=0;return}function bS(a){a=a|0;var b=0;b=a;bU(b);bT(b);return}function bT(a){a=a|0;r6(a);return}function bU(a){a=a|0;var b=0,d=0;b=a;c[b>>2]=17296;a=c[b+320>>2]|0;if((a|0)==0){d=b;fj(d);return}a3[c[(c[a>>2]|0)+4>>2]&511](a);d=b;fj(d);return}function bV(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+24|0;e=d|0;f=b;b=a;bW(b,f);a=c[(c[b>>2]|0)+76>>2]|0;bO(e,+h[f>>3]);a4[a&63](b,e);if((c[b+316>>2]|0)==0){i=d;return}e=c[b+316>>2]|0;a=c[(c[e>>2]|0)+24>>2]|0;f=~~+h[(bX(b)|0)+8>>3];a4[a&63](e,f);i=d;return}function bW(a,b){a=a|0;b=b|0;return}function bX(a){a=a|0;return a+144|0}function bY(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=b;b=a;if((c[b+316>>2]|0)==0){do{if((c[b+320>>2]|0)==0){a=bZ(172)|0;e=0;if((a|0)==0){f=0}else{e=1;e=a;eY(e);f=e}e=f;c[b+320>>2]=e;if((e|0)==0){g=10160;h=g;return h|0}else{break}}}while(0);c[b+316>>2]=c[b+320>>2]}f=c[b+316>>2]|0;g=a5[c[(c[f>>2]|0)+16>>2]&127](f,d,50)|0;h=g;return h|0}function bZ(a){a=a|0;return r5(a)|0}function b_(a){a=a|0;r6(a);return}function b$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+16|0;e=d|0;f=b;b=a;b0(b,f);a=b1(b)|0;while(1){g=a;a=g-1|0;if((g|0)==0){break}if((f&1<<a|0)!=0){a0[c[(c[b>>2]|0)+72>>2]&31](b,a,0,0,0)}else{g=c[b+316>>2]|0;if((c[b+332>>2]|0)!=0){h=c[(c[b+332>>2]|0)+(a<<2)>>2]|0}else{h=0}bc[c[(c[g>>2]|0)+12>>2]&31](e,g,a,h);do{if((c[e>>2]|0)!=0){if((c[e+4>>2]|0)==0){j=218;break}if((c[e+8>>2]|0)!=0){k=1}else{j=218}}else{j=218}}while(0);L245:do{if((j|0)==218){j=0;do{if((c[e>>2]|0)==0){if((c[e+4>>2]|0)!=0){break}if((c[e+8>>2]|0)==0){k=1;break L245}}}while(0);at(9992,6232,70,11840)}}while(0);a0[c[(c[b>>2]|0)+72>>2]&31](b,a,c[e>>2]|0,c[e+4>>2]|0,c[e+8>>2]|0)}}i=d;return}function b0(a,b){a=a|0;b=b|0;return}function b1(a){a=a|0;return c[a+232>>2]|0}function b2(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;c[b+324>>2]=d;a=c[b+316>>2]|0;a4[c[(c[a>>2]|0)+20>>2]&63](a,d);return}function b3(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a;b2(d,b);b=c[d+316>>2]|0;a=c[(c[b>>2]|0)+8>>2]|0;e=b1(d)|0;f=bb[a&127](b,e)|0;if((f|0)!=0){g=f;h=g;return h|0}fn(d,bX(d)|0);c[d+328>>2]=b4(c[d+316>>2]|0)|0;g=0;h=g;return h|0}function b4(a){a=a|0;return c[a+4>>2]|0}function b5(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b6(d,b)|0;if((a|0)!=0){e=a;f=e;return f|0}a=c[d+316>>2]|0;a3[c[(c[a>>2]|0)+28>>2]&511](a);e=0;f=e;return f|0}function b6(a,b){a=a|0;b=b|0;return 0}function b7(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+8|0;f=e|0;g=b;b=d;d=a;a=g;while(1){if((a|0)==0){h=259;break}j=c[d+316>>2]|0;a=a-(a5[c[(c[j>>2]|0)+36>>2]&127](j,b+(g-a<<1)|0,a)|0)|0;if((a|0)!=0){j=c[d+328>>2]|0;if((j|0)!=(b4(c[d+316>>2]|0)|0)){c[d+328>>2]=b4(c[d+316>>2]|0)|0;b8(d)}j=b9(c[d+316>>2]|0)|0;c[f>>2]=($(j,c[d+324>>2]|0)|0)/1e3|0;k=a5[c[(c[d>>2]|0)+80>>2]&127](d,f,j)|0;if((k|0)!=0){h=253;break}if((c[f>>2]|0)!=0){}else{at(4488,6232,114,11832);return 0}j=c[d+316>>2]|0;a4[c[(c[j>>2]|0)+32>>2]&63](j,c[f>>2]|0)}}if((h|0)==259){l=0;m=l;i=e;return m|0}else if((h|0)==253){l=k;m=l;i=e;return m|0}return 0}function b8(a){a=a|0;var b=0;b=a;fo(b,c[b+236>>2]|0);return}function b9(a){a=a|0;return c[a+12>>2]|0}function ca(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0;h=b;b=d;d=f;f=g;g=a;a=f-b|0;c[g+12>>2]=0;c[g+16>>2]=0;c[g+20>>2]=0;cb(g|0);i=h;c[g+8>>2]=a6[c[(c[i>>2]|0)+16>>2]&31](i)|0;if((c[g+8>>2]|0)<=(b|0)){j=c[2]|0;k=j;return k|0}i=cc(g|0,a+(c[g+8>>2]|0)+f|0)|0;if((i|0)==0){l=h;h=c[(c[l>>2]|0)+12>>2]|0;m=(cd(g|0)|0)+a|0;i=a5[h&127](l,m,c[g+8>>2]|0)|0}if((i|0)!=0){cb(g|0);j=i;k=j;return k|0}else{i=g+8|0;c[i>>2]=(c[i>>2]|0)-b;i=e;e=ce(g|0,a)|0;a=b;sg(i|0,e|0,a)|0;sf(cd(g|0)|0,d&255|0,f|0);sf((cf(g|0)|0)+(-f|0)|0,d&255|0,f|0);j=0;k=j;return k|0}return 0}function cb(a){a=a|0;var b=0;b=a;a=c[b>>2]|0;c[b>>2]=0;c[b+4>>2]=0;r6(a);return}function cc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=b;b=a;a=r7(c[b>>2]|0,d)|0;do{if((a|0)==0){if((d|0)==0){break}e=10160;f=e;return f|0}}while(0);c[b>>2]=a;c[b+4>>2]=d;e=0;f=e;return f|0}function cd(a){a=a|0;return c[a>>2]|0}function ce(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if(d>>>0<=(c[b+4>>2]|0)>>>0){}else{at(3400,2704,58,10600);return 0}return(c[b>>2]|0)+d|0}function cf(a){a=a|0;var b=0;b=a;return(c[b>>2]|0)+(c[b+4>>2]|0)|0}function cg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=b;b=d;d=a;c[d+12>>2]=e-b-8;a=$((e+(c[d+8>>2]|0)+b-1|0)/(b|0)|0,b)|0;if((a|0)<=0){a=0}else{b=0;f=a-1|0;while(1){if((f>>>(b>>>0)|0)==0){break}b=b+1|0}c[d+16>>2]=(1<<b)-1}if((e|0)<0){e=0}c[d+20>>2]=a;if((cc(d|0,a-(c[d+12>>2]|0)+8|0)|0)==0){return}return}function ch(a){a=a|0;return}function ci(a,b){a=a|0;b=b|0;var d=0,e=0;d=b;b=a;if((c[b+316>>2]|0)!=0){e=305}else{if((d|0)!=0){}else{e=305}}if((e|0)==305){at(2128,1344,45,11856)}c[b+316>>2]=d;return}function cj(a,b){a=a|0;b=b|0;return}function ck(a){a=a|0;return}function cl(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=d;d=a;a=a5[c[(c[d>>2]|0)+8>>2]&127](d,b,e)|0;if((a|0)==(e|0)){f=0;g=f;return g|0}do{if((a|0)>=0){if((a|0)>=(e|0)){break}f=19344;g=f;return g|0}}while(0);f=6576;g=f;return g|0}function cm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+512|0;e=d|0;f=b;b=a;while(1){if((f|0)==0){g=328;break}a=512;if((a|0)>(f|0)){a=f}f=f-a|0;h=a5[c[(c[b>>2]|0)+12>>2]&127](b,e|0,a)|0;if((h|0)!=0){g=325;break}}if((g|0)==325){j=h;k=j;i=d;return k|0}else if((g|0)==328){j=0;k=j;i=d;return k|0}return 0}function cn(a){a=a|0;var b=0;b=a;a=a6[c[(c[b>>2]|0)+24>>2]&31](b)|0;return a-(a6[c[(c[b>>2]|0)+28>>2]&31](b)|0)|0}function co(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=b;b=a;if((d|0)>=0){}else{at(9464,5968,57,11824);return 0}if((d|0)!=0){a=c[(c[b>>2]|0)+32>>2]|0;e=(a6[c[(c[b>>2]|0)+28>>2]&31](b)|0)+d|0;f=bb[a&127](b,e)|0;g=f;return g|0}else{f=0;g=f;return g|0}return 0}function cp(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;b=d;d=a;cq(d);c[d>>2]=16904;c[d+4>>2]=e;a=e;c[d+8>>2]=a6[c[(c[a>>2]|0)+16>>2]&31](a)|0;if((c[d+8>>2]|0)<=(b|0)){return}c[d+8>>2]=b;return}function cq(a){a=a|0;c[a>>2]=17256;return}function cr(a){a=a|0;return}function cs(a){a=a|0;return c[a+8>>2]|0}function ct(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;d=a;if((e|0)>(c[d+8>>2]|0)){e=c[d+8>>2]|0}a=d+8|0;c[a>>2]=(c[a>>2]|0)-e;a=c[d+4>>2]|0;return a5[c[(c[a>>2]|0)+8>>2]&127](a,b,e)|0}function cu(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=a;cq(f);c[f>>2]=16712;c[f+4>>2]=b;c[f+8>>2]=(c[f+4>>2]|0)+d;c[f+12>>2]=e;return}function cv(a){a=a|0;var b=0,d=0;b=a;a=(c[b+8>>2]|0)-(c[b+4>>2]|0)|0;d=c[b+12>>2]|0;return a+(a6[c[(c[d>>2]|0)+16>>2]&31](d)|0)|0}function cw(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=d;d=a;a=(c[d+8>>2]|0)-(c[d+4>>2]|0)|0;if((a|0)==0){f=a;return f|0}if((a|0)>(e|0)){a=e}e=c[d+4>>2]|0;g=d+4|0;c[g>>2]=(c[g>>2]|0)+a;g=b;b=e;e=a;sg(g|0,b|0,e)|0;f=a;return f|0}function cx(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=b;b=d;d=a;a=cw(d,e,b)|0;f=b-a|0;do{if((f|0)!=0){b=c[d+12>>2]|0;f=a5[c[(c[b>>2]|0)+8>>2]&127](b,e+a|0,f)|0;if((f|0)>0){break}g=f;h=g;return h|0}}while(0);g=a+f|0;h=g;return h|0}function cy(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=b;b=d;d=a;a=cw(d,e,b)|0;f=b-a|0;if((f|0)!=0){b=c[d+12>>2]|0;g=a5[c[(c[b>>2]|0)+12>>2]&127](b,e+a|0,f)|0;h=g;return h|0}else{g=0;h=g;return h|0}return 0}function cz(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;cA(e);c[e>>2]=16752;c[e+4>>2]=b;c[e+8>>2]=d;c[e+12>>2]=0;return}function cA(a){a=a|0;var b=0;b=a;cq(b);c[b>>2]=17200;return}function cB(a){a=a|0;return c[a+8>>2]|0}function cC(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=d;d=a;a=d;f=a6[c[(c[a>>2]|0)+16>>2]&31](a)|0;if((e|0)>(f|0)){e=f}f=b;b=(c[d+4>>2]|0)+(c[d+12>>2]|0)|0;a=e;sg(f|0,b|0,a)|0;a=d+12|0;c[a>>2]=(c[a>>2]|0)+e;return e|0}function cD(a){a=a|0;return c[a+12>>2]|0}function cE(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=b;b=a;if((d|0)>(c[b+8>>2]|0)){e=19344;f=e;return f|0}else{c[b+12>>2]=d;e=0;f=e;return f|0}return 0}function cF(a){a=a|0;cr(a);return}function cG(a){a=a|0;cr(a);return}function cH(a){a=a|0;var b=0;b=a;cG(b);sb(b);return}function cI(a){a=a|0;cF(a);return}function cJ(a){a=a|0;var b=0;b=a;cI(b);sb(b);return}function cK(a){a=a|0;cS(a);return}function cL(a){a=a|0;var b=0;b=a;cK(b);sb(b);return}function cM(a){a=a|0;cR(a);return}function cN(a){a=a|0;var b=0;b=a;cM(b);sb(b);return}function cO(a){a=a|0;cQ(a);return}function cP(a){a=a|0;var b=0;b=a;cO(b);sb(b);return}function cQ(a){a=a|0;cF(a);return}function cR(a){a=a|0;cr(a);return}function cS(a){a=a|0;cr(a);return}function cT(a){a=a|0;var b=0;b=a;c[b>>2]=16872;cU(b+4|0);c[b+12>>2]=0;c[b+16>>2]=-1;c[b+20>>2]=-1;c[b+24>>2]=0;cV(b+32|0);return}function cU(a){a=a|0;dj(a);return}function cV(a){a=a|0;di(a);return}function cW(a){a=a|0;dh(a);return}function cX(a){a=a|0;var b=0;b=a;cY(b);sb(b);return}function cY(a){a=a|0;var b=0;b=a;c[b>>2]=16872;cZ(b+32|0);cW(b+4|0);return}function cZ(a){a=a|0;dl(a);return}function c_(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=b;b=a;a=c$(b+4|0,d+(d>>2)<<1)|0;if((a|0)!=0){e=a;f=e;return f|0}c0(b,d);c[b+24>>2]=(c[b+16>>2]|0)+(c[b+16>>2]>>2);e=dP(b+32|0,c[b+24>>2]|0)|0;f=e;return f|0}function c$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=b;b=a;a=r7(c[b>>2]|0,d<<1)|0;do{if((a|0)==0){if((d|0)==0){break}e=3232;f=e;return f|0}}while(0);c[b>>2]=a;c[b+4>>2]=d;e=0;f=e;return f|0}function c0(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;a=d<<1;if((c[b+12>>2]|0)==(a|0)){return}if(a>>>0>(c1(b+4|0)|0)>>>0){return}else{c[b+12>>2]=a;c[b+16>>2]=(~~(+(d|0)*+c2(b+32|0))<<1)+2;c3(b);return}}function c1(a){a=a|0;return c[a+4>>2]|0}function c2(a){a=a|0;return+(+h[a+40>>3])}function c3(a){a=a|0;var b=0;b=a;c[b+20>>2]=c[b+12>>2];dO(b+32|0);return}function c4(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;e=b;b=d;d=a;a=c[d+12>>2]>>1;f=bF(e,a)|0;g=c[d+16>>2]|0;h=g-(c5(d+32|0)|0)|0;g=c[(c[d>>2]|0)+8>>2]|0;i=c6(d+32|0)|0;j=a9[g&15](d,f,h,i)|0;if((j|0)<(c[d+24>>2]|0)){}else{at(5048,9024,65,11600)}bC(e,f);if((bx(e)|0)==(a|0)){}else{at(5752,9024,68,11600)}c7(d+32|0,j);j=c9(d+4|0)|0;f=c8(d+32|0,j,c[d+12>>2]|0)|0;if((f|0)==(c[d+12>>2]|0)){k=e;l=b;da(d,k,l);m=e;n=a;bG(m,n);return}at(4280,9024,73,11600);k=e;l=b;da(d,k,l);m=e;n=a;bG(m,n);return}function c5(a){a=a|0;var b=0;b=a;a=c[b+8>>2]|0;return(a-(dc(b|0,c[b+24>>2]|0)|0)|0)/2|0|0}function c6(a){a=a|0;return c[a+8>>2]|0}function c7(a,b){a=a|0;b=b|0;var d=0;d=a;a=d+8|0;c[a>>2]=(c[a>>2]|0)+(b<<1);b=c[d+8>>2]|0;if(b>>>0<=(dk(d|0)|0)>>>0){return}at(1136,696,96,11576);return}function c8(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=d;d=e;e=a;a=f;g=c9(e|0)|0;h=c[e+8>>2]|0;i=(c[e+28>>2]|0)>>>((c[e+16>>2]|0)>>>0);j=e+52+((c[e+16>>2]|0)*24|0)|0;k=(c[e+12>>2]|0)-(c[e+16>>2]|0)|0;l=c[e+32>>2]|0;d=d>>1;if(((h-g|0)/2|0|0)>=24){h=h-48|0;do{d=d-1|0;m=0;n=0;o=g;if((d|0)<0){p=487;break}p=6;while(1){if((p|0)==0){break}q=b[j>>1]|0;m=m+($(q,b[o>>1]|0)|0)|0;n=n+($(q,b[o+2>>1]|0)|0)|0;q=b[j+2>>1]|0;j=j+4|0;m=m+($(q,b[o+4>>1]|0)|0)|0;n=n+($(q,b[o+6>>1]|0)|0)|0;o=o+8|0;p=p-1|0}k=k-1|0;m=m>>15;n=n>>15;g=g+((i<<1&2)<<1)|0;i=i>>>1;g=g+(l<<1)|0;if((k|0)==0){j=e+52|0;i=c[e+28>>2]|0;k=c[e+12>>2]|0}b[a>>1]=m&65535;b[a+2>>1]=n&65535;a=a+4|0;}while(g>>>0<=h>>>0)}c[e+16>>2]=(c[e+12>>2]|0)-k;k=((c[e+8>>2]|0)-g|0)/2|0;c[e+8>>2]=dc(e|0,k)|0;sh(c9(e|0)|0,g|0,k<<1|0);return(a-f|0)/2|0|0}function c9(a){a=a|0;return c[a>>2]|0}function da(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=d;d=e;e=a;a=dd(g,h)|0;j=c9(e+4|0)|0;k=c[e+12>>2]>>1;while(1){e=k;k=e-1|0;if((e|0)==0){break}e=de(g)|0;l=(b[j>>1]<<1)+e|0;if(((l&65535)<<16>>16|0)!=(l|0)){l=32767-(l>>24)|0}df(g,a);m=(b[j+2>>1]<<1)+e|0;if(((m&65535)<<16>>16|0)!=(m|0)){m=32767-(m>>24)|0}j=j+4|0;b[d>>1]=l&65535;b[d+2>>1]=m&65535;d=d+4|0}dg(g,h);i=f;return}function db(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b;b=d;d=e;e=a;a=(c[e+12>>2]|0)-(c[e+20>>2]|0)|0;if((a|0)!=0){if((a|0)>(f|0)){a=f}f=f-a|0;g=b;h=dc(e+4|0,c[e+20>>2]|0)|0;i=a<<1;sg(g|0,h|0,i)|0;b=b+(a<<1)|0;i=e+20|0;c[i>>2]=(c[i>>2]|0)+a}while(1){if((f|0)<(c[e+12>>2]|0)){break}c4(e,d,b);b=b+(c[e+12>>2]<<1)|0;f=f-(c[e+12>>2]|0)|0}if((f|0)==0){return}c4(e,d,c9(e+4|0)|0);c[e+20>>2]=f;d=b;a=c9(e+4|0)|0;e=f<<1;sg(d|0,a|0,e)|0;b=b+(f<<1)|0;return}function dc(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if(d>>>0<=(c[b+4>>2]|0)>>>0){}else{at(2552,1808,58,10584);return 0}return(c[b>>2]|0)+(d<<1)|0}function dd(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;c[b>>2]=c[d+8>>2];c[b+4>>2]=c[d+16>>2];return c[d+20>>2]|0}function de(a){a=a|0;return c[a+4>>2]>>14|0}function df(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=d|0;e=c[a>>2]|0;c[a>>2]=e+4;a=d+4|0;c[a>>2]=(c[a>>2]|0)+((c[e>>2]|0)-(c[d+4>>2]>>b));return}function dg(a,b){a=a|0;b=b|0;c[b+16>>2]=c[a+4>>2];return}function dh(a){a=a|0;r6(c[a>>2]|0);return}function di(a){a=a|0;var b=0;b=a;dM(b,12,b+52|0);return}function dj(a){a=a|0;var b=0;b=a;c[b>>2]=0;c[b+4>>2]=0;return}function dk(a){a=a|0;var b=0;b=a;return(c[b>>2]|0)+(c[b+4>>2]<<1)|0}function dl(a){a=a|0;dN(a);return}function dm(b){b=b|0;var c=0;c=b;h[c>>3]=-.15000000596046448;h[c+8>>3]=.15000000596046448;h[c+32>>3]=88.0;h[c+48>>3]=.11999999731779099;h[c+16>>3]=61.0;h[c+24>>3]=.10000000149011612;h[c+40>>3]=18.0;a[c+56|0]=0;return}function dn(b,d){b=b|0;d=+d;var e=0,f=0,g=0.0,j=0;e=i;i=i+64|0;f=e|0;g=d;j=b;d=g;dm(f);h[f>>3]=-.6000000238418579*d;h[f+8>>3]=.6000000238418579*d;h[f+32>>3]=88.0;h[f+16>>3]=61.0;if(d>.5){d=.5}h[f+48>>3]=.5*d;h[f+24>>3]=.30000001192092896*d;h[f+40>>3]=18.0;a[f+56|0]=g>0.0|0;a4[c[(c[j>>2]|0)+44>>2]&63](j,f);i=e;return}function dp(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=d&1;d=b;eW(d,2);c[d>>2]=16808;b=d+20|0;f=b+308|0;g=b;do{bu(g);g=g+44|0;}while((g|0)!=(f|0));dm(d+368|0);cU(d+448|0);cU(d+456|0);c[d+440>>2]=e&1?3:7;c[d+468>>2]=0;c[d+464>>2]=0;c[d+432>>2]=0;c[d+436>>2]=0;a[d+444|0]=0;dn(d,0.0);return}function dq(a){a=a|0;var b=0;b=a;dr(b);b_(b);return}function dr(a){a=a|0;var b=0,d=0;b=a;c[b>>2]=16808;cW(b+456|0);cW(b+448|0);a=b+20|0;d=a+308|0;do{d=d-44|0;bv(d);}while((d|0)!=(a|0));ck(b);return}function ds(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b;b=d;d=a;do{if((c1(d+456|0)|0)==0){a=c$(d+456|0,4096)|0;if((a|0)!=0){f=a;g=f;return g|0}else{break}}}while(0);do{if((c1(d+448|0)|0)==0){a=c$(d+448|0,16384)|0;if((a|0)!=0){f=a;g=f;return g|0}else{break}}}while(0);a=0;while(1){if((a|0)>=(c[d+440>>2]|0)){h=604;break}i=by(d+20+(a*44|0)|0,e,b)|0;if((i|0)!=0){h=600;break}a=a+1|0}if((h|0)==600){f=i;g=f;return g|0}else if((h|0)==604){a4[c[(c[d>>2]|0)+44>>2]&63](d,d+368|0);a3[c[(c[d>>2]|0)+28>>2]&511](d);h=dt(d+20|0)|0;f=bQ(d,h,du(d+20|0)|0)|0;g=f;return g|0}return 0}function dt(a){a=a|0;return c[a+24>>2]|0}function du(a){a=a|0;return c[a+36>>2]|0}function dv(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;a=0;while(1){if((a|0)>=(c[b+440>>2]|0)){break}bz(b+20+(a*44|0)|0,d);a=a+1|0}return}function dw(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;a=0;while(1){if((a|0)>=(c[b+440>>2]|0)){break}bA(b+20+(a*44|0)|0,d);a=a+1|0}return}function dx(a){a=a|0;var b=0;b=a;c[b+432>>2]=0;c[b+436>>2]=0;if((c1(b+456|0)|0)!=0){sf(dc(b+456|0,0)|0,0,8192)}if((c1(b+448|0)|0)!=0){sf(dc(b+448|0,0)|0,0,32768)}a=0;while(1){if((a|0)>=(c[b+440>>2]|0)){break}bw(b+20+(a*44|0)|0,1);a=a+1|0}return}function dy(b,d){b=b|0;d=d|0;var e=0,f=0,g=0.0;e=d;d=b;dz(d);do{if(!(a[d+424|0]&1)){if(!(a[e+56|0]&1)){break}if((c1(d+456|0)|0)==0){break}sf(dc(d+456|0,0)|0,0,8192);sf(dc(d+448|0,0)|0,0,32768)}}while(0);b=d+368|0;f=e;c[b>>2]=c[f>>2];c[b+4>>2]=c[f+4>>2];c[b+8>>2]=c[f+8>>2];c[b+12>>2]=c[f+12>>2];c[b+16>>2]=c[f+16>>2];c[b+20>>2]=c[f+20>>2];c[b+24>>2]=c[f+24>>2];c[b+28>>2]=c[f+28>>2];c[b+32>>2]=c[f+32>>2];c[b+36>>2]=c[f+36>>2];c[b+40>>2]=c[f+40>>2];c[b+44>>2]=c[f+44>>2];c[b+48>>2]=c[f+48>>2];c[b+52>>2]=c[f+52>>2];a[b+56|0]=a[f+56|0]|0;if(a[d+424|0]&1){c[d+472>>2]=32768-~~(+h[d+368>>3]*32768.0+.5);c[d+476>>2]=65536-(c[d+472>>2]|0);c[d+480>>2]=32768-~~(+h[d+376>>3]*32768.0+.5);c[d+484>>2]=65536-(c[d+480>>2]|0);c[d+508>>2]=~~(+h[d+416>>3]*32768.0+.5);c[d+496>>2]=~~(+h[d+392>>3]*32768.0+.5);g=+h[d+408>>3]*5.0e-4;f=~~(g*+(dA(d)|0));g=+h[d+400>>3]*.001;b=~~(g*+(dA(d)|0));c[d+500>>2]=dB(16384-(b-f<<1)|0,16382,0)|0;c[d+504>>2]=dB(16385-(b+f<<1)|0,16383,1)|0;g=+h[d+384>>3]*.001;b=~~(g*+(dA(d)|0));c[d+488>>2]=dB(4095-(b-f)|0,4095,0)|0;c[d+492>>2]=dB(4095-(b+f)|0,4095,0)|0;c[d+328>>2]=d+20;c[d+332>>2]=d+152;c[d+336>>2]=d+196;c[d+340>>2]=d+64;c[d+344>>2]=d+152;c[d+348>>2]=d+196;c[d+352>>2]=d+108;c[d+356>>2]=d+240;c[d+360>>2]=d+284}else{f=0;while(1){if(f>>>0>=3>>>0){break}b=d+328+(f*12|0)|0;c[b>>2]=d+20;c[b+4>>2]=d+64;c[b+8>>2]=d+108;f=f+1|0}}if((c[d+440>>2]|0)>=7){return}f=0;while(1){if((f|0)>=3){break}b=d+328+(f*12|0)|0;c[b+4>>2]=c[b>>2];c[b+8>>2]=c[b>>2];f=f+1|0}return}function dz(a){a=a|0;var b=0;b=a+4|0;c[b>>2]=(c[b>>2]|0)+1;return}function dA(a){a=a|0;return c[a+8>>2]|0}function dB(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=a;a=b;b=c;do{if((d|0)<(b|0)){e=b}else{if((d|0)>(a|0)){e=a;break}else{e=d;break}}}while(0);return e|0}function dC(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=d;d=e;e=b;b=2;if((d|0)!=0){do{if((d&512|0)==0){if(((d&255|0)%3|0|0)==0){break}b=d&1}}while(0)}else{b=(f|0)%5|0;if((b|0)>2){b=2}}f=a;a=e+328+(b*12|0)|0;c[f>>2]=c[a>>2];c[f+4>>2]=c[a+4>>2];c[f+8>>2]=c[a+8>>2];return}function dD(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=d;d=b;b=0;f=0;while(1){if((f|0)>=(c[d+440>>2]|0)){break}b=b|(dE(d+20+(f*44|0)|0)|0)<<f;bC(d+20+(f*44|0)|0,e);f=f+1|0}do{if((b&(a[d+424|0]&1?120:6)|0)!=0){if((c[d+440>>2]|0)!=7){break}f=bx(d+20|0)|0;c[d+432>>2]=f+(dF(d+20|0)|0)}}while(0);do{if(!(a[d+444|0]&1)){if(a[d+424|0]&1){break}g=d+368|0;h=g+56|0;i=a[h]|0;j=i&1;k=d+444|0;l=j&1;a[k]=l;return}}while(0);b=bx(d+20|0)|0;c[d+436>>2]=b+(dF(d+20|0)|0);g=d+368|0;h=g+56|0;i=a[h]|0;j=i&1;k=d+444|0;l=j&1;a[k]=l;return}function dE(a){a=a|0;var b=0;b=a;a=c[b+40>>2]|0;c[b+40>>2]=0;return a|0}function dF(a){a=a|0;return 8}function dG(a){a=a|0;return(bx(a+20|0)|0)<<1|0}function dH(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=b;b=d;d=a;if(((b|0)%2|0|0)==0){}else{at(3960,8512,251,11584);return 0}a=bx(d+20|0)|0;if((a|0)>(b>>1|0)){a=b>>1}b=a;while(1){if((a|0)==0){break}f=c[d+440>>2]|0;g=a;if((c[d+436>>2]|0)!=0){if((g|0)>(c[d+436>>2]|0)){g=c[d+436>>2]|0}if((c[d+432>>2]|0)!=0){dI(d,e,g)}else{dJ(d,e,g);f=3}}else{if((c[d+432>>2]|0)!=0){dK(d,e,g);f=3}else{dL(d,e,g);f=1}}e=e+(g<<1<<1)|0;a=a-g|0;h=d+432|0;c[h>>2]=(c[h>>2]|0)-g;if((c[d+432>>2]|0)<0){c[d+432>>2]=0}h=d+436|0;c[h>>2]=(c[h>>2]|0)-g;if((c[d+436>>2]|0)<0){c[d+436>>2]=0}h=0;while(1){if((h|0)>=(c[d+440>>2]|0)){break}if((h|0)<(f|0)){bG(d+20+(h*44|0)|0,g)}else{bD(d+20+(h*44|0)|0,g)}h=h+1|0}}return b<<1|0}function dI(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;f=e;e=a;a=d;d=c[e+128>>2]|0;g=c[e+116>>2]|0;h=c[e+124>>2]|0;i=c[e+160>>2]|0;j=c[e+168>>2]|0;k=c[e+204>>2]|0;l=c[e+212>>2]|0;m=c[e+248>>2]|0;n=c[e+256>>2]|0;o=c[e+292>>2]|0;p=c[e+300>>2]|0;q=c[e+28>>2]|0;r=c[e+36>>2]|0;s=c[e+72>>2]|0;t=c[e+80>>2]|0;u=c9(e+448|0)|0;v=c9(e+456|0)|0;w=c[e+468>>2]|0;x=c[e+464>>2]|0;while(1){y=f;f=y-1|0;if((y|0)==0){break}y=r>>14;z=t>>14;A=q;q=A+4|0;r=r+((c[A>>2]|0)-(r>>d))|0;A=s;s=A+4|0;t=t+((c[A>>2]|0)-(t>>d))|0;A=($(y,c[e+472>>2]|0)|0)>>15;B=A+(($(z,c[e+480>>2]|0)|0)>>15)+(j>>14)|0;A=B+(b[u+((x+(c[e+500>>2]|0)&16383)<<1)>>1]|0)|0;B=($(y,c[e+476>>2]|0)|0)>>15;y=B+(($(z,c[e+484>>2]|0)|0)>>15)+(l>>14)|0;z=y+(b[u+((x+(c[e+504>>2]|0)&16383)<<1)>>1]|0)|0;y=i;i=y+4|0;j=j+((c[y>>2]|0)-(j>>d))|0;y=k;k=y+4|0;l=l+((c[y>>2]|0)-(l>>d))|0;y=c[e+508>>2]|0;b[u+(x<<1)>>1]=($(A,y)|0)>>15&65535;b[u+(x+1<<1)>>1]=($(z,y)|0)>>15&65535;x=x+2&16383;y=h>>14;B=g;g=B+4|0;h=h+((c[B>>2]|0)-(h>>d))|0;B=A+y+(n>>14)+(($(c[e+496>>2]|0,b[v+((w+(c[e+488>>2]|0)&4095)<<1)>>1]|0)|0)>>15)|0;A=z+y+(p>>14)+(($(c[e+496>>2]|0,b[v+((w+(c[e+492>>2]|0)&4095)<<1)>>1]|0)|0)>>15)|0;z=m;m=z+4|0;n=n+((c[z>>2]|0)-(n>>d))|0;z=o;o=z+4|0;p=p+((c[z>>2]|0)-(p>>d))|0;b[v+(w<<1)>>1]=y&65535;w=w+1&4095;if(((B&65535)<<16>>16|0)!=(B|0)){B=32767-(B>>24)|0}b[a>>1]=B&65535;b[a+2>>1]=A&65535;a=a+4|0;if(((A&65535)<<16>>16|0)!=(A|0)){b[a-2>>1]=32767-(A>>24)&65535}}c[e+464>>2]=x;c[e+468>>2]=w;c[e+168>>2]=j;c[e+212>>2]=l;c[e+256>>2]=n;c[e+300>>2]=p;c[e+36>>2]=r;c[e+80>>2]=t;c[e+124>>2]=h;return}function dJ(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=e;e=a;a=d;d=c[e+128>>2]|0;g=c[e+116>>2]|0;h=c[e+124>>2]|0;i=c[e+28>>2]|0;j=c[e+36>>2]|0;k=c[e+72>>2]|0;l=c[e+80>>2]|0;m=c9(e+448|0)|0;n=c9(e+456|0)|0;o=c[e+468>>2]|0;p=c[e+464>>2]|0;while(1){q=f;f=q-1|0;if((q|0)==0){break}q=j>>14;r=l>>14;s=i;i=s+4|0;j=j+((c[s>>2]|0)-(j>>d))|0;s=k;k=s+4|0;l=l+((c[s>>2]|0)-(l>>d))|0;s=($(q,c[e+472>>2]|0)|0)>>15;t=s+(($(r,c[e+480>>2]|0)|0)>>15)|0;s=t+(b[m+((p+(c[e+500>>2]|0)&16383)<<1)>>1]|0)|0;t=($(q,c[e+476>>2]|0)|0)>>15;q=t+(($(r,c[e+484>>2]|0)|0)>>15)|0;r=q+(b[m+((p+(c[e+504>>2]|0)&16383)<<1)>>1]|0)|0;q=c[e+508>>2]|0;b[m+(p<<1)>>1]=($(s,q)|0)>>15&65535;b[m+(p+1<<1)>>1]=($(r,q)|0)>>15&65535;p=p+2&16383;q=h>>14;t=g;g=t+4|0;h=h+((c[t>>2]|0)-(h>>d))|0;t=s+q+(($(c[e+496>>2]|0,b[n+((o+(c[e+488>>2]|0)&4095)<<1)>>1]|0)|0)>>15)|0;s=r+q+(($(c[e+496>>2]|0,b[n+((o+(c[e+492>>2]|0)&4095)<<1)>>1]|0)|0)>>15)|0;b[n+(o<<1)>>1]=q&65535;o=o+1&4095;if(((t&65535)<<16>>16|0)!=(t|0)){t=32767-(t>>24)|0}b[a>>1]=t&65535;b[a+2>>1]=s&65535;a=a+4|0;if(((s&65535)<<16>>16|0)!=(s|0)){b[a-2>>1]=32767-(s>>24)&65535}}c[e+464>>2]=p;c[e+468>>2]=o;c[e+36>>2]=j;c[e+80>>2]=l;c[e+124>>2]=h;return}function dK(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=e;e=a;a=d;d=c[e+40>>2]|0;g=c[e+28>>2]|0;h=c[e+36>>2]|0;i=c[e+72>>2]|0;j=c[e+80>>2]|0;k=c[e+116>>2]|0;l=c[e+124>>2]|0;while(1){m=f;f=m-1|0;if((m|0)==0){break}m=h>>14;n=g;g=n+4|0;h=h+((c[n>>2]|0)-(h>>d))|0;n=m+(j>>14)|0;o=m+(l>>14)|0;m=i;i=m+4|0;j=j+((c[m>>2]|0)-(j>>d))|0;m=k;k=m+4|0;l=l+((c[m>>2]|0)-(l>>d))|0;if(((n&65535)<<16>>16|0)!=(n|0)){n=32767-(n>>24)|0}b[a>>1]=n&65535;b[a+2>>1]=o&65535;a=a+4|0;if(((o&65535)<<16>>16|0)!=(o|0)){b[a-2>>1]=32767-(o>>24)&65535}}c[e+124>>2]=l;c[e+80>>2]=j;c[e+36>>2]=h;return}function dL(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=e;e=a;a=d;d=c[e+40>>2]|0;g=c[e+28>>2]|0;h=c[e+36>>2]|0;i=f>>1;while(1){if((i|0)==0){break}j=h>>14;k=g;g=k+4|0;h=h+((c[k>>2]|0)-(h>>d))|0;k=h>>14;l=g;g=l+4|0;h=h+((c[l>>2]|0)-(h>>d))|0;if(((j&65535)<<16>>16|0)!=(j|0)){j=32767-(j>>24)|0}c[a>>2]=j&65535|j<<16;if(((k&65535)<<16>>16|0)!=(k|0)){k=32767-(k>>24)|0}c[a+4>>2]=k&65535|k<<16;a=a+8|0;i=i-1|0}if((f&1|0)==0){m=h;n=e+20|0;o=n|0;p=o+16|0;c[p>>2]=m;return}f=h>>14;i=g;g=i+4|0;h=h+((c[i>>2]|0)-(h>>d))|0;b[a>>1]=f&65535;b[a+2>>1]=f&65535;if(((f&65535)<<16>>16|0)!=(f|0)){f=32767-(f>>24)|0;b[a>>1]=f&65535;b[a+2>>1]=f&65535}m=h;n=e+20|0;o=n|0;p=o+16|0;c[p>>2]=m;return}function dM(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;b=a;cU(b|0);c[b+20>>2]=e;c[b+24>>2]=(e<<1)-2;c[b+48>>2]=d;c[b+8>>2]=0;c[b+12>>2]=1;c[b+16>>2]=0;c[b+28>>2]=0;c[b+32>>2]=2;h[b+40>>3]=1.0;return}function dN(a){a=a|0;cW(a|0);return}function dO(a){a=a|0;var b=0;b=a;c[b+16>>2]=0;if((c1(b|0)|0)==0){return}c[b+8>>2]=dc(b|0,c[b+24>>2]|0)|0;a=c9(b|0)|0;sf(a|0,0,c[b+24>>2]<<1|0);return}function dP(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=c$(d|0,b+(c[d+24>>2]|0)|0)|0;if((a|0)!=0){e=a;f=e;return f|0}dO(d);e=0;f=e;return f|0}function dQ(a,b,d,e){a=a|0;b=+b;d=+d;e=+e;var f=0.0,g=0,i=0.0,j=0.0,k=0.0,l=0.0,m=0;f=d;d=e;g=a;h[g+40>>3]=b;b=0.0;e=2.0;i=0.0;c[g+12>>2]=-1;a=1;while(1){if((a|0)>32){break}i=i+ +h[g+40>>3];j=+N(i+.5);k=+O(+(i-j));if(k<e){c[g+12>>2]=a;b=j/+(c[g+12>>2]|0);e=k}a=a+1|0}c[g+28>>2]=0;c[g+32>>2]=~~+N(b)<<1;h[g+40>>3]=b;b=+aW(+b,+1.0);if(+h[g+40>>3]<1.0){l=1.0}else{l=1.0/+h[g+40>>3]}e=l;l=0.0;c[g+36>>2]=0;a=0;while(1){if((a|0)>=(c[g+12>>2]|0)){break}dR(f,~~(+(c[g+20>>2]|0)*e+1.0)&-2,l,e,32767.0*d*e,c[g+20>>2]|0,(c[g+48>>2]|0)+(($(a,c[g+20>>2]|0)|0)<<1)|0);l=l+b;m=g+36|0;c[m>>2]=(c[m>>2]|0)+(c[g+32>>2]|0);if(l>=.9999999){l=l-1.0;m=g+28|0;c[m>>2]=c[m>>2]|1<<a;m=g+36|0;c[m>>2]=(c[m>>2]|0)+1}a=a+1|0}dO(g);return+(+h[g+40>>3])}function dR(a,c,d,e,f,g,h){a=+a;c=c|0;d=+d;e=+e;f=+f;g=g|0;h=h|0;var i=0.0,j=0,k=0.0,l=0.0,m=0.0,n=0.0;i=a;a=f;j=g;g=h;f=.01227184630308513*e;e=512.0/+(c|0);k=+Q(+i,+256.0);a=a/512.0;l=(+(((j|0)/2|0)-1|0)+d)*(-0.0-f);while(1){c=j;j=c-1|0;if((c|0)==0){break}c=g;g=c+2|0;b[c>>1]=0;d=l*e;if(+O(+d)<3.141592653589793){m=i*+R(l);n=a*(1.0-m-k*+R(256.0*l)+k*i*+R(255.0*l))/(1.0-m-m+i*i)-a;b[g-2>>1]=~~(+R(d)*n+n)}l=l+f}return}function dS(a,b){a=a|0;b=b|0;var d=0,e=0;d=b;b=a;a=c[b+8>>2]|0;e=(a-(c9(b|0)|0)|0)/2|0;a=e-(c[b+20>>2]<<1)|0;if((d|0)>(a|0)){d=a}e=e-d|0;c[b+8>>2]=dc(b|0,e)|0;a=c9(b|0)|0;sh(a|0,dc(b|0,d)|0,e<<1|0);return d|0}function dT(){if((a[22984]|0)!=0){return 22528}if((aL(22984)|0)==0){return 22528}c[5632]=c[24];c[5633]=c[22];c[5634]=c[20];c[5635]=c[18];c[5636]=c[16];c[5637]=c[14];c[5638]=c[12];c[5639]=c[10];c[5640]=c[8];c[5641]=c[6];c[5642]=c[4];c[5643]=0;return 22528}function dU(a){a=a|0;var b=0,c=0;b=dV(a)|0;if((b|0)==1263747907|(b|0)==1263752024){c=3e3}else if((b|0)==1195528961){c=7624}else if((b|0)==1396789261){c=1e3}else if((b|0)==1449618720){c=136}else if((b|0)==1212502861){c=3760}else if((b|0)==1515733337){c=2568}else if((b|0)==1314080325){c=1680}else if((b|0)==1197034840){c=5168}else if((b|0)==1397638483){c=448}else if((b|0)==1313166157){c=2376}else{c=22048}return c|0}function dV(a){a=a|0;var b=0;b=a;return(d[b|0]|0)<<24|(d[b+1|0]|0)<<16|(d[b+2|0]|0)<<8|(d[b+3|0]|0)|0}function dW(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+8|0;d=b|0;e=a;a=aE(e|0,46)|0;if((a|0)!=0){e=a+1|0}dX(e,6,d|0);e=dT()|0;while(1){if((c[e>>2]|0)==0){f=822;break}if((a_(d|0,c[(c[e>>2]|0)+16>>2]|0)|0)==0){f=819;break}e=e+4|0}if((f|0)==819){g=c[e>>2]|0;h=g;i=b;return h|0}else if((f|0)==822){g=0;h=g;i=b;return h|0}return 0}function dX(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0;e=b;b=c;c=d;d=0;while(1){if((d|0)>=(b|0)){f=832;break}g=(aw(a[e+d|0]|0)|0)&255;a[c+d|0]=g;if(g<<24>>24==0){f=829;break}d=d+1|0}if((f|0)==832){a[c]=0;return}else if((f|0)==829){return}}function dY(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=a;a=b;b=d;d=e;if((f|0)!=0){g=838}else{if((a|0)!=0){g=839}else{g=838}}if((g|0)==838){if((b|0)!=0){}else{g=839}}if((g|0)==839){at(9912,9472,131,10560);return 0}c[b>>2]=0;g=0;if((a|0)>=4){g=dW(dU(f)|0)|0}if((g|0)==0){h=c[2]|0;i=h;return i|0}e=dZ(g,d)|0;if((e|0)==0){h=8920;i=h;return i|0}d=d_(e,f,a)|0;if((d|0)!=0){a=e;if((a|0)!=0){a3[c[(c[a>>2]|0)+4>>2]&511](a)}}else{c[b>>2]=e}h=d;i=h;return i|0}function dZ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=a;a=b;if((d|0)!=0){if((a|0)==-1){e=a2[c[d+12>>2]&63]()|0;f=e;return f|0}b=a2[c[d+8>>2]&63]()|0;if((b|0)!=0){if((c[d+20>>2]&1|0)!=0){g=bZ(512)|0;h=0;if((g|0)==0){i=0}else{h=1;h=g;dp(h,0);i=h}c[b+312>>2]=i;if((c[b+312>>2]|0)!=0){i=b;a4[c[(c[i>>2]|0)+36>>2]&63](i,c[b+312>>2]|0)}}if((c[d+20>>2]&1|0)!=0){if((c[b+312>>2]|0)!=0){j=875}}else{j=875}do{if((j|0)==875){if((fk(b,a)|0)!=0){break}e=b;f=e;return f|0}}while(0);a=b;if((a|0)!=0){a3[c[(c[a>>2]|0)+4>>2]&511](a)}}}e=0;f=e;return f|0}function d_(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;i=i+16|0;e=d|0;cz(e,b,c);c=ev(a,e)|0;cO(e);i=d;return c|0}function d$(a){a=a|0;return c[a+4>>2]|0}function d0(a){a=a|0;var b=0;b=a;a=c[b+16>>2]|0;c[b+16>>2]=0;return a|0}function d1(a){a=a|0;return d2(a)|0}function d2(a){a=a|0;return c[a+8>>2]|0}function d3(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b;c[e>>2]=0;b=d4(1936)|0;f=0;if((b|0)==0){g=0}else{f=1;g=b}b=g;if((b|0)==0){h=8920;i=h;return i|0}g=eB(a,b+128|0,d)|0;if((g|0)!=0){d5(b);h=g;i=h;return i|0}c[b>>2]=c[b+132>>2];c[b+4>>2]=c[b+136>>2];c[b+8>>2]=c[b+140>>2];c[b+16>>2]=-1;c[b+20>>2]=-1;c[b+24>>2]=-1;c[b+28>>2]=-1;c[b+32>>2]=-1;c[b+36>>2]=-1;c[b+40>>2]=-1;c[b+44>>2]=-1;c[b+48>>2]=-1;c[b+52>>2]=-1;c[b+56>>2]=-1;c[b+60>>2]=-1;c[b+92>>2]=22048;c[b+96>>2]=22048;c[b+100>>2]=22048;c[b+104>>2]=22048;c[b+108>>2]=22048;c[b+112>>2]=22048;c[b+116>>2]=22048;c[b+120>>2]=22048;c[b+124>>2]=22048;c[b+64>>2]=b+144;c[b+68>>2]=b+400;c[b+72>>2]=b+656;c[b+76>>2]=b+912;c[b+80>>2]=b+1168;c[b+84>>2]=b+1424;c[b+88>>2]=b+1680;c[b+12>>2]=c[b>>2];if((c[b+12>>2]|0)<=0){c[b+12>>2]=(c[b+4>>2]|0)+(c[b+8>>2]<<1);if((c[b+12>>2]|0)<=0){c[b+12>>2]=15e4}}c[e>>2]=b;h=0;i=h;return i|0}function d4(a){a=a|0;return r5(a)|0}function d5(a){a=a|0;var b=0;b=a;if((b|0)==0){return}d6(b);return}function d6(a){a=a|0;r6(a);return}function d7(a,b){a=a|0;b=b|0;return fr(a,b)|0}function d8(a,b,c){a=a|0;b=b|0;c=c|0;return fB(a,b,c)|0}function d9(a){a=a|0;return(ea(a)|0)&1|0}function ea(b){b=b|0;return a[b+273|0]&1|0}function eb(a,b){a=a|0;b=b|0;ec(a,(b|0)!=0);return}function ec(a,b){a=a|0;b=b|0;var d=0;d=a;a4[c[(c[d>>2]|0)+48>>2]&63](d,b&1);return}function ed(a){a=a|0;var b=0;b=a;ee(b+28|0);a3[c[(c[b>>2]|0)+32>>2]&511](b);c[b+8>>2]=c[b+12>>2];return}function ee(a){a=a|0;var b=0;b=a;c[b+16>>2]=0;eR(b|0);eS(b+8|0);return}function ef(a){a=a|0;var b=0;b=a;ed(b);c[b+8>>2]=0;c[b+12>>2]=0;cb(b+132|0);return}function eg(a){a=a|0;var b=0;b=a;c[b>>2]=15528;eh(b+28|0);ei(b+132|0);c[b+4>>2]=0;c[b+20>>2]=0;c[b+24>>2]=0;a3[c[(c[b>>2]|0)+8>>2]&511](b);ej();return}function eh(a){a=a|0;eM(a);return}function ei(a){a=a|0;eE(a);return}function ej(){var b=0,d=0;b=i;i=i+8|0;d=b|0;c[d>>2]=1;if((a[d]|0)!=0){i=b;return}at(9792,8944,62,11976);i=b;return}function ek(a){a=a|0;eD(a);return}function el(a){a=a|0;eH(a);return}function em(a){a=a|0;var b=0;b=a;en(b);bT(b);return}function en(a){a=a|0;var b=0;b=a;c[b>>2]=15528;if((c[b+24>>2]|0)!=0){a3[c[b+24>>2]&511](c[b+20>>2]|0)}ek(b+132|0);el(b+28|0);return}function eo(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e|0;g=b;b=a;if((g|0)!=(cd(b+132|0)|0)){}else{at(7008,4840,55,10968);return 0}cz(f,g,d);d=bb[c[(c[b>>2]|0)+12>>2]&127](b,f)|0;cO(f);i=e;return d|0}function ep(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=b;b=a;a=d;e=cc(b+132|0,a6[c[(c[a>>2]|0)+16>>2]&31](a)|0)|0;if((e|0)!=0){f=e;g=f;return g|0}e=d;d=c[(c[e>>2]|0)+12>>2]|0;a=cd(b+132|0)|0;h=eq(b+132|0)|0;i=a5[d&127](e,a,h)|0;if((i|0)!=0){f=i;g=f;return g|0}i=c[(c[b>>2]|0)+16>>2]|0;h=cd(b+132|0)|0;a=eq(b+132|0)|0;f=a5[i&127](b,h,a)|0;g=f;return g|0}function eq(a){a=a|0;return c[a+4>>2]|0}function er(a){a=a|0;var b=0;b=a;a3[c[(c[b>>2]|0)+8>>2]&511](b);return}function es(a){a=a|0;return}function et(a,b){a=a|0;b=b|0;var d=0,e=0;d=b;b=a;if((d2(b)|0)==0){eu(b,c[(d$(b)|0)+4>>2]|0)}if((d|0)!=0){a3[c[(c[b>>2]|0)+8>>2]&511](b);e=d;return e|0}else{a3[c[(c[b>>2]|0)+28>>2]&511](b);e=d;return e|0}return 0}function eu(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d+12>>2]=a;c[d+8>>2]=a;return}function ev(a,b){a=a|0;b=b|0;var d=0;d=a;a3[c[(c[d>>2]|0)+24>>2]&511](d);return et(d,bb[c[(c[d>>2]|0)+12>>2]&127](d,b)|0)|0}function ew(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=b;b=c;c=d;do{if((b|0)!=0){if((a[b]|0)==0){break}while(1){if((c|0)!=0){f=((a[b]|0)-1|0)>>>0<=31>>>0}else{f=0}if(!f){break}b=b+1|0;c=c-1|0}if((c|0)>255){c=255}d=0;while(1){if((d|0)<(c|0)){g=(a[b+d|0]|0)!=0}else{g=0}if(!g){break}d=d+1|0}while(1){if((d|0)!=0){h=(a[b+(d-1)|0]|0)>>>0<=32>>>0}else{h=0}if(!h){break}d=d-1|0}a[e+d|0]=0;i=e;j=b;k=d;sg(i|0,j|0,k)|0;do{if((a_(e|0,3544)|0)!=0){if((a_(e|0,2912)|0)==0){break}if((a_(e|0,2224)|0)==0){break}return}}while(0);a[e|0]=0;return}}while(0);return}function ex(a,b){a=a|0;b=b|0;ew(a,b,255);return}function ey(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=d;d=b;b=c[e>>2]|0;if(b>>>0>=(d2(d)|0)>>>0){f=1576;g=f;return g|0}b=c[e>>2]|0;do{if(b>>>0<(ez(d+28|0)|0)>>>0){h=eA(d+28|0,c[e>>2]|0)|0;c[e>>2]=0;if((c[h+16>>2]|0)>=0){c[e>>2]=c[h+16>>2];if((c[(c[d+4>>2]|0)+20>>2]&2|0)==0){i=e;c[i>>2]=(c[i>>2]|0)-(a[h+12|0]&1)}}if((c[e>>2]|0)<(c[d+12>>2]|0)){break}f=944;g=f;return g|0}}while(0);f=0;g=f;return g|0}function ez(a){a=a|0;return eG(a|0)|0}function eA(a,b){a=a|0;b=b|0;return eF(a|0,b)|0}function eB(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+8|0;g=f|0;h=d;d=e;e=b;c[h>>2]=d2(e)|0;c[h+4>>2]=-1;c[h+12>>2]=-1;c[h+8>>2]=-1;a[h+528|0]=0;a[h+272|0]=0;a[h+784|0]=0;a[h+1040|0]=0;a[h+1296|0]=0;a[h+1552|0]=0;a[h+16|0]=0;ex(h+16|0,c[(d$(e)|0)>>2]|0);c[g>>2]=d;b=ey(e,g)|0;if((b|0)!=0){j=b;k=j;i=f;return k|0}b=a5[c[(c[e>>2]|0)+20>>2]&127](e,h,c[g>>2]|0)|0;if((b|0)!=0){j=b;k=j;i=f;return k|0}if((ez(e+28|0)|0)!=0){b=eC(e+28|0)|0;ex(h+272|0,c[b>>2]|0);ex(h+784|0,c[b+8>>2]|0);ex(h+784|0,c[b+4>>2]|0);ex(h+1552|0,c[b+12>>2]|0);b=eA(e+28|0,d)|0;ex(h+528|0,c[b+8>>2]|0);if((c[b+20>>2]|0)>=0){c[h+4>>2]=(c[b+20>>2]|0)*1e3|0}if((c[b+24>>2]|0)>=0){c[h+8>>2]=(c[b+24>>2]|0)*1e3|0}if((c[b+28>>2]|0)>=0){c[h+12>>2]=(c[b+28>>2]|0)*1e3|0}}j=0;k=j;i=f;return k|0}function eC(a){a=a|0;return a+20|0}function eD(a){a=a|0;r6(c[a>>2]|0);return}function eE(a){a=a|0;var b=0;b=a;c[b>>2]=0;c[b+4>>2]=0;return}function eF(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if(d>>>0<=(c[b+4>>2]|0)>>>0){}else{at(104,10176,58,10616);return 0}return(c[b>>2]|0)+(d*40|0)|0}function eG(a){a=a|0;return c[a+4>>2]|0}function eH(a){a=a|0;var b=0;b=a;eI(b+8|0);eJ(b|0);return}function eI(a){a=a|0;eL(a);return}function eJ(a){a=a|0;eK(a);return}function eK(a){a=a|0;r6(c[a>>2]|0);return}function eL(a){a=a|0;r6(c[a>>2]|0);return}function eM(a){a=a|0;var b=0;b=a;eN(b|0);eO(b+8|0);return}function eN(a){a=a|0;eQ(a);return}function eO(a){a=a|0;eP(a);return}function eP(a){a=a|0;var b=0;b=a;c[b>>2]=0;c[b+4>>2]=0;return}function eQ(a){a=a|0;var b=0;b=a;c[b>>2]=0;c[b+4>>2]=0;return}function eR(a){a=a|0;var b=0;b=a;a=c[b>>2]|0;c[b>>2]=0;c[b+4>>2]=0;r6(a);return}function eS(a){a=a|0;var b=0;b=a;a=c[b>>2]|0;c[b>>2]=0;c[b+4>>2]=0;r6(a);return}function eT(a,b){a=a|0;b=b|0;c[a+16>>2]=b;return}function eU(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=b;b=a;a=r7(c[b>>2]|0,d)|0;do{if((a|0)==0){if((d|0)==0){break}e=2824;f=e;return f|0}}while(0);c[b>>2]=a;c[b+4>>2]=d;e=0;f=e;return f|0}function eV(a){a=a|0;var b=0,c=0;b=a;b=b-48|0;if(b>>>0<=9>>>0){c=b;return c|0}b=(b-17&223)+10|0;c=b;return c|0}function eW(a,b){a=a|0;b=b|0;var d=0;d=a;c[d>>2]=17136;c[d+16>>2]=b;c[d+12>>2]=0;c[d+8>>2]=0;c[d+4>>2]=1;return}function eX(a,b){a=a|0;b=b|0;return 0}function eY(a){a=a|0;var b=0,d=0,e=0;b=a;eW(b,2);c[b>>2]=16944;a=b+20|0;d=a+132|0;e=a;do{bu(e);e=e+44|0;}while((e|0)!=(d|0));c[b+152>>2]=b+20;c[b+156>>2]=b+64;c[b+160>>2]=b+108;return}function eZ(a){a=a|0;var b=0;b=a;e_(b);b_(b);return}function e_(a){a=a|0;var b=0,d=0;b=a;c[b>>2]=16944;a=b+20|0;d=a+132|0;do{d=d-44|0;bv(d);}while((d|0)!=(a|0));ck(b);return}function e$(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0;d=b;b=c;c=a;a=0;while(1){if((a|0)>=3){e=1155;break}f=by(c+20+(a*44|0)|0,d,b)|0;if((f|0)!=0){e=1151;break}a=a+1|0}if((e|0)==1151){g=f;h=g;return h|0}else if((e|0)==1155){e=dt(c+20|0)|0;g=bQ(c,e,du(c+20|0)|0)|0;h=g;return h|0}return 0}function e0(a,b){a=a|0;b=b|0;var c=0;c=b;b=a;a=0;while(1){if((a|0)>=3){break}bz(b+20+(a*44|0)|0,c);a=a+1|0}return}function e1(a,b){a=a|0;b=b|0;var c=0;c=b;b=a;a=0;while(1){if(a>>>0>=3>>>0){break}bA(b+20+(a*44|0)|0,c);a=a+1|0}return}function e2(a){a=a|0;var b=0;b=a;c[b+164>>2]=0;c[b+168>>2]=0;a=0;while(1){if((a|0)>=3){break}bw(b+20+(a*44|0)|0,1);a=a+1|0}return}function e3(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=b;b=a;c[b+164>>2]=0;a=0;while(1){if(a>>>0>=3>>>0){break}e=(dE(b+20+(a*44|0)|0)|0)<<a;f=b+164|0;c[f>>2]=c[f>>2]|e;bC(b+20+(a*44|0)|0,d);a=a+1|0}return}function e4(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=b;b=d;d=a;if((b&1|0)!=0){at(10360,10080,108,11616);return 0}else{}b=(b>>>0)/2|0;a=bx(d+20|0)|0;if((b|0)>(a|0)){b=a}if((b|0)==0){f=b;g=f<<1;return g|0}a=c[d+164>>2]|c[d+168>>2];if((a|0)<=1){e5(d,e,b);bG(d+20|0,b);bD(d+64|0,b);bD(d+108|0,b)}else{if((a&1|0)!=0){e6(d,e,b);bG(d+20|0,b);bG(d+64|0,b);bG(d+108|0,b)}else{e7(d,e,b);bD(d+20|0,b);bG(d+64|0,b);bG(d+108|0,b)}}if((bx(d+20|0)|0)==0){c[d+168>>2]=c[d+164>>2];c[d+164>>2]=0}f=b;g=f<<1;return g|0}function e5(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=e;e=a;a=d;d=c[e+40>>2]|0;g=c[e+28>>2]|0;h=c[e+36>>2]|0;while(1){if((f|0)==0){break}i=h>>14;if(((i&65535)<<16>>16|0)!=(i|0)){i=32767-(i>>24)|0}j=g;g=j+4|0;h=h+((c[j>>2]|0)-(h>>d))|0;b[a>>1]=i&65535;b[a+2>>1]=i&65535;a=a+4|0;f=f-1|0}c[e+36>>2]=h;return}function e6(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=e;e=a;a=d;d=c[e+84>>2]|0;g=c[e+72>>2]|0;h=c[e+80>>2]|0;i=c[e+116>>2]|0;j=c[e+124>>2]|0;k=c[e+28>>2]|0;l=c[e+36>>2]|0;while(1){if((f|0)==0){break}m=l>>14;n=m+(h>>14)|0;o=m+(j>>14)|0;if(((n&65535)<<16>>16|0)!=(n|0)){n=32767-(n>>24)|0}m=k;k=m+4|0;l=l+((c[m>>2]|0)-(l>>d))|0;if(((o&65535)<<16>>16|0)!=(o|0)){o=32767-(o>>24)|0}m=g;g=m+4|0;h=h+((c[m>>2]|0)-(h>>d))|0;m=i;i=m+4|0;j=j+((c[m>>2]|0)-(j>>d))|0;b[a>>1]=n&65535;b[a+2>>1]=o&65535;a=a+4|0;f=f-1|0}c[e+36>>2]=l;c[e+124>>2]=j;c[e+80>>2]=h;return}function e7(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=e;e=a;a=d;d=c[e+84>>2]|0;g=c[e+72>>2]|0;h=c[e+80>>2]|0;i=c[e+116>>2]|0;j=c[e+124>>2]|0;while(1){if((f|0)==0){break}k=h>>14;if(((k&65535)<<16>>16|0)!=(k|0)){k=32767-(k>>24)|0}l=j>>14;if(((l&65535)<<16>>16|0)!=(l|0)){l=32767-(l>>24)|0}m=g;g=m+4|0;h=h+((c[m>>2]|0)-(h>>d))|0;m=i;i=m+4|0;j=j+((c[m>>2]|0)-(j>>d))|0;b[a>>1]=k&65535;b[a+2>>1]=l&65535;a=a+4|0;f=f-1|0}c[e+124>>2]=j;c[e+80>>2]=h;return}function e8(a){a=a|0;ck(a);return}function e9(a){a=a|0;var b=0;b=a;e8(b);b_(b);return}function fa(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=a;a=b+152|0;c[e>>2]=c[a>>2];c[e+4>>2]=c[a+4>>2];c[e+8>>2]=c[a+8>>2];return}function fb(a){a=a|0;return(bx(a+20|0)|0)<<1|0}function fc(){fd(22576,-8.0,180.0);return}function fd(a,b,c){a=a|0;b=+b;c=+c;sf(a|0,0,80);h[a>>3]=b;h[a+8>>3]=c;return}function fe(b){b=b|0;var d=0;d=b;c[d+260>>2]=-1;c[d+264>>2]=0;c[d+268>>2]=0;a[d+272|0]=1;a[d+273|0]=1;c[d+276>>2]=1073741824;c[d+280>>2]=1;c[d+292>>2]=0;c[d+296>>2]=0;c[d+300>>2]=0;d0(d)|0;return}function ff(a){a=a|0;var b=0;b=a;c[b+232>>2]=0;fe(b);ef(b);return}function fg(b){b=b|0;var d=0;d=b;eg(d);c[d>>2]=14632;cU(d+304|0);c[d+312>>2]=0;c[d+256>>2]=0;c[d+236>>2]=0;h[d+240>>3]=1.0;h[d+248>>3]=1.0;c[d+224>>2]=2;c[d+284>>2]=3;a[d+288|0]=0;h[d+144>>3]=-1.0;h[d+152>>3]=60.0;fh(d,12136);ff(d);return}function fh(a,b){a=a|0;b=b|0;c[a+228>>2]=b;return}function fi(a){a=a|0;var b=0;b=a;fj(b);bT(b);return}function fj(a){a=a|0;var b=0;b=a;c[b>>2]=14632;a=c[b+312>>2]|0;if((a|0)!=0){a3[c[(c[a>>2]|0)+4>>2]&511](a)}cW(b+304|0);en(b);return}function fk(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=b;b=a;if((fl(b)|0)!=0){at(888,320,80,10832);return 0}else{}a=bb[c[(c[b>>2]|0)+40>>2]&127](b,d)|0;if((a|0)!=0){e=a;f=e;return f|0}a=c$(b+304|0,2048)|0;if((a|0)!=0){e=a;f=e;return f|0}c[b+256>>2]=d;e=0;f=e;return f|0}function fl(a){a=a|0;return c[a+256>>2]|0}function fm(a){a=a|0;var b=0;b=a;if((fl(b)|0)!=0){}else{at(10424,320,89,10792)}er(b);return}function fn(a,b){a=a|0;b=b|0;var d=0,e=0;d=b;b=a;a=b+144|0;e=d;sg(a|0,e|0,80)|0;a4[c[(c[b>>2]|0)+44>>2]&63](b,d);return}function fo(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if((fl(b)|0)!=0){}else{at(10424,320,111,10848)}c[b+236>>2]=d;a4[c[(c[b>>2]|0)+52>>2]&63](b,d);return}function fp(a,b){a=a|0;b=+b;var d=0.0,e=0;d=b;e=a;if((fl(e)|0)!=0){}else{at(10424,320,118,10760)}if(d<.02){d=.02}if(d>4.0){d=4.0}h[e+240>>3]=d;a1[c[(c[e>>2]|0)+56>>2]&31](e,d);return}function fq(a){a=a|0;var b=0;b=a;fp(b,+h[b+240>>3]);b8(b);return}function fr(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+8|0;f=e|0;g=d;d=b;fe(d);c[f>>2]=g;b=ey(d,f)|0;if((b|0)!=0){h=b;j=h;i=e;return j|0}c[d+260>>2]=g;g=bb[c[(c[d>>2]|0)+60>>2]&127](d,c[f>>2]|0)|0;if((g|0)!=0){h=g;j=h;i=e;return j|0}a[d+272|0]=0;a[d+273|0]=0;if(!(a[d+288|0]&1)){g=c[d+224>>2]<<1;f=$(g,fl(d)|0)|0;while(1){if((c[d+268>>2]|0)>=(f|0)){break}fs(d);if((c[d+300>>2]|a[d+272|0]&1|0)!=0){g=1307;break}}c[d+268>>2]=c[d+300>>2];c[d+264>>2]=0;c[d+292>>2]=0;c[d+296>>2]=0}if(ea(d)|0){k=d0(d)|0}else{k=0}h=k;j=h;i=e;return j|0}function fs(b){b=b|0;var d=0;d=b;if((c[d+300>>2]|0)!=0){at(8824,320,324,10808)}else{}do{if(!(a[d+272|0]&1)){fz(d,2048,c9(d+304|0)|0);b=fA(c9(d+304|0)|0,2048)|0;if((b|0)>=2048){break}c[d+292>>2]=(c[d+268>>2]|0)-b;c[d+300>>2]=2048;return}}while(0);b=d+296|0;c[b>>2]=(c[b>>2]|0)+2048;return}function ft(b,c){b=b|0;c=c|0;var d=0;d=c;c=b;if((d|0)==0){return}a[c+272|0]=1;eT(c,d);return}function fu(a){a=a|0;return c[a+260>>2]|0}function fv(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((c|0)<(a|0)){d=c}else{d=a}return d|0}function fw(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;e=d;d=b;do{if((e|0)>3e4){b=c[d+236>>2]|0;fo(d,-1);while(1){if((e|0)>15e3){f=a[d+272|0]&1^1}else{f=0}if(!f){g=1348;break}h=c[(c[d>>2]|0)+64>>2]|0;i=c9(d+304|0)|0;j=a5[h&127](d,2048,i)|0;if((j|0)!=0){break}e=e-2048|0}if((g|0)==1348){fo(d,b);break}k=j;l=k;return l|0}}while(0);while(1){if((e|0)!=0){m=a[d+272|0]&1^1}else{m=0}if(!m){g=1360;break}j=2048;if((j|0)>(e|0)){j=e}e=e-j|0;f=c[(c[d>>2]|0)+64>>2]|0;i=c9(d+304|0)|0;n=a5[f&127](d,j,i)|0;if((n|0)!=0){g=1357;break}}if((g|0)==1357){k=n;l=k;return l|0}else if((g|0)==1360){k=0;l=k;return l|0}return 0}function fx(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=e;e=f;f=d;d=0;while(1){if((d|0)>=(g|0)){break}h=fy(((c[f+264>>2]|0)+d-(c[f+276>>2]|0)|0)/512|0,c[f+280>>2]|0,16384)|0;if((h|0)<64){a[f+272|0]=1;a[f+273|0]=1}i=e+(d<<1)|0;j=fv(512,g-d|0)|0;while(1){if((j|0)==0){break}b[i>>1]=($(b[i>>1]|0,h)|0)>>14&65535;i=i+2|0;j=j-1|0}d=d+512|0}return}function fy(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=a;a=b;b=c;c=(d|0)/(a|0)|0;e=($(d-($(c,a)|0)|0,b)|0)/(a|0)|0;return b-e+(e>>1)>>c|0}function fz(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=d;d=e;e=b;b=e+268|0;c[b>>2]=(c[b>>2]|0)+f;do{if((c[e+260>>2]|0)>=0){if(a[e+272|0]&1){break}ft(e,a5[c[(c[e>>2]|0)+64>>2]&127](e,f,d)|0);return}}while(0);sf(d|0,0,f<<1|0);return}function fA(a,c){a=a|0;c=c|0;var d=0,e=0,f=0;d=a;a=c;c=b[d>>1]|0;b[d>>1]=16;e=d+(a<<1)|0;do{f=e-2|0;e=f;}while(((b[f>>1]|0)+8|0)>>>0<=16>>>0);b[d>>1]=c;return a-((e-d|0)/2|0)|0}function fB(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=d;d=e;e=b;if(a[e+273|0]&1){sf(d|0,0,f<<1|0);g=f;h=e+264|0;i=c[h>>2]|0;j=i+g|0;c[h>>2]=j;return 0}if((fu(e)|0)>=0){}else{at(9440,320,347,10824);return 0}if(((f|0)%2|0|0)==0){}else{at(8360,320,348,10824);return 0}if((c[e+268>>2]|0)>=(c[e+264>>2]|0)){}else{at(7784,320,350,10824);return 0}b=0;if((c[e+296>>2]|0)!=0){k=$(c[e+284>>2]|0,(c[e+264>>2]|0)+f-(c[e+292>>2]|0)|0)|0;l=k+(c[e+292>>2]|0)|0;while(1){if((c[e+268>>2]|0)<(l|0)){m=(c[e+300>>2]|a[e+272|0]&1|0)!=0^1}else{m=0}if(!m){break}fs(e)}b=fv(c[e+296>>2]|0,f)|0;sf(d|0,0,b<<1|0);m=e+296|0;c[m>>2]=(c[m>>2]|0)-b;m=(c[e+268>>2]|0)-(c[e+292>>2]|0)|0;if((m|0)>((fl(e)|0)*12|0|0)){a[e+272|0]=1;a[e+273|0]=1;c[e+296>>2]=0;c[e+300>>2]=0}}if((c[e+300>>2]|0)!=0){m=fv(c[e+300>>2]|0,f-b|0)|0;l=d+(b<<1)|0;k=c9(e+304|0)|0;n=k+(2048-(c[e+300>>2]|0)<<1)|0;k=m<<1;sg(l|0,n|0,k)|0;k=e+300|0;c[k>>2]=(c[k>>2]|0)-m;b=b+m|0}m=f-b|0;if((m|0)!=0){fz(e,m,d+(b<<1)|0);k=e+273|0;a[k]=(a[k]&1|a[e+272|0]&1|0)!=0|0;if(a[e+288|0]&1){if((c[e+264>>2]|0)>(c[e+276>>2]|0)){o=1410}}else{o=1410}if((o|0)==1410){o=fA(d+(b<<1)|0,m)|0;if((o|0)<(m|0)){c[e+292>>2]=(c[e+268>>2]|0)-o}if(((c[e+268>>2]|0)-(c[e+292>>2]|0)|0)>=2048){fs(e)}}}if((c[e+264>>2]|0)>(c[e+276>>2]|0)){fx(e,f,d)}g=f;h=e+264|0;i=c[h>>2]|0;j=i+g|0;c[h>>2]=j;return 0}function fC(a,b){a=a|0;b=b|0;return 0}function fD(a){a=a|0;er(a);return}function fE(a){a=a|0;es(a);return}function fF(a,b){a=a|0;b=b|0;return}function fG(a,b){a=a|0;b=b|0;return}function fH(a,b){a=a|0;b=b|0;return}function fI(a,b){a=a|0;b=+b;return}function fJ(a,b){a=a|0;b=b|0;return 7384}function fK(a,b,c){a=a|0;b=b|0;c=c|0;return 7384}function fL(a,b){a=a|0;b=b|0;return}function fM(a){a=a|0;fO(a);return}function fN(a){a=a|0;var b=0;b=a;fM(b);bT(b);return}function fO(a){a=a|0;fj(a);return}function fP(){fc();return}function fQ(b){b=b|0;var c=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;c=b;fR(c+472|0);b=8;while(1){e=b;b=e-1|0;if((e|0)==0){break}e=c+88+(b*48|0)|0;f=d[19544+b|0]|0;g=3;while(1){h=g-1|0;g=h;if((h|0)<0){break}h=f&1;i=(f>>1&1)-h|0;h=h*15|0;j=16;while(1){k=j-1|0;j=k;if((k|0)<0){break}k=e;e=k+1|0;a[k]=a[19496+h|0]|0;h=h+i|0}f=f>>2}}fS(c,0);fT(c,1.0);fU(c);return}function fR(a){a=a|0;f$(a);return}function fS(a,b){a=a|0;b=b|0;var c=0;c=b;b=a;f1(b,0,c);f1(b,1,c);f1(b,2,c);return}function fT(a,b){a=a|0;b=+b;f0(a+472|0,.000915032679738562*b);return}function fU(d){d=d|0;var e=0,f=0;e=d;c[e+48>>2]=0;c[e+68>>2]=0;c[e+72>>2]=1;d=e+48|0;do{d=d-16|0;c[d>>2]=16;c[d+4>>2]=0;b[d+8>>1]=0;b[d+10>>1]=0;}while((d|0)!=(e|0));d=16;while(1){f=d-1|0;d=f;if((f|0)<0){break}a[e+52+d|0]=0}a[e+59|0]=-1;fV(e,13,0);return}function fV(b,e,f){b=b|0;e=e|0;f=f|0;var g=0;g=e;e=f;f=b;if(g>>>0<16>>>0){}else{at(6976,9824,122,11528)}if((g|0)==13){if((e&8|0)==0){e=(e&4|0)!=0?15:9}c[f+80>>2]=f+88+((e-7|0)*48|0);c[f+84>>2]=-48;c[f+76>>2]=0}a[f+52+g|0]=e&255;e=g>>1;if((e|0)>=3){return}g=((a[f+52+((e<<1)+1)|0]&15)<<12)+((d[f+52+(e<<1)|0]|0)<<4)|0;if((g|0)==0){g=16}b=f+(e<<4)|0;e=b+4|0;f=(c[e>>2]|0)+(g-(c[b>>2]|0))|0;c[e>>2]=f;if((f|0)<0){c[b+4>>2]=0}c[b>>2]=g;return}function fW(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;g=f;f=e;if((g|0)>=(c[f+48>>2]|0)){}else{at(6160,9824,166,11496)}e=(a[f+58|0]&31)<<5;if((e|0)==0){e=32}h=c[f+68>>2]|0;i=c[f+72>>2]|0;j=(d[f+64|0]<<8)+(d[f+63|0]|0)<<5;if((j|0)==0){j=32}if((c[f+76>>2]|0)==0){c[f+76>>2]=j}k=0;while(1){if((k|0)>=3){break}l=f+(k<<4)|0;m=d[f+59|0]>>k;n=c[l+12>>2]|0;if((n|0)!=0){fX(n);o=0;p=(((fY(n)|0)+16384|0)>>>0)/32768|0;do{if((c[l>>2]|0)<=(p|0)){if((m&1|0)!=0){break}o=1;m=m|1}}while(0);p=c[f+48>>2]|0;q=g;r=d[f+52+(k+8)|0]|0;s=d[19496+(r&15)|0]>>o;t=c[f+84>>2]|0;if((r&16|0)!=0){s=d[(c[f+80>>2]|0)+t|0]>>o;do{if((a[f+65|0]&1|0)!=0){if((t|0)<-32){u=1496;break}if((s|0)==0){m=9}}else{u=1496}}while(0);if((u|0)==1496){u=0;q=p+(c[f+76>>2]|0)|0;if((q|0)>=(g|0)){q=g}}}else{if((s|0)==0){m=9}}r=c[l>>2]|0;v=p+(c[l+4>>2]|0)|0;if((m&1|0)!=0){w=(g-v+r-1|0)/(r|0)|0;v=v+($(w,r)|0)|0;x=l+10|0;b[x>>1]=(b[x>>1]^w&1)&65535}w=g;x=1;if((m&8|0)==0){w=p+h|0;x=i}while(1){y=0;if(((m|b[l+10>>1])&1&(m>>3|x)|0)!=0){y=s}z=y-(b[l+8>>1]|0)|0;if((z|0)!=0){b[l+8>>1]=y&65535;fZ(f+472|0,p,z,n)}if((w|0)<(q|0)){u=1517}else{if((v|0)<(q|0)){u=1517}}if((u|0)==1517){u=0;z=(y<<1)-s|0;y=(z|0)!=0|0;A=b[l+10>>1]|m&1;do{B=q;if((q|0)>(v|0)){B=v}if((A&y|0)!=0){while(1){if((w|0)>(B|0)){break}C=x+1|0;x=-(x&1)&73728^x>>>1;if((C&2|0)!=0){z=-z|0;fZ(f+472|0,w,z,n)}w=w+e|0}}else{C=B-w|0;if((C|0)>=0){w=w+(e+($((C|0)/(e|0)|0,e)|0))|0}}B=q;if((q|0)>(w|0)){B=w}if((x&y|0)!=0){while(1){if((v|0)>=(B|0)){break}z=-z|0;fZ(f+472|0,v,z,n);v=v+r|0}A=(-z|0)>>>31}else{while(1){if((v|0)>=(B|0)){break}v=v+r|0;A=A^1}}if((v|0)<(q|0)){D=1}else{D=(w|0)<(q|0)}}while(D);b[l+8>>1]=z+s>>1&65535;if((m&1|0)==0){b[l+10>>1]=A&65535}}if((q|0)>=(g|0)){break}y=t+1|0;t=y;if((y|0)>=0){t=t-32|0}s=d[(c[f+80>>2]|0)+t|0]>>o;p=q;q=q+j|0;if((q|0)>(g|0)){q=g}}c[l+4>>2]=v-g;if((m&8|0)==0){c[f+68>>2]=w-g;c[f+72>>2]=x}}k=k+1|0}k=g-(c[f+48>>2]|0)-(c[f+76>>2]|0)|0;if((k|0)>=0){D=(k+j|0)/(j|0)|0;e=f+84|0;c[e>>2]=(c[e>>2]|0)+D;if((c[f+84>>2]|0)>=0){c[f+84>>2]=(c[f+84>>2]&31)-32}k=k-($(D,j)|0)|0;if((-k|0)<=(j|0)){}else{at(4456,9824,388,11496)}}c[f+76>>2]=-k;if((c[f+76>>2]|0)>0){}else{at(3384,9824,391,11496)}if((c[f+84>>2]|0)<0){E=g;F=f+48|0;c[F>>2]=E;return}at(2688,9824,392,11496);E=g;F=f+48|0;c[F>>2]=E;return}function fX(a){a=a|0;c[a+40>>2]=1;return}function fY(a){a=a|0;return c[a+28>>2]|0}function fZ(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=e;e=$(b,c[f>>2]|0)|0;f_(a,e+(c[f+4>>2]|0)|0,d,f);return}function f_(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=d;d=e;e=f;f=a;if((g>>>16|0)<(c[e+12>>2]|0)){}else{at(2056,1424,342,10712)}d=$(d,c[f+8>>2]|0)|0;a=(c[e+8>>2]|0)+(g>>>16<<2)|0;e=g>>>10&63;g=f+168+(-e<<1)|0;h=b[g>>1]|0;i=$(h,d)|0;j=$(b[g+128>>1]|0,d)|0;k=j+(c[a+12>>2]|0)|0;h=b[g+256>>1]|0;c[a+8>>2]=i+(c[a+8>>2]|0);c[a+12>>2]=k;k=$(h,d)|0;i=$(b[g+384>>1]|0,d)|0;j=i+(c[a+20>>2]|0)|0;h=b[g+512>>1]|0;c[a+16>>2]=k+(c[a+16>>2]|0);c[a+20>>2]=j;j=$(h,d)|0;k=$(b[g+640>>1]|0,d)|0;i=k+(c[a+28>>2]|0)|0;g=f+40+(e<<1)|0;h=b[g+640>>1]|0;c[a+24>>2]=j+(c[a+24>>2]|0);c[a+28>>2]=i;i=$(h,d)|0;j=$(b[g+512>>1]|0,d)|0;e=j+(c[a+36>>2]|0)|0;h=b[g+384>>1]|0;c[a+32>>2]=i+(c[a+32>>2]|0);c[a+36>>2]=e;e=$(h,d)|0;i=$(b[g+256>>1]|0,d)|0;j=i+(c[a+44>>2]|0)|0;h=b[g+128>>1]|0;c[a+40>>2]=e+(c[a+40>>2]|0);c[a+44>>2]=j;j=$(h,d)|0;h=$(b[g>>1]|0,d)|0;d=h+(c[a+52>>2]|0)|0;c[a+48>>2]=j+(c[a+48>>2]|0);c[a+52>>2]=d;return}function f$(a){a=a|0;var b=0;b=a;bH(b|0,b+40|0,12);return}function f0(a,b){a=a|0;b=+b;bN(a|0,b*1.0);return}function f1(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;if(e>>>0<3>>>0){}else{at(856,248,86,11560)}c[a+(e<<4)+12>>2]=d;return}function f2(a,d,e){a=a|0;d=d|0;e=e|0;var f=0;f=a;a=d+88+(e*116|0)|0;if((c[a+64>>2]|0)!=3){return}c[a+56>>2]=0;c[a+68>>2]=c[f+134572+(b[f+15772+(c[a+68>>2]>>16<<1)>>1]<<2)>>2]&c[a+104>>2];c[a+104>>2]=-1;c[a+72>>2]=c[a+80>>2];c[a+76>>2]=268435456;c[a+64>>2]=0;return}function f3(a,d,e){a=a|0;d=d|0;e=e|0;var f=0;f=d+88+(e*116|0)|0;if((c[f+64>>2]|0)==3){return}if((c[f+68>>2]|0)<268435456){c[f+68>>2]=(b[a+15772+(c[f+68>>2]>>16<<1)>>1]<<16)+268435456}c[f+72>>2]=c[f+92>>2];c[f+76>>2]=536870912;c[f+64>>2]=3;return}function f4(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b;b=d;d=a;a=e&3;if((a|0)==3){f=1;g=f;return g|0}h=d+40+((a+((e&256|0)!=0?3:0)|0)*556|0)|0;a=h+88+((e>>2&3)*116|0)|0;switch(e&240|0){case 48:{e=b&15;c[a+4>>2]=e;if((e|0)!=0){e=a+4|0;c[e>>2]=c[e>>2]<<1}else{c[a+4>>2]=1}c[a>>2]=d+14524+((b>>4&7)<<7);c[h+148>>2]=-1;break};case 64:{c[a+8>>2]=b&127;f5();c[a+12>>2]=c[a+8>>2]<<5;break};case 80:{c[a+20>>2]=3-(b>>6);c[h+148>>2]=-1;e=b&31;b=e;if((e|0)!=0){c[a+40>>2]=d+13628+(b<<1<<2)}else{c[a+40>>2]=d+15612}c[a+80>>2]=c[(c[a+40>>2]|0)+(c[a+24>>2]<<2)>>2];if((c[a+64>>2]|0)==0){c[a+72>>2]=c[a+80>>2]}break};case 96:{e=b&128;c[a+112>>2]=e;if((e|0)!=0){c[a+108>>2]=c[h+36>>2]}else{c[a+108>>2]=31}h=b&31;b=h;if((h|0)!=0){c[a+44>>2]=d+14140+(b<<1<<2)}else{c[a+44>>2]=d+15612}c[a+84>>2]=c[(c[a+44>>2]|0)+(c[a+24>>2]<<2)>>2];if((c[a+64>>2]|0)==1){c[a+72>>2]=c[a+84>>2]}break};case 112:{h=b&31;b=h;if((h|0)!=0){c[a+48>>2]=d+14140+(b<<1<<2)}else{c[a+48>>2]=d+15612}c[a+88>>2]=c[(c[a+48>>2]|0)+(c[a+24>>2]<<2)>>2];do{if((c[a+64>>2]|0)==2){if((c[a+68>>2]|0)>=536870912){break}c[a+72>>2]=c[a+88>>2]}}while(0);break};case 128:{c[a+16>>2]=c[d+15548+(b>>4<<2)>>2];c[a+52>>2]=d+14140+(((b&15)<<2)+2<<2);c[a+92>>2]=c[(c[a+52>>2]|0)+(c[a+24>>2]<<2)>>2];do{if((c[a+64>>2]|0)==3){if((c[a+68>>2]|0)>=536870912){break}c[a+72>>2]=c[a+92>>2]}}while(0);break};case 144:{if((b&8|0)!=0){i=b&15}else{i=0}f6(a,i);break};default:{}}f=0;g=f;return g|0}function f5(){return}function f6(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d+32>>2]=0;c[d+36>>2]=2147483647;c[d+28>>2]=a;if((a&4|0)==0){return}c[d+32>>2]=4095;c[d+36>>2]=4095;return}function f7(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=b;b=e;e=a;a=f&3;if((a|0)==3){g=1;h=g;return h|0}i=e+40+((a+((f&256|0)!=0?3:0)|0)*556|0)|0;switch(f&252|0){case 160:{f5();c[i+40>>2]=(c[i+40>>2]&1792)+b;c[i+72>>2]=c[i+56>>2]<<2|(d[19512+(c[i+40>>2]>>7)|0]|0);c[i+148>>2]=-1;break};case 164:{f5();c[i+40>>2]=(c[i+40>>2]&255)+((b&7)<<8);c[i+56>>2]=(b&56)>>3;c[i+72>>2]=c[i+56>>2]<<2|(d[19512+(c[i+40>>2]>>7)|0]|0);c[i+148>>2]=-1;break};case 168:{if((f|0)<256){a=a+1|0;f5();c[e+1192+(a<<2)>>2]=(c[e+1192+(a<<2)>>2]&1792)+b;c[e+1224+(a<<2)>>2]=c[e+1208+(a<<2)>>2]<<2|(d[19512+(c[e+1192+(a<<2)>>2]>>7)|0]|0);c[e+1300>>2]=-1}break};case 172:{if((f|0)<256){a=a+1|0;f5();c[e+1192+(a<<2)>>2]=(c[e+1192+(a<<2)>>2]&255)+((b&7)<<8);c[e+1208+(a<<2)>>2]=(b&56)>>3;c[e+1224+(a<<2)>>2]=c[e+1208+(a<<2)>>2]<<2|(d[19512+(c[e+1192+(a<<2)>>2]>>7)|0]|0);c[e+1300>>2]=-1}break};case 176:{if((c[i+24>>2]|0)!=(b&7|0)){f5();c[i+24>>2]=b&7;c[i+192>>2]=0;c[i+308>>2]=0;c[i+424>>2]=0;c[i+540>>2]=0}c[i+28>>2]=9-(b>>3&7);break};case 180:{f5();c[i+16>>2]=-(b>>7&1);c[i+20>>2]=-(b>>6&1);c[i+36>>2]=d[21824+(b>>4&3)|0]|0;c[i+32>>2]=d[21816+(b&7)|0]|0;b=0;while(1){if((b|0)>=4){break}e=i+88+(b*116|0)|0;if((c[e+112>>2]|0)!=0){j=c[i+36>>2]|0}else{j=31}c[e+108>>2]=j;b=b+1|0}break};default:{}}g=0;h=g;return h|0}function f8(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=d;d=a;switch(b|0){case 34:{if((e&8|0)!=0){c[d+13624>>2]=c[d+15740+((e&7)<<2)>>2]}else{c[d+13620>>2]=0;c[d+13624>>2]=0}break};case 36:{c[d+8>>2]=c[d+8>>2]&3|e<<2;if((c[d+12>>2]|0)!=(1024-(c[d+8>>2]|0)<<12|0)){b=1024-(c[d+8>>2]|0)<<12;c[d+12>>2]=b;c[d+16>>2]=b}break};case 38:{c[d+20>>2]=e;if((c[d+24>>2]|0)!=(256-(c[d+20>>2]|0)<<16|0)){b=256-(c[d+20>>2]|0)<<16;c[d+24>>2]=b;c[d+28>>2]=b}break};case 40:{b=e&3;if((b|0)==3){f=1;g=f;return g|0}if((e&4|0)!=0){b=b+3|0}a=d+40+(b*556|0)|0;f5();if((e&16|0)!=0){f2(d,a,0)}else{f3(d,a,0)}if((e&32|0)!=0){f2(d,a,2)}else{f3(d,a,2)}if((e&64|0)!=0){f2(d,a,1)}else{f3(d,a,1)}if((e&128|0)!=0){f2(d,a,3)}else{f3(d,a,3)}break};case 39:{if(((e^c[d+32>>2])&64|0)!=0){f5();c[d+1300>>2]=-1}a=d+4|0;c[a>>2]=c[a>>2]&(~e>>4&e>>2);c[d+32>>2]=e;break};case 37:{c[d+8>>2]=c[d+8>>2]&1020|e&3;if((c[d+12>>2]|0)!=(1024-(c[d+8>>2]|0)<<12|0)){a=1024-(c[d+8>>2]|0)<<12;c[d+12>>2]=a;c[d+16>>2]=a}break};case 43:{if((c[d+36>>2]^e&128|0)!=0){f5()}c[d+36>>2]=e&128;break};default:{}}f=0;g=f;return g|0}function f9(a,e,f){a=a|0;e=+e;f=+f;var g=0.0,h=0,i=0,j=0,k=0;g=e;e=f;h=a;if(g!=0.0){}else{at(6792,9712,633,11792)}if(e>g){}else{at(6128,9712,634,11792)}f=e/g/144.0;if(+O(+(f-1.0))<1.0e-7){f=1.0}c[h>>2]=~~(f*4096.0);a=0;while(1){if((a|0)>=12288){break}if((a|0)>=3328){c[h+36268+(a<<2)>>2]=0;c[h+36268+(a+12288<<2)>>2]=0}else{e=268435455.0;e=e/+Q(+10.0,+(+(a|0)*.0234375/20.0));c[h+36268+(a<<2)>>2]=~~e;c[h+36268+(a+12288<<2)>>2]=-(c[h+36268+(a<<2)>>2]|0)}a=a+1|0}b[h+9524>>1]=3328;b[h+5428>>1]=3328;a=1;while(1){if((a|0)>1024){break}e=+S(6.283185307179586*+(a|0)/4096.0);e=+aF(+(1.0/e))*20.0;i=~~(e/.0234375);if((i|0)>3328){i=3328}j=i&65535;b[h+5428+(2048-a<<1)>>1]=j;b[h+5428+(a<<1)>>1]=j;j=i+12288&65535;b[h+5428+(4096-a<<1)>>1]=j;b[h+5428+(a+2048<<1)>>1]=j;a=a+1|0}a=0;while(1){if((a|0)>=1024){break}e=+S(6.283185307179586*+(a|0)/1024.0);e=e+1.0;e=e/2.0;e=e*503.4666666666667;b[h+32172+(a<<1)>>1]=~~e&65535;e=+S(6.283185307179586*+(a|0)/1024.0);e=e*511.0;b[h+34220+(a<<1)>>1]=~~e&65535;a=a+1|0}a=0;while(1){if((a|0)>=4096){break}e=+Q(+(+(4095-a|0)/4096.0),+8.0);e=e*4096.0;b[h+15772+(a<<1)>>1]=~~e&65535;e=+Q(+(+(a|0)/4096.0),+1.0);e=e*4096.0;b[h+15772+(a+4096<<1)>>1]=~~e&65535;a=a+1|0}a=0;while(1){if((a|0)>=8){break}b[h+15772+(a+8192<<1)>>1]=0;a=a+1|0}b[h+32156>>1]=4095;j=4095;a=0;while(1){if((a|0)>=4096){break}while(1){if((j|0)!=0){k=(b[h+15772+(j<<1)>>1]|0)<(a|0)}else{k=0}if(!k){break}j=j-1|0}c[h+134572+(a<<2)>>2]=j<<16;a=a+1|0}a=0;while(1){if((a|0)>=15){break}e=+(a*3|0|0);e=e/.0234375;c[h+15548+(a<<2)>>2]=(~~e<<16)+268435456;a=a+1|0}c[h+15608>>2]=536805376;a=0;while(1){if((a|0)>=2048){break}e=+(a|0)*f;e=e*4096.0;e=e/2.0;c[h+150956+(a<<2)>>2]=~~e;a=a+1|0}a=0;while(1){if((a|0)>=4){break}c[h+13628+(a<<2)>>2]=0;c[h+14140+(a<<2)>>2]=0;a=a+1|0}a=0;while(1){if((a|0)>=60){break}e=f;e=e*(+(a&3|0)*.25+1.0);e=e*+(1<<(a>>2)|0);e=e*268435456.0;c[h+13628+(a+4<<2)>>2]=~~(e/399128.0);c[h+14140+(a+4<<2)>>2]=~~(e/5514396.0);a=a+1|0}a=64;while(1){if((a|0)>=96){break}c[h+13628+(a<<2)>>2]=c[h+13880>>2];c[h+14140+(a<<2)>>2]=c[h+14392>>2];c[h+15612+(a-64<<2)>>2]=0;a=a+1|0}a=96;while(1){if((a|0)>=128){break}c[h+13628+(a<<2)>>2]=0;a=a+1|0}a=0;while(1){if((a|0)>=4){break}j=0;while(1){if((j|0)>=32){break}e=+((d[21880+((a<<5)+j)|0]|0)>>>0)*f*32.0;c[h+14524+(a<<7)+(j<<2)>>2]=~~e;c[h+14524+(a+4<<7)+(j<<2)>>2]=~~(-0.0-e);j=j+1|0}a=a+1|0}c[h+15740>>2]=~~(1068373114.88/g);c[h+15744>>2]=~~(1492501135.36/g);c[h+15748>>2]=~~(1615981445.12/g);c[h+15752>>2]=~~(1709933854.72/g);c[h+15756>>2]=~~(1846835937.28/g);c[h+15760>>2]=~~(2585033441.28/g);c[h+15764>>2]=~~(12911745433.6/g);c[h+15768>>2]=~~(19381039923.2/g);ga(h);return}function ga(a){a=a|0;var b=0,d=0,e=0;b=a;c[b+13620>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;c[b+16>>2]=0;c[b+20>>2]=0;c[b+24>>2]=0;c[b+28>>2]=0;c[b+36>>2]=0;c[b+4>>2]=0;a=0;while(1){if((a|0)>=6){break}d=b+40+(a*556|0)|0;c[d+16>>2]=-1;c[d+20>>2]=-1;c[d+24>>2]=0;c[d+28>>2]=31;c[d+32>>2]=0;c[d+36>>2]=0;e=0;while(1){if((e|0)>=4){break}c[d+(e<<2)>>2]=0;c[d+40+(e<<2)>>2]=0;c[d+56+(e<<2)>>2]=0;c[d+72+(e<<2)>>2]=0;c[d+88+(e*116|0)+56>>2]=0;c[d+88+(e*116|0)+60>>2]=0;c[d+88+(e*116|0)+68>>2]=536870912;c[d+88+(e*116|0)+72>>2]=0;c[d+88+(e*116|0)+76>>2]=0;c[d+88+(e*116|0)+64>>2]=3;c[d+88+(e*116|0)+104>>2]=0;e=e+1|0}a=a+1|0}a=0;while(1){if((a|0)>=256){break}c[b+3376+(a<<2)>>2]=-1;c[b+4400+(a<<2)>>2]=-1;a=a+1|0}a=182;while(1){if((a|0)<180){break}ge(b,a,192);gf(b,a,192);a=a-1|0}a=178;while(1){if((a|0)<34){break}ge(b,a,0);gf(b,a,0);a=a-1|0}ge(b,42,128);return}function gb(a,b,d){a=a|0;b=+b;d=+d;var e=0.0,f=0,g=0,h=0;e=b;b=d;f=a;do{if((c[f>>2]|0)==0){c[f>>2]=r5(159148)|0;if((c[f>>2]|0)!=0){c[(c[f>>2]|0)+5424>>2]=0;break}g=4408;h=g;return h|0}}while(0);sf(c[f>>2]|0,0,5424);f9(c[f>>2]|0,e,b);g=0;h=g;return h|0}function gc(a){a=a|0;r6(c[a>>2]|0);return}function gd(a){a=a|0;ga(c[a>>2]|0);return}function ge(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=b;b=d;d=a;if(b>>>0<=255>>>0){}else{at(3360,9712,850,11816)}if((e|0)<48){c[d+3376+(e<<2)>>2]=b;a=e;f=b;f8(d,a,f)|0;return}if((c[d+3376+(e<<2)>>2]|0)!=(b|0)){c[d+3376+(e<<2)>>2]=b;if((e|0)<160){f=e;a=b;f4(d,f,a)|0}else{a=e;e=b;f7(d,a,e)|0}}return}function gf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=b;b=d;d=a;if(b>>>0<=255>>>0){}else{at(3360,9712,870,11808)}if((e|0)<48){return}if((c[d+4400+(e<<2)>>2]|0)==(b|0)){return}c[d+4400+(e<<2)>>2]=b;if((e|0)<160){a=e+256|0;f=b;f4(d,a,f)|0}else{f=e+256|0;e=b;f7(d,f,e)|0}return}function gg(a,b,d){a=a|0;b=b|0;d=d|0;ge(c[a>>2]|0,b,d);return}function gh(a,b,d){a=a|0;b=b|0;d=d|0;gf(c[a>>2]|0,b,d);return}function gi(a,b){a=a|0;b=b|0;c[(c[a>>2]|0)+5424>>2]=b;return}function gj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;do{b=6;if((b|0)>(a|0)){b=a}a=a-b|0;e=$(b,c[d>>2]|0)|0;if((c[d+32>>2]&1|0)!=0){b=d+16|0;f=(c[b>>2]|0)-e|0;c[b>>2]=f;if((f|0)<=0){f=d+4|0;c[f>>2]=c[f>>2]|(c[d+32>>2]&4)>>2;f=d+16|0;c[f>>2]=(c[f>>2]|0)+(c[d+12>>2]|0);if((c[d+32>>2]&128|0)!=0){f2(d,d+1152|0,0);f2(d,d+1152|0,1);f2(d,d+1152|0,2);f2(d,d+1152|0,3)}}}if((c[d+32>>2]&2|0)!=0){f=d+28|0;b=(c[f>>2]|0)-e|0;c[f>>2]=b;if((b|0)<=0){b=d+4|0;c[b>>2]=c[b>>2]|(c[d+32>>2]&8)>>2;b=d+28|0;c[b>>2]=(c[b>>2]|0)+(c[d+24>>2]|0)}}}while((a|0)>0);return}function gk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=b;b=d;d=a;if((e|0)<=0){return}if((c[d+32>>2]&3|0)!=0){gj(d,e)}a=0;while(1){if((a|0)>=6){break}f=d+40+(a*556|0)|0;if((c[f+148>>2]|0)==-1){g=0;do{if((a|0)==2){if((c[d+32>>2]&64|0)==0){break}g=2}}while(0);h=0;while(1){if((h|0)>=4){break}i=f+88+(h*116|0)|0;j=c[f+72+(g<<2)>>2]>>c[i+20>>2];c[i+60>>2]=$(((c[d+150956+(c[f+40+(g<<2)>>2]<<2)>>2]|0)>>>((7-(c[f+56+(g<<2)>>2]|0)|0)>>>0))+(c[(c[i>>2]|0)+(c[f+72+(g<<2)>>2]<<2)>>2]|0)|0,c[i+4>>2]|0)|0;if((c[i+24>>2]|0)!=(j|0)){c[i+24>>2]=j;c[i+80>>2]=c[(c[i+40>>2]|0)+(j<<2)>>2];c[i+84>>2]=c[(c[i+44>>2]|0)+(j<<2)>>2];c[i+88>>2]=c[(c[i+48>>2]|0)+(j<<2)>>2];c[i+92>>2]=c[(c[i+52>>2]|0)+(j<<2)>>2];if((c[i+64>>2]|0)==0){c[i+72>>2]=c[i+80>>2]}else{if((c[i+64>>2]|0)==1){c[i+72>>2]=c[i+84>>2]}else{if((c[i+68>>2]|0)<536870912){if((c[i+64>>2]|0)==2){c[i+72>>2]=c[i+88>>2]}else{if((c[i+64>>2]|0)==3){c[i+72>>2]=c[i+92>>2]}}}}}}if((g|0)!=0){g=g^2^g>>1}h=h+1|0}}a=a+1|0}a=0;while(1){if((a|0)>=6){break}do{if((c[d+5424>>2]&1<<a|0)==0){if((a|0)==5){if((c[d+36>>2]|0)!=0){break}}bc[c[21784+(c[d+40+(a*556|0)+24>>2]<<2)>>2]&31](d+5428|0,d+40+(a*556|0)|0,b,e)}}while(0);a=a+1|0}a=$(c[d+13624>>2]|0,e)|0;e=d+13620|0;c[e>>2]=(c[e>>2]|0)+a;return}function gl(a,b,d){a=a|0;b=b|0;d=d|0;gk(c[a>>2]|0,b,d);return}function gm(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=a;a=d;d=e;e=f;f=c[a+4>>2]|0;h=c[a+144>>2]|0;i=c[a+376>>2]|0;j=c[a+260>>2]|0;k=c[a+492>>2]|0;l=c[g+8196>>2]|0;m=(c[g+8192>>2]|0)+l|0;if(((c[a+504>>2]|0)-536870912|0)==0){return}do{n=b[g+26744+((m>>18&1023)<<1)>>1]|0;o=g+10344|0;p=(b[o+(c[a+156>>2]>>16<<1)>>1]|0)+(c[a+100>>2]|0)|0;q=(b[o+(c[a+388>>2]>>16<<1)>>1]|0)+(c[a+332>>2]|0)|0;r=(b[o+(c[a+272>>2]>>16<<1)>>1]|0)+(c[a+216>>2]|0)|0;s=(b[o+(c[a+504>>2]>>16<<1)>>1]|0)+(c[a+448>>2]|0)|0;o=g+30840|0;t=c[a>>2]|0;u=h+(t+f>>c[a+28>>2])|0;f=t;t=c[o+((b[g+((u>>14&4095)<<1)>>1]|0)+((p^c[a+120>>2])+(n>>c[a+196>>2])&p-(c[a+124>>2]|0)>>31)<<2)>>2]|0;p=i+f|0;p=j+(c[o+((b[g+((p>>14&4095)<<1)>>1]|0)+((q^c[a+352>>2])+(n>>c[a+428>>2])&q-(c[a+356>>2]|0)>>31)<<2)>>2]|0)|0;p=k+(c[o+((b[g+((p>>14&4095)<<1)>>1]|0)+((r^c[a+236>>2])+(n>>c[a+312>>2])&r-(c[a+240>>2]|0)>>31)<<2)>>2]|0)|0;r=c[o+((b[g+((p>>14&4095)<<1)>>1]|0)+((s^c[a+468>>2])+(n>>c[a+544>>2])&s-(c[a+472>>2]|0)>>31)<<2)>>2]|0;r=r>>16;s=(($(b[g+28792+((m>>18&1023)<<1)>>1]|0,c[a+32>>2]|0)|0)>>10)+256|0;m=m+l|0;h=h+(($(c[a+148>>2]|0,s)|0)>>>8)|0;i=i+(($(c[a+380>>2]|0,s)|0)>>>8)|0;j=j+(($(c[a+264>>2]|0,s)|0)>>>8)|0;k=k+(($(c[a+496>>2]|0,s)|0)>>>8)|0;s=(b[d>>1]|0)+(r&c[a+16>>2])|0;n=(b[d+2>>1]|0)+(r&c[a+20>>2])|0;gu(a+88|0);gu(a+204|0);gu(a+320|0);gu(a+436|0);c[a>>2]=t;b[d>>1]=s&65535;b[d+2>>1]=n&65535;d=d+4|0;n=e-1|0;e=n;}while((n|0)!=0);c[a+4>>2]=f;c[a+144>>2]=h;c[a+376>>2]=i;c[a+260>>2]=j;c[a+492>>2]=k;return}function gn(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=a;a=d;d=e;e=f;f=c[a+4>>2]|0;h=c[a+144>>2]|0;i=c[a+376>>2]|0;j=c[a+260>>2]|0;k=c[a+492>>2]|0;l=c[g+8196>>2]|0;m=(c[g+8192>>2]|0)+l|0;if(((c[a+504>>2]|0)-536870912|0)==0){return}do{n=b[g+26744+((m>>18&1023)<<1)>>1]|0;o=g+10344|0;p=(b[o+(c[a+156>>2]>>16<<1)>>1]|0)+(c[a+100>>2]|0)|0;q=(b[o+(c[a+388>>2]>>16<<1)>>1]|0)+(c[a+332>>2]|0)|0;r=(b[o+(c[a+272>>2]>>16<<1)>>1]|0)+(c[a+216>>2]|0)|0;s=(b[o+(c[a+504>>2]>>16<<1)>>1]|0)+(c[a+448>>2]|0)|0;o=g+30840|0;t=c[a>>2]|0;u=h+(t+f>>c[a+28>>2])|0;f=t;t=c[o+((b[g+((u>>14&4095)<<1)>>1]|0)+((p^c[a+120>>2])+(n>>c[a+196>>2])&p-(c[a+124>>2]|0)>>31)<<2)>>2]|0;p=j+f+(c[o+((b[g+((i>>14&4095)<<1)>>1]|0)+((q^c[a+352>>2])+(n>>c[a+428>>2])&q-(c[a+356>>2]|0)>>31)<<2)>>2]|0)|0;p=k+(c[o+((b[g+((p>>14&4095)<<1)>>1]|0)+((r^c[a+236>>2])+(n>>c[a+312>>2])&r-(c[a+240>>2]|0)>>31)<<2)>>2]|0)|0;r=c[o+((b[g+((p>>14&4095)<<1)>>1]|0)+((s^c[a+468>>2])+(n>>c[a+544>>2])&s-(c[a+472>>2]|0)>>31)<<2)>>2]|0;r=r>>16;s=(($(b[g+28792+((m>>18&1023)<<1)>>1]|0,c[a+32>>2]|0)|0)>>10)+256|0;m=m+l|0;h=h+(($(c[a+148>>2]|0,s)|0)>>>8)|0;i=i+(($(c[a+380>>2]|0,s)|0)>>>8)|0;j=j+(($(c[a+264>>2]|0,s)|0)>>>8)|0;k=k+(($(c[a+496>>2]|0,s)|0)>>>8)|0;s=(b[d>>1]|0)+(r&c[a+16>>2])|0;n=(b[d+2>>1]|0)+(r&c[a+20>>2])|0;gu(a+88|0);gu(a+204|0);gu(a+320|0);gu(a+436|0);c[a>>2]=t;b[d>>1]=s&65535;b[d+2>>1]=n&65535;d=d+4|0;n=e-1|0;e=n;}while((n|0)!=0);c[a+4>>2]=f;c[a+144>>2]=h;c[a+376>>2]=i;c[a+260>>2]=j;c[a+492>>2]=k;return}function go(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=a;a=d;d=e;e=f;f=c[a+4>>2]|0;h=c[a+144>>2]|0;i=c[a+376>>2]|0;j=c[a+260>>2]|0;k=c[a+492>>2]|0;l=c[g+8196>>2]|0;m=(c[g+8192>>2]|0)+l|0;if(((c[a+504>>2]|0)-536870912|0)==0){return}do{n=b[g+26744+((m>>18&1023)<<1)>>1]|0;o=g+10344|0;p=(b[o+(c[a+156>>2]>>16<<1)>>1]|0)+(c[a+100>>2]|0)|0;q=(b[o+(c[a+388>>2]>>16<<1)>>1]|0)+(c[a+332>>2]|0)|0;r=(b[o+(c[a+272>>2]>>16<<1)>>1]|0)+(c[a+216>>2]|0)|0;s=(b[o+(c[a+504>>2]>>16<<1)>>1]|0)+(c[a+448>>2]|0)|0;o=g+30840|0;t=c[a>>2]|0;u=h+(t+f>>c[a+28>>2])|0;f=t;t=c[o+((b[g+((u>>14&4095)<<1)>>1]|0)+((p^c[a+120>>2])+(n>>c[a+196>>2])&p-(c[a+124>>2]|0)>>31)<<2)>>2]|0;p=j+(c[o+((b[g+((i>>14&4095)<<1)>>1]|0)+((q^c[a+352>>2])+(n>>c[a+428>>2])&q-(c[a+356>>2]|0)>>31)<<2)>>2]|0)|0;p=k+f+(c[o+((b[g+((p>>14&4095)<<1)>>1]|0)+((r^c[a+236>>2])+(n>>c[a+312>>2])&r-(c[a+240>>2]|0)>>31)<<2)>>2]|0)|0;r=c[o+((b[g+((p>>14&4095)<<1)>>1]|0)+((s^c[a+468>>2])+(n>>c[a+544>>2])&s-(c[a+472>>2]|0)>>31)<<2)>>2]|0;r=r>>16;s=(($(b[g+28792+((m>>18&1023)<<1)>>1]|0,c[a+32>>2]|0)|0)>>10)+256|0;m=m+l|0;h=h+(($(c[a+148>>2]|0,s)|0)>>>8)|0;i=i+(($(c[a+380>>2]|0,s)|0)>>>8)|0;j=j+(($(c[a+264>>2]|0,s)|0)>>>8)|0;k=k+(($(c[a+496>>2]|0,s)|0)>>>8)|0;s=(b[d>>1]|0)+(r&c[a+16>>2])|0;n=(b[d+2>>1]|0)+(r&c[a+20>>2])|0;gu(a+88|0);gu(a+204|0);gu(a+320|0);gu(a+436|0);c[a>>2]=t;b[d>>1]=s&65535;b[d+2>>1]=n&65535;d=d+4|0;n=e-1|0;e=n;}while((n|0)!=0);c[a+4>>2]=f;c[a+144>>2]=h;c[a+376>>2]=i;c[a+260>>2]=j;c[a+492>>2]=k;return}function gp(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=a;a=d;d=e;e=f;f=c[a+4>>2]|0;h=c[a+144>>2]|0;i=c[a+376>>2]|0;j=c[a+260>>2]|0;k=c[a+492>>2]|0;l=c[g+8196>>2]|0;m=(c[g+8192>>2]|0)+l|0;if(((c[a+504>>2]|0)-536870912|0)==0){return}do{n=b[g+26744+((m>>18&1023)<<1)>>1]|0;o=g+10344|0;p=(b[o+(c[a+156>>2]>>16<<1)>>1]|0)+(c[a+100>>2]|0)|0;q=(b[o+(c[a+388>>2]>>16<<1)>>1]|0)+(c[a+332>>2]|0)|0;r=(b[o+(c[a+272>>2]>>16<<1)>>1]|0)+(c[a+216>>2]|0)|0;s=(b[o+(c[a+504>>2]>>16<<1)>>1]|0)+(c[a+448>>2]|0)|0;o=g+30840|0;t=c[a>>2]|0;u=h+(t+f>>c[a+28>>2])|0;f=t;t=c[o+((b[g+((u>>14&4095)<<1)>>1]|0)+((p^c[a+120>>2])+(n>>c[a+196>>2])&p-(c[a+124>>2]|0)>>31)<<2)>>2]|0;p=i+f|0;p=k+(c[o+((b[g+((p>>14&4095)<<1)>>1]|0)+((q^c[a+352>>2])+(n>>c[a+428>>2])&q-(c[a+356>>2]|0)>>31)<<2)>>2]|0)+(c[o+((b[g+((j>>14&4095)<<1)>>1]|0)+((r^c[a+236>>2])+(n>>c[a+312>>2])&r-(c[a+240>>2]|0)>>31)<<2)>>2]|0)|0;r=c[o+((b[g+((p>>14&4095)<<1)>>1]|0)+((s^c[a+468>>2])+(n>>c[a+544>>2])&s-(c[a+472>>2]|0)>>31)<<2)>>2]|0;r=r>>16;s=(($(b[g+28792+((m>>18&1023)<<1)>>1]|0,c[a+32>>2]|0)|0)>>10)+256|0;m=m+l|0;h=h+(($(c[a+148>>2]|0,s)|0)>>>8)|0;i=i+(($(c[a+380>>2]|0,s)|0)>>>8)|0;j=j+(($(c[a+264>>2]|0,s)|0)>>>8)|0;k=k+(($(c[a+496>>2]|0,s)|0)>>>8)|0;s=(b[d>>1]|0)+(r&c[a+16>>2])|0;n=(b[d+2>>1]|0)+(r&c[a+20>>2])|0;gu(a+88|0);gu(a+204|0);gu(a+320|0);gu(a+436|0);c[a>>2]=t;b[d>>1]=s&65535;b[d+2>>1]=n&65535;d=d+4|0;n=e-1|0;e=n;}while((n|0)!=0);c[a+4>>2]=f;c[a+144>>2]=h;c[a+376>>2]=i;c[a+260>>2]=j;c[a+492>>2]=k;return}function gq(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=a;a=d;d=e;e=f;f=(c[a+504>>2]|0)-536870912|0;f=f|(c[a+388>>2]|0)-536870912;h=c[a+4>>2]|0;i=c[a+144>>2]|0;j=c[a+376>>2]|0;k=c[a+260>>2]|0;l=c[a+492>>2]|0;m=c[g+8196>>2]|0;n=(c[g+8192>>2]|0)+m|0;if((f|0)==0){return}do{f=b[g+26744+((n>>18&1023)<<1)>>1]|0;o=g+10344|0;p=(b[o+(c[a+156>>2]>>16<<1)>>1]|0)+(c[a+100>>2]|0)|0;q=(b[o+(c[a+388>>2]>>16<<1)>>1]|0)+(c[a+332>>2]|0)|0;r=(b[o+(c[a+272>>2]>>16<<1)>>1]|0)+(c[a+216>>2]|0)|0;s=(b[o+(c[a+504>>2]>>16<<1)>>1]|0)+(c[a+448>>2]|0)|0;o=g+30840|0;t=c[a>>2]|0;u=i+(t+h>>c[a+28>>2])|0;h=t;t=c[o+((b[g+((u>>14&4095)<<1)>>1]|0)+((p^c[a+120>>2])+(f>>c[a+196>>2])&p-(c[a+124>>2]|0)>>31)<<2)>>2]|0;p=(c[o+((b[g+((l+(c[o+((b[g+((k>>14&4095)<<1)>>1]|0)+((r^c[a+236>>2])+(f>>c[a+312>>2])&r-(c[a+240>>2]|0)>>31)<<2)>>2]|0)>>14&4095)<<1)>>1]|0)+((s^c[a+468>>2])+(f>>c[a+544>>2])&s-(c[a+472>>2]|0)>>31)<<2)>>2]|0)+(c[o+((b[g+((j+h>>14&4095)<<1)>>1]|0)+((q^c[a+352>>2])+(f>>c[a+428>>2])&q-(c[a+356>>2]|0)>>31)<<2)>>2]|0)|0;p=p>>16;q=(($(b[g+28792+((n>>18&1023)<<1)>>1]|0,c[a+32>>2]|0)|0)>>10)+256|0;n=n+m|0;i=i+(($(c[a+148>>2]|0,q)|0)>>>8)|0;j=j+(($(c[a+380>>2]|0,q)|0)>>>8)|0;k=k+(($(c[a+264>>2]|0,q)|0)>>>8)|0;l=l+(($(c[a+496>>2]|0,q)|0)>>>8)|0;q=(b[d>>1]|0)+(p&c[a+16>>2])|0;f=(b[d+2>>1]|0)+(p&c[a+20>>2])|0;gu(a+88|0);gu(a+204|0);gu(a+320|0);gu(a+436|0);c[a>>2]=t;b[d>>1]=q&65535;b[d+2>>1]=f&65535;d=d+4|0;f=e-1|0;e=f;}while((f|0)!=0);c[a+4>>2]=h;c[a+144>>2]=i;c[a+376>>2]=j;c[a+260>>2]=k;c[a+492>>2]=l;return}function gr(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=a;a=d;d=e;e=f;f=(c[a+504>>2]|0)-536870912|0;f=f|(c[a+272>>2]|0)-536870912;f=f|(c[a+388>>2]|0)-536870912;h=c[a+4>>2]|0;i=c[a+144>>2]|0;j=c[a+376>>2]|0;k=c[a+260>>2]|0;l=c[a+492>>2]|0;m=c[g+8196>>2]|0;n=(c[g+8192>>2]|0)+m|0;if((f|0)==0){return}do{f=b[g+26744+((n>>18&1023)<<1)>>1]|0;o=g+10344|0;p=(b[o+(c[a+156>>2]>>16<<1)>>1]|0)+(c[a+100>>2]|0)|0;q=(b[o+(c[a+388>>2]>>16<<1)>>1]|0)+(c[a+332>>2]|0)|0;r=(b[o+(c[a+272>>2]>>16<<1)>>1]|0)+(c[a+216>>2]|0)|0;s=(b[o+(c[a+504>>2]>>16<<1)>>1]|0)+(c[a+448>>2]|0)|0;o=g+30840|0;t=c[a>>2]|0;u=i+(t+h>>c[a+28>>2])|0;h=t;t=c[o+((b[g+((u>>14&4095)<<1)>>1]|0)+((p^c[a+120>>2])+(f>>c[a+196>>2])&p-(c[a+124>>2]|0)>>31)<<2)>>2]|0;p=h;u=(c[o+((b[g+((l+p>>14&4095)<<1)>>1]|0)+((s^c[a+468>>2])+(f>>c[a+544>>2])&s-(c[a+472>>2]|0)>>31)<<2)>>2]|0)+(c[o+((b[g+((j+p>>14&4095)<<1)>>1]|0)+((q^c[a+352>>2])+(f>>c[a+428>>2])&q-(c[a+356>>2]|0)>>31)<<2)>>2]|0)+(c[o+((b[g+((k+p>>14&4095)<<1)>>1]|0)+((r^c[a+236>>2])+(f>>c[a+312>>2])&r-(c[a+240>>2]|0)>>31)<<2)>>2]|0)|0;u=u>>16;r=(($(b[g+28792+((n>>18&1023)<<1)>>1]|0,c[a+32>>2]|0)|0)>>10)+256|0;n=n+m|0;i=i+(($(c[a+148>>2]|0,r)|0)>>>8)|0;j=j+(($(c[a+380>>2]|0,r)|0)>>>8)|0;k=k+(($(c[a+264>>2]|0,r)|0)>>>8)|0;l=l+(($(c[a+496>>2]|0,r)|0)>>>8)|0;r=(b[d>>1]|0)+(u&c[a+16>>2])|0;f=(b[d+2>>1]|0)+(u&c[a+20>>2])|0;gu(a+88|0);gu(a+204|0);gu(a+320|0);gu(a+436|0);c[a>>2]=t;b[d>>1]=r&65535;b[d+2>>1]=f&65535;d=d+4|0;f=e-1|0;e=f;}while((f|0)!=0);c[a+4>>2]=h;c[a+144>>2]=i;c[a+376>>2]=j;c[a+260>>2]=k;c[a+492>>2]=l;return}function gs(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=a;a=d;d=e;e=f;f=(c[a+504>>2]|0)-536870912|0;f=f|(c[a+272>>2]|0)-536870912;f=f|(c[a+388>>2]|0)-536870912;h=c[a+4>>2]|0;i=c[a+144>>2]|0;j=c[a+376>>2]|0;k=c[a+260>>2]|0;l=c[a+492>>2]|0;m=c[g+8196>>2]|0;n=(c[g+8192>>2]|0)+m|0;if((f|0)==0){return}do{f=b[g+26744+((n>>18&1023)<<1)>>1]|0;o=g+10344|0;p=(b[o+(c[a+156>>2]>>16<<1)>>1]|0)+(c[a+100>>2]|0)|0;q=(b[o+(c[a+388>>2]>>16<<1)>>1]|0)+(c[a+332>>2]|0)|0;r=(b[o+(c[a+272>>2]>>16<<1)>>1]|0)+(c[a+216>>2]|0)|0;s=(b[o+(c[a+504>>2]>>16<<1)>>1]|0)+(c[a+448>>2]|0)|0;o=g+30840|0;t=c[a>>2]|0;u=i+(t+h>>c[a+28>>2])|0;h=t;t=c[o+((b[g+((u>>14&4095)<<1)>>1]|0)+((p^c[a+120>>2])+(f>>c[a+196>>2])&p-(c[a+124>>2]|0)>>31)<<2)>>2]|0;p=(c[o+((b[g+((l>>14&4095)<<1)>>1]|0)+((s^c[a+468>>2])+(f>>c[a+544>>2])&s-(c[a+472>>2]|0)>>31)<<2)>>2]|0)+(c[o+((b[g+((j+h>>14&4095)<<1)>>1]|0)+((q^c[a+352>>2])+(f>>c[a+428>>2])&q-(c[a+356>>2]|0)>>31)<<2)>>2]|0)+(c[o+((b[g+((k>>14&4095)<<1)>>1]|0)+((r^c[a+236>>2])+(f>>c[a+312>>2])&r-(c[a+240>>2]|0)>>31)<<2)>>2]|0)|0;p=p>>16;r=(($(b[g+28792+((n>>18&1023)<<1)>>1]|0,c[a+32>>2]|0)|0)>>10)+256|0;n=n+m|0;i=i+(($(c[a+148>>2]|0,r)|0)>>>8)|0;j=j+(($(c[a+380>>2]|0,r)|0)>>>8)|0;k=k+(($(c[a+264>>2]|0,r)|0)>>>8)|0;l=l+(($(c[a+496>>2]|0,r)|0)>>>8)|0;r=(b[d>>1]|0)+(p&c[a+16>>2])|0;f=(b[d+2>>1]|0)+(p&c[a+20>>2])|0;gu(a+88|0);gu(a+204|0);gu(a+320|0);gu(a+436|0);c[a>>2]=t;b[d>>1]=r&65535;b[d+2>>1]=f&65535;d=d+4|0;f=e-1|0;e=f;}while((f|0)!=0);c[a+4>>2]=h;c[a+144>>2]=i;c[a+376>>2]=j;c[a+260>>2]=k;c[a+492>>2]=l;return}function gt(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=a;a=d;d=e;e=f;f=(c[a+504>>2]|0)-536870912|0;f=f|(c[a+156>>2]|0)-536870912;f=f|(c[a+272>>2]|0)-536870912;f=f|(c[a+388>>2]|0)-536870912;h=c[a+4>>2]|0;i=c[a+144>>2]|0;j=c[a+376>>2]|0;k=c[a+260>>2]|0;l=c[a+492>>2]|0;m=c[g+8196>>2]|0;n=(c[g+8192>>2]|0)+m|0;if((f|0)==0){return}do{f=b[g+26744+((n>>18&1023)<<1)>>1]|0;o=g+10344|0;p=(b[o+(c[a+156>>2]>>16<<1)>>1]|0)+(c[a+100>>2]|0)|0;q=(b[o+(c[a+388>>2]>>16<<1)>>1]|0)+(c[a+332>>2]|0)|0;r=(b[o+(c[a+272>>2]>>16<<1)>>1]|0)+(c[a+216>>2]|0)|0;s=(b[o+(c[a+504>>2]>>16<<1)>>1]|0)+(c[a+448>>2]|0)|0;o=g+30840|0;t=c[a>>2]|0;u=i+(t+h>>c[a+28>>2])|0;h=t;t=c[o+((b[g+((u>>14&4095)<<1)>>1]|0)+((p^c[a+120>>2])+(f>>c[a+196>>2])&p-(c[a+124>>2]|0)>>31)<<2)>>2]|0;p=(c[o+((b[g+((l>>14&4095)<<1)>>1]|0)+((s^c[a+468>>2])+(f>>c[a+544>>2])&s-(c[a+472>>2]|0)>>31)<<2)>>2]|0)+(c[o+((b[g+((j>>14&4095)<<1)>>1]|0)+((q^c[a+352>>2])+(f>>c[a+428>>2])&q-(c[a+356>>2]|0)>>31)<<2)>>2]|0)+(c[o+((b[g+((k>>14&4095)<<1)>>1]|0)+((r^c[a+236>>2])+(f>>c[a+312>>2])&r-(c[a+240>>2]|0)>>31)<<2)>>2]|0)+h|0;p=p>>16;r=(($(b[g+28792+((n>>18&1023)<<1)>>1]|0,c[a+32>>2]|0)|0)>>10)+256|0;n=n+m|0;i=i+(($(c[a+148>>2]|0,r)|0)>>>8)|0;j=j+(($(c[a+380>>2]|0,r)|0)>>>8)|0;k=k+(($(c[a+264>>2]|0,r)|0)>>>8)|0;l=l+(($(c[a+496>>2]|0,r)|0)>>>8)|0;r=(b[d>>1]|0)+(p&c[a+16>>2])|0;f=(b[d+2>>1]|0)+(p&c[a+20>>2])|0;gu(a+88|0);gu(a+204|0);gu(a+320|0);gu(a+436|0);c[a>>2]=t;b[d>>1]=r&65535;b[d+2>>1]=f&65535;d=d+4|0;f=e-1|0;e=f;}while((f|0)!=0);c[a+4>>2]=h;c[a+144>>2]=i;c[a+376>>2]=j;c[a+260>>2]=k;c[a+492>>2]=l;return}function gu(a){a=a|0;var b=0,d=0,e=0;b=a;a=c[b+76>>2]|0;d=b+68|0;e=(c[d>>2]|0)+(c[b+72>>2]|0)|0;c[d>>2]=e;if((e|0)<(a|0)){return}gv(b);return}function gv(a){a=a|0;var b=0,d=0;b=a;a=c[b+64>>2]|0;if((a|0)==1){c[b+68>>2]=c[b+16>>2];c[b+72>>2]=c[b+88>>2];c[b+76>>2]=536870912;c[b+64>>2]=2;return}else if((a|0)==0){c[b+68>>2]=268435456;c[b+72>>2]=c[b+84>>2];c[b+76>>2]=c[b+16>>2];c[b+64>>2]=1;return}else if((a|0)==2){do{if((c[b+28>>2]&8|0)!=0){d=c[b+28>>2]&1;if((d|0)==0){c[b+68>>2]=0;c[b+72>>2]=c[b+80>>2];c[b+76>>2]=268435456;c[b+64>>2]=0}f6(b,c[b+28>>2]<<1&4);if((d|0)!=0){break}return}}while(0)}else if((a|0)!=3){return}c[b+68>>2]=536870912;c[b+72>>2]=0;c[b+76>>2]=536870913;return}function gw(a){a=a|0;var b=0;b=a;c[b+16>>2]=0;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;return}function gx(a){a=a|0;var b=0;b=a;c[b+24>>2]=0;c[b+28>>2]=0;c[b+32>>2]=0;c[b+20>>2]=3;c[b+16>>2]=c[b+12>>2];return}function gy(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;e=b;b=d;d=a;do{if((c[d+32>>2]|0)!=0){if((c[d+36>>2]|0)<=128){break}if((c[d+40>>2]|0)!=0){f=c[d+32>>2]|0}else{f=-(c[d+32>>2]|0)|0}a=f;g=a-(c[d+28>>2]|0)|0;if((g|0)!=0){c[d+28>>2]=a;fZ(c[d+44>>2]|0,e,g,c[d+16>>2]|0)}e=e+(c[d+24>>2]|0)|0;if((e|0)<(b|0)){g=c[d+16>>2]|0;h=a<<1;do{h=-h|0;gz(c[d+44>>2]|0,e,h,g);e=e+(c[d+36>>2]|0)|0;a=d+40|0;c[a>>2]=c[a>>2]^1;}while((e|0)<(b|0));if((c[d+40>>2]|0)!=0){i=c[d+32>>2]|0}else{i=-(c[d+32>>2]|0)|0}c[d+28>>2]=i}j=e;k=b;l=j-k|0;m=d;n=m+24|0;c[n>>2]=l;return}}while(0);if((c[d+28>>2]|0)!=0){fZ(c[d+44>>2]|0,e,-(c[d+28>>2]|0)|0,c[d+16>>2]|0);c[d+28>>2]=0}e=e+(c[d+24>>2]|0)|0;if((c[d+36>>2]|0)!=0){if((e|0)<(b|0)){i=(b-e+(c[d+36>>2]|0)-1|0)/(c[d+36>>2]|0)|0;c[d+40>>2]=(c[d+40>>2]|0)+i&1;e=e+($(i,c[d+36>>2]|0)|0)|0}}else{e=b}j=e;k=b;l=j-k|0;m=d;n=m+24|0;c[n>>2]=l;return}function gz(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=e;e=$(b,c[f>>2]|0)|0;f_(a,e+(c[f+4>>2]|0)|0,d,f);return}function gA(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;e=b;b=d;d=a;a=c[d+32>>2]|0;if((c[d+40>>2]&1|0)!=0){a=-a|0}f=a-(c[d+28>>2]|0)|0;if((f|0)!=0){c[d+28>>2]=a;gB(d+48|0,e,f,c[d+16>>2]|0)}e=e+(c[d+24>>2]|0)|0;if((c[d+32>>2]|0)==0){e=b}if((e|0)>=(b|0)){g=e;h=b;i=g-h|0;j=d;k=j+24|0;c[k>>2]=i;return}f=c[d+16>>2]|0;l=c[d+40>>2]|0;m=a<<1;a=c[c[d+36>>2]>>2]<<1;if((a|0)==0){a=16}do{n=l+1|0;l=c[d+44>>2]&-(l&1)^l>>>1;if((n&2|0)!=0){m=-m|0;gC(d+48|0,e,m,f)}e=e+a|0;}while((e|0)<(b|0));c[d+40>>2]=l;c[d+28>>2]=m>>1;g=e;h=b;i=g-h|0;j=d;k=j+24|0;c[k>>2]=i;return}function gB(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=e;e=$(b,c[f>>2]|0)|0;gV(a,e+(c[f+4>>2]|0)|0,d,f);return}function gC(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=e;e=$(b,c[f>>2]|0)|0;gV(a,e+(c[f+4>>2]|0)|0,d,f);return}function gD(a){a=a|0;var b=0,d=0,e=0;b=a;a=b+16|0;d=a+144|0;e=a;do{gE(e);e=e+48|0;}while((e|0)!=(d|0));fR(b+160|0);gF(b+984|0);d=0;while(1){if((d|0)>=3){break}c[b+16+(d*48|0)+44>>2]=b+160;c[b+(d<<2)>>2]=b+16+(d*48|0);d=d+1|0}c[b+12>>2]=b+984;gG(b,1.0);gH(b,0,0);return}function gE(a){a=a|0;gZ(a);return}function gF(a){a=a|0;gW(a);return}function gG(a,b){a=a|0;b=+b;var c=0.0,d=0;c=b;d=a;c=c*.00166015625;f0(d+160|0,c);gJ(d+1032|0,c);return}function gH(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=b;b=d;d=a;c[d+976>>2]=0;c[d+980>>2]=0;if((e|0)!=0){if((b|0)==0){f=2061}}else{f=2061}if((f|0)==2061){e=9;b=16}c[d+1596>>2]=1<<b-1;c[d+1592>>2]=0;while(1){f=b;b=f-1|0;if((f|0)==0){break}c[d+1592>>2]=c[d+1592>>2]<<1|e&1;e=e>>>1}gP(d+16|0);gP(d+64|0);gP(d+112|0);gQ(d+984|0);return}function gI(a){a=a|0;return}function gJ(a,b){a=a|0;b=+b;bN(a|0,b*1.0);return}function gK(a,b){a=a|0;b=b|0;var c=0;c=b;b=a;gL(b+160|0,c);gM(b+1032|0,c);return}function gL(a,b){a=a|0;b=b|0;bM(a|0,b);return}function gM(a,b){a=a|0;b=b|0;bM(a|0,b);return}function gN(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;g=b;b=d;d=e;e=f;f=a;if(g>>>0<4>>>0){}else{at(6640,9632,194,11112)}do{if((b|0)!=0){if((d|0)==0){h=2076;break}if((e|0)!=0){i=1}else{h=2076}}else{h=2076}}while(0);L2330:do{if((h|0)==2076){do{if((b|0)==0){if((d|0)!=0){break}if((e|0)==0){i=1;break L2330}}}while(0);at(6064,9632,195,11112)}}while(0);i=c[f+(g<<2)>>2]|0;c[i+4>>2]=e;c[i+8>>2]=d;c[i+12>>2]=b;c[i+16>>2]=c[i+(c[i+20>>2]<<2)>>2];return}function gO(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b;b=c;c=d;d=a;a=0;while(1){if((a|0)>=4){break}gN(d,a,e,b,c);a=a+1|0}return}function gP(a){a=a|0;var b=0;b=a;c[b+36>>2]=0;c[b+40>>2]=0;gx(b);return}function gQ(a){a=a|0;var b=0;b=a;c[b+36>>2]=20696;c[b+40>>2]=32768;c[b+44>>2]=36864;gx(b);return}function gR(a,b){a=a|0;b=b|0;var d=0,e=0;d=b;b=a;if((d|0)>=(c[b+976>>2]|0)){}else{at(4384,9632,236,11048)}if((d|0)<=(c[b+976>>2]|0)){return}a=0;while(1){if((a|0)>=4){break}e=c[b+(a<<2)>>2]|0;if((c[e+16>>2]|0)!=0){fX(c[e+16>>2]|0);if((a|0)<3){gy(b+16+(a*48|0)|0,c[b+976>>2]|0,d)}else{gA(b+984|0,c[b+976>>2]|0,d)}}a=a+1|0}c[b+976>>2]=d;return}function gS(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if((d|0)>(c[b+976>>2]|0)){gR(b,d)}if((c[b+976>>2]|0)>=(d|0)){}else{at(3336,9632,263,11064)}a=b+976|0;c[a>>2]=(c[a>>2]|0)-d;return}function gT(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=b;b=d;d=a;if(b>>>0<=255>>>0){}else{at(2664,9632,269,11080)}gR(d,e);a=0;while(1){if((a|0)>=4){break}f=c[d+(a<<2)>>2]|0;g=b>>a;h=c[f+16>>2]|0;c[f+20>>2]=g>>3&2|g&1;c[f+16>>2]=c[f+(c[f+20>>2]<<2)>>2];do{if((c[f+16>>2]|0)!=(h|0)){if((c[f+28>>2]|0)==0){break}if((h|0)!=0){fX(h);fZ(d+160|0,e,-(c[f+28>>2]|0)|0,h)}c[f+28>>2]=0}}while(0);a=a+1|0}return}function gU(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=e;e=a;if(f>>>0<=255>>>0){}else{at(2664,9632,299,11096)}gR(e,b);if((f&128|0)!=0){c[e+980>>2]=f}b=c[e+980>>2]>>5&3;if((c[e+980>>2]&16|0)!=0){c[(c[e+(b<<2)>>2]|0)+32>>2]=d[19528+(f&15)|0]|0;return}if((b|0)<3){a=e+16+(b*48|0)|0;if((f&128|0)!=0){c[a+36>>2]=c[a+36>>2]&65280|f<<4&255}else{c[a+36>>2]=c[a+36>>2]&255|f<<8&16128}}else{a=f&3;if((a|0)<3){c[e+1020>>2]=20696+(a<<2)}else{c[e+1020>>2]=e+148}if((f&4|0)!=0){g=c[e+1592>>2]|0}else{g=c[e+1596>>2]|0}c[e+1028>>2]=g;c[e+1024>>2]=32768}return}function gV(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=d;d=e;e=f;f=a;if((g>>>16|0)<(c[e+12>>2]|0)){}else{at(1968,1264,342,10688)}d=$(d,c[f+8>>2]|0)|0;a=(c[e+8>>2]|0)+(g>>>16<<2)|0;e=g>>>10&63;g=f+168+(-e<<1)|0;h=b[g>>1]|0;i=$(h,d)|0;j=$(b[g+128>>1]|0,d)|0;k=j+(c[a+20>>2]|0)|0;h=b[g+256>>1]|0;c[a+16>>2]=i+(c[a+16>>2]|0);c[a+20>>2]=k;k=$(h,d)|0;i=$(b[g+384>>1]|0,d)|0;j=i+(c[a+28>>2]|0)|0;g=f+40+(e<<1)|0;h=b[g+384>>1]|0;c[a+24>>2]=k+(c[a+24>>2]|0);c[a+28>>2]=j;j=$(h,d)|0;k=$(b[g+256>>1]|0,d)|0;e=k+(c[a+36>>2]|0)|0;h=b[g+128>>1]|0;c[a+32>>2]=j+(c[a+32>>2]|0);c[a+36>>2]=e;e=$(h,d)|0;h=$(b[g>>1]|0,d)|0;d=h+(c[a+44>>2]|0)|0;c[a+40>>2]=e+(c[a+40>>2]|0);c[a+44>>2]=d;return}function gW(a){a=a|0;var b=0;b=a;gw(b);gX(b+48|0);return}function gX(a){a=a|0;gY(a);return}function gY(a){a=a|0;var b=0;b=a;bH(b|0,b+40|0,8);return}function gZ(a){a=a|0;gw(a);return}function g_(b){b=b|0;var e=0,f=0,g=0;e=b;c[e+520>>2]=e+524;b=256;while(1){f=b-1|0;b=f;if((f|0)<0){break}f=1;g=b;while(1){if((g|0)==0){break}f=f^g;g=g>>1}g=b&168|(f&1)<<2;a[e+b|0]=g&255;a[e+(b+256)|0]=(g|1)&255}b=e|0;a[b]=(d[b]|0|64)&255;b=e+256|0;a[b]=(d[b]|0|64)&255;return}function g$(a,b){a=a|0;b=b|0;var d=0;d=a;c[d+512>>2]=b;c[d+520>>2]=d+524;c[d+528>>2]=0;c[d+524>>2]=0;c[d+516>>2]=0;sf(d+532|0,0,30);return}function g0(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0;h=i;i=i+16|0;j=h|0;k=h+8|0;l=f;g1(l,g);g=j;f=l+524|0;c[g>>2]=c[f>>2];c[g+4>>2]=c[f+4>>2];c[l+520>>2]=j;f=0;g=k;m=l+540|0;sg(g|0,m|0,8)|0;m=c[j+4>>2]|0;g=c[l+512>>2]|0;n=e[l+532>>1]|0;o=e[l+534>>1]|0;p=e[l+536>>1]|0;q=e[l+538>>1]|0;r=d[l+547|0]|0;L1:while(1){s=d[g+n|0]|0;n=n+1|0;t=d[14200+s|0]|0;u=m+t|0;m=u;if((u|0)>=0){if((m|0)>=(t|0)){v=11;break}}t=d[g+n|0]|0;L9:do{switch(s|0){case 0:case 64:case 73:case 82:case 91:case 100:case 109:case 127:{continue L1;break};case 8:{u=d[l+554|0]|0;a[l+554|0]=a[k+6|0]|0;a[k+6|0]=u&255;u=d[l+555|0]|0;a[l+555|0]=r&255;r=u;continue L1;break};case 211:{n=n+1|0;hr(l,m+(c[j>>2]|0)|0,t+((d[k+6|0]|0)<<8)|0,d[k+6|0]|0);continue L1;break};case 46:{n=n+1|0;a[k+4|0]=t&255;continue L1;break};case 62:{n=n+1|0;a[k+6|0]=t&255;continue L1;break};case 58:{u=g2(g+n|0)|0;n=n+2|0;a[k+6|0]=a[g+u|0]|0;continue L1;break};case 32:{n=n+1|0;if((r&64|0)!=0){v=2;break L9}else{n=n+((t&255)<<24>>24)|0;continue L1}break};case 40:{n=n+1|0;if((r&64|0)!=0){n=n+((t&255)<<24>>24)|0;continue L1}else{v=2;break L9}break};case 48:{n=n+1|0;if((r&1|0)!=0){v=2;break L9}else{n=n+((t&255)<<24>>24)|0;continue L1}break};case 56:{n=n+1|0;if((r&1|0)!=0){n=n+((t&255)<<24>>24)|0;continue L1}else{v=2;break L9}break};case 24:{n=n+1|0;n=n+((t&255)<<24>>24)|0;continue L1;break};case 16:{u=(d[k+1|0]|0)-1|0;a[k+1|0]=u&255;n=n+1|0;if((u|0)!=0){n=n+((t&255)<<24>>24)|0;continue L1}else{v=2;break L9}break};case 194:{if((r&64|0)!=0){v=4;break L9}else{n=g2(g+n|0)|0;continue L1}break};case 202:{if((r&64|0)!=0){n=g2(g+n|0)|0;continue L1}else{v=4;break L9}break};case 210:{if((r&1|0)!=0){v=4;break L9}else{n=g2(g+n|0)|0;continue L1}break};case 218:{if((r&1|0)!=0){n=g2(g+n|0)|0;continue L1}else{v=4;break L9}break};case 226:{if((r&4|0)!=0){v=4;break L9}else{n=g2(g+n|0)|0;continue L1}break};case 234:{if((r&4|0)!=0){n=g2(g+n|0)|0;continue L1}else{v=4;break L9}break};case 242:{if((r&128|0)!=0){v=4;break L9}else{n=g2(g+n|0)|0;continue L1}break};case 250:{if((r&128|0)!=0){n=g2(g+n|0)|0;continue L1}else{v=4;break L9}break};case 195:{n=g2(g+n|0)|0;continue L1;break};case 233:{n=e[k+4>>1]|0;continue L1;break};case 192:{if((r&64|0)!=0){m=m-6|0;continue L1}else{v=85;break L9}break};case 200:{if((r&64|0)!=0){v=85;break L9}else{m=m-6|0;continue L1}break};case 208:{if((r&1|0)!=0){m=m-6|0;continue L1}else{v=85;break L9}break};case 216:{if((r&1|0)!=0){v=85;break L9}else{m=m-6|0;continue L1}break};case 224:{if((r&4|0)!=0){m=m-6|0;continue L1}else{v=85;break L9}break};case 232:{if((r&4|0)!=0){v=85;break L9}else{m=m-6|0;continue L1}break};case 240:{if((r&128|0)!=0){m=m-6|0;continue L1}else{v=85;break L9}break};case 248:{if((r&128|0)!=0){v=85;break L9}else{m=m-6|0;continue L1}break};case 201:{v=85;break};case 196:{if((r&64|0)!=0){v=3;break L9}else{v=111;break L9}break};case 204:{if((r&64|0)!=0){v=111;break L9}else{v=3;break L9}break};case 212:{if((r&1|0)!=0){v=3;break L9}else{v=111;break L9}break};case 220:{if((r&1|0)!=0){v=111;break L9}else{v=3;break L9}break};case 228:{if((r&4|0)!=0){v=3;break L9}else{v=111;break L9}break};case 236:{if((r&4|0)!=0){v=111;break L9}else{v=3;break L9}break};case 244:{if((r&128|0)!=0){v=3;break L9}else{v=111;break L9}break};case 252:{if((r&128|0)!=0){v=111;break L9}else{v=3;break L9}break};case 205:{v=111;break};case 255:{if((n-1|0)>>>0>65535>>>0){n=n-1&65535;m=m-11|0;continue L1}else{v=115;break L9}break};case 199:case 207:case 215:case 223:case 231:case 239:case 247:{v=115;break};case 245:{t=((d[k+6|0]|0)<<8)+r|0;v=118;break};case 197:case 213:case 229:{t=e[k-24+(s>>>3)>>1]|0;v=118;break};case 241:{r=d[g+o|0]|0;a[k+6|0]=a[g+(o+1)|0]|0;o=o+2&65535;continue L1;break};case 193:case 209:case 225:{b[k-24+(s>>>3)>>1]=(g2(g+o|0)|0)&65535;o=o+2&65535;continue L1;break};case 150:case 134:{r=r&-2;v=122;break};case 158:case 142:{v=122;break};case 214:case 198:{r=r&-2;v=124;break};case 222:case 206:{v=124;break};case 144:case 145:case 146:case 147:case 148:case 149:case 151:case 128:case 129:case 130:case 131:case 132:case 133:case 135:{r=r&-2;v=126;break};case 152:case 153:case 154:case 155:case 156:case 157:case 159:case 136:case 137:case 138:case 139:case 140:case 141:case 143:{v=126;break};case 190:{t=d[g+(e[k+4>>1]|0)|0]|0;v=133;break};case 254:{n=n+1|0;v=133;break};case 184:case 185:case 186:case 187:case 188:case 189:case 191:{t=d[k-184+(s^1)|0]|0;v=133;break};case 57:{t=o;v=138;break};case 9:case 25:case 41:{t=e[k-1+(s>>>3)>>1]|0;v=138;break};case 39:{u=d[k+6|0]|0;if((u|0)>153){r=r|1}w=96&-(r&1);if((r&16|0)!=0){v=143}else{if((u&15|0)>9){v=143}}if((v|0)==143){v=0;w=w|6}if((r&2|0)!=0){w=-w|0}u=u+w|0;r=r&3|((d[k+6|0]|0)^u)&16|(d[l+(u&255)|0]|0);a[k+6|0]=u&255;continue L1;break};case 52:{t=(d[g+(e[k+4>>1]|0)|0]|0)+1|0;a[g+(e[k+4>>1]|0)|0]=t&255;v=149;break};case 4:case 12:case 20:case 28:case 36:case 44:case 60:{u=k+(s>>>3^1)|0;w=(a[u]|0)+1&255;a[u]=w;t=w&255;v=149;break};case 53:{t=(d[g+(e[k+4>>1]|0)|0]|0)-1|0;a[g+(e[k+4>>1]|0)|0]=t&255;v=154;break};case 5:case 13:case 21:case 29:case 37:case 45:case 61:{w=k+(s>>>3^1)|0;u=(a[w]|0)-1&255;a[w]=u;t=u&255;v=154;break};case 3:case 19:case 35:{u=k+(s>>>3)|0;b[u>>1]=(b[u>>1]|0)+1&65535;continue L1;break};case 51:{o=o+1&65535;continue L1;break};case 11:case 27:case 43:{u=k-1+(s>>>3)|0;b[u>>1]=(b[u>>1]|0)-1&65535;continue L1;break};case 59:{o=o-1&65535;continue L1;break};case 166:{t=d[g+(e[k+4>>1]|0)|0]|0;v=164;break};case 230:{n=n+1|0;v=164;break};case 160:case 161:case 162:case 163:case 164:case 165:case 167:{t=d[k-160+(s^1)|0]|0;v=164;break};case 182:{t=d[g+(e[k+4>>1]|0)|0]|0;v=168;break};case 246:{n=n+1|0;v=168;break};case 176:case 177:case 178:case 179:case 180:case 181:case 183:{t=d[k-176+(s^1)|0]|0;v=168;break};case 174:{t=d[g+(e[k+4>>1]|0)|0]|0;v=172;break};case 238:{n=n+1|0;v=172;break};case 168:case 169:case 170:case 171:case 172:case 173:case 175:{t=d[k-168+(s^1)|0]|0;v=172;break};case 112:case 113:case 114:case 115:case 116:case 117:case 119:{a[g+(e[k+4>>1]|0)|0]=a[k-112+(s^1)|0]|0;continue L1;break};case 65:case 66:case 67:case 68:case 69:case 71:case 72:case 74:case 75:case 76:case 77:case 79:case 80:case 81:case 83:case 84:case 85:case 87:case 88:case 89:case 90:case 92:case 93:case 95:case 96:case 97:case 98:case 99:case 101:case 103:case 104:case 105:case 106:case 107:case 108:case 111:case 120:case 121:case 122:case 123:case 124:case 125:{a[k+(s>>>3&7^1)|0]=a[k+(s&7^1)|0]|0;continue L1;break};case 6:case 14:case 22:case 30:case 38:{a[k+(s>>>3^1)|0]=t&255;n=n+1|0;continue L1;break};case 54:{n=n+1|0;a[g+(e[k+4>>1]|0)|0]=t&255;continue L1;break};case 70:case 78:case 86:case 94:case 102:case 110:case 126:{a[k-8+(s>>>3^1)|0]=a[g+(e[k+4>>1]|0)|0]|0;continue L1;break};case 1:case 17:case 33:{b[k+(s>>>3)>>1]=(g2(g+n|0)|0)&65535;n=n+2|0;continue L1;break};case 49:{o=g2(g+n|0)|0;n=n+2|0;continue L1;break};case 42:{u=g2(g+n|0)|0;n=n+2|0;b[k+4>>1]=(g2(g+u|0)|0)&65535;continue L1;break};case 50:{u=g2(g+n|0)|0;n=n+2|0;a[g+u|0]=a[k+6|0]|0;continue L1;break};case 34:{u=g2(g+n|0)|0;n=n+2|0;g3(g+u|0,e[k+4>>1]|0);continue L1;break};case 2:case 18:{a[g+(e[k+(s>>>3)>>1]|0)|0]=a[k+6|0]|0;continue L1;break};case 10:case 26:{a[k+6|0]=a[g+(e[k-1+(s>>>3)>>1]|0)|0]|0;continue L1;break};case 249:{o=e[k+4>>1]|0;continue L1;break};case 7:{u=d[k+6|0]|0;u=u<<1|u>>>7;r=r&196|u&41;a[k+6|0]=u&255;continue L1;break};case 15:{u=d[k+6|0]|0;r=r&196|u&1;u=u<<7|u>>>1;r=r|u&40;a[k+6|0]=u&255;continue L1;break};case 23:{u=(d[k+6|0]|0)<<1|r&1;r=r&196|u&40|u>>>8;a[k+6|0]=u&255;continue L1;break};case 31:{u=r<<7|(d[k+6|0]|0)>>1;r=r&196|u&40|a[k+6|0]&1;a[k+6|0]=u&255;continue L1;break};case 47:{u=~(d[k+6|0]|0);r=r&197|u&40|18;a[k+6|0]=u&255;continue L1;break};case 63:{r=r&197^1|r<<4&16|a[k+6|0]&40;continue L1;break};case 55:{r=r&196|1|a[k+6|0]&40;continue L1;break};case 219:{n=n+1|0;a[k+6|0]=(hs(l,t+((d[k+6|0]|0)<<8)|0)|0)&255;continue L1;break};case 227:{u=g2(g+o|0)|0;g3(g+o|0,e[k+4>>1]|0);b[k+4>>1]=u&65535;continue L1;break};case 235:{u=e[k+4>>1]|0;b[k+4>>1]=b[k+2>>1]|0;b[k+2>>1]=u&65535;continue L1;break};case 217:{u=e[l+548>>1]|0;b[l+548>>1]=b[k>>1]|0;b[k>>1]=u&65535;u=e[l+550>>1]|0;b[l+550>>1]=b[k+2>>1]|0;b[k+2>>1]=u&65535;u=e[l+552>>1]|0;b[l+552>>1]=b[k+4>>1]|0;b[k+4>>1]=u&65535;continue L1;break};case 243:{a[l+556|0]=0;a[l+557|0]=0;continue L1;break};case 251:{a[l+556|0]=1;a[l+557|0]=1;continue L1;break};case 118:{v=199;break L1;break};case 203:{n=n+1|0;switch(t|0){case 6:{m=m+7|0;t=e[k+4>>1]|0;v=202;break L9;break};case 0:case 1:case 2:case 3:case 4:case 5:case 7:{u=k+(t^1)|0;w=d[u]|0;w=w<<1&255|w>>>7;r=d[l+w|0]|0|w&1;a[u]=w&255;continue L1;break};case 22:{m=m+7|0;t=e[k+4>>1]|0;v=205;break L9;break};case 16:case 17:case 18:case 19:case 20:case 21:case 23:{w=k-16+(t^1)|0;u=(d[w]|0)<<1|r&1;r=d[l+u|0]|0;a[w]=u&255;continue L1;break};case 38:{m=m+7|0;t=e[k+4>>1]|0;v=208;break L9;break};case 32:case 33:case 34:case 35:case 36:case 37:case 39:{u=k-32+(t^1)|0;w=(d[u]|0)<<1;r=d[l+w|0]|0;a[u]=w&255;continue L1;break};case 54:{m=m+7|0;t=e[k+4>>1]|0;v=211;break L9;break};case 48:case 49:case 50:case 51:case 52:case 53:case 55:{w=k-48+(t^1)|0;u=(d[w]|0)<<1|1;r=d[l+u|0]|0;a[w]=u&255;continue L1;break};case 14:{m=m+7|0;t=e[k+4>>1]|0;v=214;break L9;break};case 8:case 9:case 10:case 11:case 12:case 13:case 15:{u=k-8+(t^1)|0;w=d[u]|0;r=w&1;w=w<<7&255|w>>>1;r=r|(d[l+w|0]|0);a[u]=w&255;continue L1;break};case 30:{m=m+7|0;t=e[k+4>>1]|0;v=217;break L9;break};case 24:case 25:case 26:case 27:case 28:case 29:case 31:{w=k-24+(t^1)|0;u=d[w]|0;x=u&1;u=r<<7&255|u>>>1;r=d[l+u|0]|0|x;a[w]=u&255;continue L1;break};case 46:{t=e[k+4>>1]|0;m=m+7|0;v=220;break L9;break};case 40:case 41:case 42:case 43:case 44:case 45:case 47:{u=k-40+(t^1)|0;w=d[u]|0;r=w&1;w=w&128|w>>>1;r=r|(d[l+w|0]|0);a[u]=w&255;continue L1;break};case 62:{m=m+7|0;t=e[k+4>>1]|0;v=223;break L9;break};case 56:case 57:case 58:case 59:case 60:case 61:case 63:{w=k-56+(t^1)|0;u=d[w]|0;r=u&1;u=u>>>1;r=r|(d[l+u|0]|0);a[w]=u&255;continue L1;break};case 70:case 78:case 86:case 94:case 102:case 110:case 118:case 126:{m=m+4|0;y=d[g+(e[k+4>>1]|0)|0]|0;r=r&1;break};case 64:case 65:case 66:case 67:case 68:case 69:case 71:case 72:case 73:case 74:case 75:case 76:case 77:case 79:case 80:case 81:case 82:case 83:case 84:case 85:case 87:case 88:case 89:case 90:case 91:case 92:case 93:case 95:case 96:case 97:case 98:case 99:case 100:case 101:case 103:case 104:case 105:case 106:case 107:case 108:case 109:case 111:case 112:case 113:case 114:case 115:case 116:case 117:case 119:case 120:case 121:case 122:case 123:case 124:case 125:case 127:{y=d[k+(t&7^1)|0]|0;r=r&1|y&40;break};case 134:case 142:case 150:case 158:case 166:case 174:case 182:case 190:case 198:case 206:case 214:case 222:case 230:case 238:case 246:case 254:{m=m+7|0;u=d[g+(e[k+4>>1]|0)|0]|0;w=1<<(t>>>3&7);u=u|w;if((t&64|0)==0){u=u^w}a[g+(e[k+4>>1]|0)|0]=u&255;continue L1;break};case 192:case 193:case 194:case 195:case 196:case 197:case 199:case 200:case 201:case 202:case 203:case 204:case 205:case 207:case 208:case 209:case 210:case 211:case 212:case 213:case 215:case 216:case 217:case 218:case 219:case 220:case 221:case 223:case 224:case 225:case 226:case 227:case 228:case 229:case 231:case 232:case 233:case 234:case 235:case 236:case 237:case 239:case 240:case 241:case 242:case 243:case 244:case 245:case 247:case 248:case 249:case 250:case 251:case 252:case 253:case 255:{u=k+(t&7^1)|0;a[u]=(d[u]|0|1<<(t>>>3&7))&255;continue L1;break};case 128:case 129:case 130:case 131:case 132:case 133:case 135:case 136:case 137:case 138:case 139:case 140:case 141:case 143:case 144:case 145:case 146:case 147:case 148:case 149:case 151:case 152:case 153:case 154:case 155:case 156:case 157:case 159:case 160:case 161:case 162:case 163:case 164:case 165:case 167:case 168:case 169:case 170:case 171:case 172:case 173:case 175:case 176:case 177:case 178:case 179:case 180:case 181:case 183:case 184:case 185:case 186:case 187:case 188:case 189:case 191:{u=k+(t&7^1)|0;a[u]=(d[u]|0)&~(1<<(t>>>3&7))&255;continue L1;break};default:{v=233;break L1}}u=y&1<<(t>>>3&7);r=r|(u&128|16|u-1>>8&68);continue L1;break};case 237:{n=n+1|0;m=m+((d[21400+t|0]|0)>>4)|0;L236:do{switch(t|0){case 114:case 122:{z=o;if(!0){v=238;break L236}v=237;break};case 66:case 82:case 98:case 74:case 90:case 106:{v=237;break};case 64:case 72:case 80:case 88:case 96:case 104:case 112:case 120:{u=hs(l,e[k>>1]|0)|0;a[k-8+(t>>>3^1)|0]=u&255;r=r&1|(d[l+u|0]|0);continue L1;break};case 113:{a[k+7|0]=0;v=245;break};case 65:case 73:case 81:case 89:case 97:case 105:case 121:{v=245;break};case 115:{A=o;if(!0){v=249;break L236}v=248;break};case 67:case 83:{v=248;break};case 75:case 91:{u=g2(g+n|0)|0;n=n+2|0;b[k-9+(t>>>3)>>1]=(g2(g+u|0)|0)&65535;continue L1;break};case 123:{u=g2(g+n|0)|0;n=n+2|0;o=g2(g+u|0)|0;continue L1;break};case 103:{u=d[g+(e[k+4>>1]|0)|0]|0;a[g+(e[k+4>>1]|0)|0]=((d[k+6|0]|0)<<4|u>>>4)&255;u=a[k+6|0]&240|u&15;r=r&1|(d[l+u|0]|0);a[k+6|0]=u&255;continue L1;break};case 111:{u=d[g+(e[k+4>>1]|0)|0]|0;a[g+(e[k+4>>1]|0)|0]=(u<<4|a[k+6|0]&15)&255;u=a[k+6|0]&240|u>>>4;r=r&1|(d[l+u|0]|0);a[k+6|0]=u&255;continue L1;break};case 68:case 76:case 84:case 92:case 100:case 108:case 116:case 124:{s=16;r=r&-2;t=d[k+6|0]|0;a[k+6|0]=0;v=127;break L9;break};case 169:case 185:{B=-1;if(!0){v=258;break L236}v=257;break};case 161:case 177:{v=257;break};case 168:case 184:{C=-1;if(!0){v=269;break L236}v=268;break};case 160:case 176:{v=268;break};case 171:case 187:{D=-1;if(!0){v=277;break L236}v=276;break};case 163:case 179:{v=276;break};case 170:case 186:{E=-1;if(!0){v=284;break L236}v=283;break};case 162:case 178:{v=283;break};case 71:{a[l+559|0]=a[k+6|0]|0;continue L1;break};case 79:{a[l+558|0]=a[k+6|0]|0;f=1;continue L1;break};case 87:{a[k+6|0]=a[l+559|0]|0;v=292;break};case 95:{a[k+6|0]=a[l+558|0]|0;f=1;v=292;break};case 69:case 77:case 85:case 93:case 101:case 109:case 117:case 125:{a[l+556|0]=a[l+557|0]|0;v=85;break L9;break};case 70:case 78:case 102:case 110:{a[l+560|0]=0;continue L1;break};case 86:case 118:{a[l+560|0]=1;continue L1;break};case 94:case 126:{a[l+560|0]=2;continue L1;break};default:{f=1;continue L1}}}while(0);if((v|0)==237){v=0;z=e[k+((t>>>3&6)>>>0)>>1]|0;v=238}else if((v|0)==245){v=0;hr(l,m+(c[j>>2]|0)|0,e[k>>1]|0,d[k-8+(t>>>3^1)|0]|0);continue L1}else if((v|0)==248){v=0;A=e[k-8+(t>>>3)>>1]|0;v=249}else if((v|0)==257){v=0;B=1;v=258}else if((v|0)==268){v=0;C=1;v=269}else if((v|0)==276){v=0;D=1;v=277}else if((v|0)==283){v=0;E=1;v=284}else if((v|0)==292){v=0;r=r&1|(d[l+(d[k+6|0]|0)|0]|0)&-5|(d[l+557|0]|0)<<2&4;continue L1}if((v|0)==238){v=0;u=z+(r&1)|0;r=~t>>>2&2;if((r|0)!=0){u=-u|0}u=u+(e[k+4>>1]|0)|0;z=z^(e[k+4>>1]|0);z=z^u;r=r|(u>>>16&1|z>>>8&16|u>>>8&168|(z+32768|0)>>>14&4);b[k+4>>1]=u&65535;if((u&65535)<<16>>16!=0){continue L1}else{r=r|64;continue L1}}else if((v|0)==249){v=0;u=g2(g+n|0)|0;n=n+2|0;g3(g+u|0,A);continue L1}else if((v|0)==258){v=0;u=e[k+4>>1]|0;b[k+4>>1]=u+B&65535;w=d[g+u|0]|0;u=(d[k+6|0]|0)-w|0;r=r&1|2|((w^(d[k+6|0]|0))&16^u)&144;if((u&255)<<24>>24==0){r=r|64}u=u-((r&16)>>4)|0;r=r|u&8;r=r|u<<4&32;u=k|0;w=(b[u>>1]|0)-1&65535;b[u>>1]=w;if(w<<16>>16==0){continue L1}r=r|4;do{if((r&64|0)==0){if(t>>>0<176>>>0){break}n=n-2|0;m=m+5|0;continue L1}}while(0);continue L1}else if((v|0)==269){v=0;w=e[k+4>>1]|0;b[k+4>>1]=w+C&65535;u=d[g+w|0]|0;w=e[k+2>>1]|0;b[k+2>>1]=w+C&65535;a[g+w|0]=u&255;u=u+(d[k+6|0]|0)|0;r=r&193|u&8|u<<4&32;u=k|0;w=(b[u>>1]|0)-1&65535;b[u>>1]=w;if(w<<16>>16==0){continue L1}r=r|4;if(t>>>0<176>>>0){continue L1}else{n=n-2|0;m=m+5|0;continue L1}}else if((v|0)==277){v=0;w=e[k+4>>1]|0;b[k+4>>1]=w+D&65535;u=d[g+w|0]|0;w=k+1|0;x=(a[w]|0)-1&255;a[w]=x;w=x&255;r=u>>6&2|(d[l+w|0]|0)&-5;do{if((w|0)!=0){if(t>>>0<176>>>0){break}n=n-2|0;m=m+5|0}}while(0);hr(l,m+(c[j>>2]|0)|0,e[k>>1]|0,u);continue L1}else if((v|0)==284){v=0;w=e[k+4>>1]|0;b[k+4>>1]=w+E&65535;x=hs(l,e[k>>1]|0)|0;F=k+1|0;G=(a[F]|0)-1&255;a[F]=G;F=G&255;r=x>>6&2|(d[l+F|0]|0)&-5;do{if((F|0)!=0){if(t>>>0<176>>>0){break}n=n-2|0;m=m+5|0}}while(0);a[g+w|0]=x&255;continue L1}break};case 221:{H=p;v=300;break};case 253:{H=q;v=300;break};default:{v=379;break L1}}}while(0);L313:do{if((v|0)==2){v=0;m=m-5|0;continue L1}else if((v|0)==3){v=0;m=m-7|0;v=4}else if((v|0)==85){v=0;n=g2(g+o|0)|0;o=o+2&65535;continue L1}else if((v|0)==111){v=0;F=n+2|0;n=g2(g+n|0)|0;o=o-2&65535;g3(g+o|0,F);continue L1}else if((v|0)==115){v=0;t=n;n=s&56;v=118}else if((v|0)==122){v=0;t=d[g+(e[k+4>>1]|0)|0]|0;v=127}else if((v|0)==124){v=0;n=n+1|0;v=127}else if((v|0)==126){v=0;t=d[k+(s&7^1)|0]|0;v=127}else if((v|0)==138){v=0;F=(e[k+4>>1]|0)+t|0;t=t^(e[k+4>>1]|0);b[k+4>>1]=F&65535;r=r&196|F>>>16|F>>>8&40|(t^F)>>>8&16;continue L1}else if((v|0)==300){v=0;n=n+1|0;F=d[g+n|0]|0;m=m+(a[21400+t|0]&15)|0;L324:do{switch(t|0){case 150:case 134:{r=r&-2;v=302;break};case 158:case 142:{v=302;break};case 148:case 132:{r=r&-2;v=304;break};case 156:case 140:{v=304;break};case 149:case 133:{r=r&-2;v=306;break};case 157:case 141:{v=306;break};case 57:{I=o;v=310;break};case 41:{I=H;v=310;break};case 9:case 25:{I=e[k-1+(t>>>3)>>1]|0;v=310;break};case 166:{n=n+1|0;t=d[g+(H+((F&255)<<24>>24)&65535)|0]|0;v=164;break L313;break};case 164:{t=H>>>8;v=164;break L313;break};case 165:{t=H&255;v=164;break L313;break};case 182:{n=n+1|0;t=d[g+(H+((F&255)<<24>>24)&65535)|0]|0;v=168;break L313;break};case 180:{t=H>>>8;v=168;break L313;break};case 181:{t=H&255;v=168;break L313;break};case 174:{n=n+1|0;t=d[g+(H+((F&255)<<24>>24)&65535)|0]|0;v=172;break L313;break};case 172:{t=H>>>8;v=172;break L313;break};case 173:{t=H&255;v=172;break L313;break};case 190:{n=n+1|0;t=d[g+(H+((F&255)<<24>>24)&65535)|0]|0;v=133;break L313;break};case 188:{t=H>>>8;v=133;break L313;break};case 189:{t=H&255;v=133;break L313;break};case 112:case 113:case 114:case 115:case 116:case 117:case 119:{t=d[k-112+(t^1)|0]|0;if(!0){v=326;break L324}v=325;break};case 54:{v=325;break};case 68:case 76:case 84:case 92:case 124:{a[k-8+(t>>>3^1)|0]=H>>>8&255;continue L1;break};case 100:case 109:{continue L1;break};case 69:case 77:case 85:case 93:case 125:{a[k-8+(t>>>3^1)|0]=H&255;continue L1;break};case 70:case 78:case 86:case 94:case 102:case 110:case 126:{n=n+1|0;a[k-8+(t>>>3^1)|0]=a[g+(H+((F&255)<<24>>24)&65535)|0]|0;continue L1;break};case 38:{n=n+1|0;v=334;break};case 101:{F=H&255;v=334;break};case 96:case 97:case 98:case 99:case 103:{F=d[k-96+(t^1)|0]|0;v=334;break};case 46:{n=n+1|0;v=338;break};case 108:{F=H>>>8;v=338;break};case 104:case 105:case 106:case 107:case 111:{F=d[k-104+(t^1)|0]|0;v=338;break};case 249:{o=H;continue L1;break};case 34:{u=g2(g+n|0)|0;n=n+2|0;g3(g+u|0,H);continue L1;break};case 33:{H=g2(g+n|0)|0;n=n+2|0;break};case 42:{H=g2(g+(g2(g+n|0)|0)|0)|0;n=n+2|0;break};case 203:{t=H+((F&255)<<24>>24)&65535;n=n+1|0;F=d[g+n|0]|0;n=n+1|0;switch(F|0){case 6:{v=202;break L313;break};case 22:{v=205;break L313;break};case 38:{v=208;break L313;break};case 54:{v=211;break L313;break};case 14:{v=214;break L313;break};case 30:{v=217;break L313;break};case 46:{v=220;break L313;break};case 62:{v=223;break L313;break};case 70:case 78:case 86:case 94:case 102:case 110:case 118:case 126:{u=(d[g+t|0]|0)&1<<(F>>>3&7);r=r&1|16|u&128|u-1>>8&68;continue L1;break};case 134:case 142:case 150:case 158:case 166:case 174:case 182:case 190:case 198:case 206:case 214:case 222:case 230:case 238:case 246:case 254:{u=d[g+t|0]|0;G=1<<(F>>>3&7);u=u|G;if((F&64|0)==0){u=u^G}a[g+t|0]=u&255;continue L1;break};default:{f=1;continue L1}}break};case 35:{H=H+1&65535;break};case 43:{H=H-1&65535;break};case 52:{H=H+((F&255)<<24>>24)&65535;n=n+1|0;t=(d[g+H|0]|0)+1|0;a[g+H|0]=t&255;v=149;break L313;break};case 53:{H=H+((F&255)<<24>>24)&65535;n=n+1|0;t=(d[g+H|0]|0)-1|0;a[g+H|0]=t&255;v=154;break L313;break};case 36:{H=H+256&65535;t=H>>>8;v=366;break};case 44:{t=H+1&255;H=H&65280|t;v=366;break};case 37:{H=H-256&65535;t=H>>>8;v=371;break};case 45:{t=H-1&255;H=H&65280|t;v=371;break};case 229:{t=H;v=118;break L313;break};case 225:{H=g2(g+o|0)|0;o=o+2&65535;break};case 233:{n=H;continue L1;break};case 227:{u=g2(g+o|0)|0;g3(g+o|0,H);H=u;break};default:{f=1;n=n-1|0;continue L1}}}while(0);if((v|0)==302){v=0;n=n+1|0;s=t;t=d[g+(H+((F&255)<<24>>24)&65535)|0]|0;v=127;break}else if((v|0)==304){v=0;s=t;t=H>>>8;v=127;break}else if((v|0)==306){v=0;s=t;t=H&255;v=127;break}else if((v|0)==310){v=0;x=H+I|0;I=I^H;H=x&65535;r=r&196|x>>>16|x>>>8&40|(I^x)>>>8&16}else if((v|0)==325){v=0;n=n+1|0;t=d[g+n|0]|0;v=326}else if((v|0)==334){v=0;H=H&255|F<<8}else if((v|0)==338){v=0;H=H&65280|F}else if((v|0)==366){v=0;if((s|0)==221){p=H;v=149;break}else{q=H;v=149;break}}else if((v|0)==371){v=0;if((s|0)==221){p=H;v=154;break}else{q=H;v=154;break}}if((v|0)==326){v=0;n=n+1|0;a[g+(H+((F&255)<<24>>24)&65535)|0]=t&255;continue L1}if((s|0)==221){p=H;continue L1}else{q=H;continue L1}}}while(0);if((v|0)==4){v=0;n=n+2|0;continue}else if((v|0)==118){v=0;o=o-2&65535;g3(g+o|0,t);continue}else if((v|0)==127){v=0;x=t+(r&1)|0;t=t^(d[k+6|0]|0);r=s>>>3&2;if((r|0)!=0){x=-x|0}x=x+(d[k+6|0]|0)|0;t=t^x;r=r|(t&16|(t+128|0)>>>6&4|(d[l+(x&511)|0]|0)&-5);a[k+6|0]=x&255;continue}else if((v|0)==133){v=0;x=(d[k+6|0]|0)-t|0;r=2|t&40|x>>8&1;t=t^(d[k+6|0]|0);r=r|(((x^(d[k+6|0]|0))&t)>>>5&4|(t&16^x)&144);if((x&255)<<24>>24!=0){continue}else{r=r|64;continue}}else if((v|0)==149){v=0;r=r&1|(t&15)-1&16|(d[l+(t&255)|0]|0)&-5;if((t|0)!=128){continue}else{r=r|4;continue}}else if((v|0)==154){v=0;r=r&1|2|(t&15)+1&16|(d[l+(t&255)|0]|0)&-5;if((t|0)!=127){continue}else{r=r|4;continue}}else if((v|0)==164){v=0;x=k+6|0;a[x]=(d[x]|0)&t&255;r=d[l+(d[k+6|0]|0)|0]|0|16;continue}else if((v|0)==168){v=0;x=k+6|0;a[x]=(d[x]|0|t)&255;r=d[l+(d[k+6|0]|0)|0]|0;continue}else if((v|0)==172){v=0;x=k+6|0;a[x]=((d[x]|0)^t)&255;r=d[l+(d[k+6|0]|0)|0]|0;continue}else if((v|0)==202){v=0;x=d[g+t|0]|0;x=x<<1&255|x>>>7;r=d[l+x|0]|0|x&1;a[g+t|0]=x&255;continue}else if((v|0)==205){v=0;x=(d[g+t|0]|0)<<1|r&1;r=d[l+x|0]|0;a[g+t|0]=x&255;continue}else if((v|0)==208){v=0;x=(d[g+t|0]|0)<<1;r=d[l+x|0]|0;a[g+t|0]=x&255;continue}else if((v|0)==211){v=0;x=(d[g+t|0]|0)<<1|1;r=d[l+x|0]|0;a[g+t|0]=x&255;continue}else if((v|0)==214){v=0;x=d[g+t|0]|0;r=x&1;x=x<<7&255|x>>>1;r=r|(d[l+x|0]|0);a[g+t|0]=x&255;continue}else if((v|0)==217){v=0;x=d[g+t|0]|0;w=x&1;x=r<<7&255|x>>>1;r=d[l+x|0]|0|w;a[g+t|0]=x&255;continue}else if((v|0)==220){v=0;x=d[g+t|0]|0;r=x&1;x=x&128|x>>>1;r=r|(d[l+x|0]|0);a[g+t|0]=x&255;continue}else if((v|0)==223){v=0;x=d[g+t|0]|0;r=x&1;x=x>>>1;r=r|(d[l+x|0]|0);a[g+t|0]=x&255;continue}}if((v|0)==11){m=m-t|0;J=n;K=J-1|0;n=K;L=m;M=j+4|0;c[M>>2]=L;N=r;O=N&255;P=k;Q=P+7|0;a[Q]=O;R=p;S=R&65535;T=l+532|0;U=T+4|0;b[U>>1]=S;V=q;W=V&65535;X=l+532|0;Y=X+6|0;b[Y>>1]=W;Z=o;_=Z&65535;$=l+532|0;aa=$+2|0;b[aa>>1]=_;ab=n;ac=ab&65535;ad=l+532|0;ae=ad|0;b[ae>>1]=ac;af=l+532|0;ag=af+8|0;ah=ag;ai=k;aj=ah;ak=ai;sg(aj|0,ak|0,8)|0;al=l+524|0;am=al;an=j;c[am>>2]=c[an>>2];c[am+4>>2]=c[an+4>>2];ao=l+524|0;ap=l+520|0;c[ap>>2]=ao;aq=f;ar=aq&1;i=h;return ar|0}else if((v|0)==199){m=m&3;J=n;K=J-1|0;n=K;L=m;M=j+4|0;c[M>>2]=L;N=r;O=N&255;P=k;Q=P+7|0;a[Q]=O;R=p;S=R&65535;T=l+532|0;U=T+4|0;b[U>>1]=S;V=q;W=V&65535;X=l+532|0;Y=X+6|0;b[Y>>1]=W;Z=o;_=Z&65535;$=l+532|0;aa=$+2|0;b[aa>>1]=_;ab=n;ac=ab&65535;ad=l+532|0;ae=ad|0;b[ae>>1]=ac;af=l+532|0;ag=af+8|0;ah=ag;ai=k;aj=ah;ak=ai;sg(aj|0,ak|0,8)|0;al=l+524|0;am=al;an=j;c[am>>2]=c[an>>2];c[am+4>>2]=c[an+4>>2];ao=l+524|0;ap=l+520|0;c[ap>>2]=ao;aq=f;ar=aq&1;i=h;return ar|0}else if((v|0)==233){at(6568,9552,1025,11488);return 0}else if((v|0)==379){at(6568,9552,1648,11488);return 0}return 0}function g1(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;a=(c[c[b+520>>2]>>2]|0)-d|0;c[c[b+520>>2]>>2]=d;d=(c[b+520>>2]|0)+4|0;c[d>>2]=(c[d>>2]|0)+a;return}function g2(a){a=a|0;var b=0;b=a;return(d[b+1|0]|0)<<8|(d[b|0]|0)|0}function g3(b,c){b=b|0;c=c|0;var d=0;d=b;b=c;a[d+1|0]=b>>>8&255;a[d|0]=b&255;return}function g4(a){a=a|0;var b=0;b=a;g_(b+336|0);bR(b);c[b>>2]=16608;fQ(b+66992|0);c[b+920>>2]=0;g5(b,c[24]|0);fh(b,14152);g6(b,14136);g7(b,6);return}function g5(a,b){a=a|0;b=b|0;c[a+4>>2]=b;return}function g6(a,b){a=a|0;b=b|0;c[a+332>>2]=b;return}function g7(a,b){a=a|0;b=b|0;c[a+284>>2]=b;return}function g8(a){a=a|0;var b=0;b=a;g9(b);bT(b);return}function g9(a){a=a|0;bU(a);return}function ha(a,b,c){a=a|0;b=b|0;c=c|0;hb(a+900|0,b,c);return 0}function hb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=b;b=d;ex(a+528|0,hm(e,(c[e+8>>2]|0)+(b<<2)|0,1)|0);d=hm(e,(c[e+8>>2]|0)+(b<<2)+2|0,6)|0;if((d|0)!=0){c[a+4>>2]=(hn(d+4|0)|0)*20|0}ex(a+784|0,hm(e,(c[e>>2]|0)+12|0,1)|0);ex(a+1296|0,hm(e,(c[e>>2]|0)+14|0,1)|0);return}function hc(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0;f=a;a=hd(b,e,f+900|0)|0;if((a|0)!=0){g=a;h=g;return h|0}eu(f,(d[(c[f+900>>2]|0)+16|0]|0)+1|0);if((d[(c[f+900>>2]|0)+8|0]|0|0)>2){eT(f,3312)}he(f,4);fT(f+66992|0,+hf(f));g=b3(f,3546900)|0;h=g;return h|0}function hd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0;f=a;a=b;b=e;c[b>>2]=f;c[b+4>>2]=f+a;if((a|0)<20){g=c[2]|0;h=g;return h|0}a=f;if((sj(a|0,6936,8)|0)!=0){g=c[2]|0;h=g;return h|0}c[b+8>>2]=hm(b,a+18|0,(d[a+16|0]|0)+1<<2)|0;if((c[b+8>>2]|0)!=0){g=0;h=g;return h|0}else{g=6768;h=g;return h|0}return 0}function he(a,b){a=a|0;b=b|0;c[a+232>>2]=b;return}function hf(a){a=a|0;return+(+h[a+248>>3])}function hg(a,b){a=a|0;b=b|0;hh(a+66992|0,b);return}function hh(a,b){a=a|0;b=b|0;gL(a+472|0,b);return}function hi(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;f=b;b=d;d=a;if((f|0)>=3){c[d+920>>2]=b;return}else{f1(d+66992|0,f,b);return}}function hj(a,b){a=a|0;b=+b;var d=0;d=a;c[d+912>>2]=~~(+((hk(d)|0)/50|0|0)/b);return}function hk(a){a=a|0;return c[a+324>>2]|0}function hl(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=e;e=d;d=b5(e,f)|0;if((d|0)!=0){g=d;h=g;return h|0}sf(e+1198|0,-55|0,256);sf(e+1454|0,-1|0,16128);sf(e+17582|0,0,49408);sf(e+942|0,-1|0,256);sf(e+66734|0,-1|0,256);d=hm(e+900|0,(c[e+908>>2]|0)+(f<<2)+2|0,14)|0;if((d|0)==0){g=2640;h=g;return h|0}f=hm(e+900|0,d+10|0,6)|0;if((f|0)==0){g=2640;h=g;return h|0}i=hm(e+900|0,d+12|0,8)|0;if((i|0)==0){g=2640;h=g;return h|0}g$(e+336|0,e+1198|0);b[e+870>>1]=(hn(f)|0)&65535;j=a[d+8|0]|0;a[e+881|0]=j;a[e+879|0]=j;a[e+877|0]=j;a[e+882|0]=j;j=a[d+9|0]|0;a[e+880|0]=j;a[e+878|0]=j;a[e+876|0]=j;a[e+883|0]=j;j=e+884|0;d=e+876|0;b[j>>1]=b[d>>1]|0;b[j+2>>1]=b[d+2>>1]|0;b[j+4>>1]=b[d+4>>1]|0;b[j+6>>1]=b[d+6>>1]|0;d=b[e+880>>1]|0;b[e+874>>1]=d;b[e+872>>1]=d;d=hn(i)|0;if((d|0)==0){g=2640;h=g;return h|0}j=hn(f+2|0)|0;if((j|0)==0){j=d}do{i=i+2|0;k=hn(i)|0;i=i+2|0;if((d+k|0)>>>0>65536>>>0){eT(e,1944);k=65536-d|0}l=hm(e+900|0,i,0)|0;i=i+2|0;if(k>>>0>((c[e+904>>2]|0)-l|0)>>>0){eT(e,1240);k=(c[e+904>>2]|0)-l|0}do{if(d>>>0<16384>>>0){if(d>>>0<1024>>>0){break}}}while(0);m=e+1198+d|0;n=l;o=k;sg(m|0,n|0,o)|0;if(((c[e+904>>2]|0)-i|0)<8){p=468;break}o=hn(i)|0;d=o;}while((o|0)!=0);if((p|0)==468){eT(e,1240)}p=e+1198|0;sg(p|0,14168,10)|0;p=hn(f+4|0)|0;if((p|0)!=0){f=e+1198|0;sg(f|0,14184,13)|0;a[e+1207|0]=p&255;a[e+1208|0]=p>>>8&255}a[e+1200|0]=j&255;a[e+1201|0]=j>>>8&255;a[e+1254|0]=-5;j=e+66734|0;p=e+1198|0;sg(j|0,p|0,128)|0;c[e+924>>2]=165;c[e+928>>2]=0;fU(e+66992|0);c[e+916>>2]=c[e+912>>2];b2(e,3546900);fp(e,+ho(e));a[e+940|0]=0;a[e+941|0]=0;c[e+936>>2]=0;g=0;h=g;return h|0}function hm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=a;a=b;b=a-(c[e>>2]|0)|0;f=(c[e+4>>2]|0)-(c[e>>2]|0)|0;if(b>>>0<=(f-2|0)>>>0){}else{at(8224,7704,52,11960);return 0}e=((hn(a)|0)&65535)<<16>>16;do{if((e|0)!=0){if((b+e|0)>>>0>(f-d|0)>>>0){break}g=a+e|0;h=g;return h|0}}while(0);g=0;h=g;return h|0}function hn(a){a=a|0;var b=0;b=a;return(d[b|0]|0)<<8|(d[b+1|0]|0)|0}function ho(a){a=a|0;return+(+h[a+240>>3])}function hp(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;g=d;d=e;e=f;f=b;do{if(!(a[f+941|0]&1)){b=d&65279;if((b|0)==65277){a[f+940|0]=1;c[f+932>>2]=e&15;return}else if((b|0)==48893){a[f+940|0]=1;hq(f+66992|0,g,c[f+932>>2]|0,e);return}else{break}}}while(0);do{if(!(a[f+940|0]&1)){b=d>>>8;do{if((b|0)==246){h=e&192;if((h|0)==192){c[f+932>>2]=c[f+936>>2]&15;break}else if((h|0)==128){hq(f+66992|0,g,c[f+932>>2]|0,c[f+936>>2]|0);break}else{i=504;break}}else if((b|0)==244){c[f+936>>2]=e}else{i=504}}while(0);if((i|0)==504){break}if(a[f+941|0]&1){return}a[f+941|0]=1;b2(f,2e6);fp(f,+ho(f));return}}while(0);return}function hq(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a;fW(e,b);fV(e,c,d);return}function hr(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=d;d=e;e=f;f=b-336|0;do{if((d&255|0)==254){if(a[f+941|0]&1){break}b=c[f+924>>2]|0;e=e&16;if((c[f+928>>2]|0)!=(e|0)){c[f+928>>2]=e;c[f+924>>2]=-b;a[f+940|0]=1;if((c[f+920>>2]|0)!=0){fZ(f+67464|0,g,b,c[f+920>>2]|0)}}return}}while(0);hp(f,g,d,e);return}function hs(a,b){a=a|0;b=b|0;var c=0;if((b&255|0)==254){c=255}else{c=255}return c|0}function ht(f,g,h){f=f|0;g=g|0;h=h|0;var i=0,j=0;h=g;g=f;hu(g+336|0,0);if((a[g+940|0]&1|a[g+941|0]&1|0)==0){f=h;c[f>>2]=(c[f>>2]|0)/2|0}while(1){f=hv(g+336|0)|0;if((f|0)>=(c[h>>2]|0)){break}g0(g+336|0,hw(c[h>>2]|0,c[g+916>>2]|0)|0)|0;f=hv(g+336|0)|0;if((f|0)>=(c[g+916>>2]|0)){f=g+916|0;c[f>>2]=(c[f>>2]|0)+(c[g+912>>2]|0);if((a[g+892|0]|0)!=0){if((d[g+1198+(e[g+868>>1]|0)|0]|0)==118){f=g+868|0;b[f>>1]=(b[f>>1]|0)+1&65535}a[g+893|0]=0;a[g+892|0]=0;f=e[g+868>>1]>>8&255;i=g+870|0;j=(b[i>>1]|0)-1&65535;b[i>>1]=j;a[g+1198+(j&65535)|0]=f;f=b[g+868>>1]&255;j=g+870|0;i=(b[j>>1]|0)-1&65535;b[j>>1]=i;a[g+1198+(i&65535)|0]=f;b[g+868>>1]=56;hx(g+336|0,12);if((d[g+896|0]|0)==2){hx(g+336|0,6);f=(d[g+895|0]<<8)+255|0;b[g+868>>1]=(d[g+1198+(f+1&65535)|0]<<8)+(d[g+1198+f|0]|0)&65535}}}}c[h>>2]=hv(g+336|0)|0;f=g+916|0;c[f>>2]=(c[f>>2]|0)-(c[h>>2]|0);hx(g+336|0,-(c[h>>2]|0)|0);hy(g+66992|0,c[h>>2]|0);return 0}function hu(a,b){a=a|0;b=b|0;var d=0;d=a;c[(c[d+520>>2]|0)+4>>2]=b-(c[c[d+520>>2]>>2]|0);return}function hv(a){a=a|0;var b=0;b=a;return(c[(c[b+520>>2]|0)+4>>2]|0)+(c[c[b+520>>2]>>2]|0)|0}function hw(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((c|0)<(a|0)){d=c}else{d=a}return d|0}function hx(a,b){a=a|0;b=b|0;var d=0;d=(c[a+520>>2]|0)+4|0;c[d>>2]=(c[d>>2]|0)+b;return}function hy(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if((d|0)>(c[b+48>>2]|0)){fW(b,d)}if((c[b+48>>2]|0)>=(d|0)){}else{at(9416,8672,102,11512)}a=b+48|0;c[a>>2]=(c[a>>2]|0)-d;return}function hz(){var a=0,b=0,c=0;a=hB(68280)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;g4(b);c=b}return c|0}function hA(){var a=0,b=0,c=0;a=hB(328)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;hC(b);c=b}return c|0}function hB(a){a=a|0;return r5(a)|0}function hC(a){a=a|0;hD(a);return}function hD(a){a=a|0;var b=0;b=a;hE(b);c[b>>2]=16520;g5(b,c[24]|0);return}function hE(a){a=a|0;var b=0;b=a;fg(b);c[b>>2]=14720;return}function hF(a){a=a|0;hJ(a);return}function hG(a){a=a|0;var b=0;b=a;hF(b);bT(b);return}function hH(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0;f=a;a=hd(b,e,f+316|0)|0;if((a|0)!=0){g=a;h=g;return h|0}eu(f,(d[(c[f+316>>2]|0)+16|0]|0)+1|0);g=0;h=g;return h|0}function hI(a,b,c){a=a|0;b=b|0;c=c|0;hb(a+316|0,b,c);return 0}function hJ(a){a=a|0;fO(a);return}function hK(a){a=a|0;var b=0,d=0;b=a;fR(b+376|0);gX(b+1192|0);c[b+96>>2]=b+376;c[b+164>>2]=b+376;c[b+228>>2]=b+1192;c[b+320>>2]=b+1192;c[b>>2]=b+44;c[b+4>>2]=b+112;c[b+8>>2]=b+180;c[b+12>>2]=b+268;a=0;while(1){if((a|0)>=4){break}d=c[b+(a<<2)>>2]|0;c[d+24>>2]=b+328+(a*5|0);c[d+16>>2]=0;c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;c[d+12>>2]=0;a=a+1|0}hL(b,1.0);hM(b,1.0);hN(b);return}function hL(a,b){a=a|0;b=+b;var d=0.0,e=0;d=b;e=a;c[e+24>>2]=16384;if(d==1.0){return}c[e+24>>2]=~~(+(c[e+24>>2]|0)/d);return}function hM(a,b){a=a|0;b=+b;var c=0;c=a;h[c+32>>3]=625.0e-6*b;hQ(c);return}function hN(b){b=b|0;var d=0;d=b;c[d+16>>2]=0;c[d+20>>2]=0;c[d+40>>2]=0;h8(d+44|0);h8(d+112|0);h4(d+180|0);hS(d+268|0);c[d+324>>2]=1;c[d+232>>2]=0;a[d+348|0]=119;hQ(d);a[d+350|0]=1;hT(d,0,65318,0);b=d+236|0;sg(b|0,14120,32)|0;return}function hO(a,b){a=a|0;b=b|0;var c=0;c=b;b=a;gL(b+376|0,c);gM(b+1192|0,c);return}function hP(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;g=b;b=d;d=e;e=f;f=a;if(g>>>0<4>>>0){}else{at(5936,9336,59,11472)}do{if((b|0)!=0){if((d|0)==0){h=623;break}if((e|0)!=0){i=1}else{h=623}}else{h=623}}while(0);L696:do{if((h|0)==623){do{if((b|0)==0){if((d|0)!=0){break}if((e|0)==0){i=1;break L696}}}while(0);at(5872,9336,60,11472)}}while(0);i=c[f+(g<<2)>>2]|0;c[i+4>>2]=e;c[i+8>>2]=d;c[i+12>>2]=b;c[i+16>>2]=c[i+(c[i+20>>2]<<2)>>2];return}function hQ(a){a=a|0;var b=0,c=0.0,e=0.0;b=a;a=d[b+348|0]|0;c=+((hR(a&7,a>>4&7)|0)+1|0);e=c*+h[b+32>>3];f0(b+376|0,e);gJ(b+1192|0,e);return}function hR(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((a|0)<(c|0)){d=c}else{d=a}return d|0}function hS(a){a=a|0;var b=0;b=a;c[b+48>>2]=0;h4(b);return}function hT(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=e;e=f;f=g;g=b;if(f>>>0<256>>>0){}else{at(1920,9336,202,11440)}b=e-65296|0;if(b>>>0>=48>>>0){return}hU(g,h);i=d[g+328+b|0]|0;a[g+328+b|0]=f&255;if(e>>>0<65316>>>0){ig(g,(b|0)/5|0,b,f);return}do{if((e|0)==65316){if((f|0)==(i|0)){j=655;break}b=0;while(1){if((b|0)>=4){break}k=c[g+(b<<2)>>2]|0;l=c[k+32>>2]|0;c[k+32>>2]=0;do{if((l|0)!=0){if((c[k+44>>2]|0)==0){break}if((c[k+16>>2]|0)==0){break}gB(g+1192|0,h,-l|0,c[k+16>>2]|0)}}while(0);b=b+1|0}if((c[g+192>>2]|0)!=0){gB(g+1192|0,h,30,c[g+192>>2]|0)}hQ(g);if((c[g+192>>2]|0)!=0){gB(g+1192|0,h,-30,c[g+192>>2]|0)}}else{j=655}}while(0);if((j|0)==655){do{if((e|0)==65317){j=657}else{if((e|0)==65318){j=657;break}if(e>>>0>=65328>>>0){b=(e&15)<<1;a[g+236+b|0]=f>>4&255;a[g+236+(b+1)|0]=f&15}}}while(0);if((j|0)==657){j=(a[g+350|0]&128|0)!=0?-1:0;b=(d[g+349|0]|0)&j;k=0;while(1){if((k|0)>=4){break}l=c[g+(k<<2)>>2]|0;m=l+44|0;c[m>>2]=c[m>>2]&j;m=b>>k;n=c[l+16>>2]|0;c[l+20>>2]=m>>3&2|m&1;c[l+16>>2]=c[l+(c[l+20>>2]<<2)>>2];if((c[l+16>>2]|0)!=(n|0)){m=c[l+32>>2]|0;c[l+32>>2]=0;do{if((m|0)!=0){if((n|0)==0){break}gB(g+1192|0,h,-m|0,n)}}while(0)}k=k+1|0}do{if((e|0)==65318){if((f|0)==(i|0)){break}if((f&128|0)==0){k=0;while(1){if(k>>>0>=32>>>0){break}if((k|0)!=22){hT(g,h,k+65296|0,d[20928+k|0]|0)}k=k+1|0}}}}while(0)}}return}function hU(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=d;d=b;if((e|0)>=(c[d+20>>2]|0)){}else{at(4352,9336,131,11408)}if((e|0)==(c[d+20>>2]|0)){return}while(1){b=c[d+16>>2]|0;if((b|0)>(e|0)){b=e}f=0;while(1){if((f|0)>=4){break}g=c[d+(f<<2)>>2]|0;if((c[g+16>>2]|0)!=0){fX(c[g+16>>2]|0);h=0;do{if((c[g+44>>2]|0)!=0){if((c[g+36>>2]|0)==0){break}if((a[(c[g+24>>2]|0)+4|0]&64|0)!=0){if((c[g+40>>2]|0)==0){break}}h=-1}}while(0);g=f;if((g|0)==0){ia(d+44|0,c[d+20>>2]|0,b,h)}else if((g|0)==1){ia(d+112|0,c[d+20>>2]|0,b,h)}else if((g|0)==2){ie(d+180|0,c[d+20>>2]|0,b,h)}else if((g|0)==3){ic(d+268|0,c[d+20>>2]|0,b,h)}}f=f+1|0}c[d+20>>2]=b;if((b|0)==(e|0)){break}f=d+16|0;c[f>>2]=(c[f>>2]|0)+(c[d+24>>2]|0);h5(d+44|0);h5(d+112|0);h5(d+180|0);h5(d+268|0);c[d+40>>2]=(c[d+40>>2]|0)+1&3;if((c[d+40>>2]|0)==0){h6(d+44|0);h6(d+112|0);h6(d+268|0)}if((c[d+40>>2]&1|0)!=0){h9(d+44|0)}}return}function hV(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=b;b=a;if((d|0)>(c[b+20>>2]|0)){hU(b,d)}if((c[b+16>>2]|0)>=(d|0)){}else{at(3280,9336,193,11424)}a=b+16|0;c[a>>2]=(c[a>>2]|0)-d;if((c[b+20>>2]|0)>=(d|0)){e=d;f=b+20|0;g=c[f>>2]|0;h=g-e|0;c[f>>2]=h;return}at(2616,9336,196,11424);e=d;f=b+20|0;g=c[f>>2]|0;h=g-e|0;c[f>>2]=h;return}function hW(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0;g=f;f=b;hU(f,e);e=g-65296|0;if(e>>>0<48>>>0){}else{at(1200,9336,291,11456);return 0}b=d[f+328+e|0]|0;if((g|0)!=65318){h=b;return h|0}b=b&128|112;g=0;while(1){if((g|0)>=4){break}e=c[f+(g<<2)>>2]|0;do{if((c[e+44>>2]|0)!=0){if((c[e+40>>2]|0)==0){if((a[(c[e+24>>2]|0)+4|0]&64|0)!=0){break}}b=b|1<<g}}while(0);g=g+1|0}h=b;return h|0}function hX(a,b){a=a|0;b=b|0;var c=0,e=0,f=0;c=b;b=a;a=d[hY(b+336|0,c)|0]|0;if((c-65296|0)>>>0<48>>>0){a=hW(b+25136|0,hZ(b)|0,c)|0;e=a;return e|0}do{if((c-32768|0)>>>0<8192>>>0){f=749}else{if((c-57344|0)>>>0<7936>>>0){f=749;break}}}while(0);e=a;return e|0}function hY(a,b){a=a|0;b=b|0;var d=0;d=b;return(c[(c[a+20>>2]|0)+(d>>>13<<2)>>2]|0)+((d>>>0)%8192|0)|0}function hZ(a){a=a|0;var b=0;b=a;a=c[b+424>>2]|0;return a-(h3(b+336|0)|0)|0}function h_(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;e=c;c=d;d=b;b=e-40960|0;if(b>>>0>24575>>>0){if((e^8192)>>>0<=8191>>>0){iC(d,c)}else{if((e-32768|0)>>>0<8192>>>0){f=776}else{if((e-57344|0)>>>0<7936>>>0){f=776}}}return}a[d+548+b|0]=c&255;if((e^57344)>>>0<=8063>>>0){if((e-65296|0)>>>0<48>>>0){hT(d+25136|0,hZ(d)|0,e,c)}else{if((e^65286)>>>0<2>>>0){iG(d)}else{if((e|0)==65280){a[d+548+b|0]=0}else{a[d+548+b|0]=-1}}}}return}function h$(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;c[b+20>>2]=b+24;c[b+60>>2]=0;a=0;while(1){if((a|0)>=9){break}h0(b,a,d);a=a+1|0}sf(b|0,0,16);ej();return}function h0(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;c[(c[a+20>>2]|0)+(e<<2)>>2]=d+(-(e<<13&8191)|0);return}function h1(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b;b=c;c=d;d=a;if(((e>>>0)%8192|0|0)==0){}else{at(5664,9224,74,11384)}if(((b>>>0)%8192|0|0)==0){}else{at(5848,9224,75,11384)}a=(e>>>0)/8192|0;e=(b>>>0)/8192|0;while(1){b=e;e=b-1|0;if((b|0)==0){break}h0(d,a+e|0,c+(e<<13)|0)}return}function h2(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0;h=i;i=i+48|0;j=h|0;k=h+40|0;l=f;c[l+60>>2]=((g+4|0)>>>0)/4|0;c[l+20>>2]=j;g=j;f=l+24|0;sg(g|0,f|0,40)|0;f=k;g=l|0;sg(f|0,g|0,8)|0;g=c[l+8>>2]|0;f=e[l+12>>1]|0;m=d[l+7|0]|0;L921:while(1){n=c[j+(g>>>13<<2)>>2]|0;n=n+(g&8191)|0;o=n;n=o+1|0;p=d[o]|0;g=g+1|0;o=j+36|0;q=(c[o>>2]|0)-1|0;c[o>>2]=q;if((q|0)==0){r=798;break}q=d[n]|0;L924:do{switch(p|0){case 4:case 12:case 20:case 28:case 36:case 44:case 60:{p=p>>>3&7;o=(d[k+(p^1)|0]|0)+1|0;q=o;a[k+(p^1)|0]=o&255;r=976;break};case 53:{p=e[k+4>>1]|0;if((l|0)==0){s=0}else{s=l-336|0}q=hX(s,p)|0;q=q-1|0;if((l|0)==0){t=0}else{t=l-336|0}h_(t,p,q&255);r=985;break};case 5:case 13:case 21:case 29:case 37:case 45:case 61:{p=p>>>3&7;q=(d[k+(p^1)|0]|0)-1|0;a[k+(p^1)|0]=q&255;r=985;break};case 248:{u=(q&255)<<24>>24;g=g+1|0;m=0;u=u+f|0;v=f;r=993;break};case 232:{u=(q&255)<<24>>24;g=g+1|0;m=0;u=u+f|0;v=f;f=u&65535;r=994;break};case 57:{u=f;r=992;break};case 9:case 25:case 41:{u=e[k+(p>>>4<<1)>>1]|0;r=992;break};case 134:{if((l|0)==0){w=0}else{w=l-336|0}q=hX(w,e[k+4>>1]|0)|0;r=1001;break};case 128:case 129:case 130:case 131:case 132:case 133:case 135:{q=d[k+(p&7^1)|0]|0;r=1001;break};case 198:{g=g+1|0;r=1001;break};case 142:{if((l|0)==0){x=0}else{x=l-336|0}q=hX(x,e[k+4>>1]|0)|0;r=1010;break};case 136:case 137:case 138:case 139:case 140:case 141:case 143:{q=d[k+(p&7^1)|0]|0;r=1010;break};case 206:{g=g+1|0;r=1010;break};case 150:{if((l|0)==0){y=0}else{y=l-336|0}q=hX(y,e[k+4>>1]|0)|0;r=1017;break};case 144:case 145:case 146:case 147:case 148:case 149:case 151:{q=d[k+(p&7^1)|0]|0;r=1017;break};case 214:{g=g+1|0;r=1017;break};case 158:{if((l|0)==0){z=0}else{z=l-336|0}q=hX(z,e[k+4>>1]|0)|0;r=1024;break};case 152:case 153:case 154:case 155:case 156:case 157:case 159:{q=d[k+(p&7^1)|0]|0;r=1024;break};case 222:{g=g+1|0;r=1024;break};case 160:case 161:case 162:case 163:case 164:case 165:{q=d[k+(p&7^1)|0]|0;r=1031;break};case 166:{if((l|0)==0){A=0}else{A=l-336|0}q=hX(A,e[k+4>>1]|0)|0;g=g-1|0;r=1030;break};case 230:{r=1030;break};case 167:{r=1032;break};case 176:case 177:case 178:case 179:case 180:case 181:{q=d[k+(p&7^1)|0]|0;r=1039;break};case 182:{if((l|0)==0){B=0}else{B=l-336|0}q=hX(B,e[k+4>>1]|0)|0;g=g-1|0;r=1038;break};case 246:{r=1038;break};case 183:{r=1040;break};case 168:case 169:case 170:case 171:case 172:case 173:{q=d[k+(p&7^1)|0]|0;r=1047;break};case 174:{if((l|0)==0){C=0}else{C=l-336|0}q=hX(C,e[k+4>>1]|0)|0;g=g-1|0;r=1046;break};case 238:{r=1046;break};case 175:{a[k+6|0]=0;m=128;continue L921;break};case 241:case 193:case 209:case 225:{if((l|0)==0){D=0}else{D=l-336|0}q=hX(D,f)|0;if((l|0)==0){E=0}else{E=l-336|0}b[k+((p>>>4&3)<<1)>>1]=q+((hX(E,f+1|0)|0)<<8)&65535;f=f+2&65535;if((p|0)!=241){continue L921}else{m=a[k+7|0]&240;continue L921}break};case 197:{q=e[k>>1]|0;r=849;break};case 213:{q=e[k+2>>1]|0;r=849;break};case 229:{q=e[k+4>>1]|0;r=849;break};case 245:{q=m<<8|(d[k+6|0]|0);r=849;break};case 255:{if((g|0)==61454){r=1063;break L921}r=1065;break};case 199:case 207:case 215:case 223:case 231:case 239:case 247:{r=1065;break};case 204:{g=g+2|0;if((m&128|0)!=0){r=847;break L924}else{continue L921}break};case 212:{g=g+2|0;if((m&16|0)!=0){continue L921}else{r=847;break L924}break};case 220:{g=g+2|0;if((m&16|0)!=0){r=847;break L924}else{continue L921}break};case 217:{r=860;break};case 192:{if((m&128|0)!=0){continue L921}else{r=860;break L924}break};case 208:{if((m&16|0)!=0){continue L921}else{r=860;break L924}break};case 216:{if((m&16|0)!=0){r=860;break L924}else{continue L921}break};case 24:{g=g+1|0;g=g+((q&255)<<24>>24)&65535;continue L921;break};case 48:{g=g+1|0;if((m&16|0)!=0){continue L921}else{g=g+((q&255)<<24>>24)&65535;continue L921}break};case 56:{g=g+1|0;if((m&16|0)!=0){g=g+((q&255)<<24>>24)&65535;continue L921}else{continue L921}break};case 233:{g=e[k+4>>1]|0;continue L921;break};case 195:{g=g2(n)|0;continue L921;break};case 194:{g=g+2|0;if((m&128|0)!=0){continue L921}else{r=1100;break L924}break};case 202:{g=g+2|0;if((m&128|0)!=0){r=1100;break L924}else{continue L921}break};case 210:{g=g+2|0;if((m&16|0)!=0){continue L921}else{r=1100;break L924}break};case 218:{g=g+2|0;if((m&16|0)!=0){r=1100;break L924}else{continue L921}break};case 47:{a[k+6|0]=~(d[k+6|0]|0)&255;m=m|96;continue L921;break};case 63:{m=(m^16)&-97;continue L921;break};case 55:{m=(m|16)&-97;continue L921;break};case 243:{continue L921;break};case 251:{continue L921;break};case 221:case 211:case 219:case 227:case 228:case 235:case 236:case 244:case 253:case 252:case 16:case 39:case 191:case 237:case 118:{r=1112;break L921;break};case 7:case 23:{q=p;p=d[k+6|0]|0;r=912;break};case 15:case 31:{q=p;p=d[k+6|0]|0;r=916;break};case 40:{g=g+1|0;if((m&128|0)!=0){g=g+((q&255)<<24>>24)&65535;continue L921}else{continue L921}break};case 10:{F=e[k>>1]|0;r=814;break};case 184:case 185:case 186:case 187:case 188:case 189:{q=d[k+(p&7^1)|0]|0;r=830;break};case 254:{g=g+1|0;r=830;break};case 70:case 78:case 86:case 94:case 102:case 110:case 126:{o=e[k+4>>1]|0;a[k+(p>>>3&7^1)|0]=a[(c[j+(o>>>13<<2)>>2]|0)+(o&8191)|0]|0;if((o-65296|0)>>>0<48>>>0){if((l|0)==0){G=0}else{G=l-336|0}if((l|0)==0){H=0}else{H=l-336|0}a[k+(p>>>3&7^1)|0]=(hW(G+25136|0,(c[H+424>>2]|0)-(c[j+36>>2]<<2)|0,o)|0)&255}continue L921;break};case 26:{F=e[k+2>>1]|0;r=814;break};case 42:{F=e[k+4>>1]|0;b[k+4>>1]=F+1&65535;r=814;break};case 250:{F=g2(n)|0;g=g+2|0;r=814;break};case 200:{if((m&128|0)!=0){r=859;break L924}else{continue L921}break};case 201:{r=859;break};case 0:case 64:case 73:case 82:case 91:case 100:case 109:case 127:{continue L921;break};case 203:{g=g+1|0;switch(q|0){case 192:case 193:case 194:case 195:case 196:case 197:case 199:case 200:case 201:case 202:case 203:case 204:case 205:case 207:case 208:case 209:case 210:case 211:case 212:case 213:case 215:case 216:case 217:case 218:case 219:case 220:case 221:case 223:case 224:case 225:case 226:case 227:case 228:case 229:case 231:case 232:case 233:case 234:case 235:case 236:case 237:case 239:case 240:case 241:case 242:case 243:case 244:case 245:case 247:case 248:case 249:case 250:case 251:case 252:case 253:case 255:{o=k+(q&7^1)|0;a[o]=(d[o]|0|1<<(q>>>3&7))&255;continue L921;break};case 128:case 129:case 130:case 131:case 132:case 133:case 135:case 136:case 137:case 138:case 139:case 140:case 141:case 143:case 144:case 145:case 146:case 147:case 148:case 149:case 151:case 152:case 153:case 154:case 155:case 156:case 157:case 159:case 160:case 161:case 162:case 163:case 164:case 165:case 167:case 168:case 169:case 170:case 171:case 172:case 173:case 175:case 176:case 177:case 178:case 179:case 180:case 181:case 183:case 184:case 185:case 186:case 187:case 188:case 189:case 191:{o=k+(q&7^1)|0;a[o]=(d[o]|0)&~(1<<(q>>>3&7))&255;continue L921;break};case 54:{if((l|0)==0){I=0}else{I=l-336|0}J=hX(I,e[k+4>>1]|0)|0;r=897;break};case 48:case 49:case 50:case 51:case 52:case 53:case 55:{J=d[k+(q&7^1)|0]|0;r=897;break};case 6:case 22:case 38:{if((l|0)==0){K=0}else{K=l-336|0}p=hX(K,e[k+4>>1]|0)|0;r=912;break L924;break};case 32:case 33:case 34:case 35:case 36:case 37:case 39:case 0:case 1:case 2:case 3:case 4:case 5:case 7:case 16:case 17:case 18:case 19:case 20:case 21:case 23:{p=d[k+(q&7^1)|0]|0;r=912;break L924;break};case 62:{q=q+16|0;r=904;break};case 30:case 14:case 46:{r=904;break};case 56:case 57:case 58:case 59:case 60:case 61:case 63:{q=q+16|0;r=909;break};case 24:case 25:case 26:case 27:case 28:case 29:case 31:case 8:case 9:case 10:case 11:case 12:case 13:case 15:case 40:case 41:case 42:case 43:case 44:case 45:case 47:{r=909;break};case 70:case 78:case 86:case 94:case 102:case 110:case 118:case 126:{o=e[k+4>>1]|0;L=d[(c[j+(o>>>13<<2)>>2]|0)+(o&8191)|0]|0;if((o-65296|0)>>>0<48>>>0){if((l|0)==0){M=0}else{M=l-336|0}if((l|0)==0){N=0}else{N=l-336|0}L=hW(M+25136|0,(c[N+424>>2]|0)-(c[j+36>>2]<<2)|0,o)|0}r=880;break};case 64:case 65:case 66:case 67:case 68:case 69:case 71:case 72:case 73:case 74:case 75:case 76:case 77:case 79:case 80:case 81:case 82:case 83:case 84:case 85:case 87:case 88:case 89:case 90:case 91:case 92:case 93:case 95:case 96:case 97:case 98:case 99:case 100:case 101:case 103:case 104:case 105:case 106:case 107:case 108:case 109:case 111:case 112:case 113:case 114:case 115:case 116:case 117:case 119:case 120:case 121:case 122:case 123:case 124:case 125:case 127:{L=d[k+(q&7^1)|0]|0;r=880;break};case 134:case 142:case 150:case 158:case 166:case 174:case 182:case 190:case 198:case 206:case 214:case 222:case 230:case 238:case 246:case 254:{if((l|0)==0){O=0}else{O=l-336|0}o=hX(O,e[k+4>>1]|0)|0;P=1<<(q>>>3&7);o=o&~P;if((q&64|0)==0){P=0}if((l|0)==0){Q=0}else{Q=l-336|0}h_(Q,e[k+4>>1]|0,o|P);continue L921;break};default:{r=910;break L921}}if((r|0)==897){r=0;p=J>>4|J<<4;m=0;r=921;break L924}else if((r|0)==904){r=0;if((l|0)==0){R=0}else{R=l-336|0}p=hX(R,e[k+4>>1]|0)|0;r=916;break L924}else if((r|0)==909){r=0;p=d[k+(q&7^1)|0]|0;r=916;break L924}else if((r|0)==880){r=0;m=m&-65;m=m|160;m=m^L<<(~q>>>3&7)&128;continue L921}break};case 190:{if((l|0)==0){S=0}else{S=l-336|0}q=hX(S,e[k+4>>1]|0)|0;r=830;break};case 32:{g=g+1|0;if((m&128|0)!=0){continue L921}else{g=g+((q&255)<<24>>24)&65535;continue L921}break};case 33:{b[k+4>>1]=(g2(n)|0)&65535;g=g+2|0;continue L921;break};case 58:{F=e[k+4>>1]|0;b[k+4>>1]=F-1&65535;r=814;break};case 240:{F=q|65280;g=g+1|0;r=814;break};case 242:{F=d[k|0]|0|65280;r=814;break};case 196:{g=g+2|0;if((m&128|0)!=0){continue L921}else{r=847;break L924}break};case 205:{r=848;break};case 112:case 113:case 114:case 115:case 116:case 117:case 119:{p=d[k+(p&7^1)|0]|0;r=927;break};case 65:case 66:case 67:case 68:case 69:case 71:case 72:case 74:case 75:case 76:case 77:case 79:case 80:case 81:case 83:case 84:case 85:case 87:case 88:case 89:case 90:case 92:case 93:case 95:case 96:case 97:case 98:case 99:case 101:case 103:case 104:case 105:case 106:case 107:case 108:case 111:case 120:case 121:case 122:case 123:case 124:case 125:{a[k+(p>>>3&7^1)|0]=a[k+(p&7^1)|0]|0;continue L921;break};case 8:{q=g2(n)|0;g=g+2|0;if((l|0)==0){T=0}else{T=l-336|0}h_(T,q,f&255);q=q+1|0;if((l|0)==0){U=0}else{U=l-336|0}h_(U,q,f>>>8);continue L921;break};case 249:{f=e[k+4>>1]|0;continue L921;break};case 49:{f=g2(n)|0;g=g+2|0;continue L921;break};case 1:case 17:{b[k+(p>>>4<<1)>>1]=(g2(n)|0)&65535;g=g+2|0;continue L921;break};case 224:{V=q|65280;g=g+1|0;r=949;break};case 226:{V=d[k|0]|0|65280;r=949;break};case 50:{V=e[k+4>>1]|0;b[k+4>>1]=V-1&65535;r=949;break};case 2:{V=e[k>>1]|0;r=949;break};case 18:{V=e[k+2>>1]|0;r=949;break};case 34:{V=e[k+4>>1]|0;b[k+4>>1]=V+1&65535;r=949;break};case 234:{V=g2(n)|0;g=g+2|0;r=949;break};case 6:{a[k+1|0]=q&255;g=g+1|0;continue L921;break};case 14:{a[k|0]=q&255;g=g+1|0;continue L921;break};case 22:{a[k+3|0]=q&255;g=g+1|0;continue L921;break};case 30:{a[k+2|0]=q&255;g=g+1|0;continue L921;break};case 38:{a[k+5|0]=q&255;g=g+1|0;continue L921;break};case 46:{a[k+4|0]=q&255;g=g+1|0;continue L921;break};case 54:{if((l|0)==0){W=0}else{W=l-336|0}h_(W,e[k+4>>1]|0,q);g=g+1|0;continue L921;break};case 62:{a[k+6|0]=q&255;g=g+1|0;continue L921;break};case 3:case 19:case 35:{P=k+(p>>>4<<1)|0;b[P>>1]=(b[P>>1]|0)+1&65535;continue L921;break};case 51:{f=f+1&65535;continue L921;break};case 11:case 27:case 43:{P=k+(p>>>4<<1)|0;b[P>>1]=(b[P>>1]|0)-1&65535;continue L921;break};case 59:{f=f-1&65535;continue L921;break};case 52:{p=e[k+4>>1]|0;if((l|0)==0){X=0}else{X=l-336|0}q=hX(X,p)|0;q=q+1|0;if((l|0)==0){Y=0}else{Y=l-336|0}h_(Y,p,q&255);r=976;break};default:{r=1113;break L921}}}while(0);if((r|0)==976){r=0;m=m&16|(q&15)-1&32|q>>>1&128;continue}else if((r|0)==985){r=0;m=m&16|64|(q&15)+49&32;if((q&255|0)!=0){continue}else{m=m|128;continue}}else if((r|0)==992){r=0;v=e[k+4>>1]|0;u=u+v|0;m=m&128;r=993}else if((r|0)==1010){r=0;q=q+(m>>>4&1)|0;q=q&255;r=1001}else if((r|0)==1024){r=0;q=q+(m>>>4&1)|0;q=q&255;r=1017}else if((r|0)==1030){r=0;g=g+1|0;r=1031}else if((r|0)==1038){r=0;g=g+1|0;r=1039}else if((r|0)==1046){r=0;g=g+1|0;r=1047}else if((r|0)==1065){r=0;q=g;g=(p&56)+(c[l+16>>2]|0)|0;r=849}else if((r|0)==1100){r=0;g=g-2|0;g=g2(n)|0;continue}else if((r|0)==912){r=0;p=p<<1;p=p|(q&m)>>>4&1;m=p>>>4&16;if(q>>>0<16>>>0){p=p|p>>>8}r=921}else if((r|0)==916){r=0;p=p|(q&m)<<4;m=p<<4&16;if(q>>>0<16>>>0){p=p|p<<8}p=p>>>1;if((q&32|0)!=0){p=p|p<<1&128}r=921}else if((r|0)==830){r=0;p=d[k+6|0]|0;q=p-q|0;r=831}else if((r|0)==814){r=0;a[k+6|0]=a[(c[j+(F>>>13<<2)>>2]|0)+(F&8191)|0]|0;if((F-65296|0)>>>0<48>>>0){if((l|0)==0){Z=0}else{Z=l-336|0}if((l|0)==0){_=0}else{_=l-336|0}a[k+6|0]=(hW(Z+25136|0,(c[_+424>>2]|0)-(c[j+36>>2]<<2)|0,F)|0)&255}continue}else if((r|0)==859){r=0;r=860}else if((r|0)==847){r=0;g=g-2|0;r=848}else if((r|0)==949){r=0;if((l|0)==0){$=0}else{$=l-336|0}h_($,V,d[k+6|0]|0);continue}do{if((r|0)==993){r=0;b[k+4>>1]=u&65535;r=994}else if((r|0)==1001){r=0;m=d[k+6|0]|0;q=q+m|0;m=(q&15)-(m&15)&32;m=m|q>>>4&16;a[k+6|0]=q&255;if((q&255|0)!=0){continue L921}else{m=m|128;continue L921}}else if((r|0)==1017){r=0;p=d[k+6|0]|0;q=p-q|0;a[k+6|0]=q&255;r=831}else if((r|0)==1031){r=0;P=k+6|0;a[P]=(d[P]|0)&q&255;r=1032}else if((r|0)==1039){r=0;P=k+6|0;a[P]=(d[P]|0|q)&255;r=1040}else if((r|0)==1047){r=0;q=q^(d[k+6|0]|0);a[k+6|0]=q&255;q=q-1|0;m=q>>>1&128;continue L921}else if((r|0)==860){r=0;if((l|0)==0){aa=0}else{aa=l-336|0}g=hX(aa,f)|0;if((l|0)==0){ab=0}else{ab=l-336|0}g=g+((hX(ab,f+1|0)|0)<<8)|0;f=f+2&65535;continue L921}else if((r|0)==848){r=0;q=g+2|0;g=g2(n)|0;r=849}else if((r|0)==921){r=0;q=q&7;if((p&255|0)==0){m=m|128}if((q|0)==6){r=927;break}else{a[k+(q^1)|0]=p&255;continue L921}}}while(0);if((r|0)==994){r=0;m=m|u>>>12&16;m=m|((u&4095)-(v&4095)|0)>>>7&32;continue}else if((r|0)==1032){r=0;m=32|(d[k+6|0]|0)-1>>1&128;continue}else if((r|0)==1040){r=0;m=(d[k+6|0]|0)-1>>1&128;continue}else if((r|0)==831){r=0;m=(p&15)-(q&15)&32;m=m|q>>>4&16;m=m|64;if((q&255|0)!=0){continue}else{m=m|128;continue}}else if((r|0)==849){r=0;f=f-1&65535;if((l|0)==0){ac=0}else{ac=l-336|0}h_(ac,f,q>>>8);f=f-1&65535;if((l|0)==0){ad=0}else{ad=l-336|0}h_(ad,f,q&255);continue}else if((r|0)==927){r=0;if((l|0)==0){ae=0}else{ae=l-336|0}h_(ae,e[k+4>>1]|0,p&255);continue}}if((r|0)==1063){af=g;ag=af-1|0;g=ag;ah=l|0;ai=ah;aj=k;ak=ai;al=aj;sg(ak|0,al|0,8)|0;am=g;an=l|0;ao=an+8|0;c[ao>>2]=am;ap=f;aq=ap&65535;ar=l|0;as=ar+12|0;b[as>>1]=aq;au=m;av=au&255;aw=l|0;ax=aw;ay=ax+7|0;a[ay]=av;az=l+24|0;aA=l+20|0;c[aA>>2]=az;aB=l+24|0;aC=aB;aD=j;sg(aC|0,aD|0,40)|0;aE=j+36|0;aF=c[aE>>2]|0;aG=(aF|0)>0;i=h;return aG|0}else if((r|0)==1112){ae=j+36|0;c[ae>>2]=(c[ae>>2]|0)+1;af=g;ag=af-1|0;g=ag;ah=l|0;ai=ah;aj=k;ak=ai;al=aj;sg(ak|0,al|0,8)|0;am=g;an=l|0;ao=an+8|0;c[ao>>2]=am;ap=f;aq=ap&65535;ar=l|0;as=ar+12|0;b[as>>1]=aq;au=m;av=au&255;aw=l|0;ax=aw;ay=ax+7|0;a[ay]=av;az=l+24|0;aA=l+20|0;c[aA>>2]=az;aB=l+24|0;aC=aB;aD=j;sg(aC|0,aD|0,40)|0;aE=j+36|0;aF=c[aE>>2]|0;aG=(aF|0)>0;i=h;return aG|0}else if((r|0)==1113){at(4344,9224,1041,11400);return 0}else if((r|0)==910){at(4344,9224,452,11400);return 0}else if((r|0)==798){af=g;ag=af-1|0;g=ag;ah=l|0;ai=ah;aj=k;ak=ai;al=aj;sg(ak|0,al|0,8)|0;am=g;an=l|0;ao=an+8|0;c[ao>>2]=am;ap=f;aq=ap&65535;ar=l|0;as=ar+12|0;b[as>>1]=aq;au=m;av=au&255;aw=l|0;ax=aw;ay=ax+7|0;a[ay]=av;az=l+24|0;aA=l+20|0;c[aA>>2]=az;aB=l+24|0;aC=aB;aD=j;sg(aC|0,aD|0,40)|0;aE=j+36|0;aF=c[aE>>2]|0;aG=(aF|0)>0;i=h;return aG|0}return 0}function h3(a){a=a|0;return c[(c[a+20>>2]|0)+36>>2]<<2|0}function h4(a){a=a|0;var b=0;b=a;c[b+28>>2]=0;c[b+32>>2]=0;c[b+40>>2]=0;c[b+20>>2]=3;c[b+16>>2]=c[b+(c[b+20>>2]<<2)>>2];return}function h5(b){b=b|0;var d=0;d=b;if((a[(c[d+24>>2]|0)+4|0]&64|0)==0){return}if((c[d+40>>2]|0)==0){return}b=d+40|0;c[b>>2]=(c[b>>2]|0)-1;return}function h6(b){b=b|0;var e=0,f=0;e=b;if((c[e+48>>2]|0)==0){return}b=e+48|0;f=(c[b>>2]|0)-1|0;c[b>>2]=f;if((f|0)!=0){return}c[e+48>>2]=a[(c[e+24>>2]|0)+2|0]&7;f=(c[e+36>>2]|0)-1+((d[(c[e+24>>2]|0)+2|0]|0)>>2&2)|0;if(f>>>0<15>>>0){c[e+36>>2]=f}return}function h7(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0;g=f;f=b;b=e;do{if((b|0)==4){if((g&128|0)==0){break}c[f+48>>2]=a[(c[f+24>>2]|0)+2|0]&7;c[f+36>>2]=(d[(c[f+24>>2]|0)+2|0]|0)>>4;c[f+44>>2]=1;if((c[f+40>>2]|0)==0){c[f+40>>2]=64}h=1;i=h;return i|0}else if((b|0)==2){if((g>>4|0)==0){c[f+44>>2]=0}}else if((b|0)==1){c[f+40>>2]=64-(a[(c[f+24>>2]|0)+1|0]&63)}}while(0);h=0;i=h;return i|0}function h8(a){a=a|0;var b=0;b=a;c[b+64>>2]=0;c[b+60>>2]=0;c[b+56>>2]=0;hS(b);return}function h9(b){b=b|0;var e=0,f=0,g=0;e=b;b=(a[c[e+24>>2]|0]&112)>>4;if((b|0)==0){return}if((c[e+56>>2]|0)==0){return}f=e+56|0;g=(c[f>>2]|0)-1|0;c[f>>2]=g;if((g|0)!=0){return}c[e+56>>2]=b;a[(c[e+24>>2]|0)+3|0]=c[e+60>>2]&255;a[(c[e+24>>2]|0)+4|0]=((d[(c[e+24>>2]|0)+4|0]|0)&-8|c[e+60>>2]>>8&7)&255;b=c[e+60>>2]>>(a[c[e+24>>2]|0]&7);if((a[c[e+24>>2]|0]&8|0)!=0){b=-b|0}g=e+60|0;c[g>>2]=(c[g>>2]|0)+b;if((c[e+60>>2]|0)<0){c[e+60>>2]=0}else{if((c[e+60>>2]|0)>=2048){c[e+56>>2]=0;c[e+60>>2]=2048}}return}function ia(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=b;b=e;e=f;f=a;if((c[f+60>>2]|0)==2048){e=0}a=d[12168+((d[(c[f+24>>2]|0)+1|0]|0)>>6)|0]|0;h=c[f+36>>2]&e;if((c[f+64>>2]|0)>=(a|0)){h=-h|0}i=ib(f)|0;if((i-1|0)>>>0>2040>>>0){h=c[f+36>>2]>>1;e=0}j=h-(c[f+32>>2]|0)|0;if((j|0)!=0){c[f+32>>2]=h;fZ(c[f+52>>2]|0,g,j,c[f+16>>2]|0)}g=g+(c[f+28>>2]|0)|0;if((e|0)==0){g=b}if((g|0)>=(b|0)){k=g;l=b;m=k-l|0;n=f;o=n+28|0;c[o>>2]=m;return}e=2048-i<<2;i=c[f+16>>2]|0;j=c[f+64>>2]|0;p=h<<1;do{j=j+1&7;if((j|0)==0){q=1181}else{if((j|0)==(a|0)){q=1181}}if((q|0)==1181){q=0;p=-p|0;gz(c[f+52>>2]|0,g,p,i)}g=g+e|0;}while((g|0)<(b|0));c[f+64>>2]=j;c[f+32>>2]=p>>1;k=g;l=b;m=k-l|0;n=f;o=n+28|0;c[o>>2]=m;return}function ib(b){b=b|0;var e=0;e=b;return((a[(c[e+24>>2]|0)+4|0]&7)<<8)+(d[(c[e+24>>2]|0)+3|0]|0)|0}function ic(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;h=e;e=f;f=g;g=b;b=c[g+36>>2]&f;i=13-(a[(c[g+24>>2]|0)+3|0]&8)|0;if(((c[g+56>>2]|0)>>>(i>>>0)&2|0)!=0){b=-b|0}j=b-(c[g+32>>2]|0)|0;if((j|0)!=0){c[g+32>>2]=b;gB(c[g+52>>2]|0,h,j,c[g+16>>2]|0)}h=h+(c[g+28>>2]|0)|0;if((f|0)==0){h=e}if((h|0)>=(e|0)){k=h;l=e;m=k-l|0;n=g;o=n+28|0;c[o>>2]=m;return}f=(d[12304+(a[(c[g+24>>2]|0)+3|0]&7)|0]|0)<<((d[(c[g+24>>2]|0)+3|0]|0)>>4);j=c[g+16>>2]|0;p=id(j,f)|0;q=bE(j,h)|0;r=c[g+56>>2]|0;s=b<<1;do{b=(r>>>(i>>>0))+1|0;h=h+f|0;r=r<<1;if((b&2|0)!=0){s=-s|0;r=r|1;gV(c[g+52>>2]|0,q,s,j)}q=q+p|0;}while((h|0)<(e|0));c[g+56>>2]=r;c[g+32>>2]=s>>1;k=h;l=e;m=k-l|0;n=g;o=n+28|0;c[o>>2]=m;return}function id(a,b){a=a|0;b=b|0;return $(b,c[a>>2]|0)|0}function ie(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=b;b=e;e=f;f=a;a=(c[f+36>>2]|0)-1&7;h=((d[f+56+(c[f+52>>2]|0)|0]|0)>>a&e)<<1;i=ib(f)|0;if((i-1|0)>>>0>2044>>>0){h=30>>a&e;e=0}j=h-(c[f+32>>2]|0)|0;if((j|0)!=0){c[f+32>>2]=h;gB(c[f+48>>2]|0,g,j,c[f+16>>2]|0)}g=g+(c[f+28>>2]|0)|0;if((e|0)==0){g=b}if((g|0)>=(b|0)){k=g;l=b;m=k-l|0;n=f;o=n+28|0;c[o>>2]=m;return}e=c[f+16>>2]|0;j=2048-i<<1;i=(c[f+52>>2]|0)+1&31;do{h=(d[f+56+i|0]|0)>>a<<1;i=i+1&31;p=h-(c[f+32>>2]|0)|0;if((p|0)!=0){c[f+32>>2]=h;gC(c[f+48>>2]|0,g,p,e)}g=g+j|0;}while((g|0)<(b|0));c[f+52>>2]=i-1&31;k=g;l=b;m=k-l|0;n=f;o=n+28|0;c[o>>2]=m;return}function ig(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=d;d=e;e=f;f=b;d=d-(g*5|0)|0;b=f+112|0;h=g;if((h|0)==2){ih(f+180|0,d,e);return}else if((h|0)==3){if(h7(f+268|0,d,e)|0){c[f+324>>2]=32767}return}else if((h|0)==0){b=f+44|0}else if((h|0)!=1){return}do{if(h7(b,d,e)|0){if((g|0)!=0){break}c[f+104>>2]=ib(f+44|0)|0;do{if((a[f+328|0]&112|0)!=0){if((a[f+328|0]&7|0)==0){break}c[f+100>>2]=1;h9(f+44|0)}}while(0)}}while(0);return}function ih(a,b,e){a=a|0;b=b|0;e=e|0;var f=0;f=e;e=a;a=b;if((a|0)==1){c[e+40>>2]=256-(d[(c[e+24>>2]|0)+1|0]|0);return}else if((a|0)==2){c[e+36>>2]=f>>5&3;return}else if((a|0)==4){if((f&128&(d[c[e+24>>2]|0]|0)|0)!=0){c[e+52>>2]=0;c[e+44>>2]=1;if((c[e+40>>2]|0)==0){c[e+40>>2]=256}}return}else if((a|0)==0){if((f&128|0)==0){c[e+44>>2]=0}return}else{return}}function ii(){fd(22896,-47.0,2.0e3);return}function ij(){fd(22816,0.0,300.0);return}function ik(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+80|0;d=b|0;e=a;il(e+336|0);bR(e);c[e>>2]=16416;im(e+400|0);hK(e+25136|0);g5(e,c[22]|0);fh(e,14096);g6(e,14080);g7(e,6);io(e,21);ip(e,1.2);fd(d,-1.0,120.0);fn(e,d);i=b;return}function il(a){a=a|0;var b=0;b=a;c[b+16>>2]=0;c[b+20>>2]=b+24;return}function im(a){a=a|0;iY(a);return}function io(a,b){a=a|0;b=b|0;c[a+224>>2]=b;return}function ip(a,b){a=a|0;b=+b;var c=0;c=a;if((fl(c)|0)!=0){at(7672,7224,228,10776)}else{}h[c+248>>3]=b;return}function iq(a){a=a|0;iW(a);return}function ir(a){a=a|0;var b=0;b=a;is(b);bT(b);return}function is(a){a=a|0;var b=0;b=a;c[b>>2]=16416;iq(b+400|0);bU(b);return}function it(a){a=a|0;var b=0;b=a;iu(b+400|0);ff(b);return}function iu(a){a=a|0;cb(a|0);return}function iv(a,b,c){a=a|0;b=b|0;c=c|0;iw(a+436|0,b);return 0}function iw(a,b){a=a|0;b=b|0;var c=0;c=a;a=b;ew(a+272|0,c+16|0,32);ew(a+784|0,c+48|0,32);ew(a+1040|0,c+80|0,32);return}function ix(b,c){b=b|0;c=c|0;var e=0,f=0,g=0,h=0;e=b;b=iy(e+400|0,c,112,e+436|0,0)|0;if((b|0)!=0){f=b;g=f;return g|0}eu(e,d[e+440|0]|0);b=iz(e+436|0)|0;if((b|0)!=0){f=b;g=f;return g|0}if((d[e+439|0]|0|0)!=1){eT(e,2584)}if((a[e+451|0]&120|0)!=0){eT(e,1896)}b=g2(e+442|0)|0;if((d[e+443|0]|0|(d[e+445|0]|0)|(d[e+447|0]|0)|0)>127){h=1314}else{if(b>>>0<1024>>>0){h=1314}}if((h|0)==1314){eT(e,1168)}he(e,4);hM(e+25136|0,+hf(e));f=b3(e,4194304)|0;g=f;return g|0}function iy(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return ca(a,b,c,d,e,16392)|0}function iz(a){a=a|0;var b=0,d=0;if((sj(a|0,8664,3)|0)!=0){b=c[2]|0;d=b;return d|0}else{b=0;d=b;return d|0}return 0}function iA(a,b){a=a|0;b=b|0;hO(a+25136|0,b);return}function iB(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;hP(a+25136|0,b,c,d,e);return}function iC(a,b){a=a|0;b=b|0;var c=0;c=a;a=iD(c+400|0,b<<14)|0;do{if((a|0)==0){if((iE(c+400|0)|0)<=16384){break}return}}while(0);h1(c+336|0,16384,16384,iF(c+400|0,a)|0);return}function iD(a,b){a=a|0;b=b|0;return b&c[a+16>>2]|0}function iE(a){a=a|0;return c[a+20>>2]|0}function iF(a,b){a=a|0;b=b|0;var d=0;d=a;a=iD(d,b)|0;b=a-(c[d+12>>2]|0)|0;if(b>>>0>((eq(d|0)|0)-16392|0)>>>0){b=0}return ce(d|0,b)|0}function iG(b){b=b|0;var e=0,f=0.0;e=b;if((a[e+451|0]&4|0)!=0){c[e+428>>2]=256-(d[e+24874|0]|0)<<(d[14112+(a[e+24875|0]&3)|0]|0)-((d[e+451|0]|0)>>7)}else{c[e+428>>2]=70224}if(+ho(e)==1.0){return}f=+(c[e+428>>2]|0);c[e+428>>2]=~~(f/+ho(e));return}function iH(a,d){a=a|0;d=d|0;var e=0;e=a;c[e+344>>2]=d;d=e+348|0;a=(b[d>>1]|0)-1&65535;b[d>>1]=a;h_(e,a&65535,240);a=e+348|0;d=(b[a>>1]|0)-1&65535;b[a>>1]=d;h_(e,d&65535,13);return}function iI(a,b){a=a|0;b=+b;var c=0;c=a;hL(c+25136|0,b);iG(c);return}function iJ(e,f){e=e|0;f=f|0;var g=0,h=0,i=0;g=f;f=e;e=b5(f,g)|0;if((e|0)!=0){h=e;i=h;return i|0}sf(f+548|0,0,16384);sf(f+16932|0,-1|0,8064);sf(f+24996|0,0,136);a[f+24868|0]=0;hN(f+25136|0);e=0;while(1){if((e|0)>=48){break}hT(f+25136|0,0,e+65296|0,d[21832+e|0]|0);e=e+1|0}e=g2(f+442|0)|0;iK(f+400|0,e);c[f+352>>2]=e;h$(f+336|0,iL(f+400|0)|0);h1(f+336|0,40960,24576,f+548|0);h1(f+336|0,0,16384,iF(f+400|0,0)|0);iC(f,(iE(f+400|0)|0)>16384|0);a[f+24874|0]=a[f+450|0]|0;a[f+24875|0]=a[f+451|0]|0;iG(f);c[f+432>>2]=c[f+428>>2];a[f+342|0]=g&255;c[f+344>>2]=61453;b[f+348>>1]=(g2(f+448|0)|0)&65535;c[f+424>>2]=0;iH(f,g2(f+444|0)|0);h=0;i=h;return i|0}function iK(a,b){a=a|0;b=b|0;cg(a,b,16384);return}function iL(a){a=a|0;return cd(a|0)|0}function iM(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;d=b;b=a;c[b+424>>2]=0;while(1){if((c[b+424>>2]|0)>=(c[d>>2]|0)){break}a=(c[d>>2]|0)-(c[b+424>>2]|0)|0;c[b+424>>2]=c[d>>2];e=(h2(b+336|0,a)|0)&1;a=h3(b+336|0)|0;f=b+424|0;c[f>>2]=(c[f>>2]|0)-a;if(e&1){if((c[b+344>>2]|0)==61453){if((c[b+432>>2]|0)>(c[d>>2]|0)){g=1370;break}if((c[b+424>>2]|0)<(c[b+432>>2]|0)){c[b+424>>2]=c[b+432>>2]}e=b+432|0;c[e>>2]=(c[e>>2]|0)+(c[b+428>>2]|0);iH(b,g2(b+446|0)|0)}else{if((c[b+344>>2]|0)>65535){e=b+344|0;c[e>>2]=c[e>>2]&65535}else{eT(b,800);c[b+344>>2]=(c[b+344>>2]|0)+1&65535;e=b+424|0;c[e>>2]=(c[e>>2]|0)+6}}}}if((g|0)==1370){c[b+424>>2]=c[d>>2]}c[d>>2]=c[b+424>>2];d=b+432|0;c[d>>2]=(c[d>>2]|0)-(c[b+424>>2]|0);if((c[b+432>>2]|0)>=0){h=b+25136|0;i=b+424|0;j=c[i>>2]|0;hV(h,j);return 0}c[b+432>>2]=0;h=b+25136|0;i=b+424|0;j=c[i>>2]|0;hV(h,j);return 0}function iN(){var a=0,b=0,c=0;a=hB(26888)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;ik(b);c=b}return c|0}function iO(){var a=0,b=0,c=0;a=hB(432)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;iP(b);c=b}return c|0}function iP(a){a=a|0;iQ(a);return}function iQ(a){a=a|0;var b=0;b=a;hE(b);c[b>>2]=15584;g5(b,c[22]|0);return}function iR(a){a=a|0;iV(a);return}function iS(a){a=a|0;var b=0;b=a;iR(b);bT(b);return}function iT(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;e=a;a=b;b=a5[c[(c[a>>2]|0)+12>>2]&127](a,e+316|0,112)|0;if((b|0)==0){eu(e,d[e+320|0]|0);f=iz(e+316|0)|0;g=f;return g|0}if((b|0)==19344){h=c[2]|0}else{h=b}f=h;g=f;return g|0}function iU(a,b,c){a=a|0;b=b|0;c=c|0;iw(a+316|0,b);return 0}function iV(a){a=a|0;fO(a);return}function iW(a){a=a|0;iX(a);return}function iX(a){a=a|0;ek(a|0);return}function iY(a){a=a|0;iZ(a);return}function iZ(a){a=a|0;ei(a|0);return}function i_(){ii();ij();return}function i$(a){a=a|0;var b=0;b=a;fg(b);cT(b+320|0);c[b>>2]=16304;c[b+320>>2]=16388;bu(b+1648|0);i0(b+1692|0);gX(b+1696|0);gD(b+2256|0);c[b+1176>>2]=0;c[b+1184>>2]=0;g5(b,c[20]|0);fh(b,14048);g7(b,1);return}function i0(a){a=a|0;jz(a);return}function i1(a){a=a|0;var b=0;b=a;i3(b);bT(b);return}function i2(a){a=a|0;i1(a-320|0);return}function i3(a){a=a|0;var b=0;b=a;c[b>>2]=16304;c[b+320>>2]=16388;gI(b+2256|0);gc(b+1692|0);bv(b+1648|0);cY(b+320|0);fj(b);return}function i4(a){a=a|0;i3(a-320|0);return}function i5(a,b,c){a=a|0;b=b|0;c=c|0;c=a;i6(c+1196|0,i7(c)|0,b);return 0}function i6(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=b;b=d;if((sj(e|0,10416,4)|0)!=0){return}a=(a*50|0|0)/3|0;d=ji(e+420|0)|0;if((d|0)!=0){c[b+8>>2]=(d*50|0|0)/3|0;c[b+12>>2]=a-(c[b+8>>2]|0)}else{c[b+4>>2]=a;c[b+8>>2]=a;c[b+12>>2]=0}if((a_(e+4|0,7656)|0)!=0){ew(b+528|0,e+4|0,32)}if((a_(e+36|0,7208)|0)!=0){ew(b+272|0,e+36|0,32)}if((a_(e+68|0,6912)|0)!=0){ew(b+1040|0,e+68|0,32)}if((a_(e+132|0,6752)|0)!=0){ew(b+1552|0,e+132|0,32)}if((a_(e+164|0,6528)|0)!=0){ew(b+1296|0,e+164|0,256)}return}function i7(a){a=a|0;var b=0;b=a;return i8(c[b+1176>>2]|0,c[b+1188>>2]|0)|0}function i8(a,b){a=a|0;b=b|0;var c=0,e=0,f=0;c=a;a=b;b=0;while(1){if(c>>>0>=a>>>0){break}e=c;c=e+1|0;f=d[e]|0;if((f|0)==0){b=b+1|0}else if((f|0)==1|(f|0)==2){c=c+2|0}else if((f|0)==3){c=c+1|0}}return b|0}function i9(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0;c=i;i=i+24|0;d=c|0;e=b;b=a;ja(d,-32.0,8e3,e,0);gK(b+2256|0,d);gM(b+1696|0,d);gG(b+2256|0,+hf(b)*.405);gJ(b+1696|0,+hf(b)*.00146484375);h[b+1624>>3]=+(e|0)*+jb(b+320|0,1.6666666666666667,.99,+hf(b)*3.0);d=by(b+1648|0,e,66)|0;if((d|0)!=0){f=d;g=f;i=c;return g|0}bz(b+1648|0,3580020);d=gb(b+1692|0,+h[b+1624>>3],7671471.428571428)|0;if((d|0)!=0){f=d;g=f;i=c;return g|0}d=c_(b+320|0,~~(+(e|0)*.06666666666666667))|0;if((d|0)!=0){f=d;g=f;i=c;return g|0}f=0;g=f;i=c;return g|0}function ja(a,b,c,d,e){a=a|0;b=+b;c=c|0;d=d|0;e=e|0;jp(a,b,c,d,e);return}function jb(a,b,c,d){a=a|0;b=+b;c=+c;d=+d;return+(+dQ(a+32|0,b,c,d*.5))}function jc(a,b){a=a|0;b=+b;var d=0;d=a;if(b<.25){fp(d,.25);return}if((dt(d+1648|0)|0)==0){return}c[d+1632>>2]=~~(59667.0/+ho(d));b=+(fl(d)|0);c0(d+320|0,~~(b/(+ho(d)*60.0)));return}function jd(b,c){b=b|0;c=c|0;var d=0,e=0;d=c;c=b;b0(c,d);gi(c+1692|0,d);a[c+1645|0]=(d&64|0)!=0|0;b=c+2256|0;if((d&128|0)!=0){e=0;je(b,e);return}else{e=c+1648|0;je(b,e);return}}function je(a,b){a=a|0;b=b|0;var c=0;c=b;gO(a,c,c,c);return}function jf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+8|0;f=e|0;g=b;b=d;d=a;c[f>>2]=0;a=jg(g,b,f)|0;if((a|0)!=0){h=a;j=h;i=e;return j|0}he(d,8);c[d+1176>>2]=g+(c[f>>2]|0);c[d+1188>>2]=g+b;c[d+1180>>2]=0;if((c[f>>2]|0)!=0){f=d+1196|0;b=g;sg(f|0,b|0,428)|0}else{sf(d+1196|0,0,428)}h=0;j=h;i=e;return j|0}function jg(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0;f=a;a=b;b=e;if((a|0)<4){g=c[2]|0;h=g;return h|0}do{if((sj(f|0,10416,4)|0)==0){if((a|0)<429){g=c[2]|0;h=g;return h|0}if((sj(f+424|0,22040,4)|0)!=0){g=9304;h=g;return h|0}if((b|0)!=0){c[b>>2]=428}}else{if((d[f]|0|0)<=3){break}g=c[2]|0;h=g;return h|0}}while(0);g=0;h=g;return h|0}function jh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=b;b=b6(e,d)|0;if((b|0)!=0){f=b;g=f;return g|0}c[e+1184>>2]=c[e+1176>>2];c[e+1192>>2]=ji(e+1616|0)|0;c[e+1640>>2]=0;a[e+1644|0]=0;c[e+1636>>2]=-1;gd(e+1692|0);gH(e+2256|0,0,0);bw(e+1648|0,1);c3(e+320|0);f=0;g=f;return g|0}function ji(a){a=a|0;var b=0;b=a;return(d[b+3|0]|0)<<24|(d[b+2|0]|0)<<16|(d[b+1|0]|0)<<8|(d[b|0]|0)|0}function jj(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0;e=b;b=a;a=0;f=c[b+1184>>2]|0;while(1){g=f;f=g+1|0;h=d[g]|0;g=h;if((h|0)==0){break}h=f;f=h+1|0;if((g|0)<=2){f=f+1|0}do{if((g|0)==1){if((d[h]|0|0)!=42){break}a=a+1|0}}while(0)}f=e;h=0;do{if((c[b+1640>>2]|0)!=0){i=1602}else{if((a|0)==0){i=1602;break}if((e|0)>=(a|0)){i=1602;break}f=a;h=a-e|0}}while(0);if((i|0)==1602){do{if((c[b+1640>>2]|0)!=0){if((a|0)!=0){break}if((e|0)>=(c[b+1640>>2]|0)){break}f=c[b+1640>>2]|0}}while(0)}a=((id(b+1648|0,c[b+1632>>2]|0)|0)>>>0)/(f>>>0)|0;f=(bE(b+1648|0,0)|0)+($(a,h)|0)+(a>>>1)|0;h=c[b+1636>>2]|0;if((h|0)<0){h=d[b+3856|0]|0}i=0;while(1){if((i|0)>=(e|0)){break}g=(d[b+3856+i|0]|0)-h|0;h=h+g|0;gV(b+1696|0,f,g,b+1648|0);f=f+a|0;i=i+1|0}c[b+1636>>2]=h;return}function jk(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=b;b=0;f=c[e+1184>>2]|0;do{if((c[e+1192>>2]|0)!=0){g=e+1192|0;h=(c[g>>2]|0)-1|0;c[g>>2]=h;if((h|0)!=0){break}c[e+1180>>2]=f}}while(0);while(1){h=f;f=h+1|0;g=d[h]|0;h=g;if((g|0)==0){break}g=f;f=g+1|0;i=d[g]|0;if((h|0)==1){g=f;f=g+1|0;j=d[g]|0;if((i|0)!=42){if((i|0)==43){a[e+1644|0]=(j&128|0)!=0|0}gg(e+1692|0,i,j)}else{if((b|0)<1024){a[e+3856+b|0]=j&255;b=b+(a[e+1644|0]&1)|0}}}else{if((h|0)==2){j=f;f=j+1|0;gh(e+1692|0,i,d[j]|0)}else{if((h|0)==3){gU(e+2256|0,0,i)}else{f=f-1|0}}}}if(f>>>0>=(c[e+1188>>2]|0)>>>0){if((c[e+1180>>2]|0)!=0){f=c[e+1180>>2]|0}else{jl(e)}}c[e+1184>>2]=f;if((b|0)==0){k=b;l=e+1640|0;c[l>>2]=k;return}if(a[e+1645|0]&1){k=b;l=e+1640|0;c[l>>2]=k;return}jj(e,b);k=b;l=e+1640|0;c[l>>2]=k;return}function jl(b){b=b|0;a[b+272|0]=1;return}function jm(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=c;c=d;d=a;if(!(ea(d)|0)){jk(d)}gS(d+2256|0,b);sf(c|0,0,e<<1|0);gl(d+1692|0,e>>1,c);return e|0}function jn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return jm(a-320|0,b,c,d)|0}function jo(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=a;db(d+320|0,b,c,d+1648|0);return 0}function jp(a,b,d,e,f){a=a|0;b=+b;d=d|0;e=e|0;f=f|0;var g=0;g=a;h[g>>3]=b;c[g+8>>2]=d;c[g+12>>2]=e;c[g+16>>2]=f;return}function jq(){var a=0,b=0,c=0;a=hB(4880)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;i$(b);c=b}return c|0}function jr(){var a=0,b=0,c=0;a=hB(328)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;js(b);c=b}return c|0}function js(a){a=a|0;jt(a);return}function jt(a){a=a|0;var b=0;b=a;hE(b);c[b>>2]=15440;g5(b,c[20]|0);return}function ju(a){a=a|0;jy(a);return}function jv(a){a=a|0;var b=0;b=a;ju(b);bT(b);return}function jw(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;b=d;d=a;c[d+316>>2]=e;c[d+320>>2]=e+b;c[d+324>>2]=0;return jg(e,b,d+324|0)|0}function jx(a,b,d){a=a|0;b=b|0;d=d|0;d=a;a=i8((c[d+316>>2]|0)+(c[d+324>>2]|0)|0,c[d+320>>2]|0)|0;i6(c[d+316>>2]|0,a,b);return 0}function jy(a){a=a|0;fO(a);return}function jz(a){a=a|0;c[a>>2]=0;return}function jA(a){a=a|0;var b=0;b=a;gX(b+536|0);a=b+528|0;do{a=a-88|0;c[a+60>>2]=0;c[a+64>>2]=0;c[a+68>>2]=0;c[a+72>>2]=0;c[a+76>>2]=0;}while((a|0)!=(b|0));jB(b);return}function jB(b){b=b|0;var d=0;d=b;c[d+528>>2]=0;c[d+532>>2]=255;b=d+528|0;do{b=b-88|0;sf(b|0,0,60);c[b+80>>2]=1;a[b+84|0]=64;a[b+54|0]=-1;}while((b|0)!=(d|0));return}function jC(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=b;b=a;if(g>>>0<6>>>0){}else{at(4512,8840,58,11352)}c[b+(g*88|0)+68>>2]=d;c[b+(g*88|0)+72>>2]=e;c[b+(g*88|0)+76>>2]=f;f=b+528|0;do{f=f-88|0;jD(b,f);}while((f|0)!=(b|0));return}function jD(e,f){e=e|0;f=f|0;var g=0,h=0,i=0;g=f;f=e;e=(a[g+84|0]&31)-60|0;h=e+(d[g+54|0]>>3&30)+(c[f+532>>2]>>3&30)|0;if((h|0)<0){h=0}i=e+(d[g+54|0]<<1&30)+(c[f+532>>2]<<1&30)|0;if((i|0)<0){i=0}h=b[13984+(h<<1)>>1]|0;i=b[13984+(i<<1)>>1]|0;c[g+60>>2]=c[g+68>>2];c[g+64>>2]=0;if((h|0)!=(i|0)){c[g+60>>2]=c[g+72>>2];c[g+64>>2]=c[g+76>>2]}f=g+36|0;c[f>>2]=(c[f>>2]|0)+(h-(b[g+32>>1]|0)<<4);f=g+40|0;c[f>>2]=(c[f>>2]|0)+(i-(b[g+34>>1]|0)<<4);b[g+32>>1]=h&65535;b[g+34>>1]=i&65535;return}function jE(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;h=f;f=g;g=e;e=c[g+60>>2]|0;if((e|0)==0){i=f;j=g+56|0;c[j>>2]=i;return}if((a[g+84|0]&128|0)==0){i=f;j=g+56|0;c[j>>2]=i;return}k=d[g+55|0]|0;l=b[g+32>>1]|0;m=$(k,l)|0;n=m-(c[g+36>>2]|0)|0;if((n|0)!=0){gB(h,c[g+56>>2]|0,n,e)}fX(e);n=c[g+64>>2]|0;m=b[g+34>>1]|0;if((n|0)!=0){o=$(k,m)|0;p=o-(c[g+40>>2]|0)|0;if((p|0)!=0){gB(h,c[g+56>>2]|0,p,n)}fX(n)}p=(c[g+56>>2]|0)+(c[g+44>>2]|0)|0;if((p|0)<(f|0)){if((a[g+52|0]&128|0)!=0){if((l|m|0)!=0){o=32-(a[g+52|0]&31)<<6;q=c[g+80>>2]|0;do{r=31&-(q>>>1&1);q=q>>>1^57352&-(q&1);s=r-k|0;if((s|0)!=0){k=r;gB(h,p,$(s,l)|0,e);if((n|0)!=0){gB(h,p,$(s,m)|0,n)}}p=p+o|0;}while((p|0)<(f|0));c[g+80>>2]=q;if((q|0)!=0){}else{at(5712,8840,127,11288)}}}else{if((a[g+84|0]&64|0)==0){q=(d[g+53|0]|0)+1&31;o=c[g+48>>2]<<1;do{if((o|0)>=14){if((l|m|0)==0){t=1747;break}do{s=d[g+q|0]|0;q=q+1&31;r=s-k|0;if((r|0)!=0){k=s;gB(h,p,$(r,l)|0,e);if((n|0)!=0){gB(h,p,$(r,m)|0,n)}}p=p+o|0;}while((p|0)<(f|0))}else{t=1747}}while(0);if((t|0)==1747){if((o|0)==0){o=1}t=(f-p+o-1|0)/(o|0)|0;q=q+t|0;p=p+($(t,o)|0)|0}a[g+53|0]=q-1&31}}}p=p-f|0;if((p|0)<0){p=0}c[g+44>>2]=p;a[g+55|0]=k&255;c[g+36>>2]=$(k,l)|0;c[g+40>>2]=$(k,m)|0;i=f;j=g+56|0;c[j>>2]=i;return}function jF(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0;h=e;e=f;f=g;g=b;if((e|0)==2048){c[g+528>>2]=f&7;return}if((e|0)==2049){if((c[g+532>>2]|0)!=(f|0)){c[g+532>>2]=f;b=g+528|0;do{b=b-88|0;jE(b,g+536|0,h);jD(g,g|0);}while((b|0)!=(g|0))}}else{if((c[g+528>>2]|0)<6){b=g+((c[g+528>>2]|0)*88|0)|0;jE(b,g+536|0,h);switch(e|0){case 2051:{c[b+48>>2]=c[b+48>>2]&255|(f&15)<<8;break};case 2052:{if((a[b+84|0]&64&~f|0)!=0){a[b+53|0]=0}a[b+84|0]=f&255;jD(g,b);break};case 2054:{f=f&31;if((a[b+84|0]&64|0)!=0){if((a[b+84|0]&128|0)!=0){a[b+55|0]=f&255}}else{a[b+(d[b+53|0]|0)|0]=f&255;a[b+53|0]=(d[b+53|0]|0)+1&31}break};case 2057:{do{if((f&128|0)==0){if((f&3|0)==0){break}}}while(0);break};case 2053:{a[b+54|0]=f&255;jD(g,b);break};case 2050:{c[b+48>>2]=c[b+48>>2]&3840|f;break};case 2055:{if(b>>>0>=(g+352|0)>>>0){a[b+52|0]=f&255}break};default:{}}}}return}function jG(a,b){a=a|0;b=b|0;var d=0,e=0;d=b;b=a;a=b+528|0;do{a=a-88|0;if((d|0)>(c[a+56>>2]|0)){jE(a,b+536|0,d)}if((c[a+56>>2]|0)>=(d|0)){}else{at(4232,8840,311,11336)}e=a+56|0;c[e>>2]=(c[e>>2]|0)-d;}while((a|0)!=(b|0));return}function jH(a,b){a=a|0;b=b|0;var c=0,e=0;c=b;b=a;a=d[jI(b+336|0,c)|0]|0;if((d[b+8536+(c>>>13)|0]|0|0)!=255){e=a;return e|0}a=kl(b,c)|0;e=a;return e|0}function jI(a,b){a=a|0;b=b|0;var d=0;d=b;return(c[(c[a+8212>>2]|0)+(d>>>13<<2)>>2]|0)+((d>>>0)%8192|0)|0}function jJ(b,e,f){b=b|0;e=e|0;f=f|0;var g=0;g=e;e=f;f=b;b=c[f+8604+(g>>>13<<2)>>2]|0;g=g&8191;if((b|0)!=0){a[b+g|0]=e&255;return}if((d[f+8536+(g>>>13)|0]|0|0)==255){ki(f,g,e)}return}function jK(d){d=d|0;var e=0;e=d;c[e+8212>>2]=e+8216;c[e+8256>>2]=0;c[e+8252>>2]=0;c[e+8260>>2]=1073741824;c[e+8264>>2]=1073741824;a[e+8197|0]=4;a[e+8198|0]=0;b[e+8192>>1]=0;a[e+8194|0]=0;a[e+8195|0]=0;a[e+8196|0]=0;ej();return}function jL(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0;f=d;d=e;e=b;if(f>>>0<=8>>>0){}else{at(4424,8744,71,11320)}if(d>>>0<256>>>0){}else{at(5688,8744,72,11320)}a[e+8200+f|0]=d&255;if((e|0)==0){g=0}else{g=e-336|0}b=(jM(g,f,d)|0)+(-(f<<13&8191)|0)|0;c[(c[e+8212>>2]|0)+(f<<2)>>2]=b;return}function jM(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=b;b=d;d=a;c[d+8604+(e<<2)>>2]=0;if((b|0)<128){f=jQ(d+8640|0,b<<13)|0;g=f;return g|0}a=0;h=b;if((h|0)==249|(h|0)==250|(h|0)==251){a=d+9848+(b-249<<13)|0}else if((h|0)==248){a=d+336|0}else{f=jR(d+8640|0)|0;g=f;return g|0}c[d+8604+(e<<2)>>2]=a;f=a;g=f;return g|0}function jN(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0;h=i;i=i+48|0;j=h|0;k=f;f=0;jO(k,g);g=j;l=k+8216|0;sg(g|0,l|0,44)|0;c[k+8212>>2]=j;l=c[j+40>>2]|0;g=e[k+8192>>1]|0;m=d[k+8194|0]|0;n=d[k+8195|0]|0;o=d[k+8196|0]|0;p=(d[k+8198|0]|0)+1|256;q=d[k+8197|0]|0;r=q&76;s=q<<8;t=s;s=s|~q&2;L2086:while(1){q=c[k+8264>>2]|0;do{if((r&4|0)==0){if((q|0)<=(c[k+8260>>2]|0)){break}q=c[k+8260>>2]|0}}while(0);q=c[j+(g>>>13<<2)>>2]|0;q=q+(g&8191)|0;u=q;q=u+1|0;v=d[u]|0;g=g+1|0;u=d[13728+v|0]|0;w=l+u|0;l=w;do{if((w|0)>=0){if((l|0)<(u|0)){x=1850;break}else{l=l-u|0;x=2303;break}}else{x=1850}}while(0);L2099:do{if((x|0)==1850){x=0;u=d[q]|0;L2101:do{switch(v|0){case 120:{if((r&4|0)!=0){continue L2086}else{r=r|4;x=2242;break L2101}break};case 83:{w=u;g=g+1|0;y=0;while(1){if((y|0)>=8){break}if((w&1<<y|0)!=0){jL(k,y,m)}y=y+1|0}continue L2086;break};case 67:{g=g+1|0;y=k+8200|0;do{if((u&1|0)!=0){m=d[y]|0}y=y+1|0;w=u>>>1;u=w;}while((w|0)!=0);continue L2086;break};case 3:case 19:case 35:{y=v>>>4;if((y|0)!=0){y=y+1|0}g=g+1|0;c[j+40>>2]=l;if((k|0)==0){z=0}else{z=k-336|0}ke(z,y,u);l=c[j+40>>2]|0;continue L2086;break};case 234:{continue L2086;break};case 84:{f=1;continue L2086;break};case 212:{continue L2086;break};case 244:{f=1;continue L2086;break};case 227:{A=0;x=2270;break};case 243:{A=1;x=2270;break};case 211:{B=1;C=0;x=2274;break};case 195:{B=-1;C=-1;x=2274;break};case 115:{B=1;C=1;x=2274;break};case 113:{u=(d[k+u|0]|0)+o+((d[k+(u+1&255)|0]|0)<<8)|0;x=2115;break};case 117:{u=u+n&255;x=2110;break};case 101:{x=2110;break};case 121:{u=u+o|0;x=2113;break};case 125:{u=u+n|0;x=2113;break};case 109:{x=2114;break};case 105:{x=2119;break};case 74:{t=0;x=2125;break};case 16:{g=g+1|0;if((s&32896|0)!=0){x=1843;break L2101}else{g=g+((u&255)<<24>>24)&65535;continue L2086}break};case 4:case 20:{D=u+8192|0;x=1978;break};case 145:{E=(d[k+(u+1&255)|0]|0)<<8;E=E+((d[k+u|0]|0)+o)|0;g=g+1|0;x=1925;break};case 129:{u=u+n&255;x=1922;break};case 255:{if((g|0)!=8192){x=1883;break L2101}l=0;x=2303;break L2099;break};case 242:{x=2092;break};case 241:{u=(d[k+u|0]|0)+o+((d[k+(u+1&255)|0]|0)<<8)|0;x=2100;break};case 245:{u=u+n&255;x=2095;break};case 229:{x=2095;break};case 249:{u=u+o|0;x=2098;break};case 253:{u=u+n|0;x=2098;break};case 237:{x=2099;break};case 233:{x=2104;break};case 97:{u=u+n&255;x=2107;break};case 114:{x=2107;break};case 32:{y=g+1|0;g=g2(q)|0;a[k+(256|p-1)|0]=y>>>8&255;p=p-2|256;a[k+p|0]=y&255;continue L2086;break};case 96:{g=(d[k+(256|p-255)|0]|0)<<8;g=g+((d[k+p|0]|0)+1)|0;p=p-254|256;continue L2086;break};case 0:{g=g+1|0;F=6;break L2099;break};case 142:{G=n;x=2013;break};case 236:{y=g2(q)|0;g=g+1|0;c[j+40>>2]=l;if((k|0)==0){H=0}else{H=k-336|0}u=jH(H,y)|0;l=c[j+40>>2]|0;x=2023;break};case 228:{u=d[k+u|0]|0;x=2022;break};case 224:{x=2022;break};case 68:{a[k+(256|p-1)|0]=g>>>8&255;p=p-2|256;a[k+p|0]=g&255;x=1879;break};case 116:{u=u+n&255;x=1995;break};case 100:{x=1995;break};case 148:{u=u+n&255;x=1997;break};case 132:{x=1997;break};case 150:{u=u+o&255;x=1999;break};case 134:{x=1999;break};case 182:{u=u+o&255;x=2001;break};case 166:{x=2001;break};case 76:{g=g2(q)|0;continue L2086;break};case 124:{u=u+n|0;x=1888;break};case 108:{x=1888;break};case 7:case 23:case 39:case 55:case 71:case 87:case 103:case 119:{g=g+1|0;y=k+u|0;a[y]=(d[y]|0)&~(1<<(v>>>4))&255;continue L2086;break};case 135:case 151:case 167:case 183:case 199:case 215:case 231:case 247:{g=g+1|0;y=k+u|0;a[y]=(d[y]|0|1<<(v>>>4)-8)&255;continue L2086;break};case 158:{u=u+n|0;x=1990;break};case 156:{x=1990;break};case 161:{u=u+n&255;x=1938;break};case 178:{x=1938;break};case 177:{I=(d[k+u|0]|0)+o|0;I=I+((d[k+(u+1&255)|0]|0)<<8)|0;g=g+1|0;x=1942;break};case 185:{u=u+o|0;x=1941;break};case 197:{x=2035;break};case 217:{u=u+o|0;x=2038;break};case 221:{u=u+n|0;x=2038;break};case 205:{x=2039;break};case 169:{g=g+1|0;m=u;s=u;continue L2086;break};case 60:{u=u+n|0;x=1955;break};case 44:{x=1955;break};case 52:{u=u+n&255;x=1960;break};case 149:{u=u+n&255;x=1912;break};case 80:{g=g+1|0;if((r&64|0)!=0){x=1843;break L2101}else{g=g+((u&255)<<24>>24)&65535;continue L2086}break};case 176:{g=g+1|0;if((t&256|0)!=0){g=g+((u&255)<<24>>24)&65535;continue L2086}else{x=1843;break L2101}break};case 15:case 31:case 47:case 63:case 79:case 95:case 111:case 127:case 143:case 159:case 175:case 191:case 207:case 223:case 239:{x=1883;break};case 5:{x=2080;break};case 25:{u=u+o|0;x=2083;break};case 29:{u=u+n|0;x=2083;break};case 13:{x=2084;break};case 9:{x=2089;break};case 225:{u=u+n&255;x=2092;break};case 157:{y=(g2(q)|0)+n|0;g=g+2|0;if((k|0)==0){J=0}else{J=k-336|0}w=c[J+8604+(y>>>13<<2)>>2]|0;y=y&8191;if((w|0)!=0){a[w+y|0]=m&255}else{if((d[k+8200+(y>>>13)|0]|0|0)==255){c[j+40>>2]=l;if((k|0)==0){K=0}else{K=k-336|0}ki(K,y,m);l=c[j+40>>2]|0}}continue L2086;break};case 69:{x=2065;break};case 89:{u=u+o|0;x=2068;break};case 93:{u=u+n|0;x=2068;break};case 77:{x=2069;break};case 73:{x=2074;break};case 1:{u=u+n&255;x=2077;break};case 18:{x=2077;break};case 17:{u=(d[k+u|0]|0)+o+((d[k+(u+1&255)|0]|0)<<8)|0;x=2085;break};case 21:{u=u+n&255;x=2080;break};case 162:{x=2002;break};case 180:{u=u+n&255;x=2004;break};case 164:{x=2004;break};case 160:{x=2005;break};case 188:{u=u+n|0;x=2007;break};case 172:{x=2007;break};case 140:{G=o;x=2013;break};case 201:{x=2044;break};case 33:{u=u+n&255;x=2047;break};case 50:{x=2047;break};case 49:{u=(d[k+u|0]|0)+o+((d[k+(u+1&255)|0]|0)<<8)|0;x=2055;break};case 53:{u=u+n&255;x=2050;break};case 37:{x=2050;break};case 57:{u=u+o|0;x=2053;break};case 133:{x=1912;break};case 174:{y=g2(q)|0;g=g+2|0;s=d[(c[j+(y>>>13<<2)>>2]|0)+(y&8191)|0]|0;if((d[k+8200+(y>>>13)|0]|0|0)==255){c[j+40>>2]=l;if((k|0)==0){L=0}else{L=k-336|0}s=kl(L,y)|0;l=c[j+40>>2]|0}n=s;continue L2086;break};case 144:{g=g+1|0;if((t&256|0)!=0){x=1843;break L2101}else{g=g+((u&255)<<24>>24)&65535;continue L2086}break};case 165:{y=d[k+u|0]|0;s=y;m=y;g=g+1|0;continue L2086;break};case 146:{x=1922;break};case 153:{u=u+o|0;x=1924;break};case 173:{x=1941;break};case 128:{x=1879;break};case 112:{g=g+1|0;if((r&64|0)!=0){g=g+((u&255)<<24>>24)&65535;continue L2086}else{x=1843;break L2101}break};case 106:{x=2125;break};case 10:{s=m<<1;t=s;m=s&255;continue L2086;break};case 42:{s=m<<1;y=t>>>8&1;t=s;s=s|y;m=s&255;continue L2086;break};case 94:{u=u+n|0;x=2129;break};case 78:{x=2129;break};case 110:{x=2130;break};case 62:{u=u+n|0;x=2139;break};case 30:{u=u+n|0;x=2137;break};case 14:{x=2137;break};case 46:{x=2138;break};case 126:{u=u+n|0;x=2131;break};case 118:{u=u+n&255;x=2152;break};case 86:{u=u+n&255;x=2150;break};case 70:{x=2150;break};case 102:{x=2151;break};case 54:{u=u+n&255;x=2157;break};case 22:{u=u+n&255;x=2155;break};case 6:{x=2155;break};case 38:{x=2156;break};case 26:{y=m+1|0;s=y;m=y&255;continue L2086;break};case 232:{y=n+1|0;s=y;n=y&255;continue L2086;break};case 200:{y=o+1|0;s=y;o=y&255;continue L2086;break};case 58:{y=m-1|0;s=y;m=y&255;continue L2086;break};case 202:{y=n-1|0;s=y;n=y&255;continue L2086;break};case 136:{y=o-1|0;s=y;o=y&255;continue L2086;break};case 246:{u=u+n&255;x=2165;break};case 230:{x=2165;break};case 214:{u=u+n&255;x=2167;break};case 198:{x=2167;break};case 254:{u=n+(g2(q)|0)|0;x=2172;break};case 238:{u=g2(q)|0;x=2172;break};case 222:{u=n+(g2(q)|0)|0;x=2175;break};case 206:{u=g2(q)|0;x=2175;break};case 168:{o=m;s=m;continue L2086;break};case 152:{m=o;s=o;continue L2086;break};case 190:{y=(g2(q)|0)+o|0;g=g+2|0;c[j+40>>2]=l;if((k|0)==0){M=0}else{M=k-336|0}w=jH(M,y)|0;s=w;n=w;l=c[j+40>>2]|0;continue L2086;break};case 181:{w=d[k+(u+n&255)|0]|0;s=w;m=w;g=g+1|0;continue L2086;break};case 189:{w=(g2(q)|0)+n|0;g=g+2|0;s=d[(c[j+(w>>>13<<2)>>2]|0)+(w&8191)|0]|0;if((d[k+8200+(w>>>13)|0]|0|0)==255){c[j+40>>2]=l;if((k|0)==0){N=0}else{N=k-336|0}s=kl(N,w)|0;l=c[j+40>>2]|0}m=s;continue L2086;break};case 204:{w=g2(q)|0;g=g+1|0;c[j+40>>2]=l;if((k|0)==0){O=0}else{O=k-336|0}u=jH(O,w)|0;l=c[j+40>>2]|0;x=2030;break};case 196:{u=d[k+u|0]|0;x=2029;break};case 192:{x=2029;break};case 193:{u=u+n&255;x=2032;break};case 210:{x=2032;break};case 209:{u=(d[k+u|0]|0)+o+((d[k+(u+1&255)|0]|0)<<8)|0;x=2040;break};case 213:{u=u+n&255;x=2035;break};case 240:{g=g+1|0;if((s&255)<<24>>24!=0){x=1843;break L2101}else{g=g+((u&255)<<24>>24)&65535;continue L2086}break};case 36:{x=1960;break};case 137:{x=1961;break};case 179:{P=(d[q+1|0]|0)+n|0;x=1967;break};case 147:{P=d[q+1|0]|0;x=1967;break};case 208:{g=g+1|0;if((s&255)<<24>>24!=0){g=g+((u&255)<<24>>24)&65535;continue L2086}else{x=1843;break L2101}break};case 48:{g=g+1|0;if((s&32896|0)!=0){g=g+((u&255)<<24>>24)&65535;continue L2086}else{x=1843;break L2101}break};case 61:{u=u+n|0;x=2053;break};case 45:{x=2054;break};case 41:{x=2059;break};case 65:{u=u+n&255;x=2062;break};case 82:{x=2062;break};case 81:{u=(d[k+u|0]|0)+o+((d[k+(u+1&255)|0]|0)<<8)|0;x=2070;break};case 85:{u=u+n&255;x=2065;break};case 141:{x=1924;break};case 163:{s=d[k+((d[q+1|0]|0)+n&255)|0]|0;x=1973;break};case 131:{s=d[k+(d[q+1|0]|0)|0]|0;x=1973;break};case 12:case 28:{D=g2(q)|0;g=g+1|0;x=1978;break};case 170:{n=m;s=m;continue L2086;break};case 138:{m=n;s=n;continue L2086;break};case 154:{p=n+1|256;continue L2086;break};case 186:{w=p-1&255;s=w;n=w;continue L2086;break};case 2:{w=n;n=o;o=w;continue L2086;break};case 34:{w=m;m=n;n=w;continue L2086;break};case 66:{w=m;m=o;o=w;continue L2086;break};case 98:{m=0;continue L2086;break};case 130:{n=0;continue L2086;break};case 194:{o=0;continue L2086;break};case 72:{p=p-1|256;a[k+p|0]=m&255;continue L2086;break};case 218:{p=p-1|256;a[k+p|0]=n&255;continue L2086;break};case 90:{p=p-1|256;a[k+p|0]=o&255;continue L2086;break};case 64:{w=d[k+p|0]|0;g=d[k+(256|p-255)|0]|0;g=g|(d[k+(256|p-254)|0]|0)<<8;p=p-253|256;u=r;r=w&76;s=w<<8;t=s;s=s|~w&2;a[k+8197|0]=r&255;if(((u^r)&4|0)!=0){w=c[k+8264>>2]|0;do{if((r&4|0)==0){if((w|0)<=(c[k+8260>>2]|0)){break}w=c[k+8260>>2]|0}}while(0);y=(c[j+36>>2]|0)-w|0;c[j+36>>2]=w;l=l+y|0}continue L2086;break};case 104:{y=d[k+p|0]|0;s=y;m=y;p=p-255|256;continue L2086;break};case 250:{y=d[k+p|0]|0;s=y;n=y;p=p-255|256;continue L2086;break};case 122:{y=d[k+p|0]|0;s=y;o=y;p=p-255|256;continue L2086;break};case 40:{y=d[k+p|0]|0;p=p-255|256;Q=r^y;r=y&76;s=y<<8;t=s;s=s|~y&2;if((Q&4|0)==0){continue L2086}if((r&4|0)!=0){x=2242;break L2101}else{x=2229;break L2101}break};case 8:{Q=r&76;Q=Q|(s>>>8|s)&128;Q=Q|t>>>8&1;if((s&255|0)==0){Q=Q|2}p=p-1|256;a[k+p|0]=(Q|16)&255;continue L2086;break};case 56:{t=-1;continue L2086;break};case 24:{t=0;continue L2086;break};case 184:{r=r&-65;continue L2086;break};case 216:{r=r&-9;continue L2086;break};case 248:{r=r|8;continue L2086;break};case 88:{if((r&4|0)!=0){r=r&-5;x=2229;break L2101}else{continue L2086}break};default:{if(v>>>0<=255>>>0){}else{at(4200,8744,1235,11328);return 0}f=1;continue L2086}}}while(0);do{if((x|0)==2242){x=0;a[k+8197|0]=r&255;Q=(c[j+36>>2]|0)-(c[k+8264>>2]|0)|0;c[j+36>>2]=c[k+8264>>2];l=l+Q|0;if((l|0)<0){continue L2086}else{continue L2086}}else if((x|0)==2270){x=0;B=A^1;R=B;C=A;x=2275}else if((x|0)==2274){x=0;A=0;R=0;x=2275}else if((x|0)==2110){x=0;u=d[k+u|0]|0;x=2120}else if((x|0)==2113){x=0;x=2114}else if((x|0)==1978){x=0;c[j+40>>2]=l;if((k|0)==0){S=0}else{S=k-336|0}s=m|(jH(S,D)|0);if((v&16|0)!=0){s=s^m}r=r&-65;r=r|s&64;g=g+1|0;if((k|0)==0){T=0}else{T=k-336|0}jJ(T,D,s);l=c[j+40>>2]|0;continue L2086}else if((x|0)==2092){x=0;u=((d[k+(u+1&255)|0]|0)<<8)+(d[k+u|0]|0)|0;x=2100}else if((x|0)==2095){x=0;u=d[k+u|0]|0;x=2105}else if((x|0)==2098){x=0;x=2099}else if((x|0)==2107){x=0;u=((d[k+(u+1&255)|0]|0)<<8)+(d[k+u|0]|0)|0;x=2115}else if((x|0)==2013){x=0;Q=g2(q)|0;g=g+2|0;c[j+40>>2]=l;if((k|0)==0){U=0}else{U=k-336|0}jJ(U,Q,G);l=c[j+40>>2]|0;continue L2086}else if((x|0)==2022){x=0;x=2023}else if((x|0)==1995){x=0;g=g+1|0;a[k+u|0]=0;continue L2086}else if((x|0)==1997){x=0;g=g+1|0;a[k+u|0]=o&255;continue L2086}else if((x|0)==1999){x=0;g=g+1|0;a[k+u|0]=n&255;continue L2086}else if((x|0)==2001){x=0;u=d[k+u|0]|0;x=2002}else if((x|0)==1888){x=0;u=u+((d[q+1|0]|0)<<8)|0;g=g2((c[j+(u>>>13<<2)>>2]|0)+(u&8191)|0)|0;continue L2086}else if((x|0)==1990){x=0;g=g+1|0;u=u+((d[q+1|0]|0)<<8)|0;g=g+1|0;c[j+40>>2]=l;if((k|0)==0){V=0}else{V=k-336|0}jJ(V,u,0);l=c[j+40>>2]|0;continue L2086}else if((x|0)==1938){x=0;I=(d[k+(u+1&255)|0]|0)<<8;I=I+(d[k+u|0]|0)|0;g=g+1|0;x=1942}else if((x|0)==2035){x=0;u=d[k+u|0]|0;x=2045}else if((x|0)==2038){x=0;x=2039}else if((x|0)==1955){x=0;g=g+1|0;Q=u+((d[q+1|0]|0)<<8)|0;c[j+40>>2]=l;if((k|0)==0){W=0}else{W=k-336|0}s=jH(W,Q)|0;l=c[j+40>>2]|0;x=1962}else if((x|0)==1883){x=0;Q=(d[k+u|0]|0)*257|0;Q=Q^255;g=g+1|0;u=d[q+1|0]|0;g=g+1|0;if((Q&1<<(v>>>4)|0)!=0){g=g+((u&255)<<24>>24)&65535;continue L2086}else{x=1843;break}}else if((x|0)==2080){x=0;u=d[k+u|0]|0;x=2090}else if((x|0)==2083){x=0;x=2084}else if((x|0)==2065){x=0;u=d[k+u|0]|0;x=2075}else if((x|0)==2068){x=0;x=2069}else if((x|0)==2077){x=0;u=((d[k+(u+1&255)|0]|0)<<8)+(d[k+u|0]|0)|0;x=2085}else if((x|0)==2004){x=0;u=d[k+u|0]|0;x=2005}else if((x|0)==2007){x=0;Q=u+((d[q+1|0]|0)<<8)|0;g=g+2|0;c[j+40>>2]=l;if((k|0)==0){X=0}else{X=k-336|0}y=jH(X,Q)|0;s=y;o=y;l=c[j+40>>2]|0;continue L2086}else if((x|0)==2047){x=0;u=((d[k+(u+1&255)|0]|0)<<8)+(d[k+u|0]|0)|0;x=2055}else if((x|0)==2050){x=0;u=d[k+u|0]|0;x=2060}else if((x|0)==1912){x=0;g=g+1|0;a[k+u|0]=m&255;continue L2086}else if((x|0)==1922){x=0;E=(d[k+(u+1&255)|0]|0)<<8;E=E+(d[k+u|0]|0)|0;g=g+1|0;x=1925}else if((x|0)==1941){x=0;I=u+((d[q+1|0]|0)<<8)|0;g=g+2|0;x=1942}else if((x|0)==1879){x=0;g=g+1|0;g=g+((u&255)<<24>>24)&65535;continue L2086}else if((x|0)==2125){x=0;s=t>>>1&128;t=m<<8;s=s|m>>>1;m=s;continue L2086}else if((x|0)==2129){x=0;t=0;x=2130}else if((x|0)==2137){x=0;t=0;x=2138}else if((x|0)==2150){x=0;t=0;x=2151}else if((x|0)==2155){x=0;t=0;x=2156}else if((x|0)==2165){x=0;s=1;x=2168}else if((x|0)==2167){x=0;s=-1;x=2168}else if((x|0)==2172){x=0;s=1;x=2176}else if((x|0)==2175){x=0;s=-1;x=2176}else if((x|0)==2029){x=0;x=2030}else if((x|0)==2032){x=0;u=((d[k+(u+1&255)|0]|0)<<8)+(d[k+u|0]|0)|0;x=2040}else if((x|0)==1960){x=0;u=d[k+u|0]|0;x=1961}else if((x|0)==1967){x=0;P=P+((d[q+2|0]|0)<<8)|0;g=g+1|0;c[j+40>>2]=l;if((k|0)==0){Y=0}else{Y=k-336|0}s=jH(Y,P)|0;l=c[j+40>>2]|0;x=1973}else if((x|0)==2053){x=0;x=2054}else if((x|0)==2062){x=0;u=((d[k+(u+1&255)|0]|0)<<8)+(d[k+u|0]|0)|0;x=2070}else if((x|0)==1924){x=0;E=u+((d[q+1|0]|0)<<8)|0;g=g+2|0;x=1925}else if((x|0)==2229){x=0;a[k+8197|0]=r&255;y=(c[j+36>>2]|0)-(c[k+8260>>2]|0)|0;do{if((y|0)<=0){if((l+(c[j+36>>2]|0)|0)<(c[k+8260>>2]|0)){continue L2086}else{break}}else{c[j+36>>2]=c[k+8260>>2];l=l+y|0;if((l|0)<0){continue L2086}if((y|0)>=(l+1|0)){Q=j+36|0;c[Q>>2]=(c[Q>>2]|0)+(l+1);l=-1;c[k+8260>>2]=c[j+36>>2];continue L2086}else{break}}}while(0);continue L2086}}while(0);if((x|0)==2275){x=0;y=g2(q|0)|0;w=g2(q+2|0)|0;Q=g2(q+4|0)|0;if((Q|0)==0){Q=65536}g=g+6|0;a[k+(256|p-1)|0]=o&255;a[k+(256|p-2)|0]=m&255;a[k+(256|p-3)|0]=n&255;c[j+40>>2]=l;do{if((k|0)==0){Z=0}else{Z=k-336|0}_=jH(Z,y)|0;y=y+B|0;y=y&65535;$=j+40|0;c[$>>2]=(c[$>>2]|0)+6;if((A|0)!=0){B=-B|0}if((k|0)==0){aa=0}else{aa=k-336|0}jJ(aa,w,_);w=w+C|0;w=w&65535;if((R|0)!=0){C=-C|0}_=Q-1|0;Q=_;}while((_|0)!=0);l=c[j+40>>2]|0;continue L2086}else if((x|0)==2114){x=0;g=g+1|0;u=u+((d[q+1|0]|0)<<8)|0;x=2115}else if((x|0)==2099){x=0;g=g+1|0;u=u+((d[q+1|0]|0)<<8)|0;x=2100}else if((x|0)==2023){x=0;s=n-u|0;g=g+1|0;t=~s;s=s&255;continue L2086}else if((x|0)==2039){x=0;g=g+1|0;u=u+((d[q+1|0]|0)<<8)|0;x=2040}else if((x|0)==2084){x=0;g=g+1|0;u=u+((d[q+1|0]|0)<<8)|0;x=2085}else if((x|0)==2069){x=0;g=g+1|0;u=u+((d[q+1|0]|0)<<8)|0;x=2070}else if((x|0)==2002){x=0;g=g+1|0;n=u;s=u;continue L2086}else if((x|0)==2005){x=0;g=g+1|0;o=u;s=u;continue L2086}else if((x|0)==1942){x=0;s=d[(c[j+(I>>>13<<2)>>2]|0)+(I&8191)|0]|0;if((d[k+8200+(I>>>13)|0]|0|0)==255){c[j+40>>2]=l;if((k|0)==0){ab=0}else{ab=k-336|0}s=kl(ab,I)|0;l=c[j+40>>2]|0}m=s;continue L2086}else if((x|0)==2130){x=0;x=2131}else if((x|0)==2138){x=0;x=2139}else if((x|0)==2151){x=0;x=2152}else if((x|0)==2156){x=0;x=2157}else if((x|0)==2168){x=0;s=s+(d[k+u|0]|0)|0;x=2169}else if((x|0)==2176){x=0;c[j+40>>2]=l;if((k|0)==0){ac=0}else{ac=k-336|0}s=s+(jH(ac,u)|0)|0;g=g+2|0;if((k|0)==0){ad=0}else{ad=k-336|0}jJ(ad,u,s&255);l=c[j+40>>2]|0;continue L2086}else if((x|0)==1843){x=0;l=l-2|0;continue L2086}else if((x|0)==2030){x=0;s=o-u|0;g=g+1|0;t=~s;s=s&255;continue L2086}else if((x|0)==1961){x=0;s=u;x=1962}else if((x|0)==2054){x=0;g=g+1|0;u=u+((d[q+1|0]|0)<<8)|0;x=2055}else if((x|0)==1925){x=0;if((k|0)==0){ae=0}else{ae=k-336|0}Q=c[ae+8604+(E>>>13<<2)>>2]|0;E=E&8191;if((Q|0)!=0){a[Q+E|0]=m&255}else{if((d[k+8200+(E>>>13)|0]|0|0)==255){c[j+40>>2]=l;if((k|0)==0){af=0}else{af=k-336|0}ki(af,E,m);l=c[j+40>>2]|0}}continue L2086}else if((x|0)==1973){x=0;g=g+2|0;r=r&-65;r=r|s&64;if((s&u|0)!=0){continue L2086}else{s=s<<8;continue L2086}}if((x|0)==2115){x=0;c[j+40>>2]=l;if((k|0)==0){ag=0}else{ag=k-336|0}u=jH(ag,u)|0;l=c[j+40>>2]|0;x=2119}else if((x|0)==2100){x=0;c[j+40>>2]=l;if((k|0)==0){ah=0}else{ah=k-336|0}u=jH(ah,u)|0;l=c[j+40>>2]|0;x=2104}else if((x|0)==2040){x=0;c[j+40>>2]=l;if((k|0)==0){ai=0}else{ai=k-336|0}u=jH(ai,u)|0;l=c[j+40>>2]|0;x=2044}else if((x|0)==2085){x=0;c[j+40>>2]=l;if((k|0)==0){aj=0}else{aj=k-336|0}u=jH(aj,u)|0;l=c[j+40>>2]|0;x=2089}else if((x|0)==2070){x=0;c[j+40>>2]=l;if((k|0)==0){ak=0}else{ak=k-336|0}u=jH(ak,u)|0;l=c[j+40>>2]|0;x=2074}else if((x|0)==2131){x=0;g=g+1|0;u=u+((d[q+1|0]|0)<<8)|0;c[j+40>>2]=l;if((k|0)==0){al=0}else{al=k-336|0}Q=jH(al,u)|0;s=t>>>1&128|Q>>1;t=Q<<8;x=2143}else if((x|0)==2139){x=0;g=g+1|0;u=u+((d[q+1|0]|0)<<8)|0;s=t>>>8&1;c[j+40>>2]=l;if((k|0)==0){am=0}else{am=k-336|0}Q=(jH(am,u)|0)<<1;t=Q;s=s|Q;x=2143}else if((x|0)==2152){x=0;Q=d[k+u|0]|0;s=t>>>1&128|Q>>1;t=Q<<8;x=2169}else if((x|0)==2157){x=0;s=t>>>8&1;Q=(d[k+u|0]|0)<<1;t=Q;s=s|Q;x=2169}else if((x|0)==1962){x=0;g=g+1|0;r=r&-65;r=r|s&64;if((s&m|0)!=0){continue L2086}else{s=s<<8;continue L2086}}else if((x|0)==2055){x=0;c[j+40>>2]=l;if((k|0)==0){an=0}else{an=k-336|0}u=jH(an,u)|0;l=c[j+40>>2]|0;x=2059}if((x|0)==2119){x=0;x=2120}else if((x|0)==2104){x=0;x=2105}else if((x|0)==2089){x=0;x=2090}else if((x|0)==2074){x=0;x=2075}else if((x|0)==2044){x=0;x=2045}else if((x|0)==2143){x=0;g=g+1|0;if((k|0)==0){ao=0}else{ao=k-336|0}jJ(ao,u,s&255);l=c[j+40>>2]|0;continue L2086}else if((x|0)==2169){x=0;g=g+1|0;a[k+u|0]=s&255;continue L2086}else if((x|0)==2059){x=0;x=2060}if((x|0)==2120){x=0}else if((x|0)==2105){x=0;u=u^255}else if((x|0)==2090){x=0;Q=m|u;m=Q;s=Q;g=g+1|0;continue L2086}else if((x|0)==2075){x=0;Q=m^u;m=Q;s=Q;g=g+1|0;continue L2086}else if((x|0)==2045){x=0;s=m-u|0;g=g+1|0;t=~s;s=s&255;continue L2086}else if((x|0)==2060){x=0;Q=m&u;m=Q;s=Q;g=g+1|0;continue L2086}Q=t>>>8&1;r=r&-65;r=r|(m^128)+Q+((u&255)<<24>>24)>>2&64;w=m+u+Q|0;s=w;t=w;g=g+1|0;m=s&255;continue L2086}}while(0);do{if((x|0)==2303){x=0;g=g-1|0;c[j+40>>2]=l;if((k|0)==0){ap=0}else{ap=k-336|0}F=kn(ap)|0;l=c[j+40>>2]|0;if((F|0)>0){break}if((l|0)>=0){break L2086}continue L2086}}while(0);l=l+7|0;a[k+(256|p-1)|0]=g>>>8&255;a[k+(256|p-2)|0]=g&255;g=g2((c[j+28>>2]|0)+8176+F|0)|0;p=p-3|256;u=r&76;u=u|(s>>>8|s)&128;u=u|t>>>8&1;if((s&255|0)==0){u=u|2}if((F|0)==6){u=u|16}a[k+p|0]=u&255;r=r&-9;r=r|4;a[k+8197|0]=r&255;u=(c[j+36>>2]|0)-(c[k+8264>>2]|0)|0;c[j+36>>2]=c[k+8264>>2];l=l+u|0}c[j+40>>2]=l;b[k+8192>>1]=g&65535;a[k+8198|0]=p-1&255;a[k+8194|0]=m&255;a[k+8195|0]=n&255;a[k+8196|0]=o&255;o=r&76;o=o|(s>>>8|s)&128;o=o|t>>>8&1;if((s&255|0)==0){o=o|2}a[k+8197|0]=o&255;o=k+8216|0;s=j;sg(o|0,s|0,44)|0;c[k+8212>>2]=k+8216;i=h;return f&1|0}function jO(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d+8264>>2]=a;b=jP(d,a,c[d+8260>>2]|0)|0;a=(c[d+8212>>2]|0)+40|0;c[a>>2]=(c[a>>2]|0)+b;return}function jP(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=d;d=e;e=b;do{if((d|0)<(f|0)){if((a[e+8197|0]&4|0)!=0){break}f=d}}while(0);d=(c[(c[e+8212>>2]|0)+36>>2]|0)-f|0;c[(c[e+8212>>2]|0)+36>>2]=f;return d|0}function jQ(a,b){a=a|0;b=b|0;var d=0;d=a;a=jS(d,b)|0;b=a-(c[d+12>>2]|0)|0;if(b>>>0>((eq(d|0)|0)-8200|0)>>>0){b=0}return ce(d|0,b)|0}function jR(a){a=a|0;return cd(a|0)|0}function jS(a,b){a=a|0;b=b|0;return b&c[a+16>>2]|0}function jT(a){a=a|0;var b=0;b=a;jU(b+336|0);bR(b);c[b>>2]=16200;jV(b+8640|0);jA(b+8752|0);c[b+8720>>2]=0;g5(b,c[18]|0);fh(b,13704);g6(b,13680);g7(b,6);ip(b,1.11);return}function jU(a){a=a|0;var b=0;b=a;c[b+8212>>2]=b+8216;return}function jV(a){a=a|0;kC(a);return}function jW(a){a=a|0;kB(a);return}function jX(a){a=a|0;var b=0;b=a;jY(b);bT(b);return}function jY(a){a=a|0;var b=0;b=a;c[b>>2]=16200;jW(b+8640|0);bU(b);return}function jZ(a){a=a|0;var b=0;b=a;j_(b+8640|0);ff(b);return}function j_(a){a=a|0;cb(a|0);return}function j$(a,b,c){a=a|0;b=b|0;c=c|0;j0((j1(a+8640|0)|0)+32|0,b);return 0}function j0(a,b){a=a|0;b=b|0;var c=0;c=a;a=b;if((d[c]|0|0)<32){return}c=kA(c,a+272|0)|0;c=kA(c,a+784|0)|0;c=kA(c,a+1040|0)|0;return}function j1(a){a=a|0;return(cd(a|0)|0)+8200|0}function j2(a,b){a=a|0;b=b|0;var c=0,e=0,f=0,g=0;c=a;a=j3(c+8640|0,b,32,c+8664|0,255)|0;if((a|0)!=0){e=a;f=e;return f|0}a=j4(c+8664|0)|0;if((a|0)!=0){e=a;f=e;return f|0}if((d[c+8668|0]|0|0)!=0){eT(c,1784)}if((sj(c+8680|0,1128,4)|0)!=0){eT(c,776)}if((sj(c+8692|0,22032,4)|0)!=0){eT(c,10392)}a=ji(c+8688|0)|0;b=ji(c+8684|0)|0;if((a&-1048576|0)!=0){eT(c,9976);a=a&1048575}if((a+b|0)>>>0>1048576>>>0){eT(c,9208)}if((b|0)!=(j5(c+8640|0)|0)){do{if((b|0)<=((j5(c+8640|0)|0)-4|0)){if((sj((j1(c+8640|0)|0)+b|0,1128,4)|0)!=0){g=2386;break}eT(c,8608)}else{g=2386}}while(0);if((g|0)==2386){if((b|0)<(j5(c+8640|0)|0)){eT(c,8160)}else{eT(c,7632)}}}j6(c+8640|0,a);he(c,6);j7(c+8752|0,+hf(c));e=b3(c,7159091)|0;f=e;return f|0}function j3(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return ca(a,b,c,d,e,8200)|0}function j4(a){a=a|0;var b=0,d=0;if((sj(a|0,6048,4)|0)!=0){b=c[2]|0;d=b;return d|0}else{b=0;d=b;return d|0}return 0}function j5(a){a=a|0;return c[a+8>>2]|0}function j6(a,b){a=a|0;b=b|0;cg(a,b,8192);return}function j7(a,b){a=a|0;b=+b;gJ(a+536|0,91552734375.0e-16*b);return}function j8(a,b){a=a|0;b=b|0;j9(a+8752|0,b);return}function j9(a,b){a=a|0;b=b|0;gM(a+536|0,b);return}function ka(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;jC(a+8752|0,b,c,d,e);return}function kb(a){a=a|0;var b=0;b=a;c[b+8716>>2]=($(c[b+8720>>2]|0,c[b+8704>>2]|0)|0)+1;return}function kc(a,b){a=a|0;b=+b;var d=0.0,e=0;d=b;e=a;c[e+8696>>2]=~~(119210.0/d);c[e+8704>>2]=~~(1024.0/d);kb(e);return}function kd(e,f){e=e|0;f=f|0;var g=0,h=0,i=0;g=f;f=e;e=b5(f,g)|0;if((e|0)!=0){h=e;i=h;return i|0}sf(f+336|0,0,8192);sf(f+9848|0,0,24584);jB(f+8752|0);jK(f+336|0);e=0;while(1){if(e>>>0>=8>>>0){break}jL(f+336|0,e,d[f+8672+e|0]|0);e=e+1|0}jL(f+336|0,8,255);a[f+8744|0]=6;c[f+8736>>2]=1073741824;c[f+8740>>2]=1073741824;a[f+8724|0]=0;c[f+8720>>2]=128;c[f+8712>>2]=c[f+8716>>2];a[f+8725|0]=0;c[f+8708>>2]=0;a[f+8732|0]=0;a[f+8733|0]=0;c[f+8728>>2]=0;a[f+847|0]=31;a[f+846|0]=-2;a[f+8534|0]=-3;b[f+8528>>1]=(g2(f+8670|0)|0)&65535;a[f+8530|0]=g&255;kb(f);c[f+8700>>2]=0;h=0;i=h;return i|0}function ke(b,c,e){b=b|0;c=c|0;e=e|0;var f=0;f=e;e=b;b=c;if((b|0)==3){return}else if((b|0)==0){a[e+8732|0]=f&31;return}else if((b|0)==2){if((d[e+8732|0]|0|0)==5){if((f&4|0)!=0){eT(e,7176)}kf(e,kg(e+336|0)|0);a[e+8733|0]=f&255;kh(e)}return}else{return}}function kf(b,d){b=b|0;d=d|0;var e=0,f=0;e=d;d=b;while(1){if((c[d+8728>>2]|0)>=(e|0)){break}b=d+8728|0;c[b>>2]=(c[b>>2]|0)+(c[d+8696>>2]|0)}b=e-(c[d+8708>>2]|0)|0;if((b|0)<=0){return}if((a[d+8724|0]|0)!=0){f=d+8712|0;c[f>>2]=(c[f>>2]|0)-b;if((c[d+8712>>2]|0)<=0){b=d+8712|0;c[b>>2]=(c[b>>2]|0)+(c[d+8716>>2]|0)}}c[d+8708>>2]=e;return}function kg(a){a=a|0;var b=0;b=a;return(c[(c[b+8212>>2]|0)+40>>2]|0)+(c[(c[b+8212>>2]|0)+36>>2]|0)|0}function kh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=b;b=kg(d+336|0)|0;if((c[d+8736>>2]|0)>(b|0)){c[d+8736>>2]=1073741824;do{if((a[d+8724|0]|0)!=0){if((a[d+8725|0]|0)!=0){break}c[d+8736>>2]=b+(c[d+8712>>2]|0)}}while(0)}if((c[d+8740>>2]|0)>(b|0)){c[d+8740>>2]=1073741824;if((a[d+8733|0]&8|0)!=0){c[d+8740>>2]=c[d+8728>>2]}}b=1073741824;if((a[d+8744|0]&4|0)==0){b=c[d+8736>>2]|0}if((a[d+8744|0]&2|0)!=0){e=d;f=e+336|0;g=f;h=b;km(g,h);return}b=kj(b,c[d+8740>>2]|0)|0;e=d;f=e+336|0;g=f;h=b;km(g,h);return}function ki(b,e,f){b=b|0;e=e|0;f=f|0;var g=0;g=e;e=f;f=b;if((g-2048|0)>>>0<=9>>>0){b=kg(f+336|0)|0;jF(f+8752|0,kj(b,(kk(f+336|0)|0)+8|0)|0,g,e);return}b=kg(f+336|0)|0;switch(g|0){case 3072:{kf(f,b);c[f+8720>>2]=(e&127)+1;kb(f);c[f+8712>>2]=c[f+8716>>2];break};case 5123:{kf(f,b);if((a[f+8724|0]|0)!=0){c[f+8712>>2]=c[f+8716>>2]}a[f+8725|0]=0;break};case 5122:{kf(f,b);a[f+8744|0]=e&255;do{if((e&248|0)!=0){if((e&248|0)==248){break}}}while(0);break};case 3073:{e=e&1;if((d[f+8724|0]|0)==(e|0)){return}kf(f,b);a[f+8724|0]=e&255;if((e|0)!=0){c[f+8712>>2]=c[f+8716>>2]}break};case 4096:case 1026:case 1027:case 1028:case 1029:{return};case 0:case 2:case 3:{ke(f,g,e);return};default:{return}}kh(f);return}function kj(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((c|0)<(a|0)){d=c}else{d=a}return d|0}function kk(a){a=a|0;return c[a+8264>>2]|0}function kl(a,b){a=a|0;b=b|0;var e=0,f=0,g=0;e=b;b=a;a=kg(b+336|0)|0;e=e&8191;switch(e|0){case 5122:{f=d[b+8744|0]|0;g=f;return g|0};case 5123:{e=0;if((c[b+8736>>2]|0)<=(a|0)){e=e|4}if((c[b+8740>>2]|0)<=(a|0)){e=e|2}f=e;g=f;return g|0};case 2:case 3:{f=0;g=f;return g|0};case 4096:case 6156:case 6157:{break};case 0:{if((c[b+8740>>2]|0)>(a|0)){f=0;g=f;return g|0}else{c[b+8740>>2]=1073741824;kf(b,a);kh(b);f=32;g=f;return g|0}break};case 3073:case 3072:{kf(b,a);f=(((c[b+8712>>2]|0)-1|0)>>>0)/((c[b+8704>>2]|0)>>>0)|0;g=f;return g|0};default:{}}f=255;g=f;return g|0}function km(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+8264>>2]|0;e=b;c[d+8260>>2]=e;b=jP(d,a,e)|0;e=(c[d+8212>>2]|0)+40|0;c[e>>2]=(c[e>>2]|0)+b;return}function kn(b){b=b|0;var d=0,e=0,f=0;d=b;if((a[d+8533|0]&4|0)==0){b=kg(d+336|0)|0;do{if((c[d+8736>>2]|0)<=(b|0)){if((a[d+8744|0]&4|0)!=0){break}a[d+8725|0]=1;c[d+8736>>2]=1073741824;kh(d);e=10;f=e;return f|0}}while(0);do{if((c[d+8740>>2]|0)<=(b|0)){if((a[d+8744|0]&2|0)!=0){break}e=8;f=e;return f|0}}while(0)}e=0;f=e;return f|0}function ko(a,b,d){a=a|0;b=b|0;d=d|0;d=a;a=c[b>>2]|0;if(jN(d+336|0,a)|0){eT(d,6872)}kf(d,a);b=d+8708|0;c[b>>2]=(c[b>>2]|0)-a;b=d+8728|0;c[b>>2]=(c[b>>2]|0)-a;kp(d+336|0,a);kq(d+8736|0,a);kq(d+8740|0,a);jG(d+8752|0,a);return 0}function kp(a,b){a=a|0;b=b|0;var d=0;d=b;b=a;if((c[b+8212>>2]|0)==(b+8216|0)){}else{at(6432,6320,118,11304)}a=b+8252|0;c[a>>2]=(c[a>>2]|0)-d;if((c[b+8260>>2]|0)<1073741824){a=b+8260|0;c[a>>2]=(c[a>>2]|0)-d}if((c[b+8264>>2]|0)>=1073741824){return}a=b+8264|0;c[a>>2]=(c[a>>2]|0)-d;return}function kq(a,b){a=a|0;b=b|0;var d=0;d=a;if((c[d>>2]|0)>=1073741824){return}a=d;c[a>>2]=(c[a>>2]|0)-b;if((c[d>>2]|0)<0){c[d>>2]=0}return}function kr(){var a=0,b=0,c=0;a=hB(34432)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;jT(b);c=b}return c|0}function ks(){var a=0,b=0,c=0;a=hB(528)|0;b=0;if((a|0)==0){c=0}else{b=1;b=a;kt(b);c=b}return c|0}function kt(a){a=a|0;ku(a);return}function ku(a){a=a|0;var b=0;b=a;hE(b);c[b>>2]=15352;g5(b,c[18]|0);return}function kv(a){a=a|0;kz(a);return}function kw(a){a=a|0;var b=0;b=a;kv(b);bT(b);return}function kx(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;b=a5[c[(c[a>>2]|0)+12>>2]&127](a,d+316|0,208)|0;if((b|0)==0){e=j4(d+316|0)|0;f=e;return f|0}if((b|0)==19344){g=c[2]|0}else{g=b}e=g;f=e;return f|0}function ky(a,b,c){a=a|0;b=b|0;c=c|0;j0(a+380|0,b);return 0}function kz(a){a=a|0;fO(a);return}function kA(b,c){b=b|0;c=c|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=b;b=c;do{if((e|0)!=0){c=32;do{if((a[e+31|0]|0)!=0){if((a[e+47|0]|0)!=0){break}c=48}}while(0);f=0;f=0;while(1){if((f|0)<(c|0)){g=(a[e+f|0]|0)!=0}else{g=0}if(!g){break}if(((d[e+f|0]|0)+1&255|0)<33){h=2608;break}f=f+1|0}if((h|0)==2608){i=0;j=i;return j|0}while(1){if((f|0)>=(c|0)){h=2617;break}if((a[e+f|0]|0)!=0){break}f=f+1|0}if((h|0)==2617){ew(b,e,c);e=e+c|0;break}i=0;j=i;return j|0}}while(0);i=e;j=i;return j|0}function kB(a){a=a|0;iX(a);return}function kC(a){a=a|0;iZ(a);return}function kD(b){b=b|0;var e=0,f=0,g=0;e=b;c[e+516>>2]=e+520;b=256;while(1){f=b-1|0;b=f;if((f|0)<0){break}f=1;g=b;while(1){if((g|0)==0){break}f=f^g;g=g>>1}g=b&168|(f&1)<<2;a[e+b|0]=g&255;a[e+(b+256)|0]=(g|1)&255}b=e|0;a[b]=(d[b]|0|64)&255;b=e+256|0;a[b]=(d[b]|0|64)&255;return}function kE(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;b=d;d=a;c[d+516>>2]=d+520;c[d+596>>2]=0;c[d+592>>2]=0;c[d+512>>2]=0;a=0;while(1){if((a|0)>=9){break}kF(d,a,e,b);a=a+1|0}sf(d+600|0,0,30);return}function kF(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=b;b=a;a=f<<13&8191;c[(c[b+516>>2]|0)+36+(f<<2)>>2]=d+(-a|0);c[(c[b+516>>2]|0)+(f<<2)>>2]=e+(-a|0);return}function kG(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=b;b=c;c=d;d=e;e=a;if(((f>>>0)%8192|0|0)==0){}else{at(3576,8432,103,11272)}if(((b>>>0)%8192|0|0)==0){}else{at(5568,8432,104,11272)}a=(f>>>0)/8192|0;f=(b>>>0)/8192|0;while(1){b=f;f=b-1|0;if((b|0)==0){break}b=f<<13;kF(e,a+f|0,c+b|0,d+b|0)}return}
function r6(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[5518]|0;if(b>>>0<e>>>0){av()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){av()}h=f&-8;i=a+(h-8)|0;j=i;L10:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){av()}if((n|0)==(c[5519]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[5516]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=22096+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){av()}if((c[k+12>>2]|0)==(n|0)){break}av()}}while(0);if((s|0)==(k|0)){c[5514]=c[5514]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){av()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}av()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){av()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){av()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){av()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{av()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=22360+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[5515]=c[5515]&~(1<<c[v>>2]);q=n;r=o;break L10}else{if(p>>>0<(c[5518]|0)>>>0){av()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L10}}}while(0);if(A>>>0<(c[5518]|0)>>>0){av()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[5518]|0)>>>0){av()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[5518]|0)>>>0){av()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){av()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){av()}do{if((e&2|0)==0){if((j|0)==(c[5520]|0)){B=(c[5517]|0)+r|0;c[5517]=B;c[5520]=q;c[q+4>>2]=B|1;if((q|0)!=(c[5519]|0)){return}c[5519]=0;c[5516]=0;return}if((j|0)==(c[5519]|0)){B=(c[5516]|0)+r|0;c[5516]=B;c[5519]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L112:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=22096+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[5518]|0)>>>0){av()}if((c[u+12>>2]|0)==(j|0)){break}av()}}while(0);if((g|0)==(u|0)){c[5514]=c[5514]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[5518]|0)>>>0){av()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}av()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[5518]|0)>>>0){av()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[5518]|0)>>>0){av()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){av()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{av()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=22360+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[5515]=c[5515]&~(1<<c[t>>2]);break L112}else{if(f>>>0<(c[5518]|0)>>>0){av()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L112}}}while(0);if(E>>>0<(c[5518]|0)>>>0){av()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[5518]|0)>>>0){av()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[5518]|0)>>>0){av()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[5519]|0)){H=B;break}c[5516]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=22096+(d<<2)|0;A=c[5514]|0;E=1<<r;do{if((A&E|0)==0){c[5514]=A|E;I=e;J=22096+(d+2<<2)|0}else{r=22096+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[5518]|0)>>>0){I=h;J=r;break}av()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=22360+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[5515]|0;d=1<<K;do{if((r&d|0)==0){c[5515]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=129;break}else{A=A<<1;J=E}}if((N|0)==129){if(M>>>0<(c[5518]|0)>>>0){av()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[5518]|0;if(J>>>0<E>>>0){av()}if(B>>>0<E>>>0){av()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[5522]|0)-1|0;c[5522]=q;if((q|0)==0){O=22512}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[5522]=-1;return}function r7(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=r5(b)|0;return d|0}if(b>>>0>4294967231>>>0){c[(aT()|0)>>2]=12;d=0;return d|0}if(b>>>0<11>>>0){e=16}else{e=b+11&-8}f=r8(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=r5(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;e=g>>>0<b>>>0?g:b;sg(f|0,a|0,e)|0;r6(a);d=f;return d|0}function r8(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[5518]|0;if(g>>>0<j>>>0){av();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){av();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){av();return 0}if((k|0)==0){if(b>>>0<256>>>0){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[5504]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15>>>0){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;r9(g+b|0,k);n=a;return n|0}if((i|0)==(c[5520]|0)){k=(c[5517]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[5520]=g+b;c[5517]=l;n=a;return n|0}if((i|0)==(c[5519]|0)){l=(c[5516]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15>>>0){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[5516]=q;c[5519]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L299:do{if(m>>>0<256>>>0){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=22096+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){av();return 0}if((c[l+12>>2]|0)==(i|0)){break}av();return 0}}while(0);if((k|0)==(l|0)){c[5514]=c[5514]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){av();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}av();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){av();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){av();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){av();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{av();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=22360+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[5515]=c[5515]&~(1<<c[t>>2]);break L299}else{if(s>>>0<(c[5518]|0)>>>0){av();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L299}}}while(0);if(y>>>0<(c[5518]|0)>>>0){av();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[5518]|0)>>>0){av();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[5518]|0)>>>0){av();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16>>>0){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;r9(g+b|0,q);n=a;return n|0}return 0}function r9(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L375:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[5518]|0;if(i>>>0<l>>>0){av()}if((j|0)==(c[5519]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[5516]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256>>>0){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=22096+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){av()}if((c[p+12>>2]|0)==(j|0)){break}av()}}while(0);if((q|0)==(p|0)){c[5514]=c[5514]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){av()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}av()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){av()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){av()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){av()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{av()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=22360+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[5515]=c[5515]&~(1<<c[t>>2]);n=j;o=k;break L375}else{if(m>>>0<(c[5518]|0)>>>0){av()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break L375}}}while(0);if(y>>>0<(c[5518]|0)>>>0){av()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[5518]|0)>>>0){av()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[5518]|0)>>>0){av()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[5518]|0;if(e>>>0<a>>>0){av()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[5520]|0)){A=(c[5517]|0)+o|0;c[5517]=A;c[5520]=n;c[n+4>>2]=A|1;if((n|0)!=(c[5519]|0)){return}c[5519]=0;c[5516]=0;return}if((f|0)==(c[5519]|0)){A=(c[5516]|0)+o|0;c[5516]=A;c[5519]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;L474:do{if(z>>>0<256>>>0){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=22096+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){av()}if((c[g+12>>2]|0)==(f|0)){break}av()}}while(0);if((t|0)==(g|0)){c[5514]=c[5514]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){av()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}av()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){av()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){av()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){av()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{av()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=22360+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[5515]=c[5515]&~(1<<c[l>>2]);break L474}else{if(m>>>0<(c[5518]|0)>>>0){av()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break L474}}}while(0);if(C>>>0<(c[5518]|0)>>>0){av()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[5518]|0)>>>0){av()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[5518]|0)>>>0){av()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[5519]|0)){F=A;break}c[5516]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256>>>0){z=o<<1;y=22096+(z<<2)|0;C=c[5514]|0;b=1<<o;do{if((C&b|0)==0){c[5514]=C|b;G=y;H=22096+(z+2<<2)|0}else{o=22096+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[5518]|0)>>>0){G=d;H=o;break}av()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215>>>0){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=22360+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[5515]|0;z=1<<I;if((o&z|0)==0){c[5515]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=409;break}else{I=I<<1;J=G}}if((L|0)==409){if(K>>>0<(c[5518]|0)>>>0){av()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[5518]|0;if(J>>>0<I>>>0){av()}if(L>>>0<I>>>0){av()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function sa(a){a=a|0;var b=0,d=0,e=0;b=(a|0)==0?1:a;while(1){d=r5(b)|0;if((d|0)!=0){e=453;break}a=(B=c[5744]|0,c[5744]=B+0,B);if((a|0)==0){break}a8[a&3]()}if((e|0)==453){return d|0}d=aS(4)|0;c[d>>2]=14464;au(d|0,18264,120);return 0}function sb(a){a=a|0;if((a|0)==0){return}r6(a);return}function sc(a){a=a|0;sb(a);return}function sd(a){a=a|0;return}function se(a){a=a|0;return 3944}function sf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function sg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function sh(b,c,d){b=b|0;c=c|0;d=d|0;if((c|0)<(b|0)&(b|0)<(c+d|0)){c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}}else{sg(b,c,d)|0}}function si(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function sj(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0;while((e|0)<(c|0)){f=d[a+e|0]|0;g=d[b+e|0]|0;if((f|0)!=(g|0))return((f|0)>(g|0)?1:-1)|0;e=e+1|0}return 0}function sk(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;while((e|0)<(d|0)){a[b+e|0]=f?0:a[c+e|0]|0;f=f?1:(a[c+e|0]|0)==0;e=e+1|0}return b|0}function sl(){aH()}function sm(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;a0[a&31](b|0,c|0,d|0,e|0,f|0)}function sn(a,b,c){a=a|0;b=b|0;c=+c;a1[a&31](b|0,+c)}function so(a){a=a|0;return a2[a&63]()|0}function sp(a,b){a=a|0;b=b|0;a3[a&511](b|0)}function sq(a,b,c){a=a|0;b=b|0;c=c|0;a4[a&63](b|0,c|0)}function sr(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return a5[a&127](b|0,c|0,d|0)|0}function ss(a,b){a=a|0;b=b|0;return a6[a&31](b|0)|0}function st(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;a7[a&7](b|0,c|0,d|0)}function su(a){a=a|0;a8[a&3]()}function sv(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return a9[a&15](b|0,c|0,d|0,e|0)|0}function sw(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;ba[a&7](b|0,c|0,d|0,e|0,f|0,g|0)}function sx(a,b,c){a=a|0;b=b|0;c=c|0;return bb[a&127](b|0,c|0)|0}function sy(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;bc[a&31](b|0,c|0,d|0,e|0)}function sz(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;aa(0)}function sA(a,b){a=a|0;b=+b;aa(1)}function sB(){aa(2);return 0}function sC(a){a=a|0;aa(3)}function sD(a,b){a=a|0;b=b|0;aa(4)}function sE(a,b,c){a=a|0;b=b|0;c=c|0;aa(5);return 0}function sF(a){a=a|0;aa(6);return 0}function sG(a,b,c){a=a|0;b=b|0;c=c|0;aa(7)}function sH(){aa(8)}function sI(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;aa(9);return 0}function sJ(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;aa(10)}function sK(a,b){a=a|0;b=b|0;aa(11);return 0}function sL(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;aa(12)}
// EMSCRIPTEN_END_FUNCS
var a0=[sz,sz,hi,sz,r0,sz,r$,sz,ka,sz,ni,sz,iB,sz,kX,sz,r1,sz,oU,sz,qW,sz,sz,sz,sz,sz,sz,sz,sz,sz,sz,sz];var a1=[sA,sA,qT,sA,fI,sA,jc,sA,m3,sA,hj,sA,kc,sA,kZ,sA,iI,sA,qi,sA,oV,sA,sA,sA,sA,sA,sA,sA,sA,sA,sA,sA];var a2=[sB,sB,lf,sB,iO,sB,hz,sB,qr,sB,oj,sB,o8,sB,jr,sB,ok,sB,nB,sB,o9,sB,ks,sB,hA,sB,q8,sB,q7,sB,qs,sB,kr,sB,jq,sB,iN,sB,le,sB,nA,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB,sB];var a3=[sC,sC,kM,sC,cL,sC,n8,sC,qv,sC,jX,sC,rc,sC,e9,sC,n7,sC,it,sC,pc,sC,kN,sC,fD,sC,mW,sC,fj,sC,bU,sC,dx,sC,rb,sC,cP,sC,lq,sC,ik,sC,jv,sC,g4,sC,dq,sC,gc,sC,p2,sC,qK,sC,fq,sC,bv,sC,gD,sC,ch,sC,hG,sC,qJ,sC,rF,sC,jY,sC,dr,sC,i$,sC,fE,sC,n7,sC,rS,sC,jZ,sC,i4,sC,ow,sC,fN,sC,ju,sC,g9,sC,jA,sC,lj,sC,is,sC,iR,sC,p3,sC,od,sC,qw,sC,kv,sC,mX,sC,mR,sC,kw,sC,cK,sC,gI,sC,cJ,sC,sd,sC,en,sC,es,sC,em,sC,qM,sC,on,sC,l8,sC,i2,sC,nE,sC,rU,sC,li,sC,en,sC,cG,sC,dr,sC,nM,sC,mX,sC,oN,sC,hF,sC,cN,sC,qE,sC,fM,sC,n6,sC,bu,sC,oo,sC,cO,sC,mD,sC,e2,sC,rQ,sC,mY,sC,bS,sC,bU,sC,fi,sC,i3,sC,rR,sC,cI,sC,qL,sC,eZ,sC,i3,sC,ff,sC,rG,sC,oM,sC,kL,sC,n5,sC,kJ,sC,fQ,sC,cX,sC,cH,sC,fm,sC,ou,sC,oK,sC,qG,sC,rH,sC,ef,sC,hK,sC,eY,sC,fj,sC,g8,sC,cM,sC,jY,sC,e_,sC,sc,sC,p$,sC,nQ,sC,cY,sC,rT,sC,qL,sC,oN,sC,nF,sC,cY,sC,e8,sC,is,sC,rV,sC,p3,sC,i1,sC,dm,sC,jT,sC,er,sC,kM,sC,e_,sC,g9,sC,iS,sC,pd,sC,rE,sC,ir,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC,sC];var a4=[sD,sD,fH,sD,oT,sD,iA,sD,qX,sD,cj,sD,qc,sD,fG,sD,j8,sD,e3,sD,bV,sD,ne,sD,e1,sD,e0,sD,qV,sD,hg,sD,dy,sD,dw,sD,jd,sD,dD,sD,dv,sD,dp,sD,b$,sD,fL,sD,kV,sD,fF,sD,bW,sD,qe,sD,ci,sD,sD,sD,sD,sD,sD,sD];var a5=[sE,sE,oa,sE,cy,sE,nH,sE,ha,sE,ko,sE,qg,sE,pf,sE,nq,sE,rW,sE,o1,sE,kO,sE,re,sE,jx,sE,q$,sE,iv,sE,oQ,sE,qn,sE,q6,sE,dH,sE,jw,sE,eo,sE,b7,sE,e4,sE,qQ,sE,fK,sE,j$,sE,jf,sE,ht,sE,hc,sE,iM,sE,m1,sE,iU,sE,oO,sE,hH,sE,ds,sE,ct,sE,cx,sE,q5,sE,e$,sE,hI,sE,qy,sE,ll,sE,cl,sE,pe,sE,p8,sE,la,sE,cC,sE,jo,sE,i5,sE,ky,sE,oq,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE,sE];var a6=[sF,sF,fb,sF,se,sF,cB,sF,cv,sF,cD,sF,dG,sF,cn,sF,cs,sF,sF,sF,sF,sF,sF,sF,sF,sF,sF,sF,sF,sF,sF,sF];var a7=[sG,sG,cp,sG,bH,sG,cz,sG];var a8=[sH,sH,sl,sH];var a9=[sI,sI,jn,sI,rC,sI,rz,sI,jm,sI,sI,sI,sI,sI,sI,sI];var ba=[sJ,sJ,r4,sJ,r2,sJ,r3,sJ];var bb=[sK,sK,hl,sK,kS,sK,ob,sK,ep,sK,qj,sK,kx,sK,qU,sK,rd,sK,na,sK,cm,sK,jh,sK,q4,sK,iT,sK,j2,sK,qb,sK,iJ,sK,eX,sK,ix,sK,nG,sK,fw,sK,i9,sK,oY,sK,bY,sK,kd,sK,oe,sK,op,sK,fC,sK,qx,sK,cE,sK,qm,sK,lk,sK,co,sK,k_,sK,np,sK,mQ,sK,fJ,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK,sK];var bc=[sL,sL,rZ,sL,fa,sL,rX,sL,cu,sL,gr,sL,gn,sL,dC,sL,gp,sL,rY,sL,gs,sL,gq,sL,gm,sL,go,sL,gt,sL,sL,sL];return{_memcmp:sj,_strlen:si,_free:r6,_gme_enable_accuracy:eb,_realloc:r7,_strncpy:sk,_gme_track_ended:d9,__GLOBAL__I_a:fP,_gme_open_data:dY,_memset:sf,__GLOBAL__I_a287:i_,_malloc:r5,__GLOBAL__I_a524:nL,_memcpy:sg,_gme_play:d8,_memmove:sh,_gme_track_info:d3,_gme_start_track:d7,_gme_track_count:d1,runPostSets:bt,stackAlloc:bd,stackSave:be,stackRestore:bf,setThrew:bg,setTempRet0:bj,setTempRet1:bk,setTempRet2:bl,setTempRet3:bm,setTempRet4:bn,setTempRet5:bo,setTempRet6:bp,setTempRet7:bq,setTempRet8:br,setTempRet9:bs,dynCall_viiiii:sm,dynCall_vid:sn,dynCall_i:so,dynCall_vi:sp,dynCall_vii:sq,dynCall_iiii:sr,dynCall_ii:ss,dynCall_viii:st,dynCall_v:su,dynCall_iiiii:sv,dynCall_viiiiii:sw,dynCall_iii:sx,dynCall_viiii:sy}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_viiiii": invoke_viiiii, "invoke_vid": invoke_vid, "invoke_i": invoke_i, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiii": invoke_iiii, "invoke_ii": invoke_ii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_iiiii": invoke_iiiii, "invoke_viiiiii": invoke_viiiiii, "invoke_iii": invoke_iii, "invoke_viiii": invoke_viiii, "_strncmp": _strncmp, "___assert_fail": ___assert_fail, "___cxa_throw": ___cxa_throw, "_abort": _abort, "_toupper": _toupper, "_fflush": _fflush, "_sysconf": _sysconf, "_fabs": _fabs, "_floor": _floor, "___setErrNo": ___setErrNo, "_llvm_eh_exception": _llvm_eh_exception, "_exit": _exit, "_strrchr": _strrchr, "_log10": _log10, "_sin": _sin, "___cxa_pure_virtual": ___cxa_pure_virtual, "_time": _time, "___cxa_is_number_type": ___cxa_is_number_type, "___cxa_does_inherit": ___cxa_does_inherit, "___cxa_guard_acquire": ___cxa_guard_acquire, "__ZSt9terminatev": __ZSt9terminatev, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "_cos": _cos, "_llvm_pow_f64": _llvm_pow_f64, "___cxa_call_unexpected": ___cxa_call_unexpected, "___cxa_allocate_exception": ___cxa_allocate_exception, "___errno_location": ___errno_location, "___gxx_personality_v0": ___gxx_personality_v0, "_sbrk": _sbrk, "_fmod": _fmod, "___cxa_guard_release": ___cxa_guard_release, "__exit": __exit, "___resumeException": ___resumeException, "_strcmp": _strcmp, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity, "__ZTVN10__cxxabiv117__class_type_infoE": __ZTVN10__cxxabiv117__class_type_infoE, "__ZTVN10__cxxabiv120__si_class_type_infoE": __ZTVN10__cxxabiv120__si_class_type_infoE }, buffer);
var _memcmp = Module["_memcmp"] = asm["_memcmp"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _gme_enable_accuracy = Module["_gme_enable_accuracy"] = asm["_gme_enable_accuracy"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _strncpy = Module["_strncpy"] = asm["_strncpy"];
var _gme_track_ended = Module["_gme_track_ended"] = asm["_gme_track_ended"];
var __GLOBAL__I_a = Module["__GLOBAL__I_a"] = asm["__GLOBAL__I_a"];
var _gme_open_data = Module["_gme_open_data"] = asm["_gme_open_data"];
var _memset = Module["_memset"] = asm["_memset"];
var __GLOBAL__I_a287 = Module["__GLOBAL__I_a287"] = asm["__GLOBAL__I_a287"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var __GLOBAL__I_a524 = Module["__GLOBAL__I_a524"] = asm["__GLOBAL__I_a524"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _gme_play = Module["_gme_play"] = asm["_gme_play"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var _gme_track_info = Module["_gme_track_info"] = asm["_gme_track_info"];
var _gme_start_track = Module["_gme_start_track"] = asm["_gme_start_track"];
var _gme_track_count = Module["_gme_track_count"] = asm["_gme_track_count"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vid = Module["dynCall_vid"] = asm["dynCall_vid"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}