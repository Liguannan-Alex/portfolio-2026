import type { NextConfig } from 'next';

// Public GitHub Pages builds need no server or private Sites authentication.
const nextConfig: NextConfig = process.env.PIGUANNAN_STATIC_EXPORT === '1'
  ? { output: 'export' }
  : {};

export default nextConfig;
