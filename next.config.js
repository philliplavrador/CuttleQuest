const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@data'] = path.resolve(__dirname, 'data');
    return config;
  },
};
module.exports = nextConfig;
