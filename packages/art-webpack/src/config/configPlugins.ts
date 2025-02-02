import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import chalk from 'chalk';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import paths from './paths';
import { webpackEntries } from './configWebpackModules';
import appConfig from './appConfig';
import * as path from 'path';
import * as fs from 'fs';
import qs from 'qs';
import foreach from 'lodash/foreach';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlWebpackCDNPlugin from '../plugins/HtmlWebpackCDNPlugin';
import HappyPack from 'happypack';
import { isProd } from '../utils/env';
import DynamicChunkNamePlugin from '../plugins/DynamicChunkNamePlugin';
import { HtmlWebpackChunksPlugin } from '../plugins/HtmlWebpackChunksPlugin';

const isProdEnv = isProd();

const configHtmlWebpackPlugin = (entries?: object): any[] => {
  const plugins: any[] = [];
  const newEntries = entries || webpackEntries(false);
  const projectVirtualPath = appConfig.get('art:projectVirtualPath') || '';
  const buildEnv = appConfig.get('BUILD_ENV');
  console.log(`art:webpack:output:${buildEnv}PublicPath`);
  const assetsProdPublicPath = appConfig.get(`art:webpack:output:${buildEnv}PublicPath`) || '';
  console.log(`assetsProdPublicPath: ${assetsProdPublicPath}`);

  foreach(newEntries, (value, key) => {
    const fragment = key.split('?');
    const entryKey = fragment[0];
    const queryKey = fragment[1];
    const queryObj = qs.parse(queryKey);
    const myTemplate = path.join(process.cwd(), 'client', entryKey.replace(projectVirtualPath, ''), 'index.template.ejs');
    if (!fs.existsSync(myTemplate)) {
      throw new Error(chalk.red.bold('Sorry, it\'s a breaking change from art-webpack@0.0.22' +
        ' no default template file provided any more, please put template file within module root folder.'));
    }
    const htmlWebpackPluginOptions: HtmlWebpackPlugin.Options = {
      chunks: [entryKey],
      minify: isProdEnv ? {
        minifyJS: true,
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true
      } : false,
      template: myTemplate,
      filename: `${entryKey}/${queryObj.template || 'index.html'}`,

      // customized template variables
      buildEnv,
      title: queryObj.title || '',
      publicPath: assetsProdPublicPath,
      cdnPath: (queryObj.cdn === '0' || queryObj.cdn === 'false' || !isProdEnv) ? '' : assetsProdPublicPath
    };

    plugins.push(new HtmlWebpackPlugin(htmlWebpackPluginOptions));

    plugins.push(new HtmlWebpackChunksPlugin({
      manifestPath: path.join(process.cwd(), 'client', entryKey.replace(projectVirtualPath, ''))
    }));
  });

  plugins.push(new HtmlWebpackCDNPlugin());

  return plugins;
};

const getRawModuleEntry = (entries) => {
  for (const key in entries) {
    entries[key] = entries[key].slice(1);
  }
  return entries;
};

export const configBasePlugins = (() => {
  let plugins = [
    new ProgressBarPlugin({
      format: chalk.cyan('build') + ' [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
      clear: false
    }),

    // new MiniCssExtractPlugin({
    //   chunkFilename: '[id].[chunkhash].css'
    // }),

    new HappyPack({
      id: 'jsx',
      threads: 3,
      loaders: [
        {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react'
            ],
            plugins: ['@babel/plugin-syntax-dynamic-import']
          }
        }
      ],
    }),

    new HappyPack({
      id: 'ts',
      threads: 3,
      loaders: [
        {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            silent: false,
            happyPackMode: true
          }
        }
      ]
    }),

    new ForkTsCheckerWebpackPlugin({
      tsconfig: paths.appTsConfig,
      tslint: paths.appTsLintConfig
    }),

    new DynamicChunkNamePlugin(
      getRawModuleEntry(webpackEntries(false))
    )

  ];
  if (isProdEnv) {
    plugins = plugins.concat(configHtmlWebpackPlugin());
  }

  return plugins;
})();