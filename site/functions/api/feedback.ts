import { RATE_WINDOW_MIN, feedbackSchema, isFlooding } from '../../lib/feedback'

/**
 * 의견이 쌓이는 자리. 739장 중 이 한 갈래만 서버로 돈다.
 *
 * **타입을 위해 패키지를 안 깐다.** `@cloudflare/workers-types`가 주는 것 중
 * 여기서 쓰는 건 D1 세 메서드뿐이라 그것만 손으로 적는다.
 */
type D1Statement = {
  bind(...values: unknown[]): D1Statement
  run(): Promise<unknown>
  first<T>(column: string): Promise<T | null>
}
type Env = { DB: { prepare(query: string): D1Statement } }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

/**
 * 누구인지는 안 담고 같은 사람인지만 담는다. 도배를 세는 데는 그걸로 충분하고,
 * 앞 16자만 남기므로 되돌릴 수 없다.
 */
async function fingerprint(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
  return [...new Uint8Array(buf)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function onRequestPost(ctx: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = ctx

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    // 무엇이 틀렸는지 안 돌려준다. 사람이 고칠 수 있는 실수는 화면이 이미 막는다
    return json({ ok: false, error: '남길 수 없는 내용입니다' }, 400)
  }
  const f = parsed.data

  const ip = request.headers.get('CF-Connecting-IP') ?? ''
  const hash = ip ? await fingerprint(ip) : null

  if (hash) {
    const recent = await env.DB.prepare(
      `select count(*) as n from feedback
       where ip_hash = ? and created_at > datetime('now', ?)`,
    )
      .bind(hash, `-${RATE_WINDOW_MIN} minutes`)
      .first<number>('n')
    if (isFlooding(recent ?? 0)) {
      return json({ ok: false, error: '잠시 뒤에 다시 남겨 주세요' }, 429)
    }
  }

  await env.DB.prepare(
    `insert into feedback (screen, path, subject, body, ua, ip_hash)
     values (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      f.where,
      f.path,
      f.subject ?? null,
      f.body,
      // 「화면이 깨져요」는 어느 기기인지 모르면 못 고친다. 길면 자른다
      (request.headers.get('user-agent') ?? '').slice(0, 300) || null,
      hash,
    )
    .run()

  return json({ ok: true })
}
