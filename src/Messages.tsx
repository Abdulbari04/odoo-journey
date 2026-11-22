import { useCallback, useEffect, useMemo, useState } from 'react'
import * as store from './store'
import { Av, mkey } from './Community'
import { N } from './Chapter'

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000)
  if (m < 1) return 'الآن'; if (m < 60) return `منذ ${m} د`
  const h = Math.round(m / 60); if (h < 24) return `منذ ${h} س`
  return `منذ ${Math.round(h / 24)} يوم`
}
const rdSeen = (): Record<string, number> => { try { return JSON.parse(store.get('odoo20-msg-seen') || '{}') } catch { return {} } }

export type Notif = { id: string; kind: 'msg' | 'reply' | 'mention'; t: number; who: string; text: string; peer?: { id: string; name: string }; mod?: string; unread: boolean }

// بيجيب الرسائل والتعليقات كل شوية ويطلّع منهم الإشعارات وعدّادات غير المقروء
export function useInbox(myName: string) {
  const [msgs, setMsgs] = useState<store.Msg[]>([]); const [cmts, setCmts] = useState<store.Cmt[]>([])
  const [seen, setSeen] = useState(rdSeen); const [nseen, setNseen] = useState(() => Number(store.get('odoo20-notif-seen') || 0))
  const refresh = useCallback(async () => { const [m, c] = await Promise.all([store.msgList(), store.cmtList()]); setMsgs(m); setCmts(c) }, [])
  useEffect(() => {
    void refresh(); const i = setInterval(() => void refresh(), 45000)
    const f = () => void refresh(); addEventListener('focus', f); addEventListener('odoo20-inbox', f)
    return () => { clearInterval(i); removeEventListener('focus', f); removeEventListener('odoo20-inbox', f) }
  }, [refresh])
  const notifs = useMemo<Notif[]>(() => {
    const out: Notif[] = []
    const by = new Map(cmts.map(c => [c.id, c])); const tag = '@' + mkey(myName)
    for (const c of cmts) {
      if (c.mine) continue
      const par = c.rep ? by.get(c.rep) : undefined
      if (par?.mine) out.push({ id: 'r' + c.id, kind: 'reply', t: c.t, who: c.name, text: c.text, mod: c.k, unread: c.t > nseen })
      else if (myName && c.text.includes(tag)) out.push({ id: 'm' + c.id, kind: 'mention', t: c.t, who: c.name, text: c.text, mod: c.k, unread: c.t > nseen })
    }
    for (const x of msgs) if (!x.mine) out.push({ id: 'x' + x.id, kind: 'msg', t: x.t, who: x.fn || 'مستخدم', text: x.text, peer: { id: x.from, name: x.fn }, unread: x.t > (seen[x.from] || 0) })
    return out.sort((a, b) => b.t - a.t).slice(0, 40)
  }, [cmts, msgs, myName, nseen, seen])
  const unreadMsgs = msgs.filter(x => !x.mine && x.t > (seen[x.from] || 0)).length
  const unread = notifs.filter(n => n.unread).length
  const markPeer = (id: string) => { const s = { ...rdSeen(), [id]: Date.now() }; store.set('odoo20-msg-seen', JSON.stringify(s)); setSeen(s) }
  const markAll = () => {
    const now = Date.now(); store.set('odoo20-notif-seen', String(now)); setNseen(now)
    const s = rdSeen(); msgs.forEach(x => { if (!x.mine) s[x.from] = now }); store.set('odoo20-msg-seen', JSON.stringify(s)); setSeen({ ...s })
  }
  return { msgs, notifs, unread, unreadMsgs, markPeer, markAll, refresh }
}

export function NotifPanel({ notifs, unread, onClose, onMarkAll, onOpen }: { notifs: Notif[]; unread: number; onClose: () => void; onMarkAll: () => void; onOpen: (n: Notif) => void }) {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', h); return () => removeEventListener('keydown', h) }, [onClose])
  const lab = (n: Notif) => n.kind === 'msg' ? 'أرسل لك رسالة' : n.kind === 'reply' ? 'رد على تعليقك' : 'ذكرك في تعليق'
  return (
    <div className="nt-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="nt" role="dialog" aria-label="الإشعارات">
        <header><h2>🔔 الإشعارات{unread > 0 && <i>{unread}</i>}</h2>{unread > 0 && <button onClick={onMarkAll}>تعليم الكل كمقروء</button>}<button className="nt-x" onClick={onClose} aria-label="إغلاق">×</button></header>
        {!notifs.length && <p className="nt-e">لا توجد إشعارات بعد. هتظهر هنا الرسائل والردود على تعليقاتك والمنشن.</p>}
        <ul>{notifs.map(n => (
          <li key={n.id}><button className={n.unread ? 'un' : ''} onClick={() => onOpen(n)}>
            <span className="nt-i">{n.kind === 'msg' ? '✉️' : n.kind === 'reply' ? '↩' : '@'}</span>
            <span className="nt-b"><b>{n.who}</b> {lab(n)}{n.mod && <small> · {n.mod === 'general' ? 'عام' : N[n.mod] || n.mod}</small>}<em>{n.text.slice(0, 90)}</em></span>
            <time>{ago(n.t)}</time>
          </button></li>))}</ul>
      </div>
    </div>)
}

