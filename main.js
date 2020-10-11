import { Component, render, createElement } from "./toy-react"

class MyComponent extends Component {
  render() {
    return (
      <div>
        <h1>My Component</h1>
        {this.children}
      </div>
    )
  }
}

render(
  <MyComponent id="a" class="c">
    <div>abc1</div>
    <span></span>
    <a></a>
  </MyComponent>,
  document.body
)
