// 模拟私有方法
const RENDER_TO_DOM = Symbol("render_to_dom")

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
  get vdom() {
    return this.render().vdom
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    this._vdom = this.vdom // 保存旧的vdom
    this._vdom[RENDER_TO_DOM](range)
  }
  update() {
    // 判断节点是否发生变化
    let isSameNode = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) return false
      for (let name in newNode.props) {
        if (newNode.props[name] !== oldNode.props[name]) {
          return false
        }
      }
      // 旧dom属性多于新dom属性
      if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length) {
        return false
      }

      if (newNode.type === "#text") {
        if (newNode.content !== oldNode.content) {
          return false
        }
      }
      return true
    }
    let update = (oldNode, newNode) => {
      // 不同type ,props 则更新节点
      // #text 的 content 不同更新节点
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range)
        return
      }
      // 比较 children
      newNode._range = oldNode._range
      let newChildren = newNode.vchildren
      let oldChildren = oldNode.vchildren
      if (!newChildren || !oldChildren) {
        return
      }
      let tailRange = oldChildren[oldChildren.length - 1]._range

      for (let i = 0; i < newChildren.length; i++) {
        let newChild = newChildren[i]
        let oldChild = oldChildren[i]

        if (i < oldChildren.length) {
          // 旧子节点数量多于新子节点数量
          update(oldChild, newChild)
        } else {
          // 追加节点
          let range = document.createRange()
          range.setStart(tailRange.endContainer, tailRange.endOffset)
          range.setEnd(tailRange.endContainer, tailRange.endOffset)
          newChild[RENDER_TO_DOM](range)
          tailRange = range
        }
      }
    }
    let vdom = this.vdom
    update(this._vdom, vdom)
    this._vdom = vdom
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
    this.update()
  }
}

// 封装 document.createElement
class ElementWrapper extends Component {
  // 构建实体dom
  constructor(type) {
    super(type)
    this.type = type
  }
  get vdom() {
    this.vchildren = this.children.map((child) => child.vdom)
    return this
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    let root = document.createElement(this.type)
    // 处理 this.props
    for (let name in this.props) {
      let v = this.props[name]
      if (name.match(/^on([\s\S]+)/)) {
        root.addEventListener(
          RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
          v
        )
      } else {
        if (name === "className") {
          root.setAttribute("class", v)
        } else {
          root.setAttribute(name, v)
        }
      }
    }

    if (!this.vchildren) this.vchildren = this.children.map((child) => child.vdom)

    // 处理 children
    for (const child of this.vchildren) {
      let childRange = document.createRange()
      childRange.setStart(root, root.childNodes.length)
      childRange.setEnd(root, root.childNodes.length)
      child[RENDER_TO_DOM](childRange)
    }
    replaceContent(range, root)
  }
}

class TextWrapper extends Component {
  constructor(content) {
    super(content)
    this.content = content
  }
  get vdom() {
    return this
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    let root = document.createTextNode(this.content)
    replaceContent(range, root)
  }
}

// range 删除方法
function replaceContent(range, node) {
  // 先插入，后删除
  range.insertNode(node)
  range.setStartAfter(node)
  range.deleteContents()
  // 校正 range
  range.setStartBefore(node)
  range.setEndAfter(node)
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
