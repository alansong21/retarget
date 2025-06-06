/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/**',
      },
      {
        protocol: 'https',
        hostname: '*.target.com',
      },
      {
        protocol: 'https',
        hostname: 'target.scene7.com',
      },
      {
        protocol: 'https',
        hostname: '*.traderjoes.com',
      },
    ],
  },
}

module.exports = nextConfig
