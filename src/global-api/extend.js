import { mergeOptions } from "../utils";
let cid =0
export default function extend(Vue) {
  Vue.extend = function (extendOptions) {
    
    let Super = this;
    let Sub = function VueComponent(options) {
      this._init(options)
    }
    Sub.cid = cid++;
    Sub.prototype = Object.create(Super.prototype);
    Sub.prototype.constructor = Sub;
    Sub.options = mergeOptions(Super.options, extendOptions)

    Sub.component = Super.component
    return Sub;
  }
}