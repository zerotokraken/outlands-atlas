import path from 'path';
import { fileURLToPath } from 'url';
import CopyPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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
    extensionAlias: {
      '.js': ['.js', '.ts']
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: {
      keep: /(server\.js|app\.js|map\.js|types\.js)$/
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.CLOUDCUBE_URL': JSON.stringify(process.env.CLOUDCUBE_URL),
      'process.env.CLOUDCUBE_ACCESS_KEY_ID': JSON.stringify(process.env.CLOUDCUBE_ACCESS_KEY_ID),
      'process.env.CLOUDCUBE_SECRET_ACCESS_KEY': JSON.stringify(process.env.CLOUDCUBE_SECRET_ACCESS_KEY)
    }),
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
            return relativePath.replace(/^src\//, '');
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
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      devServer.app.get('*.json', (req, res, next) => {
        res.type('application/json');
        next();
      });

      return middlewares;
    }
  },
};
