const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          // Modules that need transpilation
          'react-native-reanimated',
          'react-native-paper',
          'react-native-svg',
        ],
      },
    },
    argv
  );
  
  // Ensure the config has the necessary resolve
  if (!config.resolve) {
    config.resolve = {};
  }

  // Ensure alias exists
  if (!config.resolve.alias) {
    config.resolve.alias = {};
  }

  // Add critical aliases for React Native Web
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    '@expo/vector-icons': 'react-native-vector-icons',
  };

  // Ensure extensions are properly set
  config.resolve.extensions = [
    '.web.js',
    '.web.jsx',
    '.web.ts',
    '.web.tsx',
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.json',
  ];

  // Check and update loader rules if needed
  if (config.module && config.module.rules) {
    // Find the oneOf rule array (where most loader rules are)
    const oneOfRule = config.module.rules.find(rule => rule.oneOf);
    if (oneOfRule && oneOfRule.oneOf) {
      // SVG handling is already managed by react-native-svg-transformer
    }
  }

  // Fix for react-native-web specific features
  config.module.rules.push({
    test: /\.(js|jsx|ts|tsx)$/,
    include: path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env', '@babel/preset-react'],
      },
    },
  });

  console.log('Enhanced webpack config for React Native Web');
  
  return config;
};