import { addPen } from './points'
import { useMemo, useState } from 'react'
import { LEVELS, PASS, type Level } from './levels'
import { N, COL } from './Chapter'
import * as track from './track'

export type Passed = Record<number, boolean>
export const unlocked = (i: number, p: Passed) => i === 0 || !!p[LEVELS[i - 1].id]

export function LevelHead({ lv, state }: { lv: Level; state: 'open' | 'locked' | 'passed' }) {
  return (
    <div className={'lvh ' + state} id={'lv-' + lv.id}>
      <span className="lvn">{state === 'locked' ? '🔒' : state === 'passed' ? '✓' : lv.id}</span>
      <div><b>المستوى {lv.id}: {lv.t}</b><span>{lv.d}</span></div>
    </div>
  )
}

export function Stepper({ li, cur, done, passed, onPick }: { li: number; cur: string; done: Record<string, boolean>; passed: Passed; onPick: (id: string) => void }) {
  const lv = LEVELS[li], open = unlocked(li, passed)
  const items = [...lv.ch.map(k => ({ id: k, t: N[k], ok: !!done[k] })), { id: 'exam', t: 'الاختبار', ok: !!passed[lv.id] }]
  const at = items.findIndex(x => x.id === cur)
  return (
    <nav className="stp" aria-label={'تقدّم المستوى ' + lv.id}>
      <div className="stp-h"><b>المستوى {lv.id}: {lv.t}</b><span>{open ? `الخطوة ${at + 1} من ${items.length}` : '🔒 مقفول'}</span></div>
      <div className="stp-bar" aria-hidden="true"><i style={{ width: ((at + 1) / items.length) * 100 + '%' }} /></div>
      <ol className="stp-l">
        {items.map((x, j) => <li key={x.id}><button className={(x.id === cur ? 'on ' : '') + (x.ok ? 'ok' : '')} aria-current={x.id === cur ? 'step' : undefined} onClick={() => onPick(x.id)}><i>{x.ok ? '✓' : j + 1}</i><span>{x.t}</span></button></li>)}
      </ol>
    </nav>)
}

export function LockedCard({ k, lv }: { k: string; lv: Level }) {
  const prev = LEVELS[LEVELS.indexOf(lv) - 1]
  return (
    <section className="ch locked" id={'ch-' + k} data-k={k} style={{ ['--c' as string]: `var(${COL[k]})` }}>
      <div className="lock-i" aria-hidden="true">🔒</div>
      <h2>{N[k]}</h2>
      <p>الفصل ده مقفول. خلّص اختبار المستوى {prev?.id}{prev ? ` «${prev.t}»` : ''} الأول علشان يتفتح لك المستوى {lv.id}.</p>
    </section>
  )
}

const shuffle = <T,>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }

