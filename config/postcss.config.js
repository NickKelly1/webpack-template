'use-strict';

/* eslint-env node */

/* eslint-disable @typescript-eslint/no-var-requires */

const postcssPresetEnv = require('postcss-preset-env');

/** @typedef {import('postcss').ProcessOptions} ProcessOptions */

/**
 * TODO: replace with propert options type
 *
 * @typedef PostcssLoaderOptions
 * @property {object | string[]} [plugins]
 * @property {string} [parser]
 */

/** @type {PostcssLoaderOptions} */
const config = {
  plugins: [
    // support basic standard vendor prefixes
    postcssPresetEnv(),
  ],
};

module.exports = config;

