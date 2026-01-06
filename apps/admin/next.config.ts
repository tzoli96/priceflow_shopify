import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Rewrites - API Proxy
   *
   * Client-side: /api/templates → Next.js server
   * Next.js server: forwards to → http://api:4000/api/templates (Docker network)
   *
   * Benefits:
   * - No CORS issues
   * - Backend URL not exposed to browser
   * - Works both in Docker and local development
   */
  async rewrites() {
    // Backend URL - Docker network or localhost for local dev
    const apiUrl = process.env.API_URL || 'http://api:4000';

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
