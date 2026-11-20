import { useCallback, useEffect, useState } from 'react'
import * as store from './store'
import { N, ORDER } from './Chapter'
import { LEVELS } from './levels'

const ago = (t: number) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000))
  if (m < 1) return 'الآن'
  if (m < 60) return `منذ ${m} د`
  const h = Math.round(m / 60); if (h < 24) return `منذ ${h} س`
  const d = Math.round(h / 24); return d < 30 ? `منذ ${d} يوم` : new Date(t).toLocaleDateString('ar-EG')
}
const label = (k: string) => (k === 'general' ? 'عام' : N[k] || k)

export const ptsOf = (mods: number, lvls: number) => mods * 10 + lvls * 50
export const rankOf = (p: number) => (p >= 450 ? 'مستشار' : p >= 300 ? 'محلّل' : p >= 150 ? 'ممارس' : p >= 50 ? 'متعلّم' : 'مبتدئ')

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

function Composer({ k, name, onDone, picker }: { k: string; name: string; onDone: () => void; picker?: boolean }) {
  const [t, setT] = useState(''); const [m, setM] = useState(k); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); const x = t.trim(); if (!x) return
    setBusy(true); setErr('')
    try { await store.cmtAdd(m, name, x); setT(''); onDone() } catch { setErr('تعذّر إرسال التعليق، تأكد من صلاحية الكتابة أو الاتصال.') } finally { setBusy(false) }
  }
  return (
    <form className="cm-form" onSubmit={send}>
      {picker && <select aria-label="الموديول" value={m} onChange={e => setM(e.target.value)}><option value="general">عام</option>{ORDER.map(o => <option key={o} value={o}>{N[o]}</option>)}</select>}
      <textarea value={t} onChange={e => setT(e.target.value)} maxLength={400} rows={2} placeholder="اكتب تعليقك…" aria-label="تعليقك" />
      <div className="cm-row"><span className="cm-err">{err}</span><button disabled={busy || !t.trim()}>{busy ? '…' : 'إرسال'}</button></div>
    </form>)
}

function Item({ c, tag, onDel, pm }: { c: store.Cmt; tag?: boolean; onDel: () => void; pm: Record<string, store.Person> }) {
  return (
    <li className="cm-it">
      <div className="cm-h"><Av p={pm[c.uid]} name={c.name} s={22} /><b>{c.name}</b>{tag && <span className="cm-tag">{label(c.k)}</span>}<time>{ago(c.t)}</time>{c.mine && <button className="cm-x" onClick={onDel} aria-label="حذف تعليقي" title="حذف">×</button>}</div>
      <p>{c.text}</p>
    </li>)
}

