import { useMemo, useState } from 'react'
import { LEVELS, type Q } from './levels'

type Item = { q: Q; lv: number; opts: string[] }
const shuf = <T,>(a: T[]): T[] => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }

// وضع تدريب: أسئلة عشوائية من كل اختبارات المستويات، بدون خصم أو مكسب نقاط
export function Practice({ onClose }: { onClose: () => void }) {
  const [lv, setLv] = useState(0) // 0 = كل المستويات
  const [round, setRound] = useState(0)
  const [i, setI] = useState(0); const [pick, setPick] = useState<string | null>(null); const [score, setScore] = useState(0)
  const items = useMemo<Item[]>(() => {
    const pool = LEVELS.filter(l => !lv || l.id === lv).flatMap(l => l.exam.map(q => ({ q, lv: l.id })))
    return shuf(pool).slice(0, 10).map(x => ({ ...x, opts: shuf([x.q.ok, ...x.q.bad]) }))
  }, [lv, round])
  const cur = items[i], fin = i >= items.length
  const again = (l = lv) => { setLv(l); setRound(r => r + 1); setI(0); setPick(null); setScore(0) }
  const choose = (o: string) => { if (pick !== null) return; setPick(o); if (o === cur.q.ok) setScore(s => s + 1) }
  return (
    <div className="st-ov" role="dialog" aria-modal="true" aria-label="تدريب عشوائي" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pr-box">
        <header><h2>🎯 تدريب عشوائي</h2><button className="cert-x" onClick={onClose} aria-label="إغلاق">✕</button></header>
        <p className="pr-n">أسئلة من اختبارات المستويات للمراجعة فقط. مفيش نقاط بتتخصم أو بتتضاف.</p>
        <label className="pr-f">المستوى
          <select value={lv} onChange={e => again(Number(e.target.value))}>
            <option value={0}>كل المستويات</option>
            {LEVELS.map(l => <option key={l.id} value={l.id}>{l.id}. {l.t}</option>)}
          </select>
        </label>
        {fin ? <div className="pr-r"><b>{score}/{items.length}</b><p>{score === items.length ? 'ممتاز! إجابات كلها صح.' : score >= items.length * 0.7 ? 'كويس جدًا، راجع الغلطات وجرّب تاني.' : 'محتاج مراجعة بسيطة، ارجع للموديولات وجرّب تاني.'}</p><button className="hm2-b p" onClick={() => again()}>جولة جديدة</button></div>
          : <>
            <div className="pr-p">السؤال {i + 1} من {items.length} · المستوى {cur.lv}</div>
            <h3 className="pr-q">{cur.q.q}</h3>
            <div className="pr-o">{cur.opts.map(o => {
              const st = pick === null ? '' : o === cur.q.ok ? ' ok' : o === pick ? ' bad' : ''
              return <button key={o} className={'pr-b' + st} onClick={() => choose(o)} disabled={pick !== null}>{o}</button>
            })}</div>
            {pick !== null && <><p className="pr-w"><b>{pick === cur.q.ok ? '✓ صح. ' : '✗ غلط. '}</b>{cur.q.why}</p><button className="hm2-b p" onClick={() => { setI(x => x + 1); setPick(null) }}>{i + 1 === items.length ? 'النتيجة' : 'السؤال التالي'}</button></>}
          </>}
      </div>
    </div>)
}
