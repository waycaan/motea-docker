const path = require('path');

module.exports = {
    // 🐳 启用 standalone 输出模式用于 Docker 部署
    output: 'standalone',
    swcMinify: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // 🔧 配置 ESM 支持以解决 Lexical 模块问题
    experimental: {
        esmExternals: false,
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // 🔧 修复 Docker 构建中的模块路径解析问题
        config.resolve.alias = {
            ...config.resolve.alias,
            'libs': path.resolve(__dirname, 'libs'),
            'components': path.resolve(__dirname, 'components'),
            'pages': path.resolve(__dirname, 'pages'),
            'public': path.resolve(__dirname, 'public'),
        };

        // 🔧 确保模块解析策略正确
        config.resolve.modules = [
            path.resolve(__dirname),
            path.resolve(__dirname, 'node_modules'),
            'node_modules'
        ];

        // 🔧 添加文件扩展名解析
        config.resolve.extensions = [
            '.ts', '.tsx', '.js', '.jsx', '.json',
            ...config.resolve.extensions
        ];

        // 🔧 处理 Lexical ESM 模块
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                os: false,
            };
        }

        return config;
    },
};
