'use client'
// 첫 화면 홍보 영상 팝업. 영상은 public/promo/library.mp4(크로노아틀라스 레포 scripts/record-promo.py library가 만든다).
// 닫으면 'promo-closed'를 쏘아 첫 접속 투어(Tour)가 이어서 뜬다.
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { PROMO_KEY, promoPending } from '../lib/promo'

export function Promo() {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  useEffect(() => { if (promoPending(path)) setOpen(true) }, [path])
  useEffect(() => {
    if (!open) return
    try { localStorage.setItem(PROMO_KEY, new Date().toISOString().slice(0, 10)) } catch { /* 저장이 막혀도 이번만 */ }
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [open])
  const close = () => { setOpen(false); dispatchEvent(new Event('promo-closed')) }
  if (!open) return null
  return (
    <div className="promo-backdrop" onMouseDown={close} role="dialog" aria-modal="true" aria-label="로마쇠망사 자료실 소개 영상">
      <div className="promo-card" onMouseDown={e => e.stopPropagation()}>
        <video src="/promo/library.mp4" poster="/promo/library-poster.jpg" controls autoPlay muted playsInline preload="metadata" />
        <div className="promo-row">
          <span className="promo-note">1분 소개 · 소리는 영상 아래에서 켤 수 있습니다</span>
          <span className="promo-actions">
            <a className="promo-btn alt" href="/about">이 자료실은</a>
            <button className="promo-btn" onClick={close}>둘러보기</button>
          </span>
        </div>
      </div>
    </div>
  )
}
