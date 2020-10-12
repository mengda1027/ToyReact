import { Component, render, createElement } from "./toy-react"

class MyComponent extends Component {
  constructor() {
    super()
    this.state = {
      a: 1,
      b: 2,
    }
  }
  render() {
    return (
      <div>
        <h1>My Component</h1>
        <button
          onClick={() => {
            this.setState({ a: this.state.a + 1 })
          }}>
          a++
        </button>
        {/* 没有 toString 报错 */}
        <div>a:{this.state.a.toString()}</div>
        <div>b:{this.state.b.toString()}</div>
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
