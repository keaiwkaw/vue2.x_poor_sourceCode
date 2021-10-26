
import { mergeOptions } from "../utils";
import initExtend from './extend'
export function initGlobalApi(Vue) {
  Vue.options = {}
  Vue.options._base = Vue
  Vue.mixin = function(mixin) {
    this.options = mergeOptions(this.options, mixin)
  }
  initExtend(Vue)
  Vue.options.components = {}
  Vue.component = function (id,definition) {
    definition.name = definition.name || id;
    definition = this.options._base.extend(definition)
    Vue.options.components[id] =definition
  }
}