// تعليقات تحت كل موديول: تعليق واحد ظاهر + «إظهار المزيد»
export function ModuleComments({ k, name }: { k: string; name: string }) {
  const { all, refresh } = useCmts(); const { m: pm } = usePeople(); const [more, setMore] = useState(false)
  const list = (all || []).filter(c => c.k === k)
  const shown = more ? list : list.slice(0, 1)
  return (
    <section className="cm" aria-label="تعليقات الموديول">
      <h4>تعليقات المجتمع{list.length ? ` (${list.length})` : ''}</h4>
      <Composer k={k} name={name} onDone={refresh} />
      {all && !list.length && <p className="cm-empty">لا توجد تعليقات بعد. كن أول من يعلّق.</p>}
      <ul>{shown.map(c => <Item key={c.id} c={c} pm={pm} onDel={async () => { await store.cmtDel(c.id); refresh() }} />)}</ul>
      {list.length > 1 && <button className="cm-more" onClick={() => setMore(m => !m)}>{more ? 'إخفاء' : `إظهار المزيد (${list.length - 1})`}</button>}
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

function ProfileTab({ base, pts, mods, lvls, onSaved }: { base: { name: string; job: string }; pts: number; mods: number; lvls: number; onSaved: () => void }) {
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
      <div className="pf-stats"><span><b>{pts}</b> نقطة</span><span><b>{mods}</b> موديول</span><span><b>{lvls}</b> مستوى</span><span>{rankOf(pts)}</span></div>
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
  return (
    <div>
      <div className="lb-rules"><b>النقاط:</b> 10 لكل موديول تُكمله، و50 لكل مستوى تجتاز اختباره (أقصى مجموع {ptsOf(23, LEVELS.length)}).</div>
      {people && !list.length && <p className="cm-empty">لا يوجد متصدّرون بعد. أكمل موديولًا واحفظ ملفك لتظهر هنا.</p>}
      <ol className="lb">
        {list.slice(0, n).map((x, i) => (
          <li key={x.id} className={'lb-r' + (x.me || x.id === me ? ' me' : '') + (i < 3 ? ' top' : '')}>
            <span className="lb-n">{TOP(i)}</span>
            <Av p={x} name={x.name} s={38} />
            <span className="lb-w"><b>{x.name || 'متعلّم'}{(x.me || x.id === me) && <em> (أنت)</em>}</b><small>{x.job || rankOf(x.pts)} · {x.mods} موديول · {x.lvls} مستوى</small></span>
            <span className="lb-p"><b>{x.pts}</b><small>نقطة</small></span>
          </li>))}
      </ol>
      {list.length > n && <button className="cm-more" onClick={() => setN(v => v + 10)}>إظهار المزيد ({list.length - n})</button>}
    </div>)
}

function Feed({ name, current, pm }: { name: string; current?: string; pm: Record<string, store.Person> }) {
  const { all, refresh } = useCmts(); const [f, setF] = useState('all'); const [n, setN] = useState(5)
  const list = (all || []).filter(c => f === 'all' || c.k === f)
  return (
    <div className="cm-feed">
      <Composer k={current && ORDER.includes(current) ? current : 'general'} name={name} onDone={refresh} picker />
      <select className="cm-f" aria-label="تصفية" value={f} onChange={e => { setF(e.target.value); setN(5) }}><option value="all">كل التعليقات</option><option value="general">عام</option>{ORDER.map(o => <option key={o} value={o}>{N[o]}</option>)}</select>
      {all && !list.length && <p className="cm-empty">لا توجد تعليقات.</p>}
      <ul>{list.slice(0, n).map(c => <Item key={c.id} c={c} tag pm={pm} onDel={async () => { await store.cmtDel(c.id); refresh() }} />)}</ul>
      {list.length > n && <button className="cm-more" onClick={() => setN(x => x + 10)}>إظهار المزيد ({list.length - n})</button>}
    </div>)
}

// صفحة المجتمع المستقلة: المتصدرون، التعليقات، ملفي
export function CommunityPage({ base, mods, lvls, current, onClose }: { base: { name: string; job: string }; mods: number; lvls: number; current?: string; onClose: () => void }) {
  const [tab, setTab] = useState<'lb' | 'feed' | 'me'>('lb')
  const { m, all, refresh } = usePeople()
  const pts = ptsOf(mods, lvls); const dn = store.get('odoo20-dname') || base.name
  useEffect(() => { void store.pushPerson({ ...readProf(base), name: dn, pts, mods, lvls }).then(refresh) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const meId = Object.values(m).find(x => x.me)?.id || ''
  return (
    <div id="community" role="region" aria-label="المجتمع">
      <header className="ld-top">
        <button className="ld-btn ghost" onClick={onClose}>→ رجوع</button>
        <h1 className="cmp-t">المجتمع</h1>
        <span className="cmp-pts"><b>{pts}</b> نقطة</span>
      </header>
      <main className="cmp-main">
        <nav className="cmp-tabs" role="tablist" aria-label="أقسام المجتمع">
          {([['lb', 'المتصدرون'], ['feed', 'التعليقات'], ['me', 'ملفي']] as const).map(([id, t]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{t}</button>)}
        </nav>
        <p className="cm-note">{store.cmtShared() ? 'مساحة مشتركة بين المتعلّمين لتبادل الأسئلة والملاحظات ومتابعة الترتيب.' : 'أنت تستخدم الموقع بدون قاعدة بيانات مشتركة، لذلك تظهر بياناتك هنا لك وحدك.'}</p>
        {tab === 'lb' && <Board people={all} me={meId} />}
        {tab === 'feed' && <Feed name={dn} current={current} pm={m} />}
        {tab === 'me' && <ProfileTab base={base} pts={pts} mods={mods} lvls={lvls} onSaved={refresh} />}
      </main>
    </div>)
}
