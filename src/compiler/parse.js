const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`)
const startTagClose = /^\s*(\/?)>/
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
export function parseHTML(html) {

  let root = null,
    currentParent = null,
    stack = [];

  function advance(n) {
    html = html.substring(n)
  }

  function parseStartTag() {
    const start = html.match(startTagOpen);
    if (start) {
      const match = {
        tagName: start[1],
        attrs: []
      }
      advance(start[0].length);
      let attr, end;
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        match.attrs.push({ name: attr[1], value: attr[3] || attr[4] || attr[5] })
        advance(attr[0].length);
      }
      if (end) {
        advance(end[0].length)
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
    let element = createASTElement(tagName, attrs)
    if (!root) {
      root = element;

    }
    currentParent = element;
    stack.push(element)
  }

  function end(tagName) {
    let element = stack.pop()
    currentParent = stack[stack.length - 1]
    if (currentParent) {
      element.parent = currentParent
      currentParent.children.push(element)
    }
  }

  function chars(text) {
    text = text.trim()
    if (text) {
      currentParent.children.push({
        type: 3,
        text
      })
    }
  }
  while (html) {
    let textEnd = html.indexOf('<');
    //是开始标签
    if (textEnd == 0) {
      let startMatch = parseStartTag();
      if (startMatch) {
        start(startMatch.tagName, startMatch.attrs)
        continue;
      }
      
    }
    //是结束标签
    const endMatch = html.match(endTag);
    if (endMatch) {
      advance(endMatch[0].length)
      end(endMatch[1])
      continue
    }
    //是文本
    let text;
    if (textEnd > 0) {
      text = html.substring(0, textEnd);
      if (text) {
        chars(text)
        advance(text.length)
      }
    }
  }
  return root
}