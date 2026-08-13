<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 가이드 웹 (site/)

로마제국쇠망사 온톨로지를 편데 운영팀이 **설치 없이, 갱신을 따라가며, AI에 물려서** 쓸 수 있게 만드는 정적 사이트다.

## 먼저 읽을 것

**데이터를 다루는 규칙은 여기 없다. 레포 루트 `../AGENTS.md`가 정본이다** — 불변식 6개와 실제로 밟은 함정 12개가 거기 있다. 온톨로지 파일(`../ontology/*.jsonl`, `../entities/**`)을 읽거나 고칠 일이 생기면 반드시 먼저 본다. 특히 `rome30_merge.py`를 다시 돌리면 2주치가 사라진다.

이 파일은 **사이트 코드**에 대한 규칙만 담는다.

## 방법론 — SDD + TDD

- **스펙 먼저**: `openspec/`에 무엇을 왜 바꾸는지 적고 코드를 쓴다. `/opsx:propose`로 시작한다
- **테스트 먼저**: 데이터·변환 로직은 실패하는 테스트를 먼저 만든다
- 설계 맥락("왜 이렇게 만들었나")은 볼트 `Works/가이드웹/`에 산다. `openspec/`은 "무엇을 언제 바꿨나"를 쥔다. 둘을 섞지 않는다

## 구성

| | |
|---|---|
| Next.js | **16.3.0**. `output: 'export'` 정적 빌드. 서버 기능을 쓰지 않는다 |
| React | 19.2.8 |
| 스타일 | astryx(`@astryxdesign/core`) 예정. 사전컴파일 CSS라 StyleX 빌드 도구가 필요 없다 |
| 검색 | Pagefind (postbuild) 예정 |
| 유닛 | Vitest. `npm test` |
| E2E | Playwright. `npm run test:e2e` — `out/`을 정적 서버로 띄운다(`next start`는 export 모드에서 안 된다) |
| 배포 | Vercel, 기본 `*.vercel.app` 주소 |

## 데이터 계약이 이 사이트의 급소다

깨지는 자리는 버튼이 아니라 데이터다. 644개 객체와 667개 관계가 페이지로 변환되는 길목을 `lib/ontology.ts`가 지킨다.

- **스키마 정본은 `lib/ontology.ts` 하나다.** 빌드 게이트와 테스트가 같은 것을 import 한다. 둘이 갈라지면 로컬에서 통과한 게 배포에서 깨진다
- `npm run build`가 `npm run validate`를 먼저 돌린다. **불변식이 깨지면 빌드가 멈춘다** — 팀이 틀린 데이터를 볼 일이 없다
- 알려진 위반 12건은 `lib/ontology.test.ts`의 `KNOWN_VIOLATIONS`에 이유와 함께 적혀 있다. 목적은 "위반 0"이 아니라 **새 위반이 늘지 않는 것**이다. 고쳤으면 목록에서 지운다 — 안 지우면 다음 회귀를 못 잡는다

## 하지 말 것

- **`../ontology/*.jsonl`을 이 폴더의 코드로 쓰지 마라.** 사이트는 데이터를 읽기만 한다. 수정 제안은 `../.agent/skills/propose-change/`
- **볼트에 `node_modules`가 들어가게 하지 마라.** 코드는 레포에 살고 볼트에는 문서만 산다. 볼트는 iCloud 동기화라 감당이 안 된다
- **`KNOWN_VIOLATIONS`에 이유 없이 줄을 추가하지 마라.** 그 순간 이 테스트는 아무것도 막지 않는다
