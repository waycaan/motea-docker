const nextPWA = require('next-pwa');
const cache = require('./scripts/cache');

const developmentEnv = process.env.NODE_ENV === 'development';

const withPWA = nextPWA({
    disable: developmentEnv,
    dest: 'public',
    runtimeCaching: cache,
    // Ensure PWA files are properly handled in Docker
    publicExcludes: ['!static/**/*'],
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
