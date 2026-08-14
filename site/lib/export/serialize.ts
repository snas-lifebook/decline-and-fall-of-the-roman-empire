/**
 * 표를 시트에 넣을 수 있는 형태로 굽는다.
 *
 * 두 경로를 둔다 — **TSV 클립보드가 기본이고 CSV 내려받기가 보조다.**
 * 클립보드는 텍스트 스트림이라 인코딩 협상 자체가 없어서 문제를 통째로
 * 건너뛴다. 대신 필드 안 탭·줄바꿈이 표를 깨므로 **바꾼 개수를 돌려주고
 * 화면이 그 사실을 사람에게 말한다.**
 */

/** UTF-8 BOM. 이게 없으면 맥·윈 엑셀 둘 다 한글이 깨진다 (RESEARCH R-D 실측) */
export const BOM = '﻿'

const clean = (v: string) => v.trim()

const csvField = (v: string) => {
  const s = clean(v)
  // 쉼표·따옴표·줄바꿈 중 하나라도 있으면 감싸고, 내부 따옴표는 이중화한다.
  // CSV에 백슬래시 이스케이프는 없다.
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(header: string[], rows: string[][]): string {
  return [header, ...rows].map((r) => r.map(csvField).join(',')).join('\r\n') + '\r\n'
}

export type TsvResult = {
  text: string
  /** 탭·줄바꿈을 공백으로 바꾼 필드 수. 0이 아니면 화면이 말해야 한다 */
  replaced: number
}

export function toTsv(header: string[], rows: string[][]): TsvResult {
  let replaced = 0
  const flat = (v: string) => {
    const s = clean(v)
    const out = s.replace(/[\t\r\n]+/g, ' ')
    if (out !== s) replaced++
    return out
  }
  const text = [header, ...rows].map((r) => r.map(flat).join('\t')).join('\n')
  return { text, replaced }
}
