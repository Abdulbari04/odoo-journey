import { useCallback, useEffect, useMemo, useState } from 'react'
import * as store from './store'
import { N, ORDER } from './Chapter'
import { LEVELS } from './levels'
import { MOD_PTS, LV_PTS, MAX_PTS, fmtN, rankOf } from './points'

const ago = (t: number) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000))
  if (m < 1) return 'الآن'
  if (m < 60) return `منذ ${m} د`
  const h = Math.round(m / 60); if (h < 24) return `منذ ${h} س`
  const d = Math.round(h / 24); return d < 30 ? `منذ ${d} يوم` : new Date(t).toLocaleDateString('ar-EG')
}
export const TOPICS: [string, string, string][] = [['general', '💬', 'عام'], ['version', '🆕', 'النسخة: Odoo 20 مقابل 19'], ['bugs', '🐞', 'أخطاء ومشاكل'], ['acc', '🧾', 'أسئلة المحاسبة'], ['exams', '📝', 'الاختبارات والنقاط'], ['ideas', '💡', 'اقتراحات وتحسينات']]
const label = (k: string) => TOPICS.find(t => t[0] === k)?.[2] || N[k] || k

export { rankOf }

export function Av({ p, name, s = 28 }: { p?: store.Person; name: string; s?: number }) {
  return p?.avatar ? <img className="av" src={p.avatar} alt="" width={s} height={s} /> : <span className="av ph" style={{ width: s, height: s, fontSize: s * 0.42 }} aria-hidden="true">{(name || '?').trim().charAt(0).toUpperCase()}</span>
}
function usePeople() {
  const [m, setM] = useState<Record<string, store.Person>>({})
  const [all, setAll] = useState<store.Person[] | null>(null)
  const refresh = useCallback(async () => { const l = await store.listPeople(); setAll(l); setM(Object.fromEntries(l.map(x => [x.id, x]))) }, [])
  useEffect(() => { refresh() }, [refresh])
  return { m, all, refresh }
}

function useCmts() {
  const [all, setAll] = useState<store.Cmt[] | null>(null)
  const refresh = useCallback(async () => setAll(await store.cmtList()), [])
  useEffect(() => { refresh() }, [refresh])
  return { all, refresh }
}

const EMO = ['👍', '❤️', '💡', '🎉']
export const mkey = (n: string) => n.trim().replace(/\s+/g, '_')
const MENTION = /@[\w\u0600-\u06FF_]+/g

function useRx() {
  const [all, setAll] = useState<store.Rx[]>([])
  const refresh = useCallback(async () => setAll(await store.rxList()), [])
  useEffect(() => { refresh() }, [refresh])
  const toggle = async (c: string, e: string) => {
    const mine = all.filter(x => x.c === c && x.mine).map(x => x.e); const had = mine.includes(e)
    setAll(l => [...l.filter(x => !(x.c === c && x.mine)), ...(had ? [] : [{ c, e, u: 'me', mine: true }])])
    try { for (const o of mine) if (o !== e || had) await store.rxToggle(c, o, false); if (!had) await store.rxToggle(c, e, true) } catch { /* بنرجّع الحالة الحقيقية */ } finally { refresh() }
  }
  return { all, toggle }
}

function Body({ text, me }: { text: string; me: string }) {
  const parts: React.ReactNode[] = []; let last = 0
  for (const m of text.matchAll(MENTION)) {
    const i = m.index ?? 0; if (i > last) parts.push(text.slice(last, i))
    parts.push(<span key={i} className={'cm-mn' + (me && m[0] === '@' + mkey(me) ? ' me' : '')}>{m[0].replace(/_/g, ' ')}</span>); last = i + m[0].length
  }
  parts.push(text.slice(last)); return <p>{parts}</p>
}

