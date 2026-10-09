/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the whole index is pre-rendered from the JSON data layer.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
