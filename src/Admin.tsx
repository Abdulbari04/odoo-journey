import { Fragment, useEffect, useMemo, useState } from 'react'
import * as store from './store'
import { hash } from './Auth'
import { N } from './Chapter'
import type { Stat } from './track'

type Row = store.Row
const rd = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } }
const localRows = (): Row[] => {
  const r: Row[] = []
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; if (k.startsWith('odoo20-stat-')) r.push({ id: k, data: JSON.parse(localStorage.getItem(k) || '{}') }) } } catch { /* ignore */ }
  return r
}
const ago = (t?: number) => {
  if (!t) return '—'
  const m = Math.round((Date.now() - t) / 60000)
  if (m < 1) return 'دلوقتي'; if (m < 60) return `من ${m} دقيقة`
  const h = Math.round(m / 60); if (h < 24) return `من ${h} ساعة`
  return `من ${Math.round(h / 24)} يوم`
}
const day = (t?: number) => (t ? new Date(t).toLocaleDateString('ar-EG') : '—')
const top = (xs: string[], n = 8) => { const c: Record<string, number> = {}; xs.forEach(x => { c[x] = (c[x] || 0) + 1 }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, n) }

export function Admin({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'boot' | 'denied' | 'sb' | 'local-setup' | 'local-in' | 'ok'>('boot')
  const [rows, setRows] = useState<Row[]>([])
  const [em, setEm] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [src, setSrc] = useState<'claude' | 'sb' | 'local'>('local')

  const route = async () => {
    const c = await store.adminClaude()
    if (Array.isArray(c)) { setRows(c); setSrc('claude'); setMode('ok'); return }
    if (c === 'denied') { setMode('denied'); return }
    if (store.hasSupabase) { setMode('sb'); return }
    setMode(rd('odoo20-admin', null) ? 'local-in' : 'local-setup')
  }
  useEffect(() => { void route() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (mode === 'sb') { setRows(await store.adminSb(em.trim(), pw)); setSrc('sb'); setMode('ok') }
      else if (mode === 'local-setup') {
        if (!em.includes('@')) return setErr('اكتب إيميل صحيح')
        if (pw.length < 6) return setErr('الباسورد 6 حروف على الأقل')
        const salt = crypto.randomUUID(); localStorage.setItem('odoo20-admin', JSON.stringify({ email: em.trim().toLowerCase(), salt, hash: await hash(pw, salt) }))
        setRows(localRows()); setSrc('local'); setMode('ok')
      } else {
        const a = rd<{ email: string; salt: string; hash: string } | null>('odoo20-admin', null)
        if (!a || a.email !== em.trim().toLowerCase() || a.hash !== await hash(pw, a.salt)) return setErr('الإيميل أو الباسورد غلط')
        setRows(localRows()); setSrc('local'); setMode('ok')
      }
    } catch (x) { setErr((x as Error).message === 'notadmin' ? 'الحساب ده مش أدمن' : 'الإيميل أو الباسورد غلط، أو القاعدة مش متاحة') } finally { setBusy(false) }
  }
  const refresh = async () => {
    if (src === 'claude') { const c = await store.adminClaude(); if (Array.isArray(c)) setRows(c) } else if (src === 'local') setRows(localRows())
    else { setBusy(true); try { setRows(await store.adminSb(em.trim(), pw)) } catch { /* ignore */ } setBusy(false) }
  }
  const out = async () => { if (src === 'sb') await store.adminSbOut(); onClose() }

  const users = useMemo(() => rows.map(r => ({ id: r.id, email: r.email, s: r.data as Partial<Stat> })).sort((a, b) => (b.s.last || 0) - (a.s.last || 0)), [rows])
  const agg = useMemo(() => {
    const now = Date.now(), D = 86400000
    const mods: Record<string, number> = {}; users.forEach(u => Object.entries(u.s.mods || {}).forEach(([k, v]) => { mods[k] = (mods[k] || 0) + v }))
    return {
      n: users.length, d1: users.filter(u => now - (u.s.last || 0) < D).length, d7: users.filter(u => now - (u.s.last || 0) < 7 * D).length,
      visits: users.reduce((a, u) => a + (u.s.visits || 0), 0), done: users.reduce((a, u) => a + (u.s.done || 0), 0),
      exams: users.reduce((a, u) => a + (u.s.exams || 0), 0), passes: users.reduce((a, u) => a + (u.s.passes || 0), 0),
      mods: Object.entries(mods).sort((a, b) => b[1] - a[1]).slice(0, 8), searches: top(users.flatMap(u => u.s.searches || [])),
      jobs: top(users.map(u => u.s.job || '—'), 6),
    }
  }, [users])

  if (mode === 'boot') return <div className="adm"><p className="auth-note">بنفتح لوحة الأدمن…</p></div>
  if (mode !== 'ok') return (
    <div className="auth"><form className="auth-card" onSubmit={submit} noValidate>
      <div className="auth-logo">🛡️</div><h1>لوحة الأدمن</h1>
      {mode === 'denied' ? <p className="auth-note">اللوحة دي لصاحب الصفحة والمحرّرين (Editor) بس. حسابك عادي.</p> : <>
        {mode === 'local-setup' && <p className="auth-note">أول مرة: اعمل إيميل وباسورد للأدمن. هيشوف مستخدمين الجهاز/المتصفح ده بس. لتجميع كل المستخدمين فعّل Supabase.</p>}
        <label>الإيميل<input type="email" value={em} onChange={e => setEm(e.target.value)} autoComplete="username" dir="ltr" /></label>
        <label>الباسورد<input type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" /></label>
        {err && <p className="auth-err" role="alert">{err}</p>}
        <button className="auth-go" disabled={busy}>{mode === 'local-setup' ? 'إنشاء حساب الأدمن' : 'دخول'}</button></>}
      <button type="button" className="adm-back" onClick={onClose}>رجوع للموقع</button>
    </form></div>)

  return (
    <div className="adm">
      <header className="adm-h"><h1>🛡️ لوحة الأدمن</h1>
        <span className="adm-src">{src === 'claude' ? 'قاعدة Claude' : src === 'sb' ? 'Supabase' : 'الجهاز ده فقط'}</span>
        <button onClick={refresh} disabled={busy}>تحديث</button><button onClick={out}>خروج</button></header>
      <div className="adm-k">
        {[['المستخدمين', agg.n], ['نشطين آخر 24 ساعة', agg.d1], ['نشطين آخر 7 أيام', agg.d7], ['مرات الدخول', agg.visits], ['موديولات مكتملة', agg.done], ['اختبارات (نجح/كلها)', `${agg.passes}/${agg.exams}`]].map(([l, v]) =>
          <div key={String(l)} className="adm-c"><b>{v}</b><span>{l}</span></div>)}
      </div>
      <div className="adm-2">
        <section><h2>أكتر موديولات اتفتحت</h2>{agg.mods.length ? <ol>{agg.mods.map(([k, v]) => <li key={k}>{N[k] || k} <i>{v}</i></li>)}</ol> : <p>لسه مفيش بيانات.</p>}</section>
        <section><h2>أكتر حاجات اتبحث عنها</h2>{agg.searches.length ? <ol>{agg.searches.map(([k, v]) => <li key={k}>{k} <i>{v}</i></li>)}</ol> : <p>لسه مفيش بحث.</p>}</section>
        <section><h2>شغل المستخدمين</h2>{agg.jobs.length ? <ol>{agg.jobs.map(([k, v]) => <li key={k}>{k} <i>{v}</i></li>)}</ol> : <p>—</p>}</section>
      </div>
      <h2>المستخدمين ({users.length})</h2>
      <p className="adm-note">الباسوردات مش بتظهر هنا: بتتخزن مشفّرة (مش نص) فمحدش يقدر يقراها، ودي حماية للمستخدمين.</p>
      <div className="adm-t"><table><thead><tr><th>الاسم</th><th>الشغل</th><th>الإيميل</th><th>سجّل</th><th>آخر دخول</th><th>دخل</th><th>موديولات</th><th>مستويات</th><th>اختبارات</th></tr></thead>
        <tbody>{users.length === 0 && <tr><td colSpan={9}>لسه محدش سجّل.</td></tr>}
          {users.map(u => <Fragment key={u.id}>
            <tr onClick={() => setOpen(open === u.id ? null : u.id)} className="adm-r" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setOpen(open === u.id ? null : u.id)}>
              <td><b>{u.s.name || '—'}</b></td><td>{u.s.job || '—'}</td><td dir="ltr">{u.email || '—'}</td><td>{day(u.s.joined)}</td><td>{ago(u.s.last)}</td><td>{u.s.visits || 0}</td><td>{u.s.done || 0}/23</td><td>{u.s.levels || 0}/7</td><td>{u.s.passes || 0}/{u.s.exams || 0}</td></tr>
            {open === u.id && <tr key={u.id + 'd'}><td colSpan={9} className="adm-d">
              <b>أكتر موديولات بيفتحها:</b> {Object.entries(u.s.mods || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${N[k] || k} (${v})`).join('، ') || '—'}<br />
              <b>آخر بحث:</b> {(u.s.searches || []).slice(0, 10).join('، ') || '—'}</td></tr>}
          </Fragment>)}</tbody></table></div>
      <button className="adm-back" onClick={onClose}>رجوع للموقع</button>
    </div>)
}