type Reply = { id: string; name: string; root?: boolean }
function Composer({ k, name, onDone, picker, people, reply, onCancel }: { k: string; name: string; onDone: () => void; picker?: boolean; people: store.Person[]; reply?: Reply | null; onCancel?: () => void }) {
  const [t, setT] = useState(''); const [m, setM] = useState(k); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  useEffect(() => { if (reply && !reply.root) setT(x => (x.startsWith('@') ? x : '@' + mkey(reply.name) + ' ' + x)) }, [reply])
  const q = /@([\w\u0600-\u06FF_]*)$/.exec(t)
  const sug = q ? people.filter(x => x.name && !x.me && mkey(x.name).includes(q[1])).slice(0, 5) : []
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); const x = t.trim(); if (!x) return
    setBusy(true); setErr('')
    try { await store.cmtAdd(m, name, x, reply || undefined); setT(''); onCancel?.(); onDone() } catch { setErr('تعذّر إرسال التعليق، تأكد من صلاحية الكتابة أو الاتصال.') } finally { setBusy(false) }
  }
  return (
    <form className="cm-form" onSubmit={send}>
      {reply && <div className="cm-rp">↩ رد على <b>{reply.name}</b><button type="button" onClick={() => { setT(''); onCancel?.() }} aria-label="إلغاء الرد">×</button></div>}
      {picker && <select aria-label="الموديول" value={m} onChange={e => setM(e.target.value)}><option value="general">عام</option>{ORDER.map(o => <option key={o} value={o}>{N[o]}</option>)}</select>}
      <textarea autoFocus={!!reply} value={t} onChange={e => setT(e.target.value)} maxLength={400} rows={2} placeholder="اكتب تعليقك… (اكتب @ لعمل منشن لعضو)" aria-label="تعليقك" />
      {!!sug.length && <ul className="cm-sug" role="listbox">{sug.map(x => <li key={x.id}><button type="button" onClick={() => setT(v => v.replace(/@([\w\u0600-\u06FF_]*)$/, '@' + mkey(x.name) + ' '))}><Av p={x} name={x.name} s={20} />{x.name}</button></li>)}</ul>}
      <div className="cm-row"><span className="cm-err">{err}</span><button disabled={busy || !t.trim()}>{busy ? '…' : 'إرسال'}</button></div>
    </form>)
}

function Item({ c, tag, onDel, pm, rx, onReact, onReply, parent, meName, form }: { c: store.Cmt; tag?: boolean; onDel: () => void; pm: Record<string, store.Person>; rx: store.Rx[]; onReact: (e: string) => void; onReply: () => void; parent?: store.Cmt; meName: string; form?: React.ReactNode }) {
  return (
    <div className="cm-it" id={'c-' + c.id}>
      <div className="cm-h"><Av p={pm[c.uid]} name={c.name} s={22} /><b>{c.name}</b>{tag && <span className="cm-tag">{label(c.k)}</span>}<time>{ago(c.t)}</time>{c.mine && <button className="cm-x" onClick={onDel} aria-label="حذف تعليقي" title="حذف">×</button>}</div>
      {c.rep && parent && <div className="cm-q">↩ {c.rn || 'تعليق'}{parent ? ': ' + parent.text.slice(0, 70) + (parent.text.length > 70 ? '…' : '') : ''}</div>}
      <Body text={c.text} me={meName} />
      <div className="cm-act">
        {EMO.map(e => { const n = rx.filter(x => x.e === e).length, on = rx.some(x => x.e === e && x.mine); return <button key={e} className={'cm-rx' + (on ? ' on' : '')} aria-pressed={on} onClick={() => onReact(e)}>{e}{n > 0 && <span>{n}</span>}</button> })}
        <button className="cm-rp-b" onClick={onReply}>↩ رد</button>
      </div>
      {form}
    </div>)
}