export function LevelExam({ lv, passed, onPass, onNext, onBack }: { lv: Level; passed: boolean; onPass: () => void; onNext: (() => void) | null; onBack?: () => void }) {
  const [run, setRun] = useState(0) // 0 مقفول، غير كده رقم المحاولة
  const [ans, setAns] = useState<Record<number, string>>({})
  const [res, setRes] = useState<number | null>(null)
  const qs = useMemo(() => lv.exam.map(q => ({ ...q, opts: shuffle([q.ok, ...q.bad]) })), [lv, run]) // eslint-disable-line react-hooks/exhaustive-deps
  const submit = () => {
    const score = qs.filter((q, i) => ans[i] === q.ok).length
    setRes(score); addPen(lv.id, qs.length - score); track.exam(score >= PASS); if (score >= PASS && !passed) onPass()
  }
  const start = () => { setRun(r => r + 1); setAns({}); setRes(null) }
  return (
    <section className={'exam' + (passed ? ' ok' : '')} id={'exam-' + lv.id} aria-label={'اختبار المستوى ' + lv.id}>
      <h3>📝 اختبار المستوى {lv.id}</h3>
      {run === 0 ? <>
        <p>{passed ? 'المستوى ده مكتمل. تقدر تعيد الاختبار للمراجعة.' : `٥ أسئلة اختيار من متعدد. لازم تجاوب ${PASS} صح على الأقل علشان تخلّص المستوى ${onNext ? 'ويتفتح اللي بعده' : ''}.`}</p>
        <button className="cta" onClick={start}>{passed ? 'أعد الاختبار' : 'ابدأ الاختبار'}</button>
      </> : <>
        <ol className="exq">
          {qs.map((q, i) => {
            const shown = res !== null
            return (
              <li key={i}><b>{q.q}</b>
                <div className="exo" role="radiogroup">
                  {q.opts.map(o => {
                    const st = shown ? (o === q.ok ? ' right' : ans[i] === o ? ' wrong' : '') : ''
                    return <label key={o} className={'exopt' + st}><input type="radio" name={`q${lv.id}-${i}-${run}`} disabled={shown} checked={ans[i] === o} onChange={() => setAns(a => ({ ...a, [i]: o }))} />{o}</label>
                  })}
                </div>
                {shown && ans[i] !== q.ok && <p className="why">الإجابة الصح: {q.ok}. {q.why}</p>}
              </li>)
          })}
        </ol>
        {res === null
          ? <button className="cta" disabled={Object.keys(ans).length < qs.length} onClick={submit}>سلّم الإجابات</button>
          : res >= PASS
            ? <div className="win" role="status">
                <div className="win-i" aria-hidden="true">🎉</div>
                <h4>نجحت! مبروك عليك</h4>
                <p>جاوبت {res} من {qs.length} صح، وخلّصت المستوى {lv.id} «{lv.t}».{onNext ? ' المستوى التالي اتفتح لك.' : ' وكده خلّصت الرحلة كلها، مبروك التخرج!'}</p>
                {onNext && <button className="cta big" onClick={onNext}>الذهاب للمستوى التالي ←</button>}
              </div>
            : <div className="res f" role="status">
                <b>{res} من {qs.length}</b>
                <span>محتاج {PASS} على الأقل. راجع الموديولات وجرّب تاني.</span>
                <div className="resb"><button className="cta" onClick={start}>جرّب تاني</button>{onBack && <button className="tb" onClick={onBack}>راجع الموديولات</button>}</div>
              </div>}
      </>}
    </section>
  )
}

export function Intro({ name, passed, done, started, onStart, onJump }: { name: string; passed: Passed; done: Record<string, boolean>; started: boolean; onStart: () => void; onJump: (levelIdx: number) => void }) {
  const doneN = Object.values(done).filter(Boolean).length
  const cur = LEVELS.findIndex((l, i) => unlocked(i, passed) && !passed[l.id])
  return (
    <main className="intro-page">
      <section className="ip-hero">
        <div className="hi">أهلًا يا {name}</div>
        <h1>أعظم رحلة لتخرج <em>Odoo Consultant</em></h1>
        <p>رحلة تعليمية بالعربي المصري بتاخدك من الصفر في Odoo 20 لحد ما تقدر تشتغل كمستشار. بنبدأ بالأساس، وبعدين نمشي مع العميل من أول تواصل للبيع والشراء والمخزون والتصنيع والمحاسبة، ونعدّي على الموارد البشرية، ونقفل بمشروع تخرج.</p>
        <p>الرحلة مقسّمة لـ {LEVELS.length} مستويات. مستوى واحد بس بيتفتح في الأول، وكل مستوى بينتهي باختبار قصير. لما تعدّيه، بيتفتح لك اللي بعده.</p>
        <button className="cta big" onClick={onStart}>{started ? 'كمّل الرحلة' : 'بداية الرحلة'}</button>
        {started && <span className="ip-st">خلّصت {doneN} فصل و{Object.values(passed).filter(Boolean).length} من {LEVELS.length} مستويات</span>}
      </section>
      <section className="ip-map" aria-label="خريطة الرحلة">
        <h2>خريطة الرحلة</h2>
        <ol>
          {LEVELS.map((l, i) => {
            const st = passed[l.id] ? 'passed' : unlocked(i, passed) ? 'open' : 'locked'
            return (
              <li key={l.id} className={'ipl ' + st + (i === cur ? ' cur' : '')}>
                <button onClick={() => onJump(i)} aria-label={`المستوى ${l.id}: ${l.t}${st === 'locked' ? ' (مقفول، تقدر تفتحه باختبار)' : ''}`}>
                  <span className="ipn">{st === 'locked' ? '🔒' : st === 'passed' ? '✓' : l.id}</span>
                  <span className="ipt"><b>{l.t}</b><small>{l.d}</small>
                    <span className="ipc">{l.ch.map(k => <i key={k} style={{ ['--c' as string]: `var(${COL[k]})` }}>{N[k]}</i>)}</span></span>
                </button>
              </li>)
          })}
        </ol>
      </section>
    </main>
  )
}

