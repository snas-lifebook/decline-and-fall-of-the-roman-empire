import type { Book } from '../lib/book'

/**
 * 책 한 권을 물건으로 그린다.
 *
 * River: 「그냥 이미지는 그냥 표지 이미지인데 마치 디지털에서 책인것처럼 효과를 줘서
 * 텍스트를 하나로 패키징하자」.
 *
 * ## 표지 그림이 없다 — 그래서 글자로 짠다
 *
 * 출판사 표지를 긁어다 쓰지 않는다(저작권). 대신 **글자로 표지를 짠다.** 빠진 그림의
 * 자리표가 아니라 **작정하고 만든 표지**로 보여야 하므로, 이 책의 세계에서 색과
 * 서체를 가져왔다.
 *
 *   - **색은 반암(斑巖, porphyry)이다.** 로마 황제의 돌이다 — 이집트에서 캐서 황제
 *     석관과 사두정치 군상에 썼고, 비잔틴에서 「자주색에 태어난(포르피로게니투스)」
 *     이라는 말이 여기서 나왔다. 이 책이 20장에서 사두정치를, 30장에서 콘스탄티노플
 *     함락을 다룬다. 벽돌색·크림색은 어느 책에나 쓸 수 있는 색이라 안 쓴다
 *   - **서체는 리디바탕이다.** 전자책 본문용으로 만든 명조라 이 사이트가 이미 싣고
 *     있다(설정에서 고를 수 있는 넷 중 하나). 표지에 새 글꼴을 부르지 않는다
 *
 * 나중에 `public/covers/<id>.jpg`에 진짜 표지를 넣으면 **같은 물성 안에서 그림만
 * 갈린다** — 책등·책배·그림자는 그대로다. `lib/book.ts`의 `cover`가 그 스위치다.
 *
 * ## 무엇이 책처럼 보이게 하는가
 *
 * 원근으로 비스듬히 눕히고 광택을 얹은 3D 목업은 안 쓴다 — 어느 사이트에나 있고,
 * 무엇보다 **가짜로 보인다.** 대신 **책상에 표지를 위로 놓인 책**을 정면에서 본다.
 * 그 자세에서 실제로 보이는 것만 그린다.
 *
 *   - **책배(fore-edge)** — 표지가 속장보다 조금 커서 오른쪽에 종이 묶음이 얇게
 *     비친다. 이게 가장 책 같은 디테일이고 아무도 흉내내지 않는다
 *   - **책등 접힘** — 왼쪽 끝의 어두운 결. 문고본을 엎어 놓으면 늘 거기 있다
 *   - **그림자** — 놓여 있으니 밑에 그늘이 진다
 *
 * 책등에 제목을 세로로 앉히는 안을 만들었다가 뺐다 — 표지를 위로 놓은 책은 책등이
 * 안 보인다. **한 화면에 앞뒤를 다 그리면 그때부터 목업이다.**
 *
 * 마우스를 올리면 살짝 들린다. 펼쳐지거나 돌아가지 않는다 — 눌러서 여는 물건이라는
 * 것만 말하면 된다.
 */
export function BookCover({ book, size = 'md' }: { book: Book; size?: 'md' | 'lg' }) {
  return (
    <div className="book" data-size={size} aria-hidden="true">
      <div className="book-face">
        {book.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.cover} alt="" className="book-image" />
        ) : (
          <div className="book-plate">
            <span className="book-plate-eyebrow">30포인트로 읽어내는</span>
            <span className="book-plate-title">
              로마 제국
              <br />
              쇠망사
            </span>
            <span className="book-plate-rule" />
            <span className="book-plate-by">에드워드 기번</span>
          </div>
        )}
      </div>
      <div className="book-edge" />
    </div>
  )
}