type TProps = { all: store.Cmt[]; pm: Record<string, store.Person>; meName: string; rxs: store.Rx[]; toggle: (c: string, e: string) => void; rep: Reply | null; setRep: (r: Reply | null) => void; refresh: () => void; tag?: boolean }
// بيجمّع الردود تحت التعليق الأصلي (أي رد على رد بيتحط تحت نفس الأصل)
function threads(list: store.Cmt[], all: store.Cmt[]) {
  const by = new Map(all.map(c => [c.id, c])); const rootOf = (c: store.Cmt) => { let x = c, n = 0; while (x.rep && by.has(x.rep) && n++ < 20) x = by.get(x.rep)!; return x }
  const roots = list.filter(c => rootOf(c).id === c.id)
  const rs = new Map<string, store.Cmt[]>()
  for (const c of list) { const r = rootOf(c); if (r.id !== c.id) rs.set(r.id, [...(rs.get(r.id) || []), c]) }
  rs.forEach(v => v.sort((a, b) => a.t - b.t))
  return { roots, rs }
}
function Thread({ root, replies, t }: { root: store.Cmt; replies: store.Cmt[]; t: TProps }) {
  const people = Object.values(t.pm)
  const one = (c: store.Cmt, isRoot: boolean) => (
    <Item key={c.id} c={c} tag={isRoot && t.tag} pm={t.pm} meName={t.meName} rx={t.rxs.filter(x => x.c === c.id)} onReact={e => t.toggle(c.id, e)}
      onReply={() => t.setRep(t.rep?.id === c.id ? null : { id: c.id, name: c.name, root: isRoot })}
      form={t.rep?.id === c.id ? <Composer k={c.k} name={t.meName} onDone={t.refresh} people={people} reply={t.rep} onCancel={() => t.setRep(null)} /> : undefined}
      parent={!isRoot && c.rep !== root.id ? t.all.find(x => x.id === c.rep) : undefined}
      onDel={async () => { await store.cmtDel(c.id); t.refresh() }} />)
  return <li className="cm-th">{one(root, true)}{replies.length > 0 && <ul className="cm-rs" aria-label="الردود">{replies.map(r => <li key={r.id}>{one(r, false)}</li>)}</ul>}</li>
}

// تعليقات تحت كل موديول: تعليق واحد ظاهر + «إظهار المزيد»
export function ModuleComments({ k, name, side }: { k: string; name: string; side?: boolean }) {
  const { all, refresh } = useCmts(); const { m: pm } = usePeople(); const { all: rxs, toggle } = useRx(); const [more, setMore] = useState(false); const [rep, setRep] = useState<Reply | null>(null)
  const list = (all || []).filter(c => c.k === k)
  const { roots, rs } = threads(list, all || [])
  const shown = more || side ? roots : roots.slice(0, 1)
  const t: TProps = { all: all || [], pm, meName: name, rxs, toggle, rep, setRep, refresh }
  if (side) return (
    <section className="cm cm-p" aria-label="تعليقات الموديول">
      <h4>💬 التعليقات{list.length ? ` (${list.length})` : ''}</h4>
      <div className="cm-pl">
        {all && !list.length && <p className="cm-empty">لا توجد تعليقات بعد. كن أول من يعلّق.</p>}
        <ul>{shown.map(c => <Thread key={c.id} root={c} replies={rs.get(c.id) || []} t={t} />)}</ul>
      </div>
      <div className="cm-pc"><Composer k={k} name={name} onDone={refresh} people={Object.values(pm)} /></div>
    </section>)
  return (
    <section className="cm" aria-label="تعليقات الموديول">
      <h4>تعليقات المجتمع{list.length ? ` (${list.length})` : ''}</h4>
      <Composer k={k} name={name} onDone={refresh} people={Object.values(pm)} />
      {all && !list.length && <p className="cm-empty">لا توجد تعليقات بعد. كن أول من يعلّق.</p>}
      <ul>{shown.map(c => <Thread key={c.id} root={c} replies={rs.get(c.id) || []} t={t} />)}</ul>
      {roots.length > 1 && <button className="cm-more" onClick={() => setMore(m => !m)}>{more ? 'إخفاء' : `إظهار المزيد (${roots.length - 1})`}</button>}
    </section>)
}


