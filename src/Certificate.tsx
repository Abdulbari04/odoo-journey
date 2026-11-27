import { useEffect, useState } from 'react'
import { LEVELS } from './levels'
import { ORDER } from './Chapter'
import { fmtN } from './points'
import { VERSION } from './About'

// شهادة إتمام: بتترسم على canvas وتتعرض كصورة، فتقدر تحفظها (زرار الحفظ أو ضغطة مطوّلة على الموبايل)
async function draw(name: string, pts: number): Promise<string> {
  try { await document.fonts.ready } catch { /* ignore */ }
  const W = 1400, H = 990, c = document.createElement('canvas'); c.width = W; c.height = H
  const g = c.getContext('2d')!
  const F = (w: number, s: number) => `${w} ${s}px Cairo, Tahoma, sans-serif`
  g.direction = 'rtl'; g.textAlign = 'center'
  g.fillStyle = '#fffaf0'; g.fillRect(0, 0, W, H)
  g.strokeStyle = '#a31f1f'; g.lineWidth = 10; g.strokeRect(34, 34, W - 68, H - 68)
  g.strokeStyle = '#f2a93b'; g.lineWidth = 3; g.strokeRect(58, 58, W - 116, H - 116)
  // أركان
  for (const [x, y] of [[58, 58], [W - 58, 58], [58, H - 58], [W - 58, H - 58]]) { g.fillStyle = '#a31f1f'; g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill() }
  g.fillStyle = '#a31f1f'; g.font = F(800, 30); g.fillText('خريطة أودو 20', W / 2, 150)
  g.fillStyle = '#1b1d24'; g.font = F(800, 86); g.fillText('شهادة إتمام', W / 2, 270)
  g.fillStyle = '#4f5663'; g.font = F(600, 34); g.fillText('تشهد منصة خريطة أودو 20 بأن', W / 2, 360)
  let fs = 92; g.font = F(800, fs); while (g.measureText(name).width > W - 300 && fs > 40) { fs -= 4; g.font = F(800, fs) }
  g.fillStyle = '#a31f1f'; g.fillText(name, W / 2, 490)
  const w = Math.min(g.measureText(name).width + 80, W - 240)
  g.fillStyle = '#f2a93b'; g.fillRect(W / 2 - w / 2, 520, w, 5)
  g.fillStyle = '#1b1d24'; g.font = F(600, 40)
  g.fillText('أتمّ بنجاح رحلة Odoo 20 Consultant', W / 2, 620)
  g.fillStyle = '#4f5663'; g.font = F(600, 32)
  g.fillText(`${ORDER.length} موديولًا في ${LEVELS.length} مستويات، واجتاز اختبار كل مستوى`, W / 2, 685)
  g.fillText(`بإجمالي ${fmtN(pts)} نقطة`, W / 2, 735)
  const d = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  g.font = F(600, 28); g.fillText(d, W / 2, 850)
  g.font = F(600, 22); g.fillStyle = '#8a909c'; g.fillText(`النسخة ${VERSION}`, W / 2, 895)
  return c.toDataURL('image/png')
}

export function Certificate({ name, pts, ok, done, passedN, onClose }: { name: string; pts: number; ok: boolean; done: number; passedN: number; onClose: () => void }) {
  const [img, setImg] = useState('')
  useEffect(() => { if (ok) void draw(name, pts).then(setImg) }, [ok, name, pts])
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', h); return () => removeEventListener('keydown', h) }, [onClose])
  const save = () => { const a = document.createElement('a'); a.href = img; a.download = 'odoo20-certificate.png'; document.body.appendChild(a); a.click(); a.remove() }
  return (
    <div className="st-ov" role="dialog" aria-modal="true" aria-label="شهادة التخرج" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cert-box">
        <button className="cert-x" onClick={onClose} aria-label="إغلاق">✕</button>
        {ok ? <>
          <h2>🏅 مبروك يا {name}!</h2>
          {img ? <img className="cert-img" src={img} alt={`شهادة إتمام ${name}`} /> : <p className="cert-w">جاري تجهيز الشهادة…</p>}
          <div className="cert-a"><button className="hm2-b p" onClick={save} disabled={!img}>حفظ كصورة</button><small>على الموبايل: اضغط مطوّلًا على الشهادة واختر حفظ الصورة.</small></div>
        </> : <>
          <h2>🔒 شهادة التخرج</h2>
          <p className="cert-w">بتتفتح لما تخلّص كل الموديولات وتجتاز اختبارات المستويات السبعة.</p>
          <div className="cert-p"><span>الموديولات <b>{done}/{ORDER.length}</b></span><span>المستويات <b>{passedN}/{LEVELS.length}</b></span></div>
          <div className="cert-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(((done + passedN) / (ORDER.length + LEVELS.length)) * 100)}><i style={{ width: `${((done + passedN) / (ORDER.length + LEVELS.length)) * 100}%` }} /></div>
        </>}
      </div>
    </div>)
}
