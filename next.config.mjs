/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [],
  transpilePackages: ['streamdown', 'shiki'],
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
