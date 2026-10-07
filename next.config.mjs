import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js'

const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_GATEWAY_URL

// Two deploy targets share one codebase:
//
//  - S3 (default `next build`): a static export to out/. Nothing may need a
//    Node server — no rewrites, redirects, headers, middleware or
//    request-time route handlers. Each route is <route>/index.html
//    (trailingSlash) so S3 / CloudFront serve it as a directory index, and
//    CloudFront routes /api/* and /hubs/* to the API gateway.
//
//  - Vercel (`VERCEL=1`, set by Vercel's build) and `next dev`: a normal
//    Next.js server build. It proxies /api/* and /hubs/* to the gateway so
//    the browser stays same-origin (sidestepping the backend's missing CORS
//    policy; /hubs is the SignalR notifications hub, same-origin so the
//    httpOnly session cookie is sent), and serves the `*.server.ts` routes —
//    currently src/app/doc-proxy, the S3 document preview proxy.
const isServerBuild = (phase) => phase === PHASE_DEVELOPMENT_SERVER || process.env.VERCEL === '1'

const staticExportConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
}

const serverConfig = {
  pageExtensions: ['server.ts', 'tsx', 'ts', 'jsx', 'js'],
  // Read by src/lib/documentViewer.ts — only server builds have /doc-proxy.
  env: { NEXT_PUBLIC_DOC_PROXY: 'true' },
  // Skipped when API_GATEWAY_URL isn't set — interpolating an unset env var
  // produces the literal string "undefined", which Next.js rejects as an
  // invalid rewrite destination and fails the whole build.
  rewrites: async () =>
    API_GATEWAY_URL
      ? [
          { source: '/api/:path*', destination: `${API_GATEWAY_URL}/api/:path*` },
          { source: '/hubs/:path*', destination: `${API_GATEWAY_URL}/hubs/:path*` },
        ]
      : [],
}

/** @type {(phase: string) => import('next').NextConfig} */
export default function nextConfig(phase) {
  return isServerBuild(phase) ? serverConfig : staticExportConfig
}
