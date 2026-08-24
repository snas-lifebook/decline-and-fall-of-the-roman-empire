/**
 * 레시피 왕복 도식: 넣는 것 → 시키는 것 → 나오는 것.
 *
 * OpenAI function-calling 히어로의 swim-lane을 카드 폭에 맞게 줄인 것(롤모델 리서치
 * 2026-08-24 §2.1). 비개발 팀원이 한 글자 안 읽고 **색으로** 왕복을 안다:
 * 파랑=내가 넣는 것, 회색=AI가 하는 일, 초록=AI가 돌려주는 것. River가 카드 주석에
 * 남긴 사고 구조("입력·프로세싱·출력")를 그림 한 장으로 세운다.
 *
 * **스키마만 그린다.** material·result 같은 긴 문장은 노드에 안 넣는다(넘친다).
 * 도식은 모양을, 아래 색 맞춘 본문 줄이 내용을 진다. 그래서 도식 자체는 13장이
 * 같아도 되고(반복되는 시각 앵커), 색이 본문과 도식을 한 단위로 묶는다.
 *
 * 색은 새로 짓지 않고 read-card 팔레트를 재사용한다(person/period/institution).
 * fill을 CSS 변수로 몰아 라이트·다크·세피아를 globals.css가 이미 검증한 값으로 덮는다.
 * 전부 rect·line·polygon이라 아이콘 라이브러리가 필요 없다.
 */
export function RecipeFlow() {
  return (
    <svg
      className="recipe-flow"
      viewBox="0 0 640 120"
      role="img"
      aria-label="레시피는 세 단계입니다. 내 자료를 넣고, 프롬프트로 AI에게 시키고, AI가 답을 돌려줍니다."
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 넣는 것 (파랑) */}
      <rect className="rf-node rf-node--in" x="8" y="24" width="188" height="72" rx="12" />
      <text className="rf-label" x="102" y="60" textAnchor="middle">
        넣는 것
      </text>
      <text className="rf-sub" x="102" y="80" textAnchor="middle">
        내 자료·질문
      </text>

      {/* 화살표 1 */}
      <line className="rf-arrow" x1="200" y1="60" x2="222" y2="60" />
      <polygon className="rf-head" points="222,55 232,60 222,65" />

      {/* 시키는 것 (회색) */}
      <rect className="rf-node rf-node--do" x="236" y="24" width="168" height="72" rx="12" />
      <text className="rf-label" x="320" y="60" textAnchor="middle">
        시키는 것
      </text>
      <text className="rf-sub" x="320" y="80" textAnchor="middle">
        프롬프트로
      </text>

      {/* 화살표 2 */}
      <line className="rf-arrow" x1="408" y1="60" x2="430" y2="60" />
      <polygon className="rf-head" points="430,55 440,60 430,65" />

      {/* 나오는 것 (초록) */}
      <rect className="rf-node rf-node--out" x="444" y="24" width="188" height="72" rx="12" />
      <text className="rf-label" x="538" y="60" textAnchor="middle">
        나오는 것
      </text>
      <text className="rf-sub" x="538" y="80" textAnchor="middle">
        AI의 답
      </text>
    </svg>
  )
}