// اختبار تخطّي: بيفتح موديول مقفول لو المستخدم أثبت إنه فاهم المستويات اللي قبله
export function SkipExam({ li, passed, onPassAll, compact }: { li: number; passed: Passed; onPassAll: (ids: number[]) => void; compact?: boolean }) {
  const prev = LEVELS.slice(0, li).filter(l => !passed[l.id])
  const [run, setRun] = useState(0)
  const [ans, setAns] = useState<Record<number, string>>({})
  const [res, setRes] = useState<number | null>(null)
  const qs = useMemo(() => {
    const pool = prev.flatMap(l => l.exam.map(q => ({ ...q, lv: l.id })))
    const n = Math.min(pool.length, Math.min(10, Math.max(5, 2 * prev.length)))
    return shuffle(pool).slice(0, n).map(q => ({ ...q, opts: shuffle([q.ok, ...q.bad]) }))
  }, [run, li]) // eslint-disable-line react-hooks/exhaustive-deps
  if (prev.length === 0) return null
  const need = Math.ceil(qs.length * 0.8)
  const names = prev.map(l => `المستوى ${l.id}`).join(' و')
  const submit = () => { const s = qs.filter((q, i) => ans[i] === q.ok).length; qs.forEach((q, i) => { if (ans[i] !== q.ok) addPen(q.lv, 1) }); setRes(s); track.exam(s >= need); if (s >= need) onPassAll(prev.map(l => l.id)) }
  const start = () => { setRun(r => r + 1); setAns({}); setRes(null) }
  return (
    <section className={'exam skip' + (compact ? ' compact' : '')} aria-label={'اختبار فتح المستوى ' + LEVELS[li].id}>
      <h3>🔓 عايز تفتح المستوى {LEVELS[li].id} دلوقتي؟</h3>
      {run === 0 ? <>
        <p>اختبر نفسك الأول في {names}. اختبار من {Math.min(prev.flatMap(l => l.exam).length, Math.min(10, Math.max(5, 2 * prev.length)))} أسئلة، وبتحتاج 80% على الأقل. لو عدّيته بتتحسب المستويات اللي قبله مكتملة ويتفتح لك المستوى ده من غير ما تدرسها واحد واحد.</p>
        <button className="cta" onClick={start}>ابدأ اختبار الفتح</button>
      </> : <>
        <ol className="exq">
          {qs.map((q, i) => {
            const shown = res !== null
            return (
              <li key={i}><b>{q.q}</b>
                <div className="exo" role="radiogroup">
                  {q.opts.map(o => {
                    const st = shown ? (o === q.ok ? ' right' : ans[i] === o ? ' wrong' : '') : ''
                    return <label key={o} className={'exopt' + st}><input type="radio" name={`s${li}-${i}-${run}`} disabled={shown} checked={ans[i] === o} onChange={() => setAns(a => ({ ...a, [i]: o }))} />{o}</label>
                  })}
                </div>
                {shown && ans[i] !== q.ok && <p className="why">الإجابة الصح: {q.ok}. {q.why}</p>}
              </li>)
          })}
        </ol>
        {res === null
          ? <button className="cta" disabled={Object.keys(ans).length < qs.length} onClick={submit}>سلّم الإجابات</button>
          : <div className={'res ' + (res >= need ? 'p' : 'f')} role="status">
              <b>{res} من {qs.length}</b>
              <span>{res >= need ? `ممتاز! المستوى ${LEVELS[li].id} اتفتح لك.` : `محتاج ${need} على الأقل. راجع ${names} وجرّب تاني.`}</span>
              {res < need && <div className="resb"><button className="cta" onClick={start}>جرّب تاني</button></div>}
            </div>}
      </>}
    </section>
  )
}
