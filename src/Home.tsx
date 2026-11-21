import { LEVELS } from './levels'
import { fmtN } from './points'
import { N, COL, ORDER } from './Chapter'
import { unlocked, type Passed } from './Levels'
import { ILL } from './Stations'

// الصفحة الرئيسية: كل الموديولات في كروت، وجنب كل واحد حالته (مكتمل / مفتوح / مغلق + اختبار دخول)
export function Home({ name, passed, done, started, onStart, onModule, onSearch, onComm, onSettings, pts, onTheme, theme, onOut }: {
  name: string; passed: Passed; done: Record<string, boolean>; started: boolean; onStart: () => void; onModule: (k: string) => void
  onSearch: () => void; onComm: () => void; onSettings: () => void; pts: number; onTheme: () => void; theme: 'light' | 'dark'; onOut: () => void
}) {
  const doneN = ORDER.filter(k => done[k]).length, passN = Object.values(passed).filter(Boolean).length
  return (
    <div id="home" role="region" aria-label="كل الموديولات">
      <div className="ent-top hm-top">
        <div className="ent-logo"><b>O</b><span>خريطة أودو 20</span></div>
        <div className="ent-act">
          <button onClick={onComm}>👥 المجتمع</button>
          <button onClick={onSearch} aria-label="بحث">🔍</button>
          <button onClick={onSettings} aria-label="الإعدادات" title="الإعدادات">⚙</button>
          <button onClick={onTheme} aria-label={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}>{theme === 'dark' ? '☀ فاتح' : '☾ داكن'}</button>
          <button onClick={onOut}>خروج</button>
        </div>
      </div>
      <main className="hm-main">
        <header className="hm-hero">
          <div className="ent-kicker">أهلًا يا {name}</div>
          <h1 className="hm-ttl"><i className="wm" dir="ltr">Odoo</i> 20 Consultant</h1>
          <p className="hm-d">دورة متكاملة من الأساس حتى التخرج: {ORDER.length} موديولًا في {LEVELS.length} مستويات، يُختتم كل مستوى باختبار قصير. يمكنك فتح أي موديول مغلق مباشرةً باختبار دخول.</p>
          <div className="hm-row">
            <button className="ent-open" onClick={onStart}>{started ? 'كمّل الرحلة' : 'بداية الرحلة'} <b>←</b></button>
            <span className="hm-stat"><b>{doneN}</b>/{ORDER.length} موديول مكتمل</span>
            <span className="hm-stat"><b>{passN}</b>/{LEVELS.length} مستويات اجتزتها</span>
            <span className="hm-stat"><b>{fmtN(pts)}</b> نقطة</span>
          </div>
        </header>
        <section className="ent-grid hm-grid" id="ent-grid" aria-label="كل الموديولات">
          {LEVELS.map((l, i) => {
            const open = unlocked(i, passed), ok = !!passed[l.id]
            return (
              <div key={l.id} className="eg-lv">
                <div className="eg-h"><b>المستوى {l.id} · {l.t}</b><span className={'eg-chip ' + (ok ? 'ok' : open ? 'op' : 'lk')}>{ok ? '✓ اجتزت الاختبار' : open ? 'مفتوح' : '🔒 مغلق'}</span></div>
                <div className="eg-cards">
                  {l.ch.map(k => {
                    const dn = !!done[k]
                    return (
                      <button key={k} className={'eg-card' + (open ? '' : ' lock')} onClick={() => onModule(k)} style={{ ['--cc' as string]: `var(${COL[k]})` }}>
                        <span className="eg-pv ent-near"><svg viewBox="-120 -250 240 260" aria-hidden="true">{ILL[k]}</svg></span>
                        <span className="eg-t">{N[k]}</span>
                        <span className="eg-st">
                          {dn ? <i className="s ok">✓ مكتمل</i> : open ? <i className="s op">مفتوح</i> : <><i className="s lk">🔒 مغلق</i><i className="s ex">اختبار دخول</i></>}
                        </span>
                      </button>)
                  })}
                </div>
              </div>)
          })}
        </section>
      </main>
    </div>
  )
}
