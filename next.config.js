const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: "stellargig",
    project: "javascript-nextjs",
  },
  {
    widenClientSandbox: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
    disableServerWebpackPlugin: true, // Disable Sentry webpack plugins in local builds to avoid auth errors
    disableClientWebpackPlugin: true,
  }
);
