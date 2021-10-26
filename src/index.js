// import { compileToFunctions } from './compiler/index';
import { initGlobalApi } from './global-api/index';
import { initMixin } from './init'
import { lifecycleMixin } from './lifecycle';
import { stateMixin } from './state';
import { renderMixin } from './vdom/index';
// import { createElm, patch } from './vdom/patch';

function Vue(options) {
  this._init(options);
}
//原型方法
initMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)
stateMixin(Vue)
  //静态方法
initGlobalApi(Vue)

export default Vue;