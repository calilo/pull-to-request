var webpack = require("webpack");

module.exports = {
  entry: './example/index.js',

  output: {
    path:'./dist',
    filename: 'bundle.js',
  },

  devServer: {
    contentBase: "./dist",
    hot: true,
    historyApiFallback: true,
    port: 8080
  },

  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        presets: ['es2015', 'es2017', 'stage-2'],
        plugins: ['add-module-exports', 'istanbul', 'transform-class-properties', 'transform-require-ignore', 'transform-runtime']
      }
    }]
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("development")
      }
    })
  ]
}