import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT } from './ontology'

/**
 * 편역본 30포인트의 번호와 제목.
 *
 * 제목은 `points/NN_제목.md` 파일명이 나른다. `00_목차`·`00_일러두기`·
 * `99_옮기고나서`는 30포인트가 아니라 번호 범위에서 자연히 걸러진다.
 */

export const POINT_COUNT = 30

export type PointMeta = { n: number; title: string }

const two = (n: number) => String(n).padStart(2, '0')

export function pointTitles(root = REPO_ROOT): Map<number, string> {
  const files = readdirSync(join(root, 'points'))
  const out = new Map<number, string>()
  for (let n = 1; n <= POINT_COUNT; n++) {
    const f = files.find((x) => x.startsWith(`${two(n)}_`))
    if (f) out.set(n, f.replace(/^\d\d_/, '').replace(/\.md$/, '').replace(/_/g, ' '))
  }
  return out
}

export function pointList(root = REPO_ROOT): PointMeta[] {
  const titles = pointTitles(root)
  return Array.from({ length: POINT_COUNT }, (_, i) => i + 1).map((n) => ({
    n,
    title: titles.get(n) ?? '',
  }))
}

/** 화면에 뜨는 이름. 초보자는 번호가 아니라 제목으로 자기 포인트를 찾는다 */
export const pointLabel = ({ n, title }: PointMeta) => (title ? `${two(n)} ${title}` : two(n))
