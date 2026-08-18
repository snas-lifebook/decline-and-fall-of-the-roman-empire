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
    /*
     * **`e2e/`는 vitest가 안 본다.** 그쪽은 `@playwright/test`의 `test`를 쓰므로
     * vitest가 집어 들면 파일 네 개가 통째로 로드 실패한다 — 348개가 다 초록인데
     * 「4 failed」가 뜨는 상태였다(2026-08-18). 헌장 4절이 이미 자리를 갈라 놨다:
     * 유닛은 대상 파일 옆, E2E만 `e2e/`에 따로.
     */
    exclude: ['**/node_modules/**', '**/dist/**', '**/out/**', 'e2e/**'],
  },
})
