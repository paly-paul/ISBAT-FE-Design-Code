const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_GATEWAY_URL

/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [{ key: 'Vary', value: 'User-Agent' }],
    },
  ],
  // The separate resit schedule pages were merged into Resit Scheduling
  // (resit-scheduling-page.md#routes).
  redirects: async () => [
    { source: '/assessment/resit-schedule', destination: '/assessment/resit-scheduling?tab=exam', permanent: false },
    { source: '/assessment/resit-ct-schedule', destination: '/assessment/resit-scheduling?tab=ct', permanent: false },
    { source: '/assessment/resit-cw-schedule', destination: '/assessment/resit-scheduling?tab=cw', permanent: false },
    // question-view-and-edit-page.md's route; view & edit lives in the
    // question bank page alongside the import.
    { source: '/assessment/questions', destination: '/assessment/cw-qbank', permanent: false },
  ],
  // TEMPORARY: proxies API calls through the Next.js dev server so the browser
  // talks to same-origin /api/* instead of the ngrok URL directly, sidestepping
  // the backend's missing CORS policy. Remove once the backend adds CORS headers
  // for the frontend origin, and point NEXT_PUBLIC_API_GATEWAY_URL at it directly.
  // Skip the rewrite entirely when API_GATEWAY_URL isn't set — interpolating
  // an unset env var produces the literal string "undefined", which Next.js
  // rejects as an invalid rewrite destination and fails the whole build.
  // /hubs/* proxies the SignalR notifications hub the same way /api/* does
  // above — same-origin so the browser's httpOnly session cookie is sent
  // automatically (SignalR connects with withCredentials: true), and the
  // same CORS gap sidestepped for /api applies here too.
  rewrites: async () =>
    API_GATEWAY_URL
      ? [
          { source: '/api/:path*', destination: `${API_GATEWAY_URL}/api/:path*` },
          { source: '/hubs/:path*', destination: `${API_GATEWAY_URL}/hubs/:path*` },
        ]
      : [],
}

export default nextConfig
  