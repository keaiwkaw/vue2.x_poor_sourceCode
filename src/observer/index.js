import { arrayMethods } from "./array";
import { defineProperty } from '../utils'
import { Dep } from "./dep";
export function observe(data) {
  if (typeof data != 'object' && typeof data !== null) return;
  if (data.__ob__) return data;
  return new Observer(data);
}
class Observer {

  constructor(data) {
    this.dep = new Dep()
    defineProperty(data, '__ob__', {
      enumerable: false,
      configurable: false,
      value: this
    })
    if (Array.isArray(data)) {
      data.__proto__ = arrayMethods
        //观察数组中的对象变化
      this.observeArray(data)
    } else {
      this.walk(data)
    }

  }
  walk(obj) {
    let keys = Object.keys(obj)
    for (const key of keys) {
      defineReactive(obj, key, obj[key])
    }
  }
  observeArray(data) {
    data.forEach(item => {
      observe(item)
    })
  }
}

function defineReactive(obj, key, value) {
  let childOb = observe(value)
  // debugger
  let dep = new Dep()
  Object.defineProperty(obj, key, {
    get() {
      //依赖收集
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          // debugger
          childOb.dep.depend()
        }
      }
      return value
    },
    set(newValue) {
      // console.log('设置值');
      if (newValue == value) return
      childOb=observe(newValue) //设置成对象就要继续监控
        //派发更新  
      value = newValue
      dep.notify()
    }
  })
}