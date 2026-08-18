/**
 * 위키미디어에서 **초상과 생몰 연대**를 받아 레포에 넣는다.
 *
 * **빌드가 이걸 부르지 않는다.** 손으로 가끔 돌리고 결과를 커밋한다. 빌드에 외부
 * 요청을 섞으면 인터넷이 끊긴 자리나 CI에서 사이트가 안 서고, 위키가 느린 날 배포가
 * 같이 느려진다. 파비콘 13개를 받아 커밋한 것과 같은 판단이다(2026-08-16).
 *
 * **커버리지가 절반쯤이다.** 표본 25명 중 11명(실측 2026-08-18) — 카이사르·네로·
 * 콘스탄티누스는 있고 기번·칼리굴라·호노리우스·안토니아는 없다. 못 받은 객체는
 * 카드에서 타입 표식으로 떨어진다. **그게 정상 경로이지 실패가 아니다.**
 *
 *   node scripts/fetch-portraits.mjs          받을 것만 받는다(이미 있으면 건너뜀)
 *   node scripts/fetch-portraits.mjs --force  전부 다시 받는다
 *   node scripts/fetch-portraits.mjs --dry    받지 않고 몇 개나 되는지만 센다
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SITE = join(HERE, '..')
const REPO = join(SITE, '..')
const OUT_DIR = join(SITE, 'public/portraits')
const MANIFEST = join(SITE, 'data/people.json')

const force = process.argv.includes('--force')
const dry = process.argv.includes('--dry')

/**
 * 위키가 우리를 막지 않게 누구인지 밝힌다 — 이게 없으면 403이 온다.
 *
 * **ASCII만 쓴다.** 처음에 한국어 설명을 넣었더니 262명 전부가
 * `Cannot convert argument to a ByteString`으로 죽었다. HTTP 헤더는 바이트 문자열이라
 * 한글이 못 들어간다.
 */
const UA = 'roma-library/1.0 (https://roma-library.pages.dev; team archive, contact via repo)'

/** 초상이 있을 만한 종류만 묻는다. 제도·시대에 얼굴은 없다 */
const ASK = new Set(['person'])

/**
 * 위키가 줄여서 주는 크기(px).
 *
 * **원본을 받으면 안 된다.** 처음에 `piprop: 'original'`로 받았더니 162장이
 * **426MB**였다 — 박물관 사진 원본이라 한 장에 61MB짜리도 있었다. 카드에서 48px로
 * 쓰는 그림이다. 위키가 썸네일을 만들어 주므로 우리가 이미지 라이브러리를 깔 필요도
 * 없다. 320이면 레티나에서 객체 화면에 크게 써도 안 뭉갠다.
 */
const THUMB = 320

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(lang, params) {
  const url = `https://${lang}.wikipedia.org/w/api.php?${new URLSearchParams({
    format: 'json',
    formatversion: '2',
    ...params,
  })}`
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  if (!res.ok) throw new Error(`${lang} ${res.status}`)
  return res.json()
}

/**
 * 한국어 위키 → 영어 위키 순으로, 이름과 별칭을 차례로 물어본다.
 *
 * 한국어를 먼저 보는 이유는 **동명이인을 덜 만나기 때문**이다. 영어 `Cato`는 여러
 * 사람이지만 한국어 「대 카토」는 하나다. 우리 데이터가 이미 갈라 둔 이름을 살린다.
 */
async function findImage(name, aliases) {
  for (const lang of ['ko', 'en']) {
    for (const title of [name, ...aliases]) {
      const r = await api(lang, {
        action: 'query',
        titles: title,
        prop: 'pageimages',
        piprop: 'thumbnail|original',
        pithumbsize: String(THUMB),
        redirects: '1',
      })
      const page = r?.query?.pages?.[0]
      if (!page || page.missing || !page.thumbnail?.source) continue
      // 원본 주소는 라이선스를 물어볼 때만 쓴다. 내려받는 것은 썸네일이다
      return {
        lang,
        title,
        src: page.thumbnail.source,
        original: page.original?.source ?? page.thumbnail.source,
        pageTitle: page.title,
      }
    }
  }
  return null
}

/** 저작자와 라이선스. **적을 수 없으면 안 쓴다** */
async function credit(lang, src) {
  const file = `File:${decodeURIComponent(src.split('/').pop().split('?')[0])}`
  const r = await api(lang, {
    action: 'query',
    titles: file,
    prop: 'imageinfo',
    iiprop: 'extmetadata',
    iiextmetadatafilter: 'LicenseShortName|Artist|LicenseUrl',
  })
  const meta = r?.query?.pages?.[0]?.imageinfo?.[0]?.extmetadata ?? {}
  const strip = (v) => (v ? String(v).replace(/<[^>]*>/g, '').trim() : null)
  return {
    license: strip(meta.LicenseShortName?.value),
    author: strip(meta.Artist?.value)?.slice(0, 120) ?? null,
  }
}

