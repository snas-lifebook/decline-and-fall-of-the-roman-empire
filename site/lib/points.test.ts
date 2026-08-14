// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { pointTitles, pointList, POINT_COUNT } from './points'

describe('포인트 제목', () => {
  it('30개를 다 찾는다', () => {
    expect(pointTitles().size).toBe(POINT_COUNT)
  })

  it('번호 접두사와 확장자를 뗀다', () => {
    expect(pointTitles().get(2)).toBe('제1차 포에니 전쟁')
  })

  it('밑줄을 공백으로 편다', () => {
    for (const t of pointTitles().values()) expect(t).not.toContain('_')
  })

  it('30포인트가 아닌 파일을 안 담는다 — 목차·일러두기·옮기고나서', () => {
    for (const t of pointTitles().values()) {
      expect(['목차', '일러두기', '책머리에', '옮기고나서']).not.toContain(t)
    }
  })
})

describe('목록', () => {
  it('1번부터 30번까지 빠짐없이 준다', () => {
    const list = pointList()
    expect(list).toHaveLength(POINT_COUNT)
    expect(list.map((p) => p.n)).toEqual(Array.from({ length: POINT_COUNT }, (_, i) => i + 1))
  })
})
