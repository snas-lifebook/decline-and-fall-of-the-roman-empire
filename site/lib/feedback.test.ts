// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { feedbackDraft, telegramShareUrl } from './feedback'

describe('한 줄 남기기 — 초안 문장', () => {
  it('어느 화면인지가 이미 적혀 있다', () => {
    // 사람은 하고 싶은 말만 쓰면 된다. 맥락은 폼 필드가 아니라 문장이 나른다.
    expect(feedbackDraft({ where: '포인트 03 인물 목록' })).toContain('포인트 03 인물 목록')
  })

  it('객체를 집어서 남기면 그것도 실린다', () => {
    const d = feedbackDraft({ where: '찾아보기', subject: '하스드루발 (한니발의 동생)' })
    expect(d).toContain('하스드루발 (한니발의 동생)')
  })

  it('사람이 쓸 자리를 비워둔다', () => {
    expect(feedbackDraft({ where: '허브' }).trimEnd().endsWith('—')).toBe(false)
  })
})

describe('텔레그램 보내기', () => {
  it('공유 주소로 만든다 — 봇도 사용자명도 필요 없다', () => {
    expect(telegramShareUrl('안녕').startsWith('https://t.me/share/url?')).toBe(true)
  })

  it('한글을 인코딩한다', () => {
    const url = telegramShareUrl('가나다')
    expect(url).toContain(encodeURIComponent('가나다'))
    expect(url).not.toContain('가나다')
  })

  it('줄바꿈과 특수문자가 깨지지 않는다', () => {
    const text = '포인트 03에서\n"하스드루발"이 둘 & 헷갈립니다'
    const url = telegramShareUrl(text)
    expect(decodeURIComponent(new URL(url).searchParams.get('text')!)).toBe(text)
  })
})
