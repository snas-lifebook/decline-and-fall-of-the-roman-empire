import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT } from './ontology'

/**
 * 데이터 기준일(F5). 전 화면 하단에 상시 노출한다 — 카드가 아니라 맥락이다.
 *
 * **화면에 찍히는 글자는 「자료 기준일」이다**(`SiteFooter`). F5의 문서상 이름과
 * 다르니 카피를 쓸 때 이쪽을 따른다 — 안내문 넷이 「데이터 기준일」을 찾으라고
 * 했는데 화면에 그 글자가 없어서 2026-08-19에 넷 다 고쳤다.
 *
 * 커밋 날짜가 가장 정직하다. 빌드 환경에 git이 없으면 파일 mtime으로 떨어진다.
 */
export function dataDate(): string {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', 'ontology/'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim()
    if (iso) return iso.slice(0, 10)
  } catch {
    // git이 없거나 레포가 아니다. mtime으로 간다
  }
  return statSync(join(REPO_ROOT, 'ontology/entities.jsonl')).mtime.toISOString().slice(0, 10)
}
