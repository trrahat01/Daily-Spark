const appJson = require("./app.json");

const baseConfig = appJson.expo;

module.exports = () => {
  const variant =
    process.env.EXPO_PUBLIC_APP_VARIANT === "user" ? "user" : "admin";
  const isUserApp = variant === "user";

  return {
    ...baseConfig,
    name: isUserApp ? "Daily Spark" : "Daily Spark Admin",
    slug: baseConfig.slug,
    scheme: isUserApp ? "dailyspark" : "dailysparkadmin",
    ios: {
      ...baseConfig.ios,
      bundleIdentifier: isUserApp
        ? "com.dailyspark.user"
        : "com.dailyspark.admin",
    },
    android: {
      ...baseConfig.android,
      package: isUserApp ? "com.dailyspark.user" : "com.dailyspark.admin",
    },
    extra: {
      ...baseConfig.extra,
      appVariant: variant,
    },
  };
};
