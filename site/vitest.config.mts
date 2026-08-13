import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Vite가 tsconfig paths를 기본 지원한다. vite-tsconfig-paths 플러그인 불필요.
  resolve: { tsconfigPaths: true },
  test: {
    // 컴포넌트 테스트 기본값. 노드 API가 필요한 파일은 상단에
    // `// @vitest-environment node` 주석으로 각자 선언한다.
    environment: 'jsdom',
    globals: true,
  },
})
