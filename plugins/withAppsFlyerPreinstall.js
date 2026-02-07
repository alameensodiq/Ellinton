const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAppsFlyerPreinstall(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application?.[0];
    if (!app) return config;

    app["meta-data"] = app["meta-data"] || [];

    const name = "AF_PRE_INSTALL_NAME";
    const value = "shalltry_int"; 

    const exists = app["meta-data"].some((m) => m.$["android:name"] === name);

    if (!exists) {
      app["meta-data"].push({
        $: {
          "android:name": name,
          "android:value": value,
        },
      });
    }

    return config;
  });
};
