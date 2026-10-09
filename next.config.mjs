/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pages are pre-rendered (ISR) from the data layer; server routes under /api
  // power submissions, live avatars and the health check.
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
  // Netlify sets COMMIT_REF during the build; /api/submit/health/ reports it
  env: { BUILD_COMMIT: process.env.COMMIT_REF ?? "" },
};

export default nextConfig;
