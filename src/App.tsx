import { useEffect, useMemo, useState } from 'react'
import raw from './data.json'
import type { Data } from './types'
import { Bg } from './Bg'
import { Sidebar } from './Sidebar'
import { About, VERSION } from './About'
import { Auth, Welcome2, session, logout, type User } from './Auth'
import { TipToast } from './Tips'
import { LEVELS, levelIdx } from './levels'
import { Search } from './Search'
import * as track from './track'
import { Admin } from './Admin'
import { Home } from './Home'
import { CommunityPage, readProf, ModuleComments } from './Community'
import { Settings } from './Settings'
import { useInbox, NotifPanel, Messages } from './Messages'
import { calcPts, readPen, fmtN } from './points'
import { Landing } from './Landing'
import { SkipExam, LevelExam, LockedCard, unlocked, type Passed } from './Levels'
import * as store from './store'
import { CloudSignup, SbAuth } from './Auth'
import { ChapterView, GuideChapter, ORDER, N, type Sub } from './Chapter'

const data = raw as unknown as Data
type Step = { t: 'ch'; k: string; li: number } | { t: 'exam'; li: number }
const STEPS: Step[] = LEVELS.flatMap((l, li): Step[] => [...l.ch.map(k => ({ t: 'ch' as const, k, li })), { t: 'exam' as const, li }])
const stepOf = (k: string) => STEPS.findIndex(x => x.t === 'ch' && x.k === k)
const load = store.get
const save = store.set

