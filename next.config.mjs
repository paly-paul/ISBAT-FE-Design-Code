/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [{ key: 'Vary', value: 'User-Agent' }],
    },
  ],
}

export default nextConfig
