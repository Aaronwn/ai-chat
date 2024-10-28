/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  },
  // 添加详细的构建日志
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // 禁用 Vercel Toolbar
  devIndicators: {
    buildActivity: false,
  },
}

module.exports = nextConfig
