const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();

module.exports = {
  entry: {
    popup: './src/popup/popup.jsx',
    content: './src/content/content.js',
    background: './src/background/background.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'manifest.json', 
          to: 'manifest.json',
          transform: (content) => {
            const manifest = JSON.parse(content.toString());
            // Update paths to reference dist directory
            manifest.background.service_worker = 'background.js';
            manifest.content_scripts[0].js = ['content.js'];
            return JSON.stringify(manifest, null, 2);
          }
        },
        { from: 'src/assets', to: 'assets', noErrorOnMissing: true }
      ]
    }),
    new webpack.DefinePlugin({
      'process.env.PROMPTHIRE_API_BASE': JSON.stringify(process.env.PROMPTHIRE_API_BASE),
      'process.env.PROMPTHIRE_TOKEN': JSON.stringify(process.env.PROMPTHIRE_TOKEN),
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY)
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx']
  },
  devtool: 'cheap-module-source-map'
};
