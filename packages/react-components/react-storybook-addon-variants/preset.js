/* eslint-disable no-shadow */

// See `@fluentui/react-storybook-addon-export-to-sandbox/preset.js` for the
// rationale behind the dual CJS/ESM path split below.
const preset = require('./lib-commonjs/preset/preset');

function previewAnnotations(entry = []) {
  return [...entry, require.resolve('./lib/preset/preview')];
}

module.exports = { previewAnnotations, ...preset };
