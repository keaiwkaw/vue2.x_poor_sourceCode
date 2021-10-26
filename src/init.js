import { initState } from "./state";
import { compileToFunctions } from './compiler/index'
import {callHook, mountComponent} from './lifecycle'
import { mergeOptions } from "./utils";
export  function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    const vm = this;
    vm.$options = mergeOptions(vm.constructor.options, options);
    callHook(vm,'beforeCreate')
    initState(vm)
    callHook(vm,'created')
    //渲染
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
  Vue.prototype.$mount = function (el) {
    const vm = this;
    const options = vm.$options
    if (!options.render) {
      let template
      if (options.template) {
        template = options.template
      } else {
        template = document.querySelector(el).outerHTML
        vm.$el =  document.querySelector(el)
      }
      //将模板编译成render
      const render = compileToFunctions(template);
      options.render = render;
    } 
    // mountComponent(vm,el)
    callHook(vm,'beforeMount')
    mountComponent(vm, el)
    callHook(vm,'mounted')
  }
}
