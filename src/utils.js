export function proxy(vm, data, key) {
  Object.defineProperty(vm, key, {
    get() {
      return vm[data][key]
    },
    set(newValue) {
      vm[data][key] = newValue
    }
  })
}
export function defineProperty(target, key, value) {
  Object.defineProperty(target, key, value)
}

export const LIFECICYLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  "beforeDestory",
  "destoryed"
]
const strats = {}
strats.components = function (parentVal, childVal) {
  let res = Object.create(parentVal);
  for (let i in childVal) {
    res[i] = childVal[i]
  }
  return res
}
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
  strats[hook] = mergeHook
})
export function mergeOptions(parent, child) {
  const options = {}
  for (let key in parent) {
    mergeField(key)  //将父options上面的属性合并到总options上面
  }
  for (let key in child) {
    if (!parent.hasOwnProperty(key)) { //将父options上面没有的 子options上面有的合并到总options上面
      mergeField(key)
    }
  }

  function mergeField(key) {
    if (strats[key]) {
      options[key] = strats[key](parent[key], child[key])
    } else {
      if (child[key]) {
        options[key] = child[key]
      } else {
        options[key] = parent[key]
      }
     
    }
  }
  return options;
}
let callbacks = [],
  pending;
let timerFunc = () => {
  return Promise.resolve().then(flushCallbacks)
}

function flushCallbacks() {
  callbacks.forEach(cb => cb())
  pending = false
}
export function nextTick(cb) {
  callbacks.push(cb)
  if (!pending) {
    timerFunc()
    pending = true;
  }


}
export const nativeTag = isNative('a,div,span,img,p,h1,h2,h3')
function isNative(str) {
  let list = str.split(',');
  let map = {}
  for (let i = 0; i < list.length; i++){
    map[list[i]] = true
  }
  return tag=>map[tag]
}