function useDesktop() {
  const q = '(min-width: 901px)'
  const [d, setD] = useState(() => matchMedia(q).matches)
  useEffect(() => { const m = matchMedia(q), f = () => setD(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  return d
}

function Main({ user, fresh, onOut }: { user: User; fresh: boolean; onOut: () => void }) {
  const [hello, setHello] = useState(fresh)
  const [syncErr, setSyncErr] = useState('')
  useEffect(() => store.onSyncError(setSyncErr), [])
  const desktop = useDesktop()
  const [page, setPage] = useState(() => { const v = Number(store.get('odoo20-page')); return Number.isInteger(v) && v >= 0 && v < STEPS.length ? v : 0 })
  const [sub, setSub] = useState<Sub>(null)
  const [sideEl, setSideEl] = useState<HTMLElement | null>(null)
  const [wide, setWide] = useState(() => matchMedia('(min-width:1400px)').matches)
  useEffect(() => { const m = matchMedia('(min-width:1400px)'), f = () => setWide(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  const step = STEPS[page]
  const active = step.t === 'ch' ? step.k : LEVELS[step.li].ch[LEVELS[step.li].ch.length - 1]
  const [done, setDone] = useState<Record<string, boolean>>(() => { try { return JSON.parse(load('odoo20-done') || '{}') } catch { return {} } })
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'))
  useEffect(() => { document.documentElement.dataset.theme = theme; save('odoo20-theme', theme); try { localStorage.setItem('odoo20-theme', theme) } catch { /* ignore */ } }, [theme])
  const [view, setView] = useState<'intro' | 'course'>(() => (load('odoo20-view') === 'course' && load('odoo20-started') === '1' ? 'course' : 'intro'))
  useEffect(() => { save('odoo20-view', view) }, [view])
  const [passed, setPassed] = useState<Passed>(() => { try { return JSON.parse(load('odoo20-levels') || '{}') } catch { return {} } })
  const [started, setStarted] = useState(() => load('odoo20-started') === '1')
  const lockedK = (k: string) => !unlocked(levelIdx(k), passed)
  const [about, setAbout] = useState(false)
  const [bm, setBm] = useState(false)
  useEffect(() => { if (!bm) return; const f = (e: Event) => { if (!(e.target as Element).closest?.('.bar-act, .bar-more')) setBm(false) }; addEventListener('pointerdown', f); return () => removeEventListener('pointerdown', f) }, [bm])
  useEffect(() => {
    let last = 0, lastEl: EventTarget | null = null
    const f = (e: Event) => {
      const t = e.target as Element | Document, y = t instanceof Document ? (document.scrollingElement?.scrollTop ?? 0) : (t as Element).scrollTop ?? 0
      if (t !== lastEl) { lastEl = t; last = y; return }
      const d = y - last
      if (Math.abs(d) < 8) return
      document.documentElement.classList.toggle('nav-hide', d > 0 && y > 70)
      last = y
    }
    addEventListener('scroll', f, { capture: true, passive: true }); return () => removeEventListener('scroll', f, true)
  }, [])
  const [penV, setPenV] = useState(0)
  useEffect(() => { const h = () => setPenV(v => v + 1); addEventListener('odoo20-pen', h); return () => removeEventListener('odoo20-pen', h) }, [])
  const modsN = ORDER.filter(k => done[k]).length, lvlsN = Object.values(passed).filter(Boolean).length
  const pts = useMemo(() => calcPts(modsN, passed, readPen()), [modsN, passed, penV]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => { const p = readProf(user); void store.pushPerson({ ...p, pts, mods: modsN, lvls: lvlsN }) }, 1200)
    return () => clearTimeout(t)
  }, [pts, modsN, lvlsN, user])
  const [srch, setSrch] = useState(false)
  const [sett, setSett] = useState(false)
  const dn = store.get('odoo20-dname') || user.name
  const inbox = useInbox(dn)
  const [bell, setBell] = useState(false); const [msgO, setMsgO] = useState<{ id: string; name: string } | 'list' | null>(null)
  useEffect(() => { const h = (e: Event) => setMsgO((e as CustomEvent).detail); addEventListener('odoo20-dm', h); return () => removeEventListener('odoo20-dm', h) }, [])
  const [comm, setCommS] = useState(() => location.hash === '#community')
  const setComm = (v: boolean) => { setCommS(v); if (v) location.hash = 'community'; else if (location.hash === '#community') history.replaceState(null, '', location.pathname + location.search) }
  useEffect(() => { const h = () => setCommS(location.hash === '#community'); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h) }, [])
  useEffect(() => { track.start(user); return () => track.stop() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { track.progress(ORDER.filter(k => done[k]).length, Object.values(passed).filter(Boolean).length) }, [done, passed])
  useEffect(() => { if (view === 'course' && active) track.module_(active) }, [active, view])
  const [menu, setMenu] = useState(false)
  useEffect(() => { save('odoo20-page', String(page)) }, [page])
  useEffect(() => { if (view === 'course') scrollTo({ top: 0 }) }, [page, view])
  const go = (k: string) => { setSub(null); setPage(stepOf(k)); setView('course'); setMenu(false) }
  const goLevel = (i: number) => { setSub(null); setPage(stepOf(LEVELS[i].ch[0])); setView('course') }
  const goExam = (li: number) => { setSub(null); setPage(STEPS.findIndex(x => x.t === 'exam' && x.li === li)); setView('course') }
  const startJourney = () => { setView('course'); setStarted(true); save('odoo20-started', '1'); if (!started) setPage(0) }
  const finish = (k: string) => { setDone(d => { const n = { ...d, [k]: true }; save('odoo20-done', JSON.stringify(n)); return n }); setSub(null); setPage(p => Math.min(p + 1, STEPS.length - 1)) }
  const passAll = (ids: number[]) => setPassed(p => { const n = { ...p }; ids.forEach(i => { n[i] = true }); save('odoo20-levels', JSON.stringify(n)); return n })
  const passLevel = (id: number) => setPassed(p => { const n = { ...p, [id]: true }; save('odoo20-levels', JSON.stringify(n)); return n })
  const goSub = (k: string, id: string) => { setPage(stepOf(k)); setView('course'); setMenu(false); setSub({ k, id, n: Date.now() }) }
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenu(false); setAbout(false); setSrch(false) } }; addEventListener('keydown', h); return () => removeEventListener('keydown', h) }, [])
  useEffect(() => {
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches
    const tio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); tio.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px' })
    if (!rm) document.querySelectorAll('.ch .term,.ch .steps li,.ch .ent,.ch .ex,.ch .ana,.ch .lk,.ch .qz details,.ch .bridge').forEach(x => { x.classList.add('tilt'); tio.observe(x) })
    return () => tio.disconnect()
  }, [view, passed, page])
  const toggleDone = (k: string) => lockedK(k) || setDone(d => { const n = { ...d, [k]: !d[k] }; save('odoo20-done', JSON.stringify(n)); return n })

  const course = view === 'course'
  const docked = desktop && course
  useEffect(() => { document.body.classList.toggle('docked', docked); return () => document.body.classList.remove('docked') }, [docked])
  const outFn = () => { if (store.getBackend() === 'claude') { setView('intro'); setMenu(false) } else onOut() }
  const tip = <TipToast k={course && step.t === 'ch' ? active : null} name={k => N[k]} />

  return (<>
    <Bg />
    {course && <Sidebar avatar={store.get('odoo20-avatar') || ''} dname={store.get('odoo20-dname') || user.name} pts={pts} onSettings={() => { setMenu(false); setSett(true) }} docked={docked} cloud={store.getBackend() === 'claude'} user={user} onOut={outFn} onAbout={() => setAbout(true)} open={menu} onClose={() => setMenu(false)} active={active} done={done} passed={passed} onToggleDone={toggleDone} go={go} goSub={goSub} data={data} onIntro={() => { setView('intro'); setMenu(false) }} />}
    {hello && <Welcome2 user={user} onClose={() => setHello(false)} />}
    {syncErr && <div className="syncerr" role="alert">⚠ مش قادر يحفظ على قاعدة البيانات دلوقتي، تقدّمك الأخير ممكن ما يتحفظش. <button onClick={() => setSyncErr('')}>×</button></div>}
    {tip}
    <Search open={srch} onClose={() => setSrch(false)} data={data} passed={passed} onPassAll={passAll} go={go} goSub={goSub} />
    {sett && <Settings base={user} pts={pts} mods={modsN} lvls={lvlsN} theme={theme} onTheme={setTheme} onClose={() => setSett(false)} />}
    {bell && <NotifPanel notifs={inbox.notifs} unread={inbox.unread} onClose={() => setBell(false)} onMarkAll={inbox.markAll} onOpen={n => { setBell(false); if (n.kind === 'msg' && n.peer) setMsgO(n.peer); else if (n.mod && ORDER.includes(n.mod)) go(n.mod); else setComm(true) }} />}
    {msgO && <Messages myName={dn} msgs={inbox.msgs} peer0={msgO === 'list' ? undefined : msgO} onClose={() => setMsgO(null)} markPeer={inbox.markPeer} refresh={inbox.refresh} />}
    {about && <About onClose={() => setAbout(false)} />}
    {comm && <CommunityPage base={user} pts={pts} mods={modsN} lvls={lvlsN} current={course && step.t === 'ch' ? step.k : undefined} onClose={() => setComm(false)} />}
    <div className="bar">
      {course && <button className="menub" onClick={() => setMenu(m => !m)} aria-expanded={menu} aria-label="قايمة الفصول" title="قايمة الفصول">☰</button>}
      <button className="brand brandb" onClick={() => { setComm(false); setMenu(false); setView('intro'); scrollTo({ top: 0 }) }} title="صفحة البداية">خريطة أودو 20</button>
      <span className="prog" aria-live="polite">{ORDER.filter(k => done[k]).length}/{ORDER.length}</span>
      <button className="bar-more" onClick={() => setBm(v => !v)} aria-expanded={bm} aria-label="القائمة" title="القائمة">{bm ? '✕' : '⋯'}</button>
      <div className={'bar-act' + (bm ? ' open' : '')} onClick={() => setBm(false)}>
      <button className="modeb nbtn" onClick={() => setMsgO('list')} aria-label="الرسائل" title="الرسائل">✉{inbox.unreadMsgs > 0 && <i className="bdg">{inbox.unreadMsgs}</i>}</button>
      <button className="modeb nbtn" onClick={() => setBell(true)} aria-label="الإشعارات" title="الإشعارات">🔔{inbox.unread > 0 && <i className="bdg">{inbox.unread}</i>}</button>
      <button className="modeb commb" onClick={() => setComm(true)} aria-label="المجتمع" title="المجتمع">👥 <span>المجتمع</span></button>
      <button className="modeb srchb" onClick={() => setSrch(true)} aria-label="بحث" title="بحث">🔍</button>
      <button className="modeb" onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))} aria-label={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'} title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}>{theme === 'dark' ? '☀' : '☾'}</button>
      </div>
    </div>
    {!course && <Home name={user.name} passed={passed} done={done} started={started} onStart={startJourney} onModule={go} onSearch={() => setSrch(true)} onComm={() => setComm(true)} onSettings={() => setSett(true)} onMsg={() => setMsgO('list')} onBell={() => setBell(true)} nMsg={inbox.unreadMsgs} nBell={inbox.unread} pts={pts} onTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))} theme={theme} onOut={outFn} onAbout={() => setAbout(true)} />}
    {course && <div className="layout focus">
      <main className="chaps">
        {(() => {
          const li = step.li, lv = LEVELS[li], open = unlocked(li, passed)
          if (step.t === 'ch') {
            const k = step.k
            if (!open) return <><LockedCard k={k} lv={lv} /><SkipExam li={li} passed={passed} onPassAll={passAll} /></>
            const i = ORDER.indexOf(k)
            return !data.CORE[k]
              ? <GuideChapter side={wide ? sideEl : undefined} who={user.name} key={k} k={k} i={i} done={!!done[k]} onFinish={() => finish(k)} onToggle={() => toggleDone(k)} go={go} sub={sub} />
              : <ChapterView side={wide ? sideEl : undefined} who={user.name} key={k} k={k} i={i} data={data} done={!!done[k]} onFinish={() => finish(k)} onToggle={() => toggleDone(k)} go={go} sub={sub} />
          }
          if (!open) return <><section className="ch locked"><div className="lock-i" aria-hidden="true">🔒</div><h2>اختبار المستوى {lv.id}</h2><p>المستوى ده مقفول. اختبر نفسك في اللي قبله الأول وهيتفتح لك.</p></section><SkipExam li={li} passed={passed} onPassAll={passAll} /></>
          return <LevelExam lv={lv} passed={!!passed[lv.id]} onPass={() => passLevel(lv.id)} onNext={LEVELS[li + 1] ? () => goLevel(li + 1) : null} onBack={() => go(lv.ch[lv.ch.length - 1])} />
        })()}
      </main>
      {step.t === 'ch' && unlocked(step.li, passed) && <aside className="cm-side" ref={setSideEl} />}
    </div>}
    <footer>
      <p>تفاصيل Odoo 20 مأخوذة من صفحات iVentureTeam لملاحظات الإصدار (كل صفحة بتقول إنها ملخّص لملاحظات أودو الرسمية، وأنا ما قدرتش أفتح صفحة أودو الرسمية للمقارنة). الفروق العامة من Versich. شرح المفاهيم والمسارات والأمثلة الرقمية تعليمي عام، وأسماء القوائم ممكن تختلف شوية في نسختك. القيود المحاسبية أمثلة مبسطة.</p>
      <p>مصادر عامة: {[['فهرس iVentureTeam', 'https://iventureteam.com/odoo-20-release-notes/'], ['وثائق Odoo (19.0)', 'https://www.odoo.com/documentation/19.0/applications/'], ['Webkul', 'https://webkul.com/blog/odoo-20-whats-new-key-features-and-comparison/'], ['Versich', 'https://versich.com/blog/odoo-19-to-20-upgrade-key-changes-and-testing-checklist/']].map(([t, u], i) => <span key={u}>{i ? ' · ' : ''}<a href={u} target="_blank" rel="noopener noreferrer" className="lnk">{t}</a></span>)}</p>
          <p className="credit"><button className="ab-link" onClick={() => setAbout(true)}>ℹ️ عن الموقع</button> · تم الصنع بواسطة <b>Muhammed Abdul Bari</b> · النسخة <bdi dir="ltr">v{VERSION}</bdi> · <a href="#admin">لوحة الأدمن</a></p>
    </footer>
  </>)
}

