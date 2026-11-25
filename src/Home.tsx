import { LEVELS } from './levels'
import { fmtN, MAX_PTS } from './points'
import { listPeople } from './store'
import { N, COL, ORDER } from './Chapter'
import { unlocked, type Passed } from './Levels'
import { VERSION } from './About'
import { useEffect, useRef, useState, type ReactNode } from 'react'


function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLElement>(null)
  const [v, setV] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setV(to); return }
    let raf = 0, t0 = 0
    const run = () => { const step = (t: number) => { if (!t0) t0 = t; const k = Math.min(1, (t - t0) / 1600); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step) }; raf = requestAnimationFrame(step) }
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); run() } }, { threshold: 0.4 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [to])
  return <b ref={ref}>{fmtN(v)}</b>
}

function Stats({ me }: { me: boolean }) {
  const [n, setN] = useState<{ u: number; g: number } | null>(null)
  useEffect(() => { let off = false; void listPeople().then(l => { if (!off) setN({ u: Math.max(l.length, me ? 1 : 0), g: l.filter(x => x.pts >= MAX_PTS || x.lvls >= LEVELS.length).length }) }).catch(() => { if (!off) setN({ u: me ? 1 : 0, g: 0 }) }); return () => { off = true } }, [me])
  const items: [string, number, string][] = [['🎓', n?.g ?? 0, 'طالب حصل على الكورس'], ['👥', n?.u ?? 0, 'مستخدم للموقع'], ['📦', ORDER.length, 'موديول']]
  return (
    <div className="hm2-st" aria-label="إحصائيات">
      {items.map(([ic, v, l]) => <div key={l} className="hm2-sc"><i aria-hidden="true">{ic}</i><CountUp key={n ? 'r' : 'l'} to={v} /><span>{l}</span></div>)}
    </div>)
}

// أيقونات أصلية للمستويات (تصميم خاص بالموقع)
const LV_ICON: ReactNode[] = [
  <><circle cx="32" cy="22" r="10" fill="#f2a93b" /><path d="M12 52c2-12 10-18 20-18s18 6 20 18z" fill="#2aa6a0" /><circle cx="50" cy="20" r="6" fill="#6a7be0" /></>,
  <><path d="M10 24 32 12l22 12v24L32 60 10 48z" fill="#e0554f" /><path d="M10 24l22 12 22-12" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" /><path d="M32 36v24" stroke="#fff" strokeWidth="3" /><path d="M42 18l-20 11" stroke="#fff" strokeWidth="3" /></>,
  <><circle cx="26" cy="30" r="16" fill="#3f9d5a" /><circle cx="26" cy="30" r="6" fill="#fff" /><rect x="40" y="36" width="18" height="20" rx="4" fill="#f2a93b" /><rect x="44" y="40" width="10" height="5" rx="1.5" fill="#fff" /></>,
  <><rect x="10" y="30" width="10" height="24" rx="3" fill="#6a7be0" /><rect x="27" y="20" width="10" height="34" rx="3" fill="#2aa6a0" /><rect x="44" y="10" width="10" height="44" rx="3" fill="#e0554f" /><path d="M14 14l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="#f2a93b" /></>,
  <><circle cx="32" cy="20" r="8" fill="#e0554f" /><circle cx="13" cy="26" r="6" fill="#f2a93b" /><circle cx="51" cy="26" r="6" fill="#2aa6a0" /><path d="M18 54c0-12 6-19 14-19s14 7 14 19z" fill="#e0554f" /><path d="M3 50c0-9 4-14 10-14s7 2 7 2l-4 12z" fill="#f2a93b" /><path d="M61 50c0-9-4-14-10-14s-7 2-7 2l4 12z" fill="#2aa6a0" /></>,
  <><rect x="8" y="8" width="21" height="21" rx="6" fill="#6a7be0" /><rect x="35" y="8" width="21" height="21" rx="6" fill="#2aa6a0" /><rect x="8" y="35" width="21" height="21" rx="6" fill="#f2a93b" /><path d="M45.5 36v20M35.5 46h20" stroke="#e0554f" strokeWidth="5" strokeLinecap="round" /></>,
  <><path d="M32 12 4 26l28 14 28-14z" fill="#2a2f45" /><path d="M16 34v12c0 5 7 9 16 9s16-4 16-9V34l-16 8z" fill="#e0554f" /><path d="M56 28v18" stroke="#f2a93b" strokeWidth="3" strokeLinecap="round" /><circle cx="56" cy="48" r="3.5" fill="#f2a93b" /></>,
]

