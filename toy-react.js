// 封装 document.createElement
class ElementWrapper {
  // 构建实体dom
  constructor(type) {
    this.root = document.createElement(type)
  }
  setAttribute(k, v) {
    this.root.setAttribute(k, v)
  }
  appendChild(component) {
    this.root.appendChild(component.root)
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null)
    this.children = []
    // component的root需要取出来
    this._root = null
  }
  setAttribute(k, v) {
    this.props[k] = v
  }
  appendChild(component) {
    this.children.push(component)
  }
  get root() {
    if (!this._root) {
      // 如果 render 仍返回了 Component 类型，则递归直至 ElementWrapper 或 TextWrapper
      this._root = this.render().root
    }
    return this._root
  }
}

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
      if (typeof child === "string") {
        child = new TextWrapper(child)
      }
      if (Array.isArray(child)) {
        insertChildren(child)
      } else {
        // 只有 TextWrapper 或 ElementWrapper 才
        e.appendChild(child)
      }
    }
  }
  insertChildren(children)

  return e
}

export function render(component, parentElement) {
  parentElement.appendChild(component.root)
}
