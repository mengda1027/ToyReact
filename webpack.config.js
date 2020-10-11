module.exports = {
  entry: {
    main: "./main.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            // 处理  JSX  并修改 React.createElement
            plugins: [["@babel/plugin-transform-react-jsx", { pragma: "createElement" }]],
          },
        },
      },
    ],
  },
  mode: "development",
  optimization: {
    minimize: false,
  },
}
