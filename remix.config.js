/** @type {import('@remix-run/dev').AppConfig} */
export default {
  appDirectory: "src",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  server: "./server.ts",
  serverBuildPath: "functions/[[path]].js",
  serverModuleFormat: "esm",
  serverPlatform: "neutral",
  serverConditions: ["worker"],
  future: {
    v3_fetcherPersist: false,
    v3_lazyRouteDiscovery: false,
    v3_relativeSplatPath: false,
    v3_singleFetch: false,
    v3_throwAbortReason: false,
  },
};
