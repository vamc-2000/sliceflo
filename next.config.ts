import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
       {
        protocol: 'https',
        hostname: 'd3oyi37rxfey58.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'd19ipk9pi24bav.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dev-slice-flo.s3.ap-south-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
