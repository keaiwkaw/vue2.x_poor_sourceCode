import { Dep } from "./observer/dep";
import { observe } from "./observer/index";
import { Watcher } from "./observer/watcher";
import { nextTick, proxy } from "./utils";

export function initState(vm) {
  const opts = vm.$options;
  if (opts.props) {
    initProps(vm)
  }
  if (opts.methods) {
    initMethods(vm)
  }
  if (opts.data) {
    initData(vm)
  }
  if (opts.computed) {
    initComputed(vm)
  }
  if (opts.watch) {
    initWatch(vm)
  }

}
function initComputed(vm) {
  let computed = vm.$options.computed;
  const watchers = vm._computedWatchers = {}
  for (let key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef == "function" ? userDef : userDef.get;
    watchers[key] = new Watcher(vm,getter,()=>{},{lazy:true}) 
    defineComputed(vm, key, userDef)
  }
}

function defineComputed(target, key, userDef) {
  const sharePropertyDefinition = {
    enumerable: true,
    configurable:true,
    set: () => { },
    get:()=>{}
  }
  if (typeof userDef == 'function') {
    sharePropertyDefinition.get = createComputedGetter(key)
  } else {
    sharePropertyDefinition.get =createComputedGetter(key)
    sharePropertyDefinition.set = createComputedGetter(key)
  }
  Object.defineProperty(target,key,sharePropertyDefinition)
}

function createComputedGetter(key) {
  return function () {
    let watcher = this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) {
        watcher.evalute();
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value;
    }
  }
}
function initData(vm) {
  let data = vm.$options.data;
  if ( typeof data == 'function') {
  data = data.call(vm);
  }
  vm._data = data;
  for (let key in data) {
    proxy(vm,'_data',key)
  }
  observe(data)
}

export function stateMixin(Vue) {
  Vue.prototype.$nextTick = function (cb) {
    nextTick(cb)
  } 
  Vue.prototype.$watch = function (exprOrFn, cb, options) {

    let watcher = new Watcher(this,exprOrFn, cb, {...options,user:true})
    if (options.immediate) {
      cb()
    }
  } 
}
/* 
watch 的几种写法
watch:{
  a(){}
  a:[]
  a:a
  a:{
  handler
  }
}

*/
function initWatch(vm) {
  let watch = vm.$options.watch;
  for (const key in watch) {
    if (Array.isArray(watch[key])) {
      for (const handler of watch[key]) {
        createWatcher(vm, key, handler)
      }
    } else {
      createWatcher(vm, key, watch[key])
    }
  }
}
function createWatcher(vm, exprOrFn, cb, options = {}) {

  if (typeof cb == 'object') {
    cb = cb.handler 
    options = cb;
  }
  if (typeof cb == 'string') {
    cb = vm[cb]
  }
  return vm.$watch(exprOrFn,cb,options)
}