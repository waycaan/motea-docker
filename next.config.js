const nextPWA = require('next-pwa');More actions
const cache = require('./scripts/cache');

const developmentEnv = process.env.NODE_ENV === 'development';

const withPWA = nextPWA({
    disable: developmentEnv,
    dest: 'public',
    runtimeCaching: cache,
    // Don't exclude static files from PWA
    buildExcludes: [/middleware-manifest\.json$/],
});

module.exports = withPWA({
    swcMinify: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Enable standalone output for Docker
    output: 'standalone',
    // Configure static file serving
    trailingSlash: false,
    // Optimize for production
    experimental: {
        outputFileTracingRoot: __dirname,
    },
});
