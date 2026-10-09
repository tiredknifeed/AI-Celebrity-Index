/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pages are still pre-rendered from the JSON data layer; server routes
  // under /api power paid submissions (Stripe + analysis + review PRs).
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
