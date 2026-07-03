/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint is run separately; don't block production builds on stylistic rules.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
