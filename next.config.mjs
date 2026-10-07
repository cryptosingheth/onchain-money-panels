/** @type {import('next').NextConfig} */
// STATIC_EXPORT=1 builds a static site (used for the GitHub Pages preview, rebuilt daily).
// BASE_PATH is the repo path on GitHub Pages, e.g. "/onchain-money-panels".
const isStatic = process.env.STATIC_EXPORT === '1';

const nextConfig = {
  reactStrictMode: true,
  ...(isStatic
    ? {
        output: 'export',
        basePath: process.env.BASE_PATH || '',
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
