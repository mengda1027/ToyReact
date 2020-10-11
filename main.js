function createElement(tagName, attributes, ...children) {
  let e = document.createElement(tagName)
  for (const attr in attributes) {
    e.setAttribute(attr, attributes[attr])
  }
  for (const child of children) {
    if (typeof child === "string") {
      child = document.createTextNode(child)
    }
    e.appendChild(child)
  }
  return e
}

window.a = (
  <div id="a" class="c">
    <div>abc</div>
    <div></div>
    <div></div>
  </div>
)
