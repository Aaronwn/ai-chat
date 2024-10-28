/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  },
  // 禁用 Vercel Toolbar
  devIndicators: {
    buildActivity: false,
  },
}

module.exports = nextConfig