const TOP = (n: number) => (n === 0 ? '🥇' : n === 1 ? '🥈' : n === 2 ? '🥉' : String(n + 1))

function resizeImg(file: File, size = 160): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file)
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = cv.height = size
      const x = cv.getContext('2d'); if (!x) return rej(new Error('canvas'))
      const m = Math.min(img.width, img.height), sx = (img.width - m) / 2, sy = (img.height - m) / 2
      x.drawImage(img, sx, sy, m, m, 0, 0, size, size); URL.revokeObjectURL(url); res(cv.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')) }
    img.src = url
  })
}

export type Prof = { name: string; job: string; bio: string; avatar: string }
export const readProf = (base: { name: string; job: string }): Prof => ({
  name: store.get('odoo20-dname') || base.name, job: store.get('odoo20-djob') ?? base.job, bio: store.get('odoo20-bio') || '', avatar: store.get('odoo20-avatar') || '',
})

export function ProfileTab({ base, pts, mods, lvls, onSaved }: { base: { name: string; job: string }; pts: number; mods: number; lvls: number; onSaved: () => void }) {
  const [p, setP] = useState<Prof>(() => readProf(base)); const [ok, setOk] = useState(false); const [err, setErr] = useState('')
  const up = (k: keyof Prof, v: string) => { setP(x => ({ ...x, [k]: v })); setOk(false) }
  const pick = async (f?: File) => { if (!f) return; try { up('avatar', await resizeImg(f)) } catch { setErr('تعذّر قراءة الصورة، جرّب صورة أخرى.') } }
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); const n = p.name.trim() || base.name
    store.set('odoo20-dname', n); store.set('odoo20-djob', p.job.trim()); store.set('odoo20-bio', p.bio.trim()); store.set('odoo20-avatar', p.avatar)
    await store.pushPerson({ name: n, job: p.job.trim(), bio: p.bio.trim(), avatar: p.avatar, pts, mods, lvls }); setOk(true); setErr(''); onSaved()
  }
  return (
    <form className="pf" onSubmit={save}>
      <div className="pf-top">
        <Av p={{ avatar: p.avatar } as store.Person} name={p.name} s={88} />
        <div className="pf-btns">
          <label className="pf-up">{p.avatar ? 'تغيير الصورة' : 'إضافة صورة'}<input type="file" accept="image/*" onChange={e => pick(e.target.files?.[0])} hidden /></label>
          {p.avatar && <button type="button" className="pf-rm" onClick={() => up('avatar', '')}>إزالة</button>}
        </div>
      </div>
      <div className="pf-stats"><span><b>{fmtN(pts)}</b> نقطة</span><span><b>{mods}</b> موديول</span><span><b>{lvls}</b> مستوى</span><span>{rankOf(pts)}</span></div>
      <label>الاسم الظاهر<input value={p.name} maxLength={40} onChange={e => up('name', e.target.value)} /></label>
      <label>المسمّى أو الوظيفة<input value={p.job} maxLength={50} onChange={e => up('job', e.target.value)} placeholder="مثال: محاسب، مستشار تحت التدريب" /></label>
      <label>نبذة عنك<textarea value={p.bio} maxLength={160} rows={3} onChange={e => up('bio', e.target.value)} placeholder="سطر أو سطرين تعرّف بهما نفسك" /></label>
      <p className="pf-n">الاسم والصورة والنبذة والنقاط تظهر لبقية أعضاء المجتمع في قائمة المتصدرين وتحت تعليقاتك.</p>
      <div className="pf-act"><button className="ld-btn">حفظ الملف</button>{ok && <span className="pf-ok">تم الحفظ ✓</span>}{err && <span className="cm-err">{err}</span>}</div>
    </form>)
}

