// 模拟私有方法
const RENDER_TO_DOM = Symbol("render_to_dom")

// 封装 document.createElement
class ElementWrapper {
  // 构建实体dom
  constructor(type) {
    this.root = document.createElement(type)
  }
  setAttribute(k, v) {
    if (k.match(/^on([\s\S]+)/)) {
      this.root.addEventListener(
        RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
        v
      )
    } else {
      if (k === "className") {
        this.setAttribute("class", v)
      } else {
        this.root.setAttribute(k, v)
      }
    }
  }
  appendChild(component) {
    let range = document.createRange()
    // appendChild 是将插入内容放在所有节点的最后
    range.setStart(this.root, this.root.childNodes.length)
    range.setEnd(this.root, this.root.childNodes.length)
    component[RENDER_TO_DOM](range)
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null)
    this.children = []
    // component的root需要取出来
    this._root = null
    this._range = null
  }
  setAttribute(k, v) {
    this.props[k] = v
  }
  appendChild(component) {
    this.children.push(component)
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    this.render()[RENDER_TO_DOM](range)
  }
  rerender() {
    // 保存原range，先插入，再删除，防止触发新插入的range被删除的bug
    let oldRange = this._range

    let toolRange = document.createRange()
    toolRange.setStart(oldRange.startContainer, oldRange.startOffset)
    toolRange.setEnd(oldRange.startContainer, oldRange.startOffset)
    this[RENDER_TO_DOM](toolRange)
    // 删除操作
    oldRange.setStart(toolRange.endContainer, toolRange.endOffset)
    oldRange.deleteContents()
  }
  setState(newState) {
    // this.state 为null 或不是 Object 直接赋值
    if (this.state === null || typeof this.state !== "object") {
      this.state = newState
      this.rerender()
      return
    }
    // 深拷贝合并状态
    let merge = (oldState, newState) => {
      for (const p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== "object") {
          oldState[p] = newState[p]
        } else {
          merge(oldState[p], newState[p])
        }
      }
    }
    merge(this.state, newState)
    this.rerender()
  }
}

// plugin-transform-react-jsx 将 jsx 解析后调用 createEelment
// JSX转换机制：小写时type为字符串，包含大写时(自定义组件)type为组件自定义对象或class
// 第三个参数起为子节点  或者  如果当前节点的子节点为文本节点则第三个参数是字符串（文本内容）
export function createElement(type, attributes, ...children) {
  let e
  if (typeof type === "string") {
    e = new ElementWrapper(type)
  } else {
    e = new type()
  }

  for (const attr in attributes) {
    e.setAttribute(attr, attributes[attr])
  }
  // 遇到 child 为 数组时 (如：{this.children}), 需要递归处理，直至 TextWrapper 或 ElementWrapper
  const insertChildren = (children) => {
    for (const child of children) {
      if (child === null) {
        continue
      }
      if (typeof child === "string") {
        child = new TextWrapper(child)
      }
      if (Array.isArray(child)) {
        // 递归
        insertChildren(child)
      } else {
        // 只有 TextWrapper 或 ElementWrapper 才添加
        e.appendChild(child)
      }
    }
  }
  insertChildren(children)

  return e
}

export function render(component, parentElement) {
  // 将挂载点的dom内容清空
  let range = document.createRange()
  range.setStart(parentElement, 0)
  range.setEnd(parentElement, parentElement.childNodes.length)
  range.deleteContents()
  component[RENDER_TO_DOM](range)
}
