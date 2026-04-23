import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/frmStudentLogin.aspx',
        destination: '/login/student',
      },
    ]
  },
}

export default nextConfig
