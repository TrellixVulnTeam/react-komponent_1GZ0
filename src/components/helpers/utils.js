const React = require("react");
const path = require("path");
// const Obj = require('./Obj')
const _Proxy = (...args) => {
  let Prox = require("./_Proxy").default;
  return !args.length ? Prox : new Prox(...args);
};
const proto = { get: Object.getPrototypeOf, set: Object.setPrototypeOf };

let _global;
try {
  _global = window;
} catch {
  _global = global;
}
function _if(exp, more) {
  if (!more && typeof exp === "function") {
    let cb = (res) => res || undefined;
    try {
      return exp(cb);
    } catch {
      return undefined;
    }
  }
  return exp ? more(exp) : undefined;
}
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
function unCapitalize(word) {
  return word.charAt(0).toLowerCase() + word.slice(1);
}
function isDescriptor(ob) {
  let isDescriptor = true;
  if (!Reflect.ownKeys(ob).length) return false;
  try {
    let copy = Object.getOwnPropertyDescriptor(
      Object.defineProperty({}, "prop", ob),
      "prop"
    );
    isDescriptor =
      Reflect.ownKeys(copy).length === Reflect.ownKeys(ob).length &&
      Reflect.ownKeys(copy).every((key) => key in ob && ob[key] === copy[key]);
  } catch {
    isDescriptor = false;
  }
  return isDescriptor;
}
function areDescriptors(ob) {
  let areDescriptors = true;
  if (!Reflect.ownKeys(ob).length) return false;
  try {
    let copy = Object.getOwnPropertyDescriptors(
      Object.defineProperties({}, ob)
    );
    areDescriptors = !!(
      JSON.stringify(copy) === JSON.stringify(ob) &&
      Reflect.ownKeys(copy).every((key) => {
        return !!(
          JSON.stringify(ob[key]) === JSON.stringify(copy[key]) &&
          Reflect.ownKeys(copy[key]).every(
            (key) => !!(copy[key][key] === original[key][key])
          )
        );
      })
    );
  } catch {
    areDescriptors = false;
  }
  return areDescriptors;
}
function simpleMixin(trg, src) {
  return proto.set(trg, proto.set(src, proto.get(trg)));
}
function bind(...arg) {
  let target = arg[0];
  if (typeof target !== "function" || isClass(target)) return target;
  return Function.prototype.bind.call(...arg);
}

