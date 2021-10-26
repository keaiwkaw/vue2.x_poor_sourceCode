const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g
export function generate(el) {
  let children = el.children
  let code = `_c(${JSON.stringify(el.tag)},${el.attrs.length?`${genProps(el.attrs)}`:'undefined'}${children?','+genChildren(children):''})`
  return code
}
function genProps(attrs) {
  let str = ''
  for (const attr of attrs) {
    if (attr.name == 'style') {
      let ob = {}
      attr.value.split(';').map(item => {
        let [key, value] = item.split(':')
        ob[key] = value
      })
      attr.value = ob;
    }
    str+=`${attr.name}:${JSON.stringify(attr.value)},`
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
    let tokens = [] //存每一项 ”我“ {{name}} "hahha"
    let lastIndex =  defaultTagRE.lastIndex = 0;
    let match,index;
    while (match = defaultTagRE.exec(text)) {
      index = match.index
      if (index > lastIndex) {
        tokens.push(JSON.stringify(text.slice(lastIndex, index)))
      }
      tokens.push(`_s(${match[1].trim()})`)
      lastIndex = index+match[0].length
    }
    if (lastIndex < text.length) {
      tokens.push(JSON.stringify(text.slice(lastIndex)))
    }
    // console.log(tokens);
    return `_v(${tokens.join('+')})`
  }
}