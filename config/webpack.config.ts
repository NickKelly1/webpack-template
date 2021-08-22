/* eslint-disable @typescript-eslint/ban-types */
/* eslint-env node */

import path from 'path';
import w, { DefinePlugin } from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import dotenv from 'dotenv';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import * as Config from'@nkp/config';


const dirRoot = (...segs: string[]) => path.join(__dirname, '..', ...segs);
const dirConfig = (...segs: string[]) => dirRoot('config', ...segs);
const dirPartials = (...segs: string[]) => dirRoot('src', 'partials', ...segs);
const dirhelpers = (...segs: string[]) => dirRoot('src', 'helpers', ...segs);
const dirPages = (...segs: string[]) => dirRoot('src', 'pages', ...segs);
const dirDist = (...segs: string[]) => dirRoot('dist', ...segs);
const dirDistStatic = (...segs: string[]) => dirRoot('dist', 'static', ...segs);
const dirStatic = (...segs: string[]) => dirRoot('static', ...segs);

interface EnvFile {
  GA_TRACKING_ID?: string;
}

interface Env {
  WEBPACK_BUNDLE?: boolean,
  WEBPACK_BUILD?: boolean,
  analyze?: string;
}

interface Options {
  mode: 'none' | 'development' | 'production',
}

const envparse = dotenv.config({ path: dirRoot('.env'), });
if (envparse.error) throw envparse.error;
const parsedEnvFile: EnvFile = envparse.parsed!;

export default async (env: Env, options: Options): Promise<w.Configuration> => {
  const envFile = Config.parse({
    GA_TRACKING_ID: Config
      .key('GA_TRACKING_ID')
      .as(Config.string(undefined)),
  }, parsedEnvFile as {});

  const analyze = Config
    .key('analyze')
    .as(Config.boolean(false))
    .get(env as {});

  const mode: w.Configuration['mode'] = Config
    .key('mode')
    .as(Config.oneOf(['none', 'development', 'production',] as const))
    .get(options as {});

  const entry: w.Configuration['entry'] = {
    index: dirPages('index.ts'),
  };
  const output: w.Configuration['output'] = {
    clean: true,
    path: dirDist(),
    filename: '[name].bundle.[contenthash].js',
    chunkFilename: '[id].chunk.[contenthash].js',
  };
  const resolve: w.Configuration['resolve'] = {
    extensions: ['.js', '.jsx', '.ts', '.tsx',],
  };
  const module: w.Configuration['module'] = {
    rules: [
      {
        // static assets
        // absolute, starting with /static/, ending with file extension
        test: /^[\\/]static[\\/].*\.(svg|txt|csv|tsv)$/,
        type: 'asset/resource',
      },
      {
        // fonts and images
        test: /\.(woff(2)?|eot|ttf|otf|png|jpg|jpeg|gif)$/,
        type: 'asset/resource',
      },
      {
        // source assets
        test: /\.(svg|txt|csv|tsv)$/,
        dependency: { not: ['url',], },
        type: 'asset/source',
      },
      {
        test: /\.[tj]sx?$/,
        exclude: [/node_modules/,],
        use: [{
          loader: 'ts-loader',
          options: { configFile: dirRoot('tsconfig.json'), },
        },],
      },
      {
        // html templating with handlebars
        // https://www.npmjs.com/package/handlebars-loader
        test: /\.hbs$/,
        use: [
          {
            loader: 'handlebars-loader',
            options: {
              helperDirs: [dirhelpers(),],
              partialDirs: [dirPartials(),],
              // relative path, including /assets/, with file extension
              inlineRequires: /^\..*[\\/]assets[\\/].*\.(woff|woff2|otf|ttf|jpg|jpeg|png|gif)$/,
            },
          },
        ],
      },
      {
        test: /\.s?css$/,
        use: [
          // load into separate files
          MiniCssExtractPlugin.loader,
          // load into css
          { loader: 'css-loader', },
          // vendor prefixes
          {
            loader: 'postcss-loader',
            options: { postcssOptions: { config: dirConfig('postcss.config.js'), }, },
          },
          // sass
          { loader: 'sass-loader', },
        ],
      },
    ],
  };

  const optimization: w.Configuration['optimization'] = {
    splitChunks: {
      //
    },
  };

  const plugins: w.Configuration['plugins'] = [
    new HtmlWebpackPlugin({
      template:  dirPages('index.hbs'),
      chunks: ['index',],
      filename: 'index.html',
      templateParameters: {
        gentlemen: 'the king',
      },
    }),
    new CopyWebpackPlugin({
      patterns: [{
        from: dirStatic(),
        to: dirDistStatic(),
      },],
    }),
    new MiniCssExtractPlugin({
      filename: '[name].bundle.[contenthash].css',
      chunkFilename: '[id].chunk.[contenthash].css',
    }),
    new DefinePlugin({
      'ENV.GA_TRACKING_ID': stringify(envFile.GA_TRACKING_ID),
    }),
  ];

  if (analyze) {
    plugins.push(
      new BundleAnalyzerPlugin({
        openAnalyzer: true,
      }),
    );
  }

  // const devtool: w.Configuration['devtool'] = 'inline-source-map';
  const devtool: w.Configuration['devtool'] = 'source-map';

  const config: w.Configuration = {
    mode,
    devtool,
    entry,
    output,
    resolve,
    module,
    plugins,
    optimization,
  } as w.Configuration;
  return config;
};


function stringify(value: unknown): string | undefined {
  if (value == null) return undefined;
  return JSON.stringify(value);
}
