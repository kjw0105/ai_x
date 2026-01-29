/** @type {import('next').NextConfig} */
const nextConfig = {
    serverComponentsExternalPackages: ['html-pdf-node', 'handlebars', 'pdfjs-dist'],
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            handlebars: 'handlebars/dist/handlebars.js',
        };
        return config;
    },
};

export default nextConfig;
