import path from 'path';
import nodeExternals from 'webpack-node-externals';
import { Configuration } from 'webpack';

const config: Configuration = {
  entry: './src/server.ts',
  target: 'node',
  mode: 'development',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'server.js'
  },

  externals: [nodeExternals()],

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  },

  resolve: {
    extensions: ['.ts', '.js']
  },

  devtool: 'source-map'
};

export default config;
