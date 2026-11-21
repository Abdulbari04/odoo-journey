import { useEffect, useState } from 'react'
import * as store from './store'
import { ProfileTab, readProf, Av } from './Community'

function Invite({ base, pts, mods, lvls }: { base: { name: string; job: string }; pts: number; mods: number; lvls: number }) {
  const code = store.myCode()
  const [people, setPeople] = useState<store.Person[]>([]); const [inp, setInp] = useState(''); const [used, setUsed] = useState(store.get('odoo20-inv') || '')
  const [msg, setMsg] = useState(''); const [cp, setCp] = useState(false)
  useEffect(() => { void store.listPeople().then(setPeople) }, [])
  const invited = people.filter(x => x.inv === code && !x.me)
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCp(true); setTimeout(() => setCp(false), 1500) } catch { setCp(false) } }
  const apply = async (e: React.FormEvent) => {
    e.preventDefault(); const c = inp.trim().toUpperCase(); if (!c) return
    if (c === code) return setMsg('ده كودك أنت. اطلب كود من صديق.')
    if (store.cmtShared() && !people.some(x => x.code === c)) return setMsg('الكود غير موجود. تأكد منه مع صاحبه.')
    store.set('odoo20-inv', c); setUsed(c); setMsg('تم تسجيل الكود ✓')
    await store.pushPerson({ ...readProf(base), pts, mods, lvls })
  }
  const inviter = people.find(x => x.code === used)
  return (
    <section className="st-sec">
      <h3>🎟️ كود الدعوة</h3>
      <p className="st-d">شارك كودك مع زملائك، ومن يسجّله في إعداداته يُحسب لك في قائمة «من دعوتهم».</p>
      <div className="st-code"><bdi dir="ltr">{code}</bdi><button type="button" onClick={copy}>{cp ? 'تم النسخ ✓' : 'نسخ'}</button></div>
      <p className="st-d">من دعوتهم: <b>{invited.length}</b>{invited.length > 0 && <span className="st-inv">{invited.map(x => <i key={x.id}><Av p={x} name={x.name} s={20} />{x.name}</i>)}</span>}</p>
      {used
        ? <p className="st-d">دعاك: <b>{inviter?.name || <bdi dir="ltr">{used}</bdi>}</b></p>
        : <form className="st-f" onSubmit={apply}><input value={inp} onChange={e => setInp(e.target.value)} maxLength={8} placeholder="عندك كود دعوة من صديق؟" aria-label="كود الدعوة" dir="ltr" /><button className="ld-btn">تسجيل</button></form>}
      {msg && <p className="st-m" role="status">{msg}</p>}
    </section>)
}

export function Settings({ base, pts, mods, lvls, theme, onTheme, onClose }: { base: { name: string; job: string }; pts: number; mods: number; lvls: number; theme: 'light' | 'dark'; onTheme: (t: 'light' | 'dark') => void; onClose: () => void }) {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', h); return () => removeEventListener('keydown', h) }, [onClose])
  return (
    <div className="st-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="st" role="dialog" aria-modal="true" aria-label="الإعدادات">
        <header><h2>⚙ الإعدادات</h2><button className="sb-x" onClick={onClose} aria-label="إغلاق">×</button></header>
        <section className="st-sec">
          <h3>🌗 وضع المتصفح</h3>
          <div className="st-seg" role="group" aria-label="وضع العرض">
            <button className={theme === 'light' ? 'on' : ''} aria-pressed={theme === 'light'} onClick={() => onTheme('light')}>☀ فاتح</button>
            <button className={theme === 'dark' ? 'on' : ''} aria-pressed={theme === 'dark'} onClick={() => onTheme('dark')}>☾ داكن</button>
          </div>
        </section>
        <section className="st-sec"><h3>👤 إعدادات البروفايل</h3><ProfileTab base={base} pts={pts} mods={mods} lvls={lvls} onSaved={() => {}} /></section>
        <Invite base={base} pts={pts} mods={mods} lvls={lvls} />
      </div>
    </div>)
}
