import { nativeTag } from "../utils";

export function renderMixin(Vue) {
  Vue.prototype._render = function() {
    const vm = this
    const render = vm.$options.render;
    // console.log(vnode);
    let vnode = render.call(vm, ...arguments)
    return vnode
  }
  Vue.prototype._c = function() {
    return createElement(this, ...arguments)
  }
  Vue.prototype._v = function(text) {
    return createTextVnode(text)
  }
  Vue.prototype._s = function(value) { return value == null ? "" : (typeof value == 'object' ? JSON.stringify(value) : value) }
}

function createElement(vm, tag, data = {}, ...children) {
  if (nativeTag(tag)) {
    return vnode(tag, data, data.key, children)
  } else {

    let Ctor = vm.$options.components[tag];
    return createComponent(vm, tag, data, data.key, children, Ctor)
  }

}

function createComponent(vm, tag, data, key, children, Ctor) {
  const baseCtor = vm.$options._base;
  if (typeof Ctor == 'object') {
    Ctor = baseCtor.extend(Ctor)
  }

  data.hook = {
    init(vnode) {
      let child = vnode.componentInstance = new Ctor({})
      child.$mount()
    }
  }
  return new vnode(`vue-component-${Ctor.cid}-${tag}`, data, key, undefined, undefined, { children, Ctor })
}

function createTextVnode(text) {
  return vnode(undefined, undefined, undefined, undefined, text)
}

function vnode(tag, data, key, children, text, componentOptions) {
  return {
    tag,
    data,
    key,
    children,
    text,
    componentOptions
  }
}