// Reanimated 4 переехал на плагин из react-native-worklets.
// Он должен идти последним в списке.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
