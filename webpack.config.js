const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          // Add any modules that need to be transpiled here
        ],
      },
    },
    argv
  );

  // Add any custom configurations here
  config.resolve.alias = {
    ...config.resolve.alias,
    // Add any custom path aliases here
  };

  return config;
};