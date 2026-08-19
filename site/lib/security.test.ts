// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * 응답 헤더.
 *
 * 배포 전에는 `Referrer-Policy`와 `X-Content-Type-Options` 둘뿐이었다(실측
 * 2026-08-19). CSP도, 프레임 차단도, 권한 정책도 없었다.
 *
 * 이 파일이 지키는 것은 **그것이 조용히 사라지지 않는 것**이다. `public/_headers`는
 * 아무도 import하지 않으므로 지워져도 빌드가 안 죽는다 — 그러면 다음 배포에서
 * 보호가 통째로 없어지고 아무도 모른다.
 */
const HEADERS = readFileSync(join(process.cwd(), 'public/_headers'), 'utf8')

describe('보안 헤더', () => {
  it('있어야 할 것이 다 있다', () => {
    for (const h of [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Permissions-Policy',
      'Referrer-Policy',
      'X-Robots-Tag',
    ]) {
      expect(HEADERS, `${h} 가 없다`).toContain(`${h}:`)
    }
  })

  /**
   * 이 사이트는 글꼴까지 자체 호스팅이라 **바깥에서 불러오는 자원이 0이다.**
   * `default-src 'self'`가 그 성질을 브라우저가 강제하게 만든다 — 나중에 누가
   * 외부 스크립트를 무심코 넣으면 화면이 조용히 새는 대신 콘솔에서 막힌다.
   */
  it('CSP가 바깥을 막고 프레임에 안 들어간다', () => {
    const csp = HEADERS.match(/Content-Security-Policy:\s*(.+)/)?.[1] ?? ''
    expect(csp).toContain("default-src 'self'")
    expect(csp, '클릭재킹을 안 막는다').toContain("frame-ancestors 'none'")
    expect(csp).toContain("base-uri 'none'")
    expect(csp).toContain("object-src 'none'")
    // 폰트·이미지·요청이 전부 자기 origin이어야 「외부 요청 0」이 사실이 된다
    expect(csp).toContain("font-src 'self'")
    expect(csp).toContain("connect-src 'self'")
  })

  /**
   * 검색에 안 걸리게 해 둔 사이트다. 나가는 클릭이 목적지에 우리 주소를 알리면
   * 그 전제가 깨진다 — 링크 카드 18장이 yes24·넷플릭스·구글로 나간다.
   */
  it('나갈 때 어디서 왔는지 안 알린다', () => {
    expect(HEADERS).toMatch(/Referrer-Policy:\s*no-referrer/)
    expect(HEADERS).toMatch(/X-Robots-Tag:\s*noindex/)
  })

  /**
   * `'unsafe-inline'`이 `script-src`에 남아 있는 것은 정적 내보내기의 한계라서
   * **알고 남긴 것**이다. 그 사정이 `style-src` 밖으로 번지지 않는지만 본다 —
   * `unsafe-eval`이 들어오는 날은 사고다.
   */
  it('알고 남긴 예외 말고 더 열지 않는다', () => {
    const csp = HEADERS.match(/Content-Security-Policy:\s*(.+)/)?.[1] ?? ''
    expect(csp, 'eval을 열었다').not.toContain('unsafe-eval')
    /*
      **CSP 한 줄 안에서만 본다.** 파일 전체를 훑었더니 Cloudflare의 경로 패턴
      `/*` 에 걸려서 빨개졌다 — `[^;]`가 줄바꿈까지 먹어 지시자 밖으로 새어 나간 것이다.
    */
    expect(csp, '와일드카드가 들어왔다').not.toMatch(/(script|connect|font)-src[^;]*\*/)
  })
})
