import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT } from './ontology'

/**
 * 데이터 기준일(F5). 전 화면 하단에 상시 노출한다 — 카드가 아니라 맥락이다.
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
