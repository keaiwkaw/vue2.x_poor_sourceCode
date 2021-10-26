let oldArrayMethods = Array.prototype;
export let arrayMethods = Object.create(oldArrayMethods)
let methods = [
  "push",
  "pop",
  "shift",
  "unshift",
  "reverse",
  'sort',
  'splice'
]
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
      default:
        break;
    }
    if (inserted) {
      ob.observeArray(inserted)
    }
    ob.dep.notify()
    return result;
  }
})