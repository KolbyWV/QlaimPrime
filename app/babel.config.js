module.exports = function(api) {
  api.cache(true);

  // Prefer local install; fall back to Expo-bundled preset for offline setups.
  const expoBabelPreset = (() => {
    try {
      return require.resolve('babel-preset-expo');
    } catch (_) {
      return require.resolve('babel-preset-expo', {
        paths: [require.resolve('expo/package.json')],
      });
    }
  })();

  return {
    presets: [expoBabelPreset],
    plugins: []
  };
};
