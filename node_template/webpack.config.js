const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/server.js',      // ✅ correct
  target: 'node',
  mode: 'development',       // ✅ now webpack WILL read this

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'server.js'
  },

  externals: [nodeExternals()],

  resolve: {
    extensions: ['.js']
  }
};