function Board({ people, me }: { people: store.Person[] | null; me: string }) {
  const [n, setN] = useState(10)
  const list = [...(people || [])].sort((a, b) => b.pts - a.pts || b.mods - a.mods || a.t - b.t)
  const first = list[0], rest = list.slice(1)
  const isMe = (x: store.Person) => x.me || x.id === me
  return (
    <div>
      <div className="lb-rules"><b>النقاط:</b> {fmtN(MOD_PTS)} لكل موديول تُكمله، و{fmtN(LV_PTS[0])}–{fmtN(LV_PTS[LV_PTS.length - 1])} لكل مستوى تجتاز اختباره (حسب المستوى). كل إجابة خاطئة في الاختبارات تخصم قيمة سؤال صحيح. الحد الأقصى {fmtN(MAX_PTS)} نقطة.</div>
      {people && !list.length && <p className="cm-empty">لا يوجد متصدّرون بعد. أكمل موديولًا واحفظ ملفك لتظهر هنا.</p>}
      {first && <div className="lb-grid">
        <aside className={'lb-champ' + (isMe(first) ? ' me' : '')} aria-label="المتصدر الأول">
          <span className="lb-crown">🥇 المركز الأول</span>
          <Av p={first} name={first.name} s={96} />
          <h3>{first.name || 'متعلّم'}{isMe(first) && <em> (أنت)</em>}</h3>
          <p className="lb-job">{first.job || rankOf(first.pts)}</p>
          {!isMe(first) && <button className="lb-dm" onClick={() => dispatchEvent(new CustomEvent('odoo20-dm', { detail: { id: first.id, name: first.name } }))}>✉ راسله</button>}
          {first.bio && <p className="lb-bio">{first.bio}</p>}
          <div className="lb-st"><span><b>{first.mods}</b>موديول</span><span><b>{first.lvls}</b>مستوى</span><span><b>{rankOf(first.pts)}</b>الرتبة</span></div>
          <div className="lb-big"><b>{fmtN(first.pts)}</b><small>نقطة</small></div>
        </aside>
        <ol className="lb" start={2}>
          {rest.slice(0, n).map((x, i) => (
            <li key={x.id} className={'lb-r' + (isMe(x) ? ' me' : '') + (i < 2 ? ' top' : '')}>
              <span className="lb-n">{TOP(i + 1)}</span>
              <Av p={x} name={x.name} s={38} />
              <span className="lb-w"><b>{x.name || 'متعلّم'}{isMe(x) && <em> (أنت)</em>}</b><small>{x.job || rankOf(x.pts)} · {x.mods} موديول · {x.lvls} مستوى</small></span>
              <span className="lb-p"><b>{fmtN(x.pts)}</b><small>نقطة</small></span>
              {!isMe(x) && <button className="lb-dm s" aria-label={'مراسلة ' + x.name} title="راسله" onClick={() => dispatchEvent(new CustomEvent('odoo20-dm', { detail: { id: x.id, name: x.name } }))}>✉</button>}
            </li>))}
          {!rest.length && <li className="cm-empty">أنت أول المتصدرين حاليًا — بانتظار بقية المتعلّمين.</li>}
        </ol>
      </div>}
      {rest.length > n && <button className="cm-more" onClick={() => setN(v => v + 10)}>إظهار المزيد ({rest.length - n})</button>}
    </div>)
}

