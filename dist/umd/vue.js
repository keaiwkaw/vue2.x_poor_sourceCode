(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  function proxy(vm, data, key) {
    Object.defineProperty(vm, key, {
      get() {
        return vm[data][key]
      },
      set(newValue) {
        vm[data][key] = newValue;
      }
    });
  }
  function defineProperty(target, key, value) {
    Object.defineProperty(target, key, value);
  }

  const LIFECICYLE_HOOKS = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    "beforeDestory",
    "destoryed"
  ];
  const strats = {};
  strats.components = function (parentVal, childVal) {
    let res = Object.create(parentVal);
    for (let i in childVal) {
      res[i] = childVal[i];
    }
    return res
  };
  function mergeHook(parentVal, childVal) {
    if (childVal) {
      if (parentVal) {
        return parentVal.concat(childVal)
      } else {
        return [childVal]
      }
    } else {
      return parentVal
    }
  }
  LIFECICYLE_HOOKS.forEach((hook) => {
    strats[hook] = mergeHook;
  });
  function mergeOptions(parent, child) {
    const options = {};
    for (let key in parent) {
      mergeField(key);  //将父options上面的属性合并到总options上面
    }
    for (let key in child) {
      if (!parent.hasOwnProperty(key)) { //将父options上面没有的 子options上面有的合并到总options上面
        mergeField(key);
      }
    }

    function mergeField(key) {
      if (strats[key]) {
        options[key] = strats[key](parent[key], child[key]);
      } else {
        if (child[key]) {
          options[key] = child[key];
        } else {
          options[key] = parent[key];
        }
       
      }
    }
    return options;
  }
  let callbacks = [],
    pending$1;
  let timerFunc = () => {
    return Promise.resolve().then(flushCallbacks)
  };

  function flushCallbacks() {
    callbacks.forEach(cb => cb());
    pending$1 = false;
  }
  function nextTick(cb) {
    callbacks.push(cb);
    if (!pending$1) {
      timerFunc();
      pending$1 = true;
    }


  }
  const nativeTag = isNative('a,div,span,img,p,h1,h2,h3');
  function isNative(str) {
    let list = str.split(',');
    let map = {};
    for (let i = 0; i < list.length; i++){
      map[list[i]] = true;
    }
    return tag=>map[tag]
  }

  let cid =0;
  function extend(Vue) {
    Vue.extend = function (extendOptions) {
      
      let Super = this;
      let Sub = function VueComponent(options) {
        this._init(options);
      };
      Sub.cid = cid++;
      Sub.prototype = Object.create(Super.prototype);
      Sub.prototype.constructor = Sub;
      Sub.options = mergeOptions(Super.options, extendOptions);

      Sub.component = Super.component;
      return Sub;
    };
  }

  function initGlobalApi(Vue) {
    Vue.options = {};
    Vue.options._base = Vue;
    Vue.mixin = function(mixin) {
      this.options = mergeOptions(this.options, mixin);
    };
    extend(Vue);
    Vue.options.components = {};
    Vue.component = function (id,definition) {
      definition.name = definition.name || id;
      definition = this.options._base.extend(definition);
      Vue.options.components[id] =definition;
    };
  }

  let id$1 = 0;
  class Dep {

    constructor() {
      this.subs = [];
      this.id = id$1++;
    }
    depend() {
      Dep.target.addDep(this);
    }
    addSub(watcher) {
      this.subs.push(watcher);
    }
    notify() {
      this.subs.forEach(sub => {
        sub.update();
      });
    }
  }
  Dep.target = null;
  let stack = [];
  function pushTarget(watcher) {
    stack.push(watcher);
    Dep.target = watcher;
  }
  function popTarget() {
    stack.pop();
    Dep.target = stack[stack.length-1];
  }

  let oldArrayMethods = Array.prototype;
  let arrayMethods = Object.create(oldArrayMethods);
  let methods = [
    "push",
    "pop",
    "shift",
    "unshift",
    "reverse",
    'sort',
    'splice'
  ];
  methods.forEach(method => {
    arrayMethods[method] = function (...args) {
      // console.log(args);
      let result = oldArrayMethods[method].apply(this, args);
      let inserted;
      let ob = this.__ob__;
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break;
        case 'splice':
         inserted =  args.slice(2);
      }
      if (inserted) {
        ob.observeArray(inserted);
      }
      ob.dep.notify();
      return result;
    };
  });

  function observe(data) {
    if (typeof data != 'object' && typeof data !== null) return;
    if (data.__ob__) return data;
    return new Observer(data);
  }
  class Observer {

    constructor(data) {
      this.dep = new Dep();
      defineProperty(data, '__ob__', {
        enumerable: false,
        configurable: false,
        value: this
      });
      if (Array.isArray(data)) {
        data.__proto__ = arrayMethods;
          //观察数组中的对象变化
        this.observeArray(data);
      } else {
        this.walk(data);
      }

    }
    walk(obj) {
      let keys = Object.keys(obj);
      for (const key of keys) {
        defineReactive(obj, key, obj[key]);
      }
    }
    observeArray(data) {
      data.forEach(item => {
        observe(item);
      });
    }
  }

  function defineReactive(obj, key, value) {
    let childOb = observe(value);
    // debugger
    let dep = new Dep();
    Object.defineProperty(obj, key, {
      get() {
        //依赖收集
        if (Dep.target) {
          dep.depend();
          if (childOb) {
            // debugger
            childOb.dep.depend();
          }
        }
        return value
      },
      set(newValue) {
        // console.log('设置值');
        if (newValue == value) return
        childOb=observe(newValue); //设置成对象就要继续监控
          //派发更新  
        value = newValue;
        dep.notify();
      }
    });
  }

  // const { pushTarget, popTarget } = require("./dep");
  let id = 0;
  class Watcher {
    constructor(vm, exprOrFn, cb, options) {
      this.vm = vm;
      this.exprOrFn = exprOrFn;
      this.cb = cb;
      this.options = options;
      this.isRender = options.isRender;
      this.user = options.user;
      this.value = null;
      this.lazy = options.lazy;
      this.dirty = !!this.lazy;
      this.id = id++;
      this.depsId = new Set();
      this.deps = [];
      if (typeof exprOrFn == 'function') {
        this.getter = exprOrFn;
      } else {
        this.getter = function () {
          let obj = vm;
          let array = exprOrFn.split('.');
          for (let i = 0; i < array.length; i++){
            obj = obj[array[i]];
          }
          return obj
        };
      }
      this.value = this.lazy?void 0:this.get();
    }
    get() {

      pushTarget(this);
      let result = this.getter.call(this.vm);
      popTarget();
      return result
    }
    evalute() {
      this.value = this.get();
      this.dirty = false;
    }
    update() {
      // this.get()
      if (this.lazy) {
        this.dirty = true;
      } else {
        queueWatcher(this);
      }
     
    }
    run() {
      let newValue = this.get();
      let oldValue = this.value;
      this.value = newValue;
      if (this.user) {
        this.cb.call(this.vm,newValue,oldValue);
      }
    }
    addDep(dep) {
      let id = dep.id;
      if (!this.depsId.has(id)) {
        this.deps.push(dep);
        this.depsId.add(id);
        dep.addSub(this);
          // dep.subs.push(Dep.target)
      }
    }
    depend() {
      let i = this.deps.length;
      while (i--) {
        this.deps[i].depend();
      }
    }
  }
  let has = {};
  let queue = [];
  let pending = false;

  function queueWatcher(watcher) {
    let id = watcher.id;
    if (!has[id]) {
      queue.push(watcher);
      has[id] = true;
      if (!pending) {
        nextTick(flushScheduleQueue);
        pending = true;
      }
    }
  }

  function flushScheduleQueue() {
    // console.log(queue);
    queue.forEach((wathcer) => {
      // if (watcher.isRender) {
      //   watcher.run()
      // }
      wathcer.run();
    });
    has = {};
    pending = false;
    queue = [];
  }

  function initState(vm) {
    const opts = vm.$options;
    if (opts.props) {
      initProps(vm);
    }
    if (opts.methods) {
      initMethods(vm);
    }
    if (opts.data) {
      initData(vm);
    }
    if (opts.computed) {
      initComputed(vm);
    }
    if (opts.watch) {
      initWatch(vm);
    }

  }
  function initComputed(vm) {
    let computed = vm.$options.computed;
    const watchers = vm._computedWatchers = {};
    for (let key in computed) {
      const userDef = computed[key];
      const getter = typeof userDef == "function" ? userDef : userDef.get;
      watchers[key] = new Watcher(vm,getter,()=>{},{lazy:true}); 
      defineComputed(vm, key, userDef);
    }
  }

  function defineComputed(target, key, userDef) {
    const sharePropertyDefinition = {
      enumerable: true,
      configurable:true,
      set: () => { },
      get:()=>{}
    };
    if (typeof userDef == 'function') {
      sharePropertyDefinition.get = createComputedGetter(key);
    } else {
      sharePropertyDefinition.get =createComputedGetter(key);
      sharePropertyDefinition.set = createComputedGetter(key);
    }
    Object.defineProperty(target,key,sharePropertyDefinition);
  }

  function createComputedGetter(key) {
    return function () {
      let watcher = this._computedWatchers[key];
      if (watcher) {
        if (watcher.dirty) {
          watcher.evalute();
        }
        if (Dep.target) {
          watcher.depend();
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
      proxy(vm,'_data',key);
    }
    observe(data);
  }

  function stateMixin(Vue) {
    Vue.prototype.$nextTick = function (cb) {
      nextTick(cb);
    }; 
    Vue.prototype.$watch = function (exprOrFn, cb, options) {

      new Watcher(this,exprOrFn, cb, {...options,user:true});
      if (options.immediate) {
        cb();
      }
    }; 
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
          createWatcher(vm, key, handler);
        }
      } else {
        createWatcher(vm, key, watch[key]);
      }
    }
  }
  function createWatcher(vm, exprOrFn, cb, options = {}) {

    if (typeof cb == 'object') {
      cb = cb.handler; 
      options = cb;
    }
    if (typeof cb == 'string') {
      cb = vm[cb];
    }
    return vm.$watch(exprOrFn,cb,options)
  }

  const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
  function generate(el) {
    let children = el.children;
    let code = `_c(${JSON.stringify(el.tag)},${el.attrs.length?`${genProps(el.attrs)}`:'undefined'}${children?','+genChildren(children):''})`;
    return code
  }
  function genProps(attrs) {
    let str = '';
    for (const attr of attrs) {
      if (attr.name == 'style') {
        let ob = {};
        attr.value.split(';').map(item => {
          let [key, value] = item.split(':');
          ob[key] = value;
        });
        attr.value = ob;
      }
      str+=`${attr.name}:${JSON.stringify(attr.value)},`;
    }
    return `{${str.slice(0,-1)}}`
  }
  function  genChildren(children) {
    return children.map(child => gen(child)).join(',')
  }
  function  gen(child) {
    if (child.type == 1) {
      return generate(child)
    } else {
      let text = child.text;
      if (!defaultTagRE.test(text)) {
        return `_v(${JSON.stringify(text)})`
      }
      let tokens = []; //存每一项 ”我“ {{name}} "hahha"
      let lastIndex =  defaultTagRE.lastIndex = 0;
      let match,index;
      while (match = defaultTagRE.exec(text)) {
        index = match.index;
        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }
        tokens.push(`_s(${match[1].trim()})`);
        lastIndex = index+match[0].length;
      }
      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)));
      }
      // console.log(tokens);
      return `_v(${tokens.join('+')})`
    }
  }

  const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;
  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`;
  const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
  const startTagOpen = new RegExp(`^<${qnameCapture}`);
  const startTagClose = /^\s*(\/?)>/;
  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
  function parseHTML(html) {

    let root = null,
      currentParent = null,
      stack = [];

    function advance(n) {
      html = html.substring(n);
    }

    function parseStartTag() {
      const start = html.match(startTagOpen);
      if (start) {
        const match = {
          tagName: start[1],
          attrs: []
        };
        advance(start[0].length);
        let attr, end;
        while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          match.attrs.push({ name: attr[1], value: attr[3] || attr[4] || attr[5] });
          advance(attr[0].length);
        }
        if (end) {
          advance(end[0].length);
        }
        return match
      }
    }

    function createASTElement(tagName, attrs) {
      return {
        tag: tagName,
        attrs,
        children: [],
        parent: null,
        type: 1
      }
    }

    function start(tagName, attrs) {
      let element = createASTElement(tagName, attrs);
      if (!root) {
        root = element;

      }
      currentParent = element;
      stack.push(element);
    }

    function end(tagName) {
      let element = stack.pop();
      currentParent = stack[stack.length - 1];
      if (currentParent) {
        element.parent = currentParent;
        currentParent.children.push(element);
      }
    }

    function chars(text) {
      text = text.trim();
      if (text) {
        currentParent.children.push({
          type: 3,
          text
        });
      }
    }
    while (html) {
      let textEnd = html.indexOf('<');
      //是开始标签
      if (textEnd == 0) {
        let startMatch = parseStartTag();
        if (startMatch) {
          start(startMatch.tagName, startMatch.attrs);
          continue;
        }
        
      }
      //是结束标签
      const endMatch = html.match(endTag);
      if (endMatch) {
        advance(endMatch[0].length);
        end(endMatch[1]);
        continue
      }
      //是文本
      let text;
      if (textEnd > 0) {
        text = html.substring(0, textEnd);
        if (text) {
          chars(text);
          advance(text.length);
        }
      }
    }
    return root
  }

  function compileToFunctions(template) {
    let ast = parseHTML(template);
      //代码生成
    let code = generate(ast);
   let render =  new Function(  `with (this) {
    return ${code}
  }`); 
    // console.log(render);
    return render
  }

  function createElm(vnode) {
    let { tag, children, key, data, text } = vnode;

    if (typeof tag == 'string') {
      if (createComponent$1(vnode)) {
        return vnode.componentInstance.$el
      }
      vnode.el = document.createElement(tag);
      updateProperties(vnode);
      children.forEach(child => {
        vnode.el.appendChild(createElm(child));
      });

    } else {
      vnode.el = document.createTextNode(text);
    }
    return vnode.el
  }

  function createComponent$1(vnode) {
    let i = vnode.data;
    if ((i = i.hook) && (i = i.init)) {
      i(vnode);
    }
    if(vnode.componentInstance) return true
  }
  function updateProperties(vnode, oldProps = {}) {
    let el = vnode.el;
    let newProps = vnode.data || {};

    for (let prop in oldProps) {
      if (!newProps[prop]) {
        el.removeAttribute(prop);
      }
    }
    //样式处理 style:{fontsize:1px,color:red;}
    let oldStyle = oldProps.style || {};
    let newStyle = newProps.style || {};
    for (let style in oldStyle) {
      if (!newStyle[style]) {
        el.style[style] = '';
      }
    }
    for (let [k, v] of Object.entries(newProps)) {
      if (k == 'style') {
        for (let [sk, sy] of Object.entries(v)) {
          el.style[sk] = sy;
        }
      } else if (k == 'class') {
        el.className = v;
      } else {
        el.setAttribute(k, v);
      }

    }
  }
  function patch(oldVnode, newVnode) {
    if (!oldVnode) {
      return createElm(newVnode)
    }
    if (oldVnode.nodeType == 1) {
      let el = createElm(newVnode);
      let parentElm = oldVnode.parentNode;
      parentElm.insertBefore(el, oldVnode.nextSibling);
      parentElm.removeChild(oldVnode);
      return el
    } else {
      //不是同一个节点 替换
      if (oldVnode.tag != newVnode.tag) {
        return oldVnode.el.parentNode.replaceChild(createElm(newVnode), oldVnode.el)
      } else if (!oldVnode.tag) {
        if (oldVnode.text != newVnode.text) {
          oldVnode.el.textContent = newVnode.text;
          // return
        }
      } else {
        //是同一个节点
        // 复用老的真实DOM
        let el = newVnode.el = oldVnode.el;
        updateProperties(newVnode, oldVnode.data);

        //更新儿子
        let newChildren = newVnode.children || [];
        let oldChildren = oldVnode.children || [];

        if (newChildren.length && oldChildren.length) {
          //新老节点都有儿子
          updateChildern(newChildren, oldChildren, el);
        } else if (newChildren.length) {
          //newVnode 有儿子 旧节点没有--给老节点添加儿子
          for (let i = 0; i < newChildren.length; i++) {
            el.appendChild(createElm(newChildren[i]));
          }
        } else if (oldChildren.length) {
          //旧节点有儿子，新节点没有  --删除老的儿子
          el.innerHTML = '';
        }
      }

    }

  }

  function updateChildern(newChildren, oldChildren, parent) {
    // debugger
    let newStartIndex = 0,
      newStartVnode = newChildren[0],
      newEndIndex = newChildren.length - 1,
      newEndVnode = newChildren[newEndIndex];
    let oldStartIndex = 0,
      oldStartVnode = oldChildren[0],
      oldEndIndex = oldChildren.length - 1,
      oldEndVnode = oldChildren[oldEndIndex];

    function keyIdx(oldChildren) {
      let map = {};
      oldChildren.map((item, idx) => {
        if (item.key) {
          map[item.key] = idx;
        }
      });
      return map
    }
    let map = keyIdx(oldChildren); //新节点当中的key对应老节点的 index
    while (newStartIndex <= newEndIndex && oldStartIndex <= oldEndIndex) {
      if (!oldStartVnode) {
        oldStartVnode = oldChildren[++oldStartIndex];
      } else if (!oldEndVnode) {
        oldEndVnode = oldChildren[--oldEndIndex];
      } else if (isSameNode(newStartVnode, oldStartVnode)) { //从前面查找
        patch(oldStartVnode, newStartVnode);
        oldStartVnode = oldChildren[++oldStartIndex];
        newStartVnode = newChildren[++newStartIndex];
      } else if (isSameNode(newEndVnode, oldEndVnode)) { //从后面查找
        patch(oldEndVnode, newEndVnode);
        oldEndVnode = oldChildren[--oldEndIndex];
        newEndVnode = newChildren[--newEndIndex];
      } else if (isSameNode(oldEndVnode, newStartVnode)) {
        patch(oldEndVnode, newStartVnode);
        parent.insertBefore(oldEndVnode.el, oldStartVnode.el);
        oldEndVnode = oldChildren[--oldEndIndex];
        newStartVnode = newChildren[++newStartIndex];
      } else if (isSameNode(oldStartVnode, newEndVnode)) {
        patch(oldStartVnode, newEndVnode);
        parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
        oldStartVnode = oldChildren[++oldStartIndex];
        newEndVnode = newChildren[--newEndIndex];
      } else {
        //上面的都不能命中就要暴力比对
        let moveIdx = map[newChildren[newStartVnode.key]]; //找出老节点中要移动的下标
        if (moveIdx == undefined) {   //下标不存在 --直接插入新的el
          parent.insertBefore(createElm(newStartVnode), oldStartVnode.el);
        } else { //存在的话移动节点到新的oldStartVnode.el的前面 ，并且将空出来的位置置作null
          let moveVnode = oldChildren[moveIdx];
          oldChildren[moveIdx] = null;
          parent.insertBefore(moveVnode.el, oldStartVnode.el);
          patch(moveVnode, newStartVnode); //插入了新的节点，所以旧要patch一下
        }
        newStartVnode = newChildren[++newStartIndex];
      }
    }
    if (newStartIndex <= newEndIndex) { //新的startIdx 如果小于等于 新的endIdx 说明有节点要插入
      for (let i = newStartIndex; i <= newEndIndex; i++) {
        let elm = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].elm : null;
        parent.insertBefore(createElm(newChildren[i]), elm);
      }
    }
    if (oldStartIndex <= oldEndIndex) { //删除老孩子中多余的节点
      for (let i = oldStartIndex; i <= oldEndIndex; i++) {
        let child = oldChildren[i];
        if (child) {
          parent.removeChild(child.el);
        }
      }
    }
  }

  function isSameNode(node1, node2) {
    return (node1.tag == node2.tag) && (node1.key == node2.key)
  }

  function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
      const vm = this;
      let preVnode = vm._vnode;
      if (!preVnode) {
        vm.$el =  patch(vm.$el,vnode);
      } else {
        vm.$el =  patch(preVnode,vnode);
      }
      vm._vnode = vnode;
    };
  }
  function mountComponent(vm, el) {
    callHook(vm,'beforeMount');
    let updateComponent = function () {
      vm._update(vm._render());
    };
  new Watcher(vm, updateComponent, () => {
      callHook(vm,'beforeUpdate');
    }, {isRender:true});
    callHook(vm,'mounted');
  }
  function callHook(vm,hook) {
    const handlers = vm.$options[hook];
    if (handlers) {
      for (const handler of handlers) {
        handler.call(vm);
      }
    }
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      const vm = this;
      vm.$options = mergeOptions(vm.constructor.options, options);
      callHook(vm,'beforeCreate');
      initState(vm);
      callHook(vm,'created');
      //渲染
      if (vm.$options.el) {
        vm.$mount(vm.$options.el);
      }
    };
    Vue.prototype.$mount = function (el) {
      const vm = this;
      const options = vm.$options;
      if (!options.render) {
        let template;
        if (options.template) {
          template = options.template;
        } else {
          template = document.querySelector(el).outerHTML;
          vm.$el =  document.querySelector(el);
        }
        //将模板编译成render
        const render = compileToFunctions(template);
        options.render = render;
      } 
      // mountComponent(vm,el)
      callHook(vm,'beforeMount');
      mountComponent(vm);
      callHook(vm,'mounted');
    };
  }

  function renderMixin(Vue) {
    Vue.prototype._render = function() {
      const vm = this;
      const render = vm.$options.render;
      // console.log(vnode);
      let vnode = render.call(vm, ...arguments);
      return vnode
    };
    Vue.prototype._c = function() {
      return createElement(this, ...arguments)
    };
    Vue.prototype._v = function(text) {
      return createTextVnode(text)
    };
    Vue.prototype._s = function(value) { return value == null ? "" : (typeof value == 'object' ? JSON.stringify(value) : value) };
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
      Ctor = baseCtor.extend(Ctor);
    }

    data.hook = {
      init(vnode) {
        let child = vnode.componentInstance = new Ctor({});
        child.$mount();
      }
    };
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

  // import { compileToFunctions } from './compiler/index';
  // import { createElm, patch } from './vdom/patch';

  function Vue(options) {
    this._init(options);
  }
  //原型方法
  initMixin(Vue);
  lifecycleMixin(Vue);
  renderMixin(Vue);
  stateMixin(Vue);
    //静态方法
  initGlobalApi(Vue);

  return Vue;

}));
//# sourceMappingURL=vue.js.map
