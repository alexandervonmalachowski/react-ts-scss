const webpack = require('webpack');
const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const { getIfUtils, removeEmpty } = require('webpack-config-utils');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const publicPath = '/';
const publicUrl = '';
const templateUrl = 'public/index.html';
const appPublic = 'public';

module.exports = (env) => {
  const { ifProd, ifNotProd } = getIfUtils(env);
  return {
    cache: ifProd(),
    mode: ifProd('production', 'development'),
    entry: removeEmpty({
      app: ['@babel/polyfill', './src/index.tsx'],
    }),
    optimization: {
      removeAvailableModules: ifNotProd(),
      mangleWasmImports: true,
      minimize: true,
      chunkIds: 'named',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
      },
      minimizer: [
        new TerserPlugin({
          chunkFilter: (chunk) => {
            if (chunk.name === 'vendor') {
              return false;
            }
            return true;
          },
        }),
      ],
    },
    devtool: ifNotProd('source-map'),
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', 'scss'],
      modules: [resolve(__dirname, 'src'), resolve(__dirname, 'node_modules')],
    },
    output: {
      pathinfo: true,
      chunkFilename: ifProd(
        'static/js/[name].[contenthash].js',
        'static/js/[name].js'
      ),
      publicPath: publicPath,
    },
    devServer: {
      publicPath: publicPath,
      hot: true,
      historyApiFallback: true,
      contentBase: resolve(__dirname, appPublic),
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|tsx|ts)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
        {
          test: /\.s(a|c)ss$/,
          exclude: /node_modules/,
          use: removeEmpty([
            ifProd(MiniCssExtractPlugin.loader, 'style-loader'),
            {
              loader: 'css-loader?-minimize',
              options: {
                localsConvention: 'asIs',
                modules: {
                  mode: 'local',
                  localIdentName: ifNotProd('[local]', '[hash:base64:5]'),
                  context: resolve(__dirname, 'src'),
                  hashPrefix: ifNotProd('development', 'production'),
                },
                sourceMap: ifNotProd(),
              },
            },
            ifProd({ loader: 'postcss-loader', options: { sourceMap: false } }),
            {
              loader: 'sass-loader',
              options: {
                implementation: require('sass'),
                sassOptions: {
                  fiber: require('fibers'),
                },
              },
            },
          ]),
        },
        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          loader: resolve('url-loader'),
          options: {
            limit: 10000,
            name: 'static/media/[name].[contenthash].[ext]',
          },
        },
      ],
    },
    plugins: removeEmpty([
      new HtmlWebpackPlugin({
        inject: true,
        template: templateUrl,
        hot: true,
      }),
      new webpack.NamedModulesPlugin(),
      ifProd(
        new MiniCssExtractPlugin({
          filename: 'static/css/[name].[contenthash].css',
          chunkFilename: 'static/css/[id].[contenthash].css',
        })
      ),
      ifProd(
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: '"production"',
          },
        })
      ),
      ifProd(new CleanWebpackPlugin()),
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, { PUBLIC_URL: publicUrl }),
      new webpack.HotModuleReplacementPlugin({
        multiStep: true,
      }),
      new webpack.ProgressPlugin(),
    ]),
  };
};
