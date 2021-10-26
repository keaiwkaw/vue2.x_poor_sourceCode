// const { pushTarget, popTarget } = require("./dep");

import { nextTick } from "../utils";
import { Dep, popTarget, pushTarget } from "./dep";
let id = 0
export class Watcher {
  constructor(vm, exprOrFn, cb, options) {
    this.vm = vm;
    this.exprOrFn = exprOrFn
    this.cb = cb;
    this.options = options
    this.isRender = options.isRender;
    this.user = options.user;
    this.value = null;
    this.lazy = options.lazy
    this.dirty = !!this.lazy;
    this.id = id++;
    this.depsId = new Set();
    this.deps = [];
    if (typeof exprOrFn == 'function') {
      this.getter = exprOrFn
    } else {
      this.getter = function () {
        let obj = vm;
        let array = exprOrFn.split('.')
        for (let i = 0; i < array.length; i++){
          obj = obj[array[i]]
        }
        return obj
      }
    }
    this.value = this.lazy?void 0:this.get()
  }
  get() {

    pushTarget(this)
    let result = this.getter.call(this.vm)
    popTarget()
    return result
  }
  evalute() {
    this.value = this.get()
    this.dirty = false
  }
  update() {
    // this.get()
    if (this.lazy) {
      this.dirty = true
    } else {
      queueWatcher(this)
    }
   
  }
  run() {
    let newValue = this.get()
    let oldValue = this.value;
    this.value = newValue;
    if (this.user) {
      this.cb.call(this.vm,newValue,oldValue)
    }
  }
  addDep(dep) {
    let id = dep.id
    if (!this.depsId.has(id)) {
      this.deps.push(dep)
      this.depsId.add(id)
      dep.addSub(this)
        // dep.subs.push(Dep.target)
    }
  }
  depend() {
    let i = this.deps.length;
    while (i--) {
      this.deps[i].depend()
    }
  }
}
let has = {}
let queue = []
let pending = false;

function queueWatcher(watcher) {
  let id = watcher.id;
  if (!has[id]) {
    queue.push(watcher)
    has[id] = true;
    if (!pending) {
      nextTick(flushScheduleQueue)
      pending = true
    }
  }
}

function flushScheduleQueue() {
  // console.log(queue);
  queue.forEach((wathcer) => {
    // if (watcher.isRender) {
    //   watcher.run()
    // }
    wathcer.run()
  })
  has = {};
  pending = false;
  queue = []
}