// الصفحة الرئيسية: كل الموديولات في كروت، وجنب كل واحد حالته (مكتمل / مفتوح / مغلق + اختبار دخول)
export function Home({ name, passed, done, started, onStart, onModule, onSearch, onComm, onSettings, onMsg, onBell, nMsg, nBell, pts, onTheme, theme, onOut, onAbout }: {
  name: string; passed: Passed; done: Record<string, boolean>; started: boolean; onStart: () => void; onModule: (k: string) => void
  onSearch: () => void; onComm: () => void; onSettings: () => void; onMsg: () => void; onBell: () => void; nMsg: number; nBell: number; pts: number; onTheme: () => void; theme: 'light' | 'dark'; onOut: () => void; onAbout: () => void
}) {
  const [am, setAm] = useState(false)
  useEffect(() => { if (!am) return; const f = (e: Event) => { if (!(e.target as Element).closest?.('.ent-act, .hm-more')) setAm(false) }; addEventListener('pointerdown', f); return () => removeEventListener('pointerdown', f) }, [am])
  const doneN = ORDER.filter(k => done[k]).length, passN = Object.values(passed).filter(Boolean).length
  return (
    <div id="home" role="region" aria-label="كل الموديولات">
      <div className="ent-top hm-top">
        <button className="ent-logo logo-btn" onClick={() => document.getElementById('home')?.scrollTo({ top: 0, behavior: 'smooth' })} title="صفحة البداية" aria-label="صفحة البداية"><b>O</b><span>خريطة أودو 20</span></button>
        <button className="hm-more" onClick={() => setAm(v => !v)} aria-expanded={am} aria-label="القائمة" title="القائمة">{am ? '✕' : '☰'}</button>
        <div className={'ent-act' + (am ? ' open' : '')} onClick={() => setAm(false)}>
          <button onClick={onMsg} aria-label="الرسائل" title="الرسائل" className="nb ico">✉{nMsg > 0 && <i className="bdg">{nMsg}</i>}</button>
          <button onClick={onBell} aria-label="الإشعارات" title="الإشعارات" className="nb ico">🔔{nBell > 0 && <i className="bdg">{nBell}</i>}</button>
          <button onClick={onComm}>👥 المجتمع</button>
          <button className="ico" onClick={onSearch} aria-label="بحث">🔍</button>
          <button className="ico" onClick={onSettings} aria-label="الإعدادات" title="الإعدادات">⚙</button>
          <button onClick={onTheme} aria-label={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}>{theme === 'dark' ? '☀ فاتح' : '☾ داكن'}</button>
          <button onClick={onOut}>خروج</button>
        </div>
      </div>
      <main className="hm2">
        <section className="hm2-hero">
          <p className="hm2-k">أهلًا يا {name}</p>
          <h1>رحلتك من الصفر لحد <mark>Odoo Consultant</mark></h1>
          <p className="hm2-s">{ORDER.length} موديولًا في {LEVELS.length} مستويات، <u>كل مستوى باختبار قصير</u>، ولو عايز تقفز تفتح أي مستوى باختبار دخول.</p>
          <div className="hm2-cta">
            <button className="hm2-b p" onClick={onStart}>{started ? 'كمّل الرحلة' : 'ابدأ الآن'} <b>←</b></button>
            <button className="hm2-b" onClick={onComm}>👥 المجتمع والمتصدرون</button>
          </div>
        </section>
        <section className="hm2-curve" aria-label="المستويات">
          <h2 className="hm2-map">خريطة الرحلة</h2>
          <div className="hm2-lv" aria-label="المستويات" id="ent-grid">
            {LEVELS.map((l, i) => {
              const open = unlocked(i, passed), ok = !!passed[l.id], dn = l.ch.filter(k => done[k]).length
              return (
                <button key={l.id} className={'hm2-t' + (open ? '' : ' lkd')} onClick={() => onModule(l.ch.find(k => !done[k]) || l.ch[0])} title={`افتح المستوى ${l.id}`}>
                  <span className="hm2-ic"><svg viewBox="0 0 64 64" aria-hidden="true">{LV_ICON[i]}</svg><i className={'hm2-bd ' + (ok ? 'ok' : open ? 'op' : 'lc')}>{ok ? '✓' : open ? `${dn}/${l.ch.length}` : '🔒'}</i></span>
                  <span className="hm2-n">المستوى {l.id}</span>
                  <span className="hm2-tt">{l.t}</span>
                </button>)
            })}
          </div>
          <Stats me />
        </section>
      </main>
      <footer className="hm2-ft"><p><button className="ab-link" onClick={onAbout}>ℹ️ عن الموقع</button> · تم الصنع بواسطة <b>Muhammed Abdul Bari</b> · النسخة <bdi dir="ltr">v{VERSION}</bdi> · © {new Date().getFullYear()} · <a href="#admin">لوحة الأدمن</a></p></footer>
    </div>
  )
}
