/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  headers: async () => [
    {
      source: '/(.*)',
      headers: [{ key: 'Vary', value: 'User-Agent' }],
    },
  ],
}

export default nextConfig
