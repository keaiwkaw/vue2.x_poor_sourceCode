import { Watcher } from "./observer/watcher";
import { patch } from "./vdom/patch";

export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    const vm = this;
    let preVnode = vm._vnode;
    if (!preVnode) {
      vm.$el =  patch(vm.$el,vnode)
    } else {
      vm.$el =  patch(preVnode,vnode)
    }
    vm._vnode = vnode;
  }
}
export function mountComponent(vm, el) {
  callHook(vm,'beforeMount')
  let updateComponent = function () {
    vm._update(vm._render())
  }
let wathcer =   new Watcher(vm, updateComponent, () => {
    callHook(vm,'beforeUpdate')
  }, {isRender:true});
  callHook(vm,'mounted')
}
export function callHook(vm,hook) {
  const handlers = vm.$options[hook];
  if (handlers) {
    for (const handler of handlers) {
      handler.call(vm)
    }
  }
}