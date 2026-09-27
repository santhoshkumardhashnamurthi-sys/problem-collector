import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/explore',
        destination: '/',
        permanent: false,
      },
      {
        source: '/insights',
        destination: '/',
        permanent: false,
      },
      {
        source: '/landscape',
        destination: '/',
        permanent: false,
      },
      {
        source: '/live',
        destination: '/',
        permanent: false,
      },
      {
        source: '/locations',
        destination: '/',
        permanent: false,
      },
      {
        source: '/categories/:path*',
        destination: '/',
        permanent: false,
      },
      {
        source: '/problems/:path*',
        destination: '/',
        permanent: false,
      },
      {
        source: '/profile',
        destination: '/',
        permanent: false,
      },
      {
        source: '/about',
        destination: '/#about',
        permanent: false,
      },
      {
        source: '/how-it-works',
        destination: '/#how-it-works',
        permanent: false,
      },
      {
        source: '/submit',
        destination: '/#submit-problem',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
