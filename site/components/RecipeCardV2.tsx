import { Text, CodeBlock } from '@astryxdesign/core'
import type { Recipe } from '../lib/recipes'
import { RecipeFlow } from './RecipeFlow'

/**
 * 사례 한 건, v2 프로토타입 (롤모델 리서치 2026-08-24).
 *
 * 앞 판은 7단 세로 스택이 13번 평평하게 쌓여 "다 비슷한 벽"이 됐고, 사람이 찾는
 * 프롬프트가 여섯 형제와 같은 무게로 묻혔다(River 반려). 네 소스(애플·Claude·OpenAI·
 * Obsidian)가 하나로 수렴한 처방을 적용한다:
 *
 *   1. **기본은 접는다.** 네이티브 `<details>`로 헤더 한 줄만 보이고 고른 카드만 편다
 *      (progressive disclosure, JS 0). 13장이 스캔 가능한 메뉴가 된다.
 *   2. **메타를 헤더 칩으로.** 시간·웹/데이터를 제목 옆 칩 한 줄로. 「언제」는 라벨·
 *      구분선 없이 부제 한 줄로. → 4조각이 헤더로 흡수.
 *   3. **왕복 도식으로 시각을 준다**(`RecipeFlow`). OpenAI식 색 코딩을 본문 3단에도
 *      이어, 도식과 내용이 한 단위로 읽힌다(파랑 넣는 것 / 회색 프롬프트 / 초록 결과).
 *   4. **프롬프트가 주인공.** 유일한 복사 대상. 주의는 7번째 블록이 아니라 콜아웃 한 줄.
 *
 * 기본 **닫힘**으로 둔다 — 13장이 헤더 한 줄로 스캔되는 메뉴가 되고, 고른 카드만
 * 편다. 상단 선택 표(page.tsx)에서 사례를 누르면 `#recipe-<id>`로 뛰어 그 카드를
 * 펼친다(`RecipeControls`의 해시 핸들러). `data-needs`는 웹/데이터 필터가 잡는다.
 *
 * 2026-08-24 프로토타입 승인(#go) 후 13장 전체 롤아웃. 구 `RecipeCard`는 지웠다.
 */
export function RecipeCardV2({ r }: { r: Recipe }) {
  return (
    <details className="recipe-v2" id={`recipe-${r.id}`} data-needs={r.needs}>
      <summary className="recipe-v2-head">
        <span className="recipe-v2-titlerow">
          <span className="recipe-v2-title">{r.title}</span>
          <span className="recipe-chips">
            <span className="recipe-chip" data-kind={r.needs}>
              {r.needs === 'web' ? '웹만으로' : '자료 필요'}
            </span>
            <span className="recipe-chip">약 {r.minutes}분</span>
          </span>
          <span className="recipe-v2-chevron" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
        </span>
        {/* 「언제 쓰나」는 라벨 없이 부제 한 줄. 접힌 상태에서 무엇에 쓰는지가 여기서 끝난다 */}
        <span className="recipe-v2-when">{r.when}</span>
      </summary>

      <div className="recipe-v2-body">
        <RecipeFlow />

        {/* 넣는 것 (파랑) */}
        <div className="recipe-step" data-kind="in">
          <span className="recipe-step-label">넣는 것</span>
          <Text size="sm">
            <a href={r.materialHref}>{r.material}</a>
          </Text>
        </div>

        {/* 시키는 것 (회색), 주인공. 프롬프트 없는 사례(scope)는 통째로 뺀다 */}
        {r.prompt ? (
          <div className="recipe-step" data-kind="do">
            <span className="recipe-step-label">시키는 것</span>
            <CodeBlock code={r.prompt} title="AI 창에 붙여넣기" hasCopyButton />
          </div>
        ) : null}

        {/* 나오는 것 (초록) */}
        <div className="recipe-step" data-kind="out">
          <span className="recipe-step-label">나오는 것</span>
          <Text>{r.result}</Text>
        </div>

        {/* 주의: 콜아웃 한 줄(살몬). 없으면 안 그린다 */}
        {r.caution ? (
          <p className="recipe-caution">
            <span className="recipe-caution-tag">주의</span>
            {r.caution}
          </p>
        ) : null}
      </div>
    </details>
  )
}