function Feed({ name, current, pm }: { name: string; current?: string; pm: Record<string, store.Person> }) {
  const { all, refresh } = useCmts(); const { all: rxs, toggle } = useRx(); const [topic, setTopic] = useState(current && ORDER.includes(current) ? current : 'general'); const [n, setN] = useState(10); const [rep, setRep] = useState<Reply | null>(null)
  const cnt = (k: string) => (all || []).filter(c => c.k === k && !c.rep).length
  const list = (all || []).filter(c => c.k === topic)
  const { roots, rs } = threads(list, all || [])
  const t: TProps = { all: all || [], pm, meName: name, rxs, toggle, rep, setRep, refresh }
  const pick = (k: string) => { setTopic(k); setN(10); setRep(null) }
  const Btn = ({ k, ic, t: tt }: { k: string; ic: string; t: string }) => <button className={'tp-b' + (topic === k ? ' on' : '')} aria-pressed={topic === k} onClick={() => pick(k)}><i aria-hidden="true">{ic}</i><span>{tt}</span>{cnt(k) > 0 && <em>{cnt(k)}</em>}</button>
  return (
    <div className="dsc">
      <aside className="dsc-topics" aria-label="موضوعات النقاش">
        <h3>موضوعات النقاش</h3>
        <select className="cm-f dsc-sel" aria-label="اختر الموضوع" value={topic} onChange={e => pick(e.target.value)}>
          <optgroup label="موضوعات عامة">{TOPICS.map(x => <option key={x[0]} value={x[0]}>{x[1]} {x[2]}</option>)}</optgroup>
          <optgroup label="الموديولات">{ORDER.map(o => <option key={o} value={o}>{N[o]}</option>)}</optgroup>
        </select>
        <div className="tp-g">{TOPICS.map(x => <Btn key={x[0]} k={x[0]} ic={x[1]} t={x[2]} />)}</div>
        <h4>الموديولات</h4>
        <div className="tp-g">{ORDER.map(o => <Btn key={o} k={o} ic="📦" t={N[o]} />)}</div>
      </aside>
      <section className="dsc-main cm-feed" aria-label={'مناقشة: ' + label(topic)}>
        <h3 className="dsc-h">{label(topic)}<small>{roots.length ? `${roots.length} نقاش` : ''}</small></h3>
        <Composer key={topic} k={topic} name={name} onDone={refresh} people={Object.values(pm)} />
        {all && !list.length && <p className="cm-empty">لا توجد مناقشات في الموضوع ده لسه. ابدأ أول واحدة.</p>}
        <ul>{roots.slice(0, n).map(c => <Thread key={c.id} root={c} replies={rs.get(c.id) || []} t={t} />)}</ul>
        {roots.length > n && <button className="cm-more" onClick={() => setN(x => x + 10)}>إظهار المزيد ({roots.length - n})</button>}
      </section>
    </div>)
}

// ---- المسابقة الأسبوعية: نفس الأسئلة لكل المتعلّمين، محاولة واحدة في الأسبوع ----
const DAY = 864e5
const weekNo = () => Math.floor((Date.now() - 2 * DAY) / (7 * DAY)) // الأسبوع بيبدأ السبت (UTC)
const daysLeft = () => 7 - (Math.floor((Date.now() - 2 * DAY) / DAY) % 7)
const rng = (seed: number) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
function seededShuffle<T>(a: T[], r: () => number) { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]] } return x }
const CN = 10
function weekQs(w: number) {
  const r = rng(w * 7919 + 13)
  return seededShuffle(LEVELS.flatMap(l => l.exam), r).slice(0, CN).map(q => ({ ...q, opts: seededShuffle([q.ok, ...q.bad], r) }))
}