export default function App() {
  const [u, setU] = useState<User | null>(null)
  const [fresh, setFresh] = useState(false)
  const [adm, setAdm] = useState(() => location.hash === '#admin')
  useEffect(() => { const h = () => setAdm(location.hash === '#admin'); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h) }, [])
  const [phase, setPhase] = useState<'boot' | 'signup' | 'sbauth' | 'local' | 'in'>('boot')
  const [land, setLand] = useState(true)
  const [authMode, setAuthMode] = useState<'in' | 'up'>('in')
  const [theme0, setTheme0] = useState<'light' | 'dark'>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'))
  useEffect(() => { document.documentElement.dataset.theme = theme0; save('odoo20-theme', theme0); try { localStorage.setItem('odoo20-theme', theme0) } catch { /* ignore */ } }, [theme0])
  const toggleTheme = () => setTheme0(t => (t === 'dark' ? 'light' : 'dark'))
  useEffect(() => {
    let off = false
    ;(async () => {
      const r = await store.initCloud()
      if (off) return
      if (r) { if (r.profile) { setU(r.profile); setPhase('in') } else setPhase('signup'); return }
      if (store.hasSupabase) {
        try {
          const s = await store.initSupabase(); if (off) return
          if (s === 'noauth') setPhase('sbauth'); else if (s.profile) { setU(s.profile); setPhase('in') } else setPhase('sbauth')
          return
        } catch { /* لو القاعدة مش متاحة نكمل بالتخزين المحلي */ }
      }
      setU(session()); setPhase('local')
    })()
    return () => { off = true }
  }, [])
  if (adm) return <><Bg /><Admin onClose={() => { history.replaceState(null, '', location.pathname + location.search); setAdm(false) }} /></>
  if (phase === 'boot') return <><Bg /><div className="auth"><p className="auth-note">بنفتح حسابك…</p></div></>
  if (phase === 'signup') return <><Bg /><CloudSignup onDone={x => { setFresh(true); setU(x); setPhase('in') }} /><a className="adminlnk" href="#admin">لوحة الأدمن</a></>
  if (phase === 'sbauth' && land) return <><Bg /><Landing theme={theme0} onTheme={toggleTheme} onGo={m => { setAuthMode(m); setLand(false) }} /></>
  if (phase === 'sbauth') return <><Bg /><SbAuth key={authMode} mode0={authMode} onIn={(x, f) => { setFresh(f); setU(x); setPhase('in') }} /><a className="adminlnk" href="#admin">لوحة الأدمن</a></>
  if (!u && land) return <><Bg /><Landing theme={theme0} onTheme={toggleTheme} onGo={m => { setAuthMode(m); setLand(false) }} /></>
  if (!u) return <><Bg /><Auth key={authMode} mode0={authMode} onIn={(x, f) => { setFresh(f); setU(x) }} /><button className="adminlnk" onClick={() => setLand(true)}>عن الدورة</button><a className="adminlnk l2" href="#admin">لوحة الأدمن</a></>
  return <Main user={u} fresh={fresh} onOut={() => { if (store.getBackend() === 'sb') { void store.signOut().then(() => { setFresh(false); setU(null); setPhase('sbauth') }) } else { logout(); setFresh(false); setU(null) } }} />
}
