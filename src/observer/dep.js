let id = 0
export class Dep {

  constructor() {
    this.subs = []
    this.id = id++
  }
  depend() {
    Dep.target.addDep(this)
  }
  addSub(watcher) {
    this.subs.push(watcher)
  }
  notify() {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
}
Dep.target = null;
let stack = []
export function pushTarget(watcher) {
  stack.push(watcher)
  Dep.target = watcher
}
export function popTarget() {
  stack.pop()
  Dep.target = stack[stack.length-1];
}