const { createV8Config: createConfig } = require('@fluentui/scripts-jest');

const config = createConfig({
  snapshotSerializers: ['@fluentui/jest-serializer-merge-styles'],
});

module.exports = config;