function Contest({ people, me, onDone }: { people: store.Person[] | null; me: string; onDone: () => void }) {
  const w = weekNo(); const qs = useMemo(() => weekQs(w), [w])
  const [mine, setMine] = useState<store.Contest | null>(() => { const c = store.readContest(); return c && c.w === w ? c : null })
  const [run, setRun] = useState(false); const [ans, setAns] = useState<Record<number, string>>({})
  const submit = () => {
    const s = qs.filter((q, i) => ans[i] === q.ok).length; const c = { w, s, n: CN }
    store.set('odoo20-contest', JSON.stringify(c)); setMine(c); setRun(false); onDone()
  }
  const board = (people || []).filter(x => x.cw === w && x.cs != null).sort((a, b) => (b.cs || 0) - (a.cs || 0) || a.t - b.t)
  return (
    <div className="ct">
      <section className="ct-box">
        <h3>🏆 مسابقة الأسبوع</h3>
        <p>{CN} أسئلة مشتركة لكل المتعلّمين من مناهج المستويات كلها، <b>محاولة واحدة</b> في الأسبوع، ولا تؤثّر على النقاط ولا يوجد خصم. تتجدد بعد {daysLeft()} {daysLeft() > 2 ? 'أيام' : 'يوم'}.</p>
        {!mine && !run && <button className="cta" onClick={() => setRun(true)}>ابدأ المسابقة</button>}
        {mine && <div className="ct-done" role="status"><b>{mine.s}/{mine.n}</b><span>نتيجتك هذا الأسبوع. نلتقي الأسبوع القادم بأسئلة جديدة.</span></div>}
        {run && <>
          <ol className="exq">{qs.map((q, i) => (
            <li key={i}><b>{q.q}</b>
              <div className="exo" role="radiogroup">{q.opts.map(o => <label key={o} className="exopt"><input type="radio" name={`ct${w}-${i}`} checked={ans[i] === o} onChange={() => setAns(a => ({ ...a, [i]: o }))} />{o}</label>)}</div>
            </li>))}</ol>
          <button className="cta" disabled={Object.keys(ans).length < CN} onClick={submit}>سلّم الإجابات</button>
        </>}
      </section>
      <h4 className="ct-h">ترتيب مسابقة هذا الأسبوع</h4>
      {people && !board.length && <p className="cm-empty">لا توجد نتائج بعد. كن أول من يشارك.</p>}
      <ol className="lb">{board.slice(0, 20).map((x, i) => (
        <li key={x.id} className={'lb-r' + (x.me || x.id === me ? ' me' : '') + (i < 3 ? ' top' : '')}>
          <span className="lb-n">{TOP(i)}</span><Av p={x} name={x.name} s={38} />
          <span className="lb-w"><b>{x.name || 'متعلّم'}{(x.me || x.id === me) && <em> (أنت)</em>}</b><small>{x.job || rankOf(x.pts)}</small></span>
          <span className="lb-p"><b>{x.cs}/{x.cn || CN}</b><small>صح</small></span>
        </li>))}</ol>
    </div>)
}

// صفحة المجتمع المستقلة: المتصدرون، المسابقات، المناقشات
export function CommunityPage({ base, pts, mods, lvls, current, onClose }: { base: { name: string; job: string }; pts: number; mods: number; lvls: number; current?: string; onClose: () => void }) {
  const [tab, setTab] = useState<'lb' | 'ct' | 'feed'>('lb')
  const { m, all, refresh } = usePeople()
  const dn = store.get('odoo20-dname') || base.name
  useEffect(() => { void store.pushPerson({ ...readProf(base), name: dn, pts, mods, lvls }).then(refresh) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const meId = Object.values(m).find(x => x.me)?.id || ''
  return (
    <div id="community" role="region" aria-label="المجتمع">
      <header className="ld-top">
        <button className="ld-btn ghost" onClick={onClose}>→ رجوع</button>
        <h1 className="cmp-t">المجتمع</h1>
        <span className="cmp-pts"><b>{fmtN(pts)}</b> نقطة</span>
      </header>
      <main className={'cmp-main' + (tab === 'feed' ? ' wide' : '')}>
        <nav className="cmp-tabs" role="tablist" aria-label="أقسام المجتمع">
          {([['lb', 'المتصدرون'], ['ct', 'المسابقات'], ['feed', 'المناقشات']] as const).map(([id, t]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{t}</button>)}
        </nav>
        <p className="cm-note">{store.cmtShared() ? 'مساحة مشتركة بين المتعلّمين لتبادل الأسئلة والملاحظات ومتابعة الترتيب.' : 'أنت تستخدم الموقع بدون قاعدة بيانات مشتركة، لذلك تظهر بياناتك هنا لك وحدك.'}</p>
        {tab === 'lb' && <Board people={all} me={meId} />}
        {tab === 'ct' && <Contest people={all} me={meId} onDone={() => { void store.pushPerson({ ...readProf(base), pts, mods, lvls }).then(refresh) }} />}
        {tab === 'feed' && <Feed name={dn} current={current} pm={m} />}
      </main>
    </div>)
}
