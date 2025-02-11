import path from 'path';
import { fileURLToPath } from 'url';
import CopyPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDevelopment = process.env.NODE_ENV !== 'production';

export default {
  mode: isDevelopment ? 'development' : 'production',
  entry: './src/app.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              experimentalWatchApi: true
            }
          }
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    extensionAlias: {
      '.js': ['.js', '.ts']
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: isDevelopment ? '/' : './',
    clean: false
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.IS_DEVELOPMENT': JSON.stringify(process.env.NODE_ENV === 'development')
    }),
    new CopyPlugin({
      patterns: [
        { from: 'index.html', to: '.' },
        { from: 'src/icons', to: 'icons' },
        { from: 'src/images', to: 'images' },
        { from: 'src/css', to: 'css' },
        { from: 'src/json', to: 'json' },
        { from: 'src/floors', to: 'floors' },
        { from: 'src/favicon', to: 'favicon' },
        { from: 'site.webmanifest', to: '.' }
      ],
    }),
  ],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist'),
        publicPath: '/',
      },
      {
        directory: path.join(__dirname, 'src'),
        publicPath: '/src',
      }
    ],
    hot: true,
    compress: true,
    port: 3000,
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      // Handle JSON files
      devServer.app.get('*.json', (req, res, next) => {
        res.type('application/json');
        next();
      });

      return middlewares;
    }
  },
};
