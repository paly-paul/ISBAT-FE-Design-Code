const API_GATEWAY_URL = process.env.API_GATEWAY_URL

/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [{ key: 'Vary', value: 'User-Agent' }],
    },
  ],
  // TEMPORARY: proxies API calls through the Next.js dev server so the browser
  // talks to same-origin /api/* instead of the ngrok URL directly, sidestepping
  // the backend's missing CORS policy. Remove once the backend adds CORS headers
  // for the frontend origin, and point NEXT_PUBLIC_API_GATEWAY_URL at it directly.
  rewrites: async () => [
    { source: '/api/:path*', destination: `${API_GATEWAY_URL}/api/:path*` },
  ],
}

export default nextConfig
