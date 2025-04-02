const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  // Create the default Expo webpack config
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Ensure we have resolution settings
  if (!config.resolve) {
    config.resolve = {};
  }

  // Set up proper alias for react-native-web
  if (!config.resolve.alias) {
    config.resolve.alias = {};
  }
  config.resolve.alias['react-native$'] = 'react-native-web';

  // Make sure we have the right extensions
  config.resolve.extensions = [
    '.web.js',
    '.web.jsx',
    '.js',
    '.jsx',
    '.json',
  ];

  return config;
};