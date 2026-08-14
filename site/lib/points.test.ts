// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { pointTitles, pointList, pointLabel, POINT_COUNT } from './points'

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

describe('화면 이름', () => {
  it('제목이 번호와 함께 온다 — 초보자는 번호로 자기 포인트를 못 찾는다', () => {
    expect(pointLabel({ n: 2, title: '제1차 포에니 전쟁' })).toBe('02 제1차 포에니 전쟁')
  })

  it('제목이 없으면 번호만 남는다', () => {
    expect(pointLabel({ n: 7, title: '' })).toBe('07')
  })
})

describe('목록', () => {
  it('1번부터 30번까지 빠짐없이 준다', () => {
    const list = pointList()
    expect(list).toHaveLength(POINT_COUNT)
    expect(list.map((p) => p.n)).toEqual(Array.from({ length: POINT_COUNT }, (_, i) => i + 1))
  })
})
