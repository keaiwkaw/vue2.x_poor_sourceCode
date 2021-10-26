export function createElm(vnode) {
  let { tag, children, key, data, text } = vnode

  if (typeof tag == 'string') {
    if (createComponent(vnode)) {
      return vnode.componentInstance.$el
    }
    vnode.el = document.createElement(tag)
    updateProperties(vnode)
    children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    })

  } else {
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}

function createComponent(vnode) {
  let i = vnode.data;
  if ((i = i.hook) && (i = i.init)) {
    i(vnode)
  }
  if(vnode.componentInstance) return true
}
function updateProperties(vnode, oldProps = {}) {
  let el = vnode.el;
  let newProps = vnode.data || {}

  for (let prop in oldProps) {
    if (!newProps[prop]) {
      el.removeAttribute(prop);
    }
  }
  //样式处理 style:{fontsize:1px,color:red;}
  let oldStyle = oldProps.style || {}
  let newStyle = newProps.style || {}
  for (let style in oldStyle) {
    if (!newStyle[style]) {
      el.style[style] = ''
    }
  }
  for (let [k, v] of Object.entries(newProps)) {
    if (k == 'style') {
      for (let [sk, sy] of Object.entries(v)) {
        el.style[sk] = sy;
      }
    } else if (k == 'class') {
      el.className = v
    } else {
      el.setAttribute(k, v)
    }

  }
}
export function patch(oldVnode, newVnode) {
  if (!oldVnode) {
    return createElm(newVnode)
  }
  if (oldVnode.nodeType == 1) {
    let el = createElm(newVnode);
    let parentElm = oldVnode.parentNode;
    parentElm.insertBefore(el, oldVnode.nextSibling)
    parentElm.removeChild(oldVnode)
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
      let el = newVnode.el = oldVnode.el
      updateProperties(newVnode, oldVnode.data);

      //更新儿子
      let newChildren = newVnode.children || []
      let oldChildren = oldVnode.children || []

      if (newChildren.length && oldChildren.length) {
        //新老节点都有儿子
        updateChildern(newChildren, oldChildren, el)
      } else if (newChildren.length) {
        //newVnode 有儿子 旧节点没有--给老节点添加儿子
        for (let i = 0; i < newChildren.length; i++) {
          el.appendChild(createElm(newChildren[i]))
        }
      } else if (oldChildren.length) {
        //旧节点有儿子，新节点没有  --删除老的儿子
        el.innerHTML = ''
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
        map[item.key] = idx
      }
    })
    return map
  }
  let map = keyIdx(oldChildren) //新节点当中的key对应老节点的 index
  while (newStartIndex <= newEndIndex && oldStartIndex <= oldEndIndex) {
    if (!oldStartVnode) {
      oldStartVnode = oldChildren[++oldStartIndex]
    } else if (!oldEndVnode) {
      oldEndVnode = oldChildren[--oldEndIndex]
    } else if (isSameNode(newStartVnode, oldStartVnode)) { //从前面查找
      patch(oldStartVnode, newStartVnode);
      oldStartVnode = oldChildren[++oldStartIndex]
      newStartVnode = newChildren[++newStartIndex]
    } else if (isSameNode(newEndVnode, oldEndVnode)) { //从后面查找
      patch(oldEndVnode, newEndVnode)
      oldEndVnode = oldChildren[--oldEndIndex]
      newEndVnode = newChildren[--newEndIndex]
    } else if (isSameNode(oldEndVnode, newStartVnode)) {
      patch(oldEndVnode, newStartVnode);
      parent.insertBefore(oldEndVnode.el, oldStartVnode.el)
      oldEndVnode = oldChildren[--oldEndIndex]
      newStartVnode = newChildren[++newStartIndex]
    } else if (isSameNode(oldStartVnode, newEndVnode)) {
      patch(oldStartVnode, newEndVnode);
      parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)
      oldStartVnode = oldChildren[++oldStartIndex]
      newEndVnode = newChildren[--newEndIndex]
    } else {
      //上面的都不能命中就要暴力比对
      let moveIdx = map[newChildren[newStartVnode.key]]; //找出老节点中要移动的下标
      if (moveIdx == undefined) {   //下标不存在 --直接插入新的el
        parent.insertBefore(createElm(newStartVnode), oldStartVnode.el)
      } else { //存在的话移动节点到新的oldStartVnode.el的前面 ，并且将空出来的位置置作null
        let moveVnode = oldChildren[moveIdx];
        oldChildren[moveIdx] = null;
        parent.insertBefore(moveVnode.el, oldStartVnode.el)
        patch(moveVnode, newStartVnode) //插入了新的节点，所以旧要patch一下
      }
      newStartVnode = newChildren[++newStartIndex]
    }
  }
  if (newStartIndex <= newEndIndex) { //新的startIdx 如果小于等于 新的endIdx 说明有节点要插入
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      let elm = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].elm : null
      parent.insertBefore(createElm(newChildren[i]), elm)
    }
  }
  if (oldStartIndex <= oldEndIndex) { //删除老孩子中多余的节点
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      let child = oldChildren[i];
      if (child) {
        parent.removeChild(child.el)
      }
    }
  }
}

function isSameNode(node1, node2) {
  return (node1.tag == node2.tag) && (node1.key == node2.key)
}