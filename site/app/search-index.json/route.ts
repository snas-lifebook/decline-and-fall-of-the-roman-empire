import { buildSearchIndex } from '../../lib/search/build'

/**
 * 검색 색인을 빌드 때 한 장으로 굽는다.
 *
 * **화면마다 들고 다니지 않는 것이 요점이다.** 항목이 700개라 컴포넌트에 그냥
 * import하면 739장 전부의 번들에 붙는다. 팔레트를 **처음 열 때 한 번** 받는다.
 *
 * `output: 'export'`라 라우트 핸들러도 정적이어야 한다 — `force-static`이 그것이다.
 */
export const dynamic = 'force-static'

export function GET() {
  return Response.json(buildSearchIndex())
}
