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
        { from: 'src/icons', to: 'src/icons' },
        { from: 'src/images', to: 'src/images' },
        { from: 'src/css', to: 'src/css' },
        { from: 'src/json', to: 'src/json' },
        { 
          from: 'src/floors/**/required_tiles.json',
          to: ({ context, absoluteFilename }) => {
            const relativePath = path.relative(context, absoluteFilename);
            return relativePath;
          }
        }
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