/**
 * 생몰 연대는 **위키데이터**에서 온다(P569 태어남 / P570 죽음).
 *
 * 우리 데이터에는 사실상 없다 — 262명 중 `birth`가 1명, `death`가 3명이고 그중 둘은
 * 연도가 아니라 「battle」·「execution」이다(실측 2026-08-18). 위키데이터는 표본
 * 14명 중 12명에게 있었고, **초상이 없는 사람에게도 연대는 있는 경우가 많다**
 * (안토니우스·칼리굴라·호노리우스).
 *
 * 기원전은 음수다 — 이 저장소의 불변식과 같다(AGENTS 3).
 */
async function findYears(name, aliases) {
  for (const lang of ['ko', 'en']) {
    for (const title of [name, ...aliases]) {
      const r = await api(lang, {
        action: 'query',
        titles: title,
        prop: 'pageprops',
        ppprop: 'wikibase_item',
        redirects: '1',
      })
      const qid = r?.query?.pages?.[0]?.pageprops?.wikibase_item
      if (!qid) continue
      const res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, {
        headers: { 'user-agent': UA },
      })
      if (!res.ok) continue
      const claims = (await res.json())?.entities?.[qid]?.claims ?? {}
      const yearOf = (prop) => {
        const t = claims[prop]?.[0]?.mainsnak?.datavalue?.value?.time
        // "+0100-01-01T00:00:00Z" / "-0100-..." — 앞 다섯 글자가 부호와 연도다
        return t ? Number(t.slice(0, 5)) : null
      }
      const born = yearOf('P569')
      const died = yearOf('P570')
      if (born !== null || died !== null) return { born, died }
    }
  }
  return { born: null, died: null }
}

const entities = readFileSync(join(REPO, 'ontology/entities.jsonl'), 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l))
  .filter((e) => ASK.has(e.type))

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}
mkdirSync(OUT_DIR, { recursive: true })
mkdirSync(dirname(MANIFEST), { recursive: true })

let hit = 0
let miss = 0
let skip = 0

for (const e of entities) {
  const prev = manifest[e.id]
  // 이미 초상도 연대도 물어본 것은 건너뛴다. 「없다」도 물어본 것이다
  if (!force && prev !== undefined && prev !== null && 'born' in prev) {
    skip += 1
    continue
  }

  // 연대는 초상이 있든 없든 물어본다 — 초상 없는 사람에게도 연대는 흔하다
  let years = { born: null, died: null }
  try {
    years = await findYears(e.name, e.aliases ?? [])
  } catch (err) {
    console.error(`  ! ${e.name} 연대: ${err.message}`)
  }

  // 초상은 이미 받아 뒀으면 다시 안 받는다
  if (!force && prev !== undefined) {
    manifest[e.id] = prev === null ? { portrait: null, ...years } : { ...prev, ...years }
    if (years.born !== null || years.died !== null) hit += 1
    else miss += 1
    await sleep(150)
    continue
  }

  let found = null
  try {
    found = await findImage(e.name, e.aliases ?? [])
  } catch (err) {
    console.error(`  ! ${e.name}: ${err.message}`)
  }

  if (!found) {
    // **못 찾았다는 사실도 기록한다.** 안 그러면 돌릴 때마다 없는 것을 다시 묻는다
    manifest[e.id] = { portrait: null, ...years }
    miss += 1
    continue
  }

  const ext = found.src.split('?')[0].split('.').pop().toLowerCase()
  const file = `${e.id.replace(/[:/]/g, '_')}.${ext === 'svg' ? 'svg' : ext}`

  if (!dry) {
    const img = await fetch(found.src, { headers: { 'user-agent': UA } })
    if (!img.ok) {
      manifest[e.id] = { portrait: null, ...years }
      miss += 1
      continue
    }
    writeFileSync(join(OUT_DIR, file), Buffer.from(await img.arrayBuffer()))
  }

  const c = await credit(found.lang, found.original)
  manifest[e.id] = {
    portrait: {
      file: `/portraits/${file}`,
      source: `https://${found.lang}.wikipedia.org/wiki/${encodeURIComponent(found.pageTitle)}`,
      ...c,
    },
    ...years,
  }
  hit += 1
  console.log(`  + ${e.name}  ${c.license ?? '라이선스 불명'}`)

  // 위키에 예의를 지킨다. 서두를 일이 아니다
  await sleep(200)
}

if (!dry) {
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
}

const vals = Object.values(manifest).filter(Boolean)
const withFace = vals.filter((v) => v.portrait).length
const withYear = vals.filter((v) => v.born !== null || v.died !== null).length
const pct = (n) => `${Math.round((n / entities.length) * 100)}%`
console.log(
  `\n인물 ${entities.length}명 · 이번에 처리 ${hit + miss} · 건너뜀 ${skip}` +
    `\n초상 ${withFace}명 (${pct(withFace)}) · 생몰 연대 ${withYear}명 (${pct(withYear)})`,
)
