import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 정적 export. Vercel에 올리지만 서버 기능을 쓰지 않는다 —
  // 데이터가 빌드 시점에 전부 확정되기 때문이다.
  output: 'export',
  images: { unoptimized: true },
}

export default nextConfig