let thiss = (module.exports = {
  // const Obj = require("./Obj").Obj
  // const is = require("./Obj").is
  get _typeof() {
    const _typeof = function (ob, type) {
      let returnVal = unCapitalize(
        {}.toString.call(ob).split("[object ").join("").split("]")[0]
      );

      let ret = !!(type === returnVal);
      let split = type ? type.split(" ") : [];

      split.forEach((key, ind) => {
        if (key === "and" || key === "or") return;
        if (split[ind + 1] === "or")
          ret = !!(returnVal === key || returnVal === ind + 2);
        if (split[ind + 1] === "and")
          ret = !!(returnVal === key && returnVal === ind + 2);
      });
      return typeof type === "string" ? ret : returnVal;
    };
    _typeof.class = (ob) => _global[capitalize(_typeof(ob))];
    return _typeof;
  },
  entries(obj) {
    return Reflect.ownKeys(obj).map((key) => {
      let ent = [key, ""];
      Object.defineProperty(ent, 1, Object.getOwnPropertyDescriptor(obj, key));
      return ent;
    });
  },
  _undef(varble) {
    return typeof varble === "undefined";
  },
  isURL(url) {
    if (typeof url !== "string") return false;
    if (!thiss.isURL.pattern)
      thiss.isURL.pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return thiss.isURL.pattern.test(url) ? true : false;
  },
  isJSON(data) {
    if (typeof data !== "string") return false;
    data = data.trim();
    let match = data.match(/\{[^{}]+\}/) || [];
    return match[0] === data;
  },
  randomString(length = 32) {
    return Math.round(
      Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)
    )
      .toString(36)
      .slice(1);
  },
  Problem: class Problem extends Error {
    constructor(...arg) {
      super(...arg);
    }
    get log() {
      let stackTrace;
      let stack = new Error().stack;
      let trace = {};
      stackTrace = stack.split("\n");
      if (stackTrace[0].includes("log")) stackTrace.shift();

      let re = /(\w+)@|at (\w+) \(/g;
      stackTrace.forEach((st, ind) => {
        if (!st.trim()) return;
        let find = re.exec(st);
        if (find) find = find[1] || find[2];
        if (typeof find !== "string") return;
        trace[find] = st;
        let url = st.match(isURL.pattern);
        trace[find] = url ? url[0] : st;
      });
      return trace;
    }
  },
  isClass(func) {
    return is.class(func);
  },
  _last: (arr) => [...arr].pop(),
  tryCatch(exp, cb) {
    let res;
    let err;
    try {
      res = exp();
    } catch (error) {
      err = error;
    }
    return cb ? cb(res, err) : err || res;
  },
  suppress(exp, deflt) {
    let res = thiss.tryCatch(exp);
    return res instanceof Error ? deflt : res;
  },
  ReflectBind: (function () {
    let thiss = this;
    let RB = {
      descriptor(object, property, ...bindArgument) {
        let {
          object: ob = arguments[0],
          property: prop = arguments[1],
          descriptor: desc = Object.getOwnPropertyDescriptor(ob, prop),
          includeSet = false,
          bind = bindArgument
        } = arguments.length === 1 ? arguments[0] : {};
        if (!bind || !bind.length) return desc;
        if (bind && !Array.isArray(bind)) bind = [bind];
        Reflect.ownKeys(desc)
          .filter((key) => (key === "set" ? includeSet : true))
          .forEach((key) => {
            if (typeof desc[key] === "function" && property !== "constructor") {
              let original = desc[key];
              desc[key] = desc[key].bind(...bind);

              Array("bind", "apply", "call").forEach((meth) => {
                Object.defineProperty(desc[key], meth, {
                  value: function (...arg) {
                    if (arg[0]) {
                      let args = [...arg];
                      let newBind = args[0];
                      if (args.length && !newBind) newBind = this;
                      arg[0] = newBind;
                    }
                    return Function.prototype[meth].bind(original)(...arg);
                  },
                  configurable: true,
                  writable: true,
                  enumerable: false
                });
              });
            }
          });
        return desc;
      },
      ownDescriptor(object, property, ...bind) {
        if (!object.hasOwnProperty(property)) return;
        return this.descriptor(object, property, ...bind);
      },
      get(obj, prop, bind) {
        let desc;
        if (arguments.length === 1 || !obj || Object(obj) !== obj) return obj;
        if (arguments.length === 3 && !bind) return obj ? obj[prop] : undefined;
        if (arguments.lenght === 2) {
          if (!prop) return obj;
          (prop = ""), (bind = prop);
          desc = { value: property };
        }
        desc = desc || Reflect.getOwnPropertyDescriptor(obj, prop);
        if (!desc) return obj[prop];
        let type = Array("get", "value").find(
          (key) => typeof desc[key] === "function"
        );
        if (!type || (type === "value" && prop === "constructor"))
          return obj[prop];
        let property = type === "get" ? desc.get.bind(bind)() : desc.value;
        let res =
          typeof property === "function" && prop !== "constructor"
            ? property.bind(bind)
            : res;
        if (typeof res === "function") {
          Array("bind", "apply", "call").forEach(
            (key) => (res[key] = Function.prototype[key].bind(property))
          );
        }
        return res;
      }
    };
    let ReflectBind = function (...bind) {
      if (!bind.length) return RB;
      Reflect.ownKeys(RB).forEach((key) => {
        let property = RB[key];
        RB[key] = function (...args) {
          args.splice(2, 0, ...bind);
          return property.call(...args);
        };
      });
      return RB;
    };
    Object.defineProperties(ReflectBind, Object.getOwnPropertyDescriptors(RB));
    return ReflectBind;
  })(),
  argsProxy(args) {
    let newArg = {};
    return new Proxy(newArg, {
      get(ob, prop) {
        if (newArg[prop]) return newArg[prop];
        if (prop === "args") return newArg;
        let position = Object.keys(newArg).length;
        newArg[prop] = args[position];
        return newArg[prop];
      }
    });
  },
  Args(cb) {
    let newfunc = function (...arg) {
      return cb(argsProxy(arg));
    };
    return newfunc;
  },
  Funktion: class Funktion extends Function {
    constructor(func, props) {
      props =
        arguments[1] || (typeof arguments[0] === "object" && arguments[0]);
      func =
        typeof arguments[0] === "function"
          ? arguments[0]
          : props && props.function && props.function;
      if (props) delete props.function;
      let name =
        (props.hasOwnProperty("name") && props.name) || func.name || "funktion";
      delete props.name;

      function funktionCaller(fun, binder, ...ar) {
        return fun.call(binder, ...ar);
      }
      let funktion = {
        [name]: function (...ar) {
          let ao = argsProxy(ar);
          let binder = new Proxy(this || _global, {
            get(ob, prop) {
              if (prop in ob) return ob[prop];
              if (ao && ao.hasOwnProperty(prop)) return ao[prop];
              if (prop === "arguments") return [...ar];
            }
          });
          return !ao
            ? funktionCaller(func, binder, ...arguments)
            : funktionCaller(func, binder, ao);
        }
      }[name];
      Object.defineProperty(funktion, "name", {
        value: name,
        writable: false,
        enumerable: false,
        configurable: true
      });
      Array("properties", "static").forEach((pr) => {
        if (pr in props) merge(funktion, props[pr]);
        delete props[pr];
      });
      super();
      if (props && "__proto__" in props)
        Object.setPrototypeOf(funktion, props["__proto__"]);

      merge(funktion, this, ["name"]);
      if (props) merge(funktion, props, ["name", "__proto__"]);
      if (!props["__proto__"]) proto.set(funktion, this.constructor.prototype);
      funktion.prototype.constructor = funktion;
      return funktion;
    }
  },
  /*  alternative to the switch statement  */
  swap(cond, mp) {
    let res = cond();
    let deflt = {};
    let ret = deflt;
    mp.forEach((val, key) => {
      if (ret !== deflt) return;
      if (key === res) {
        ret = val(res);
      }
    });
    return ret === deflt ? undefined : ret;
  },

  executionTime(script) {
    let start = new Date();
    script();
    return new Date() - start;
  },
  contract(input, then) {
    if (isPromise(input))
      return then ? input.then((done) => then(done)) : input;
    return then ? then(input) : input;
  },
  asyncForEach(arr, cb, ths) {
    let iteration = -1;
    function iterate(prev) {
      if (iteration === arr.length - 1) return prev;
      iteration++;
      return contract(
        cb.call(ths, arr[iteration], iteration, prev, arr),
        (res) => {
          prev = res;
          return iterate(prev);
        }
      );
    }
    return iterate();
  },
  sequence(...funcs) {
    if (funcs.length === 1 && Array.isArray(funcs[0])) funcs = funcs[0];
    if (funcs.constructor && !Array.isArray(funcs))
      funcs = Object.values(funcs);
    return asyncForEach(funcs, (func, ind, res) => {
      return func(res);
    });
  },
  mixProx(obj, mix, bound, priority) {
    let prec = priority;
    let handler = {
      get(ob, prop) {
        let trg =
          (prop in prec && prec) ||
          (prop in obj && obj) ||
          (prop in mix && mix);
        let bnd = bound;
        if (trg === bound) bnd = undefined;
        return bnd ? thiss.tie(Reflect.get(trg[prop], bnd), bnd) : trg[prop];
      }
    };
    return new Proxy(obj, handler);
  },
  reverseInherit() {},
  bindIt(obj, key, bnd) {
    let res, args;
    if (arguments.length < 3) {
      if (!key) return obj;
      if (typeof key === "string" || typeof key === "symbol") return obj[key];
      bnd = key;
      res = obj;
    }
    args = [obj, key, bnd].filter(Boolean);
    res = res || Reflect.get(...args);
    return typeof res === "function" ? res.bind(bnd) : res;
  },
  _mixin({ target, source, priority = source, bind = target }) {
    function objFunc(trg) {
      let apply = (ob, ...arg) => {
        if (arguments.length === 1 && typeof ob === "string")
          return ReflectBind.get(trg, ob, bound());
        return !arguments.length
          ? trg
          : thiss.suppress(() => ob() === trg, ob === trg);
      };
      let handler = _Proxy().handlers.default(trg);
      return new Proxy(apply, handler);
    }
    let obj = objFunc(target);
    let mix = objFunc(source);
    let rank = objFunc(priority);
    let bound = objFunc(bind);

    let type = (o1, o2) =>
      !o2 ? Obj(o1).Type().class() : Obj(o1).Type() === Obj(o2).Type();

    let clonedMix = Obj(Obj(mix).descriptors)
      .filter(key, () => {
        if (key in obj && rank(obj())) return false;
        if (
          key in type(obj).prototype &&
          !(
            type(mix).prototype instanceof type(obj) ||
            type(obj).prototype instanceof mix()
          ) &&
          type(obj) !== Object &&
          bound(obj)
        )
          return false;
      })
      .map((key, val) => {
        delete val.value;
        val.get = function () {
          return mix(key);
        };
        return val;
      });
    return simpleMixin(obj, clonedMix);
  },
  mixin(...ar) {
    return _mixin(argsProxy(ar));
  },
  captured: function () {
    let captured = { get: {}, set: {} };
    function capture(name = "object") {
      let cap = typeof name === "string" ? [] : name;
      if (!cap.applies) cap.applies = [];
      return new Proxy(cap, {
        get: function (ob, prop) {
          if (typeof name === "string") {
            captured.get[name] = captured.get[name] || [];
            captured.get[name].push(cap);
          }
          cap.push(prop);
          return capture(cap);
        },
        set: function (ob, prop, val) {
          if (typeof name === "string") {
            captured.set[name] = captured.get[name] || [];
            captured.set[name].push(cap);
          }
          cap.set(prop);
          cap.applies.push((target) => {
            let dest = target;
            cap.forEach((part, ind) => {
              if (ind === cap.length) dest[part] = val;
              else dest = dest[part];
            });
          });
          return true;
        },
        apply: function (target, that, args) {
          cap.applies.push();
        }
      });
    }
    return captue;
  },
  mapFunction(map = new Map()) {
    function mapFunc(key, val) {
      if (!map.has(key)) return mapFunc.get(...arguments);
      if (!arguments.hasOwnProperty(1)) return map.get(key);
      return map.set(...arguments);
    }
    simpleMixin(mapFunc, {});
    Reflect.ownKeys(thiss._typeof.class(map).prototype).forEach((key) => {
      Object.getPrototypeOf(mapFunc)[key] =
        typeof thiss._typeof.class(map).prototype[key] === "function"
          ? thiss._typeof.class(map).prototype[key].bind(map)
          : thiss._typeof.class(map).prototype[key];
    });
    mapFunc.get = function (obj, properties) {
      let props = () => arguments.hasOwnProperty(1);
      if (!props() && map.has(obj)) return map.get(obj);
      if (!map.has(obj)) mapFunc.set(obj, props());
      return properties;
    };
    return mapFunc;
  },
  WeakerMap: class WeakerMap extends WeakMap {
    constructor(...arg) {
      super(...arg);
      let WM = this;
      const random = randomString();
      const mapFunction = function (obj, properties) {
        if (!WM.has(obj)) return mapFunction.get(...arguments);
        if (!arguments.hasOwnProperty(1)) return WM.get(obj);
        return WM.set(...arguments);
      };
      Reflect.ownKeys(WeakMap.prototype).forEach((key) => {
        mapFunction[key] =
          typeof WeakMap.prototype[key] === "function"
            ? WeakMap.prototype[key].bind(WM)
            : WeakMap.prototype[key];
      });
      mapFunction.get = function (obj, properties) {
        let def = {};
        let props = () => arguments.hasOwnProperty(1);
        if (!props() && WM.has(obj)) return WM.get(obj);
        if (!WM.has(obj)) mapFunction.set(obj, props() ? properties : def);
        return props() ? properties : def;
      };
      mapFunction.set = function (obj, props) {
        if (!WM.has(obj))
          WM.set(
            obj,
            new Proxy(
              {},
              {
                get(ob, prop) {
                  return prop === "randomString"
                    ? random
                    : prop in props
                    ? props[prop]
                    : undefined;
                },
                set(ob, prop, val) {
                  return (props[prop] = val);
                }
              }
            )
          );
        else WM.set(obj, props);
      };
    }
  },

  /*
  function ObjectMap(obMap={}) {
    let types = new MapFunc(new WeakMap());
    let type = obMap instanceof Map ? "map" : "object";
    let asObject = type === "object" ? obMap : Object.fromEntries(obMap);
    let asMap = type === "object" ? new Map(entries(obMap)) : obMap;

    asObject.asMap = function () {
      return asMap;
    };
    asMap.asObject = function () {
      return asObject;
    };

    // create the object map that will be returned from the constructor
    let objMapHandler = {};
    let objectMap = new Proxy(asObject, new Handler(objMapHandler));

    asObject.objectMap = asMap.objectMap = objectMap;
    types(objectMap, type);

    // create two separate proxies, one for each type
    let asObjectHandler = { objmapType: "object", target: asObject };
    let asMapHandler = {
      objmapType: "map",
      target: asMap,
      ownKeys(map) {
        return Reflect.ownKeys(map.objectMap);
      }
    };
    let asMapProxy = new Proxy(asMap, new Handler(asMapHandler));
    let asObjectProxy = new Proxy(asObject, new Handler(asObjectHandler));

    asMapHandler.props = {
      // default(ob,prop) {},
      delete(map, prop) {
        return function (key) {
          Reflect.deleteProperty(map.asObject(), key);
          return map.delete(key);
        };
      },
      get(map, prop) {
        return function get(key) {
          return map.asObject()[key];
        };
      },
      set(map, prop) {
        return function set(key, val) {
          map.asObject()[key] = val;
          map.set(key, val);
        };
      },
      has(map, prop) {
        return function has(key) {
          return map.asObject().hasOwnProperty(key);
        };
      },
      forEach(map, prop) {
        return function forEach(cb) {
          Reflect.ownKeys(map.objectMap).forEach((key, ind, ths) => {
            return cb(map.asObject()[key], key, ind, ths);
          });
        };
      }
    };

    asObjectProxy = new Proxy(asObject, asObjectHandler);
    asMapProxy = new Proxy(asObject, asMapHandler);

    objMapHandler.default = function (ob, prop) {
      let type = types(objectMap);
      let returnVal;
      if (type === "object") {
        returnVal = asObjectProxy[prop];
        if (typeof returnVal === "undefined" && !(prop in ob))
          returnVal = asMapProxy[prop];
      } else if (type === "map") {
        returnVal = asMapProxy[prop];
        if (typeof returnVal === "undefined" && !(prop in ob.asMap()))
          returnVal = asObjectProxy[prop];
      }
      return returnVal;
    };
    objMapHandler.props = {
      asObject(ob, prop, rec = objectMap) {
        return function (...arg) {
          types(objectMap, "object");
          if (proto.get(objMapHandler) === asMapHandler)
            proto.set(objMapHandler, asObjectHandler);
          return rec;
          // return ob.asObject(...arg)
        };
      },
      asMap(ob, prop, rec = objectMap) {
        return function () {
          types(objectMap, "map");
          if (proto.get(objMapHandler) === asObjectHandler)
            proto.set(objMapHandler, asMapHandler);
          return rec;
        };
      }
    };
    objMapHandler.set = function (ob, prop, val) {
      ob.asMap().set(prop, tie(Reflect.get(ob, prop, ob), ob));
      return Reflect.set(ob, prop, val);
    };
    objMapHandler.deleteProperty = function (ob, prop) {
      Reflect.deleteProperty(ob, prop);
      return ob.asMap().delete(prop);
    };
    objMapHandler.defineProperty = function (ob, prop, def) {
      Reflect.defineProperty(ob, prop, def);
      return ob.asMap().set(prop, ob[prop]);
    };
    objMapHandler.ownKeys = function (map, key) {
      return function keys() {
        let kys = [];
        map.forEach((val, key) => kys.push(key));
        return kys;
      };
    };

    types(obMap, type);
    return objectMap;
  }
  */

  ObjectMap(obMap = {}) {
    (vars = require("../Komponent/privateVariables")),
      vars.default(ObjectMap, { keys: new WeakMap() });
    let keys = vars(ObjectMap).keys;
    let origSet = keys.set.bind(keys);
    keys.set = (arg) => {
      if (typeof arg === "symbol") return origSet(arg, { key: arg });
      else return origSet(arg);
    };
    class mapKey {
      constructor(obj, key, text) {
        let mapKey = Symbol(text || "MapKey");
        keys.set(mapKey, {
          key: key,
          map: vars(obj).map,
          object: vars(map).obj
        });
        return mapKey;
      }
    }

    function initializeVars(om) {
      vars(om).type = om instanceof Map ? "map" : "object";
      if (!vars(om).map)
        vars(om).map = vars(om).type === "object" ? new Map(entries(om)) : om;
      if (vars(om).type === "object") {
        vars(om).map = ObjectMap(vars(om).map);
        vars(vars(om).map).obj = om;
      }
      if (!vars(om).obj) vars(om).obj = om;
    }
    if (!vars.has(obMap)) initializeVars(obMap);

    // if it's an object, then we set the object's prototype to the map itself
    if (vars(obMap).type === "object") {
      proto.set(obMap, vars(obMap).map);
      return obMap;
    }

    let map = (ths) => vars(ths).map;
    let obj = (ths) => vars(ths).obj;

    let mpro = (ths) => {
      if (vars(ths).mpro) return vars(ths).mpro;
      vars(ths).mpro = new Proxy(map(ths), {
        get(ob, prop) {
          return map(ths)[prop];
        }
      });
      return vars(ths).mpro;
    };

    const omProto = {
      get(key) {
        if (!(typeof key === "string" || typeof key === "symbol"))
          key = this.symbolFromKey(this, key);
        return obj(this)[key];
      },
      set(key, val, alt) {
        mpro(this).set(key);
        let obkey =
          typeof key === "string" || typeof key === "symbol"
            ? key
            : new mapKey(obj(this), key, alt);
        obj(this)[obkey] = val;
      },
      delete(key) {
        mpro(this).delete(key);
        return delete obj(this)[key];
      },
      has(key) {
        if (!(typeof key === "string" || typeof key === "symbol"))
          key = this.symbolFromKey(key);
        return !!obj(this)[key];
      },
      clear() {
        mpro(this).clear();
        return Obj(obj(this)).clear();
      },
      refresh() {
        mpro(this).forEach((val, key) => {
          if (!obj(this).hasOwnProperty(key)) mpro(this).delete(key);
          mpro(this).set(key, ob(this)[key]);
        });
        let objEnt = entries(obj(this)).filter(
          ([key, val] = ent) => !mpro(this).has(key)
        );
        objEnt.forEach(([key, val] = ent) => mpro(this).set(key, val));
      },
      symbolFromKey(ob, key) {
        return Reflect.ownKeys(vars(ob).obj).find(
          (key) => keys.get(key) === key
        );
      },
      keyFromSymbol(ob, sym) {
        return keys.get(sym).key;
      }
    };
    // if it's not a map then we have to get creative
    if (!(vars(obMap).type === "map" && vars(obMap).obj !== obMap)) {
      let mixed = mixin(obMap, omProto);
      delete mixed.constructor;
      proto.set(obMap, omProto);
    }

    return obMap;
  },

  classInherit: (komp, Komponent) => {
    let comp = proto.set({}, komp);
    while ((comp = proto.get(comp))) {
      if (proto.get(comp) === Komponent) break;
      if (proto.get(comp) === React.Component) {
        proto.set(comp, Komponent);
        break;
      }
    }
  },
  objInherit: (komp, Komponent) => {
    let comp = proto.set({}, komp);
    while ((comp = proto.get(comp))) {
      console.log(comp.constructor.name);
      if (proto.get(comp) && proto.get(comp).constructor === Komponent) break;
      if (proto.get(comp) && proto.get(comp).constructor === React.Component) {
        proto.set(comp, Komponent.prototype);
        break;
      }
    }
  },
  tie: function () {
    let tie = function (func, newBind) {
      if (typeof func !== "function" || func.name.split("bound ")[1])
        return func;
      if (!newBind) return func;

      if (func instanceof tie) func = func.originalFunc;
      if (isClass(func)) {
        console.error(
          `Problem with: "${func.name}." Tie function can't work with classes. Invalid data type. Ignoring.`
        );
        return func;
      }
      var funcName = func.name;
      let newFunc = {
        [funcName]: function (...arg) {
          return newFunc.tie.bind
            ? newFunc.originalFunc.call(newFunc.tie.bind, ...arg)
            : newFunc.originalFunc.call(...arg);
        }
      }[funcName];
      Object.setPrototypeOf(newFunc, func);
      Object.defineProperty(newFunc, "name", { value: funcName });

      newFunc.originalFunc = func;

      newFunc.tie =
        newFunc.tie ||
        function (binder) {
          this.tie.bind = binder;
        };
      if (newBind) newFunc.tie.bind = newBind;
      proto.set(newFunc, tie.prototype);
      // return newFunc
      return newFunc;
    };
    proto.set(tie.prototype, Function.prototype);
    Array("bind", "call", "apply").forEach(
      (key) =>
        (tie.prototype[key] = function (...arg) {
          return this.originalFunc[key](...arg);
        })
    );
    return tie;
  },
  /*
  const tie = new Funktion({

    _function: function tie(func, newBind) {
      if (typeof func !== "function" || func.name.split("bound ")[1]) return func;
      if (!newBind) return func;
    
      if (func instanceof tie) func = func.originalFunc;
      if (isClass(func)) {
        console.error(
          `Problem with: "${func.name}." Tie function can't work with classes. Invalid data type. Ignoring.`
        );
        return func;
      }
      let newFunc = new Funktion({
        _function: function (...arg) {
          return newFunc.tie.bind
            ? newFunc.originalFunc.call(newFunc.tie.bind, ...arg)
            : newFunc.originalFunc.call(...arg);
        },
        _properties: merge(merge({},func),{
          originalFunc = func,
          tie : newFunc.tie ||
          function (binder) {
            this.tie.bind = binder;
          }        
        }),
        _prototype:tie.prototype,
      })
      if (newBind) newFunc.tie.bind = newBind;
      return newFunc;
    },
    prototype: {
      constructor: this.originalFunc,
      bind() { 
        return this.originalFunc.bind(...arg);
      },
      call() {
        return this.originalFunc.call(...arg);
      },
      apply() {
        return this.originalFunc.apply(...arg);
      },
      _prototype: Function
    }
  })
  */
  cloneFunc(func, cb, binder) {
    var clonedFunctionName = func.name;
    const cloned = {
      [clonedFunctionName]: function (...props) {
        let bnd = binder || this;
        if (new.target) return new func(...props);
        return cb.call(bnd, binder, ...props);
      }
    }[clonedFunctionName];
    cloned.prototype = func.prototype;
    if (!binder) {
      Object.setPrototypeOf(cloned, func);
      Object.defineProperty(cloned, "name", { value: func.name });
      return cloned;
    }
    const properties = {}[("call", "bind", "apply")].forEach((method) => {
      let original = thiss.tie(Function.prototype[method], cloned);
      properties[method] = function (...arg) {
        let bin = binder || this;
        binder = arg[0];
        if (method === "bind") {
          let newClone = cloneFunc(func, cb, arg[0]);
          let newOriginal = thiss.tie(Function.prototype.bind, newClone);
          binder = bin;
          return newOriginal(...arg);
        }
        try {
          return original(...arg);
        } finally {
          binder = bin;
        }
      };
    });
    const clonedProto = _Proxy({
      target: func,
      virtualTarget: Object.getPrototypeOf(func),
      properties
    });
    Object.defineProperty(cloned, "name", { value: func.name });
    proto.set(cloned, clonedProto);
    return cloned;
  },
  waitFor(conditionFunction, time = 100) {
    const poll = (resolve) => {
      if (typeof conditionFunction === "number") {
        setTimeout((_) => resolve(), conditionFunction);
      } else {
        if (conditionFunction()) resolve();
        else setTimeout((_) => poll(resolve), time);
      }
    };
    return new Promise(poll);
  },
  merge(target, src, exclude, binder) {
    if (typeof target === "undefined" || typeof src === "undefined")
      throw new Error(
        "Invalid arguments at merge function. Must have a valid target and source."
      );
    let callback = typeof exclude === "function" ? exclude : undefined;
    if (!Array.isArray(exclude)) exclude = [];

    if (Array.isArray(target) && Array.isArray(src))
      return [
        ...target,
        ...src.filter((item) => !exclude.includes(item) && target)
      ];
    if (target[Symbol.iterator] && src[Symbol.iterator]) {
      if (target instanceof HTMLCollection) {
        target.parentNode.replaceChildren(...target.children, ...src);
      } else if (target.set) [...src].forEach((item) => target.set(...item));
      else if (target.add) {
        [...src].forEach((item) => target.add(item));
      }
      return target;
    }

    if (thiss._typeof(target) === 'element' || thiss._typeof(target) === 'htmlElement') {
      if (thiss._typeof(src) === 'element' || thiss._typeof(src) === 'htmlElement') {
        target.replaceChildren(...target.children, ...src.children);
        Reflect.ownKeys(src)
          .filter((key) => key !== "children" && key !== "childNodes")
          .forEach((key) => {
            if (target[key][Symbol.iterator]) {
              try {
                merge(target[key], src[key]);
              } catch {}
            } else
              try {
                target.setAttribute(key, src[key]);
              } catch {}
          });
        } else if (thiss._typeof(src) === 'hTMLCollection') target.replaceChildren.apply(target, _toConsumableArray(target.children).concat(_toConsumableArray(src)));
        target.replaceChildren(...target.children, ...src);
      return target;
    }
    if (src === Object.prototype) throw new Error("Object prototype");
    let descriptors = areDescriptors(src)
      ? src
      : Object.getOwnPropertyDescriptors(src);
    Reflect.ownKeys(descriptors)
      .filter((key) => !exclude.includes(key))
      .forEach((key) => {
        let desc = descriptors[key];
        let type = "value" in desc ? "value" : "get" in desc ? "get" : "set";
        if (binder)
          desc[type] =
            key === "constructor" || key === "set"
              ? desc[type]
              : thiss.bindIt(desc[type], binder);
        let targetDesc = Object.getOwnPropertyDescriptor(target, key);
        if (
          targetDesc &&
          targetDesc.configurable === false &&
          targetDesc.writable === false &&
          !callback
        ) {
          delete descriptors[key];
          return;
        }
        if (targetDesc && targetDesc.configurable === false && !callback) {
          let val;
          try {
            val = Reflect.get(targetDesc, type, target);
          } catch {
            val = Reflect.get(targetDesc, type, src);
          }
          if (val && typeof val === "function" && binder)
            val = val.bind(binder);
          target[key] = val;
          delete descriptors[key];
          return;
        }
        let throwThis;
        try {
          let cbResult;
          if (callback) {
            cbResult = callback(key, desc, target);
            desc =
              cbResult === true
                ? desc
                : cbResult &&
                  typeof cbResult === "object" &&
                  !Array.isArray(cbResult) &&
                  !cbResult instanceof Error
                ? cbResult
                : desc;
            if (cbResult instanceof Error || typeof cbResult === "string") {
              throwThis = cbResult;
              desc = undefined;
            }
          }
        } catch (err) {
          if (err) console.error(err);
          if (throwThis) throw throwThis;
        }
      });
    Object.defineProperties(target, descriptors);
    return target;
  },
  clone(obj, withProto = false, exclude = [], binder) {
    if (typeof obj === "function") {
      let backup;
      if (exclude.length || arguments[1] === false)
        backup = Object.setPrototypeOf(
          Object.getOwnPropertyDescriptors(obj),
          Object.getPrototypeOf(obj)
        );
      obj = this.cloneFunc(obj, (...arg) => obj(...arg), binder);
      if (arguments[1] === false)
        Object.setPrototypeOf(obj, Object.getPrototypeOf(backup));
      if (exclude.length)
        exclude.forEach((ex) => Object.defineProperty(obj, ex, backup[ex]));
    }
    let cb = typeof exclude === "function" ? exclude : undefined;
    let constructorName = capitalize(thiss._typeof(obj));
    let typeConstructor = _global[constructorName];
    let target;
    let arg;
    if (Symbol.iterator in obj) {
      if (Array.isArray(obj))
        target = [...obj].filter((item) => !exclude.includes(item));
      else if (obj instanceof String) {
        if (Object(obj) !== obj) return obj;
        target = Object.setPrototypeOf(
          String(Object(obj).toString()),
          Object.getPrototypeOf(obj)
        );
      } else {
        let argSpread = [...obj];
        arg = [...argSpread.entries()];

        if (arg.every((ent) => Array.isArray(ent[1]))) {
          arg = arg
            .map((ent) => {
              if (exclude.includes(ent[1][1])) return false;
              return ent[1];
            })
            .filter(Boolean);
        } else if (
          arg.every(
            (ent, ind) => obj.hasOwnProperty(ind) && ent[1] === obj[ind]
          )
        )
          // if it's a numeric key
          arg = arg.filter((ent) => !exclude.includes(ent[1]));

        let consTarget = thiss.suppress(() => new obj.constructor(arg), false);
        if (
          consTarget &&
          JSON.stringify([...consTarget]) === JSON.stringify(arg)
        )
          target = consTarget;
        else {
          let typeTarget = new typeConstructor(arg);
          if (
            typeTarget &&
            JSON.stringify([...typeTarget]) === JSON.stringify(arg)
          )
            target = typeTarget;
        }
      }
    }

    target =
      target ||
      thiss.suppress(() => new obj.constructor(), new typeConstructor());

    if (withProto) proto.set(target, proto.get(obj));

    let descs = Object.getOwnPropertyDescriptors(obj);
    if (withProto) proto.set(descs, proto.get(obj));

    if (typeof exclude !== "function") {
      if (exclude.length)
        Reflect.ownKeys(obj).forEach((key) => {
          if (exclude.includes(key)) delete descs[key];
        });
      return Object.defineProperties(target, descs);
    }

    Object.entries(descs).forEach(([key, desc]) => {
      if (cb) descs[key] = cb(key, desc, obj) || descs[key];
      // if (binder) descs[key] = boundDescriptor(obj,key,binder);
    });

    return Object.defineProperties(target, descs);
  },
  getClone(obj, merge) {
    let thiss = this;
    let cloned = merge || this.clone(obj, true, Reflect.ownKeys(obj));
    function updateProps() {
      Reflect.ownKeys(obj).forEach((key) => {
        if (!Reflect.has(cloned, key)) {
          let desc = Object.getOwnPropertyDescriptor(obj, key);
          Object.defineProperties(cloned, key, {
            get() {
              return obj[key];
            },
            set(val) {
              return !!(obj[key] = val);
            },
            enumerable: desc.enumerable,
            configurable: true
          });
        }
      });
      Reflect.ownKeys(cloned).forEach((key) => {
        if (!Reflect.has(obj, key))
          try {
            Reflect.deleteProperty(clone, key);
          } catch {}
      });
    }
    Reflect.ownKeys(obj).forEach((key) => {
      let desc = Object.getOwnPropertyDescriptor(obj, key);
      let cloneDesc = Object.getOwnPropertyDescriptor(cloned, key);
      if (
        cloneDesc &&
        cloneDesc.configurable === false &&
        cloneDesc.writable === false
      )
        return;
      else if (cloneDesc && cloneDesc.configurable === false) {
        try {
          cloned[key] = obj[key];
        } catch {}
        return;
      }
      Object.defineProperty(cloned, key, {
        get() {
          updateProps();
          if (!Reflect.has(obj, key)) Reflect.deleteProperty(cloned, key);
          return obj[key];
        },
        set(val) {
          Reflect.set(obj, key, val);
          updateProps();
          return true;
        },
        configurable: true,
        enumerable: desc.enumerable
      });
    });

    let getCloneHandler = {};
    Reflect.ownKeys(Reflect).forEach(
      (key) =>
        (getCloneHandler[key] = function (...arg) {
          updateProps();
          return this.defaults[key](...arg);
        })
    );
    Object.setPrototypeOf(
      cloned,
      _Proxy({
        target: obj,
        virtualTarget: Object.getPrototypeOf(obj),
        handler: getCloneHandler
      })
    );
    return cloned;
  },
  getLevel(obj, cb) {
    let level = obj;
    let success = false;
    if (typeof level === "undefined") return;
    const loop = () => {
      level = proto.set({}, level);
      while ((level = proto.get(level))) {
        if (typeof level === "undefined") return;
        let result = cb(level);
        if (result) {
          success = true;
          return level;
        }
      }
    };
    loop();
    return success ? level : undefined;
  },
  getLevels(ob) {
    let levels = new Set();
    this.getLevel(ob, (lvl) => {
      if (!lvl) return true;
      levels.add(lvl.constructor);
    });
    let lvls = Array.from(levels);
    lvls.strings = () => lvls.map((lvl) => lvl.constructor.name);
  },
  getDescriptor(obj, prop) {
    let level = this.getLevel(obj, (lvl) => lvl && lvl.hasOwnProperty(prop));
    return level ? new Descriptor(level, prop) : undefined;
  },
  descriptorValue(obj, prop) {
    if (!obj) return;
    let desc;
    if (arguments.length === 1 && ("get" in obj || "value" in obj)) desc = obj;
    desc = desc || Object.getOwnPropertyDescriptor(obj, prop);
    if (!desc) return;
    return desc.hasOwnProperty("get") ? desc.get : desc.value;
  },
  getStackTrace() {
    return new Problem().log;
  },
  /*
  function commandLine(command) {
    return require('child_process').execSync(command, (error, stdout, stderr) => {
      if (error) {
          console.log(`error: ${error.message}`);
          return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
  }
  */
  safe(ob, type = "get") {
    let props = [];
    let safeProx = _Proxy()(ob, {
      get: function (ob, prop) {
        if (prop !== "done" && prop !== "setVal") props.push(prop);
        ob = ob["{{target}}"] || ob;
        if (prop === "done" || prop === "setVal") {
          return function (val) {
            if (val) {
              prop = last(props);
              ob[prop] = arguments[0];
            }
            return prop === "done" ? ob : safe(ob[prop]);
          };
        }
        if (type === "get") {
          if (!(prop in ob)) return safe({});
          return safe(ob[prop]);
        }
        if (!ob[prop]) ob[prop] = {};
        return safe(ob[prop], "set");
      },
      set: function (ob, prop, val) {
        ob[prop] = typeof ob[prop] === "undefined" ? ob[prop] : val;
        return true;
      }
    });
    // if (typeof ob !== 'object' && typeof ob !== 'function')
    // return ob
    return safeProx;
  }
});