type Peer = { id: string; name: string }
export function Messages({ myName, msgs, peer0, onClose, markPeer, refresh }: { myName: string; msgs: store.Msg[]; peer0?: Peer; onClose: () => void; markPeer: (id: string) => void; refresh: () => Promise<void> }) {
  const [peer, setPeer] = useState<Peer | null>(peer0 || null); const [people, setPeople] = useState<store.Person[]>([]); const [q, setQ] = useState('')
  const [t, setT] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  const can = store.msgCapable()
  useEffect(() => { void store.listPeople().then(setPeople) }, [])
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', h); return () => removeEventListener('keydown', h) }, [onClose])
  const convs = useMemo(() => {
    const m = new Map<string, { id: string; name: string; last: store.Msg; n: number }>()
    for (const x of msgs) { const id = x.mine ? x.to : x.from; const name = x.mine ? x.tn : x.fn; const c = m.get(id); m.set(id, { id, name: name || c?.name || 'مستخدم', last: x, n: 0 }) }
    return [...m.values()].sort((a, b) => b.last.t - a.last.t)
  }, [msgs])
  const thread = peer ? msgs.filter(x => (x.mine ? x.to : x.from) === peer.id) : []
  useEffect(() => { if (peer && thread.some(x => !x.mine)) markPeer(peer.id) }, [peer, thread.length]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { document.querySelector('.ms-th')?.scrollTo({ top: 1e6 }) }, [thread.length, peer])
  const unreadOf = (id: string) => { const s = rdSeen()[id] || 0; return msgs.filter(x => !x.mine && x.from === id && x.t > s).length }
  const pm = Object.fromEntries(people.map(p => [p.id, p]))
  const cand = people.filter(p => !p.me && p.name && (!q || p.name.toLowerCase().includes(q.toLowerCase()))).slice(0, 30)
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); if (!peer || !t.trim()) return; setBusy(true); setErr('')
    try { await store.msgSend(peer.id, peer.name, myName, t); setT(''); await refresh() } catch { setErr('تعذّر الإرسال. تأكد من الاتصال أو الصلاحيات.') } finally { setBusy(false) }
  }
  return (
    <div className="ms-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={'ms' + (peer ? ' open' : '')} role="dialog" aria-modal="true" aria-label="الرسائل">
        <aside className="ms-l">
          <header><h2>✉️ الرسائل</h2><button className="sb-x" onClick={onClose} aria-label="إغلاق">×</button></header>
          {!can && <p className="ms-note">الرسائل المباشرة بتشتغل لما الموقع يكون متصل بقاعدة مشتركة (Supabase أو صفحة Claude).</p>}
          <input className="ms-s" value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث عن عضو لتراسله…" aria-label="بحث عن عضو" />
          {q && <ul className="ms-c">{cand.map(p => <li key={p.id}><button onClick={() => { setPeer({ id: p.id, name: p.name }); setQ('') }}><Av p={p} name={p.name} s={34} /><span className="ms-n"><b>{p.name}</b><small>{p.job || 'عضو'}</small></span></button></li>)}{!cand.length && <li className="ms-e">لا يوجد عضو بهذا الاسم.</li>}</ul>}
          {!q && <ul className="ms-c">{convs.map(c => (
            <li key={c.id}><button className={peer?.id === c.id ? 'on' : ''} onClick={() => setPeer({ id: c.id, name: c.name })}>
              <Av p={pm[c.id]} name={c.name} s={34} /><span className="ms-n"><b>{c.name}</b><small>{(c.last.mine ? 'أنت: ' : '') + c.last.text.slice(0, 40)}</small></span>
              {unreadOf(c.id) > 0 && <i className="bdg">{unreadOf(c.id)}</i>}</button></li>))}
            {!convs.length && <li className="ms-e">لا توجد محادثات بعد. ابحث عن عضو لتبدأ.</li>}</ul>}
        </aside>
        <section className="ms-r">
          {!peer ? <p className="ms-e ms-ph">اختر محادثة أو ابحث عن عضو لتبدأ رسالة جديدة.</p> : <>
            <header><button className="ms-back" onClick={() => setPeer(null)} aria-label="رجوع">→</button><Av p={pm[peer.id]} name={peer.name} s={34} /><b>{peer.name}</b></header>
            <div className="ms-th">{!thread.length && <p className="ms-e">ابدأ المحادثة مع {peer.name}.</p>}
              {thread.map(x => <div key={x.id} className={'ms-b' + (x.mine ? ' me' : '')}><p>{x.text}</p><time>{ago(x.t)}</time></div>)}</div>
            <form className="ms-f" onSubmit={send}>
              <textarea value={t} onChange={e => setT(e.target.value)} maxLength={1000} rows={2} placeholder={can ? 'اكتب رسالتك…' : 'الرسائل غير متاحة هنا'} disabled={!can} aria-label="رسالتك" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }} />
              <button disabled={busy || !t.trim() || !can}>{busy ? '…' : 'إرسال'}</button>
            </form>
            {err && <p className="ms-err" role="alert">{err}</p>}
            {store.getBackend() === 'claude' && <p className="ms-priv">ملحوظة: على صفحة Claude الرسائل غير مشفّرة تقنيًا. للخصوصية الكاملة استخدم Supabase.</p>}
          </>}
        </section>
      </div>
    </div>)
}
