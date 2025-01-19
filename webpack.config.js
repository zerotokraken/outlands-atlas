import path from 'path';
import { fileURLToPath } from 'url';
import CopyPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  entry: './src/app.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true,
  },
    plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'index.html', to: '.' },
        { from: 'src/floors', to: 'src/floors' },
        { from: 'src/icons', to: 'src/icons' },
        { from: 'src/images', to: 'src/images' },
        { from: 'src/css', to: 'src/css' },
        { from: 'src/json', to: 'src/json' },
        { from: 'src/floors/floor-1/tiles', to: 'src/floors/floor-1/tiles' },
        { from: 'src/floors/floor-2/tiles', to: 'src/floors/floor-2/tiles' },
        { from: 'src/floors/floor-3/tiles', to: 'src/floors/floor-3/tiles' },
        { from: 'src/floors/floor-4/tiles', to: 'src/floors/floor-4/tiles' },
        { from: 'src/floors/floor-5/tiles', to: 'src/floors/floor-5/tiles' },
        { from: 'src/floors/floor-6/tiles', to: 'src/floors/floor-6/tiles' },
        { from: 'src/floors/floor-6.5/tiles', to: 'src/floors/floor-6.5/tiles' },
        { from: 'src/floors/floor-7/tiles', to: 'src/floors/floor-7/tiles' },
        { from: 'src/floors/floor-8/tiles', to: 'src/floors/floor-8/tiles' },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, '/'),
      publicPath: '/',
    },
    hot: true,
    compress: true,
    port: 3000,
  },
};
