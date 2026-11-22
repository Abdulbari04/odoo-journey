import { ModuleVideo } from './Video'
import { ModuleComments } from './Community'
import * as store from './store'
import { Fragment, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties, ReactNode } from 'react'
import type { Data, Chg } from './types'
import { ICON } from './icons'
import { Storyboard } from './Toon'
import { GuideView, type Guide } from './Guide'
import guidesRaw from './guides.json'
export const GUIDES = guidesRaw as unknown as Record<string, Guide>
import { LORDER, LEVELS, levelIdx } from './levels'

export const MODS = ['crm', 's', 'i', 'p', 'm', 'pos', 'a', 'con', 'ai', 'rec', 'emp', 'att', 'to', 'pay']
export const HR = ['emp', 'rec', 'att', 'to', 'pay']
export const ORDER = LORDER
export const N: Record<string, string> = { base: 'الأساس', crm: 'CRM', s: 'المبيعات', i: 'المخازن', p: 'المشتريات', m: 'التصنيع', pos: 'نقاط البيع', a: 'المحاسبة', con: 'جهات الاتصال', ai: 'AI', rec: 'التوظيف', emp: 'الموظفين', att: 'الحضور', to: 'الإجازات', pay: 'الرواتب', grad: 'التخرج', exp: 'المصروفات', plm: 'PLM', studio: 'Studio', web: 'الموقع', ecom: 'التجارة الإلكترونية', fleet: 'الأسطول', prj: 'المشاريع' }
export const COL: Record<string, string> = { base: '--c-base', crm: '--c-crm', s: '--c-s', i: '--c-i', p: '--c-p', m: '--c-m', pos: '--c-pos', a: '--c-a', con: '--c-con', ai: '--c-ai', rec: '--c-rec', emp: '--c-emp', att: '--c-att', to: '--c-to', pay: '--c-pay', grad: '--c-grad', exp: '--c-exp', plm: '--c-plm', studio: '--c-studio', web: '--c-web', ecom: '--c-ecom', fleet: '--c-fleet', prj: '--c-prj' }
export const CHK: Record<string, string> = { base: 'base', crm: 'crm', s: 'sales', i: 'inventory', p: 'purchase', m: 'mrp', pos: 'pos', a: 'acc', con: 'con', ai: 'ai', rec: 'rec', emp: 'emp', att: 'att', to: 'to', pay: 'pay' }
const PAGE: Record<string, string> = { crm: 'crm/', s: 'sales/', i: 'inventory/', p: 'purchase/', m: 'manufacturing/', pos: 'point-of-sale/', a: 'accounting/', con: 'general/', ai: 'ai/', rec: 'recruitment/', emp: 'employees/', att: 'attendances/', to: 'time-off/', pay: 'payroll/' }
const VERSICH = 'https://versich.com/blog/odoo-19-to-20-upgrade-key-changes-and-testing-checklist/'
export const sid = (k: string, x: string) => `s-${k}-${x}`
const CAT = { n: 'جديد', e: 'تحسين', r: 'إعادة هيكلة', x: 'إزالة' }
const MAPT: Record<string, string> = { base: 'الكلمات الأساسية اللي هتسمعها في كل فصل.', crm: 'عميل محتمل يسأل، فتتسجل فرصة.', s: 'عرض سعر ثم أمر بيع.', i: 'المخزن يجهّز ويسلّم.', p: 'اللي ناقص بيتشرى من المورد.', m: 'لو بتصنّع، المكونات تبقى منتج تام.', pos: 'بيع مباشر في المحل أو المطعم.', a: 'كل ده بيتحول لقيود وتقارير.', con: 'سجل واحد لكل شخص وشركة.', ai: 'مساعد ذكي بيشتغل على بياناتك.', rec: 'من المتقدم للتعيين.', emp: 'ملف الموظف وجدوله.', att: 'دخول وخروج وأوفر تايم.', to: 'رصيد وطلبات إجازة.', pay: 'القسيمة والقيد.', grad: 'إزاي تشتغل كمستشار وتختبر الترقية.' }

export const E: Record<string, { a: string; b: string; t: string; d: string }> = {
  'crm-s': { a: 'crm', b: 's', t: 'من فرصة لعرض سعر', d: 'زر New Quotation على الفرصة بيفتح عرض سعر في المبيعات، ولما يتأكد الفرصة تبقى Won.' },
  's-i': { a: 's', b: 'i', t: 'التسليم', d: 'أمر البيع المؤكد بيولّد إذن تسليم (Delivery) في المخازن، والتسليم بينقّص الرصيد.' },
  's-pos': { a: 's', b: 'pos', t: 'قناة بيع تانية', d: 'نفس المنتجات وقوائم الأسعار. المبيعات بدورة عرض وتسليم وفاتورة، ونقاط البيع بتبيع وتقبض في نفس اللحظة.' },
  'pos-i': { a: 'pos', b: 'i', t: 'خصم من مخزن الفرع', d: 'بيع الكاشير بينقّص رصيد مخزن نقطة البيع.' },
  'i-p': { a: 'i', b: 'p', t: 'الاستلام والتزويد', d: 'أمر الشراء بيولّد إذن استلام (Receipt)، وقواعد Reordering Rules بتولّد طلبات شراء.' },
  'i-m': { a: 'i', b: 'm', t: 'مكونات تطلع ومنتج تام يدخل', d: 'أمر التصنيع بيسحب المكونات من المخزن وبيدخّل المنتج التام فيه.' },
  'p-m': { a: 'p', b: 'm', t: 'شراء المكونات والتصنيع من الباطن', d: 'المكونات الناقصة بتتشرى، والمورد ممكن يصنّع لك بـ Subcontracting.' },
  's-a': { a: 's', b: 'a', t: 'فاتورة العميل والتحصيل', d: 'الفاتورة بتسجّل عملاء ومبيعات وضريبة، والدفع بيقفل حساب العميل.' },
  'pos-a': { a: 'pos', b: 'a', t: 'قفل الجلسة', d: 'قفل جلسة الكاشير بيرحّل المبيعات والنقدية للمحاسبة.' },
  'i-a': { a: 'i', b: 'a', t: 'تقييم المخزون', d: 'حركات الاستلام والتسليم والجرد والتالف بتتحول لقيود مع التقييم التلقائي (Automated).' },
  'p-a': { a: 'p', b: 'a', t: 'فاتورة المورد والدفع', d: 'فاتورة المورد بتتطابق مع الأمر والاستلام وبتتسجل دائنين ثم دفع.' },
  'con-crm': { a: 'con', b: 'crm', t: 'جهة الفرصة', d: 'كل فرصة في CRM مربوطة بجهة اتصال (Contact).' },
  'con-s': { a: 'con', b: 's', t: 'العميل على الأمر', d: 'أمر البيع بياخد العميل وعناوين الفاتورة والتسليم من كارت الجهة.' },
  'con-p': { a: 'con', b: 'p', t: 'المورد على الأمر', d: 'أمر الشراء بياخد المورد وشروط الدفع من الجهة.' },
  'con-a': { a: 'con', b: 'a', t: 'حسابات العملاء والموردين', d: 'الجهة بتحدد حساب المدين أو الدائن والموقف الضريبي (Fiscal Position).' },
  'ai-crm': { a: 'ai', b: 'crm', t: 'مساعد المبيعات', d: 'الوكيل يلخّص فرصة أو يكتب متابعة وينشئ سجلات بعد تأكيدك.' },
  'ai-s': { a: 'ai', b: 's', t: 'عروض وأوامر', d: 'يقدر ينشئ أو يعدّل سجلات بمهارات Create/Update Records.' },
  'ai-a': { a: 'ai', b: 'a', t: 'فواتير من ملفات', d: 'ممكن يقرأ PDF ويعرض بيانات الفاتورة لتأكيدك.' },
  'rec-emp': { a: 'rec', b: 'emp', t: 'من متقدم لموظف', d: 'زر Create Employee بيحوّل المقبول لسجل موظف.' },
  'emp-att': { a: 'emp', b: 'att', t: 'جدول وحضور', d: 'الحضور بيتقارن بجدول العمل وجهة الموظف.' },
  'emp-to': { a: 'emp', b: 'to', t: 'رصيد إجازات', d: 'الإجازة بتتحسب على جدول الموظف.' },
  'emp-pay': { a: 'emp', b: 'pay', t: 'العقد والراتب', d: 'العقد في الموظف هو أساس القسيمة.' },
  'att-pay': { a: 'att', b: 'pay', t: 'ساعات وأوفر تايم', d: 'الساعات والأوفر تايم بتدخل في حساب القسيمة.' },
  'to-pay': { a: 'to', b: 'pay', t: 'أثر الإجازة', d: 'الإجازات المعتمدة بتتحول لأنواع وقت (Time Types) في الراتب.' },
  'pay-a': { a: 'pay', b: 'a', t: 'قيد المرتبات', d: 'تأكيد القسائم بيولّد القيد المحاسبي للمرتبات.' },
  'm-a': { a: 'm', b: 'a', t: 'تكلفة التصنيع', d: 'تكلفة المكونات والتشغيل بتدخل في قيمة المنتج التام.' },
}

/** Wraps Latin runs in <bdi class="en"> so English Odoo terms stay left-to-right inside Arabic text. */
const LATIN = /[A-Za-z][A-Za-z0-9 &/._\-:+'%]*[A-Za-z0-9%]|[A-Za-z]/g
export function Ar({ children }: { children: string }) {
  if (!/[\u0600-\u06FF]/.test(children) && /[A-Za-z]/.test(children)) return <bdi dir="ltr" className="en">{children}</bdi>
  const out: ReactNode[] = []; let last = 0; let m: RegExpExecArray | null; LATIN.lastIndex = 0
  while ((m = LATIN.exec(children))) { if (m.index > last) out.push(children.slice(last, m.index)); out.push(<bdi className="en" key={m.index}>{m[0]}</bdi>); last = m.index + m[0].length }
  if (last < children.length) out.push(children.slice(last))
  return <>{out}</>
}
const cv = (k: string): CSSProperties => ({ ['--c' as string]: `var(${COL[k]})` })
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function Note({ k }: { k: string }) {
  const key = 'odoo20-note-' + k
  const [v, setV] = useState('')
  useEffect(() => { setV(store.get(key) || '') }, [key])
  return <textarea className="note" rows={4} value={v} placeholder="اكتب ملاحظاتك على الفصل ده هنا. بتتحفظ تلقائيًا." aria-label="ملاحظاتي" onChange={e => { setV(e.target.value); store.set(key, e.target.value) }} />
}

export function Welcome({ name, total, onStart, children, onAll, allCollapsed }: { name: string; total: number; onStart: (v: string) => void; children?: ReactNode; onAll: () => void; allCollapsed: boolean }) {
  const [v, setV] = useState(name)
  return (
    <section className="welcome" id="ch-welcome" style={cv('s')}>
      <div className="hi">{name ? `أهلًا يا ${name}، نورت الرحلة` : 'أهلًا وسهلًا بيك'}</div>
      <h1>رحلتك من الصفر لـ <em>Odoo Consultant</em></h1>
      <p className="lead">لو ما تعرفش حاجة عن أودو، مفيش مشكلة. هنمشي سوا من أول عميل محتمل لآخر قيد محاسبي، في {MODS.length} موديول (أعمال وموارد بشرية)، وكل فصل بيشرح الأساس وبعدين يوريك إيه اللي اتغيّر في Odoo 20 عن Odoo 19.</p>
      <form className="who" onSubmit={e => { e.preventDefault(); onStart(v.trim()) }}>
        <input type="text" placeholder="اكتب اسمك وانت بتبدأ" value={v} onChange={e => setV(e.target.value)} autoComplete="given-name" aria-label="اسمك" />
        <button className="cta" type="submit">ابدأ الرحلة</button>
      </form>
      <div className="hand-note" aria-hidden="true"><svg viewBox="0 0 80 50"><path d="M70 6C50 4 28 14 14 40M14 40l1-14M14 40l13-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg><span>ابدأ من هنا، ومتنساش تكتب ملاحظاتك</span></div>
      <div className="promise">
        <div><b>من الصفر</b><span>كل مصطلح بيتشرح قبل ما نستخدمه.</span></div>
        <div><b>عربي بمصطلحات أودو</b><span>الاسم بالإنجليزي زي ما هتشوفه في البرنامج، وشرحه تحته بالعربي.</span></div>
        <div><b>Odoo 20 مقابل 19</b><span>كل تغيير ليه رابط مصدره.</span></div>
      </div>
      <div className="stats"><span className="tally"><svg viewBox="0 0 40 24" aria-hidden="true"><path d="M6 3v18M14 3v18M22 3v18M30 3v18M2 17 34 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg><b>{ORDER.length}</b> فصول</span><span><b>{total}</b> تغيير موثق في Odoo 20</span><span><b>{MODS.length}</b> موديول متصل</span></div>
      {children}
      <h3>خريطة الرحلة</h3>
      <button className="tb" onClick={onAll}>{allCollapsed ? 'وسّع كل الفصول' : 'ضيّق كل الفصول'}</button>
      <ol className="map">{ORDER.map((k, i) => <li key={k} style={cv(k)}><i /><span><b>{i + 1}. {N[k]}:</b> {MAPT[k]}</span></li>)}</ol>
    </section>)
}

function Vs({ k, list }: { k: string; list: Chg[] }) {
  const [f, setF] = useState('all'); const [open, setOpen] = useState(false)
  const cnt = { n: 0, e: 0, r: 0, x: 0, E: 0 }
  list.forEach(x => { cnt[x[1]]++; if (x[2] === 'E') cnt.E++ })
  const shown = list.filter(x => f === 'all' || (f === 'E' ? x[2] === 'E' : x[1] === f))
  const btns: [string, string, number][] = [['all', 'الكل', 1], ['n', 'جديد', cnt.n], ['e', 'تحسين', cnt.e], ['r', 'هيكلة', cnt.r], ['x', 'إزالة', cnt.x], ['E', 'Enterprise', cnt.E]]
  return (
    <div className="vs">
      <h3 id={sid(k, 'vs')}>Odoo 20 مقابل Odoo 19</h3>
      <p className="sm" style={{ color: 'var(--text)', fontSize: 15.5 }}>{k === 'base' ? 'التغييرات العامة على مستوى النظام كله.' : 'التغييرات دي مأخوذة من ملاحظات إصدار Odoo 20 كما نشرتها iVentureTeam. لما المصدر مذكرش سلوك 19 ما كتبتوش.'}</p>
      <div className="cnt"><span><b>{list.length}</b> تغيير</span>{cnt.n > 0 && <span><b>{cnt.n}</b> جديد</span>}{cnt.e > 0 && <span><b>{cnt.e}</b> تحسين</span>}{cnt.r > 0 && <span><b>{cnt.r}</b> إعادة هيكلة</span>}{cnt.x > 0 && <span><b>{cnt.x}</b> إزالة</span>}{cnt.E > 0 && <span><b>{cnt.E}</b> Enterprise فقط</span>}</div>
      <div className="flt">{btns.filter(b => b[2] > 0).map(([id, t]) => <button key={id} aria-pressed={f === id} onClick={() => setF(id)}>{t}</button>)}</div>
      <button className="tb" onClick={() => setOpen(o => !o)}>{open ? 'اقفل الكل' : 'افتح الكل'}</button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shown.map(x => {
          const url = k === 'base' ? VERSICH : 'https://iventureteam.com/odoo-20-release-notes/' + PAGE[k] + (k === 's' ? '#' + slug(x[0]) : '')
          return (
            <details className="chg" key={x[0] + open} open={open}>
              <summary><span className="nm">{x[0]}</span><span className={'b ' + x[1]}>{CAT[x[1]]}</span>{x[2] === 'E' && <span className="b E">Enterprise فقط</span>}</summary>
              <div className="body">
                {x[3] && <div className="row v19"><span className="k">في Odoo 19</span><span><Ar>{x[3]}</Ar></span></div>}
                <div className="row v20"><span className="k">في Odoo 20</span><span><Ar>{x[4]}</Ar></span></div>
                {x[5] && <div className="row"><span className="k">فين وإزاي</span><span><Ar>{x[5]}</Ar></span></div>}
                {x[6] && <div className="row nt"><span className="k">تنبيه</span><span><Ar>{x[6]}</Ar></span></div>}
                <div className="row src"><span className="k">المصدر</span><a href={url} target="_blank" rel="noopener noreferrer">{k === 'base' ? 'Versich' : 'iVentureTeam'}</a></div>
              </div>
            </details>)
        })}
      </div>
    </div>)
}

export const tabFor = (id: string) => /-(draw|terms|steps)$/.test(id) ? 'learn' : /-guide$/.test(id) ? 'guide' : /-(acc|links)$/.test(id) ? 'acc' : /-(vs|up)$/.test(id) ? 'chg' : 'more'
export type Sub = { k: string; id: string; n: number } | null

function Pager({ k, done, onFinish, onToggle, go }: { k: string; done: boolean; onFinish: () => void; onToggle: () => void; go: (k: string) => void }) {
  const i = ORDER.indexOf(k), pv = ORDER[i - 1], lv = LEVELS[levelIdx(k)], last = lv.ch[lv.ch.length - 1] === k, nx = ORDER[i + 1]
  return (
    <div className="fin">
      <button className="cta big" onClick={onFinish}>{last ? `اختبار المستوى ${lv.id}` : `التالي: ${N[nx]}`} <b>←</b></button>
      <div className="fin2">
        <button disabled={!pv || levelIdx(pv) !== levelIdx(k)} onClick={() => pv && go(pv)}>→ السابق{pv && levelIdx(pv) === levelIdx(k) ? `: ${N[pv]}` : ''}</button>
        <button aria-pressed={done} onClick={onToggle}>{done ? '✓ مكتمل (إلغاء)' : 'علّم كمكتمل بس'}</button>
      </div>
    </div>)
}

export function GuideChapter({ k, i, done, onFinish, onToggle, go, sub, who, side }: { who: string; side?: HTMLElement | null; k: string; i: number; done: boolean; onFinish: () => void; onToggle: () => void; go: (k: string) => void; sub: Sub }) {
  const g = GUIDES[k]
  useEffect(() => { if (sub && sub.k === k) setTimeout(() => document.getElementById(sub.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120) }, [sub, k, side])
  return (
    <section className="ch" id={'ch-' + k} data-k={k} style={cv(k)}>
      <div className="kick">الموديول {i + 1} من {ORDER.length} · المستوى {LEVELS[levelIdx(k)].id} · صعوبة الموديول: {g.level}</div>
      <div className="chead"><div className="ico">{ICON[k]}</div><div><h2><Ar>{g.title || N[k]}</Ar></h2></div></div>
      <ModuleVideo k={k} title={N[k]} icon={ICON[k]} idx={i} total={ORDER.length} lvl={LEVELS[levelIdx(k)].id} />
      {g.intro && <p className="intro"><Ar>{g.intro}</Ar></p>}
      {inPanel(side, <div className="cpanel">
        <Sec k={k} id="guide" n={1} t="الدليل التفصيلي"><h3 id={sid(k, 'guide')}>إزاي تشتغل على الموديول</h3><GuideView g={g} /></Sec>
        <Sec k={k} id="more" n={2} t="ملاحظاتي"><h3 id={sid(k, 'note')}>ملاحظاتي</h3><Note k={k} /></Sec>
      </div>)}
      <Pager k={k} done={done} onFinish={onFinish} onToggle={onToggle} go={go} />
      <ModuleComments k={k} name={who} />
    </section>)
}

const numOf = (t: string) => Number(t.replace(/[^\d.]/g, ''))
const fmt = (n: number) => n.toLocaleString('en-US')
// يفكّ جانب القيد (مثلًا «المبيعات + ضريبة 1,120») لسطور فيها اسم الحساب والمبلغ
function jlines(side: string, total: string): [string, string][] {
  const T = numOf(total)
  const parts = side.split(/\s*\+\s*/).map(p => { const m = p.match(/^(.*?)\s*(\d[\d,]*(?:\.\d+)?)$/); return m ? { n: m[1].trim(), a: numOf(m[2]) } : { n: p.trim(), a: NaN } })
  const miss = parts.filter(p => isNaN(p.a)), known = parts.reduce((x, p) => x + (isNaN(p.a) ? 0 : p.a), 0)
  if (!isNaN(T) && miss.length === 1) miss[0].a = T - known
  return parts.map(p => [p.n || side, isNaN(p.a) ? total : fmt(p.a)])
}
function Je({ r }: { r: string[] }) {
  return (
    <blockquote className="je">
      <div className="jt"><Ar>{r[0]}</Ar></div>
      {jlines(r[1], r[3]).map(([n, a], i) => <div className="jl d" key={'d' + i}><span><em>مدين</em><Ar>{n}</Ar></span><b dir="ltr">{a}</b></div>)}
      {jlines(r[2], r[3]).map(([n, a], i) => <div className="jl c" key={'c' + i}><span><em>دائن</em><Ar>{n}</Ar></span><b dir="ltr">{a}</b></div>)}
    </blockquote>)
}

// side === undefined: عرض عادي داخل الصفحة. side === null: الجانب لسه مجهّز. element: يتعرض في اللوحة الجانبية الثابتة
function inPanel(side: HTMLElement | null | undefined, node: ReactNode) { return side === undefined ? node : side ? createPortal(node, side) : null }

function Sec({ k, id, n, t, children }: { k: string; id: string; n: number; t: string; children: ReactNode }) {
  return (
    <details className="csec" id={`sec-${k}-${id}`}>
      <summary><h2 className="sh"><i>{n}</i>{t}</h2><span className="chev" aria-hidden="true">▾</span></summary>
      <div className="cbody">{children}</div>
    </details>)
}

export function ChapterView({ k, i, data, done, onFinish, onToggle, go, sub, who, side }: { who: string; side?: HTMLElement | null; k: string; i: number; data: Data; done: boolean; onFinish: () => void; onToggle: () => void; go: (k: string) => void; sub: Sub }) {
  const c = data.CORE[k]
  const links = MODS.includes(k) ? Object.values(E).filter(e => e.a === k || e.b === k) : []
  const tabs = [['learn', 'الفهم'], ...(GUIDES[k] ? [['guide', 'الدليل التفصيلي']] : []), ['acc', 'المحاسبة والربط'], ...(CHK[k] || c.up ? [['chg', 'Odoo 20 مقابل 19']] : []), ['more', 'اختبر نفسك']] as [string, string][]
  const nn = (id: string) => tabs.findIndex(t => t[0] === id) + 1
  useEffect(() => {
    if (!sub || sub.k !== k) return
    const el = document.getElementById(sub.id); el?.closest('details')?.setAttribute('open', '')
    const t = setTimeout(() => document.getElementById(sub.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200); return () => clearTimeout(t)
  }, [sub, k, side])
  return (
    <section className="ch" id={'ch-' + k} data-k={k} style={cv(k)}>
      <div className="kick">الموديول {i + 1} من {ORDER.length} · المستوى {LEVELS[levelIdx(k)].id}{GUIDES[k] ? ` · صعوبة الموديول: ${GUIDES[k].level}` : ''}</div>
      <div className="chead"><div className="ico">{ICON[k]}</div><div><h2><Ar>{c.t}</Ar></h2><div className="sub2">{c.en}</div></div></div>
      <ModuleVideo k={k} title={N[k]} icon={ICON[k]} idx={i} total={ORDER.length} lvl={LEVELS[levelIdx(k)].id} />
      <p className="intro"><Ar>{c.intro}</Ar></p>
      {inPanel(side, <div className="cpanel">
      <Sec k={k} id="learn" n={nn('learn')} t="الفهم">
        <p className="ana"><Ar>{c.analogy}</Ar></p>
        <div id={sid(k, 'draw')}><Storyboard k={k} /></div>
        <h3 id={sid(k, 'terms')}>المصطلحات</h3>
        <div className="terms">{c.terms.map(t => <div className="term" key={t[0]}><div className="t">{t[0]}</div><div className="d"><Ar>{t[1]}</Ar></div></div>)}</div>
        <h3 id={sid(k, 'steps')}>خطوة بخطوة</h3>
        <ol className="steps">{c.steps.map((s, j) => <li key={j}><span><Ar>{s}</Ar></span></li>)}</ol>
        <p className="ex"><Ar>{c.ex}</Ar></p>
      </Sec>
      {GUIDES[k] && <Sec k={k} id="guide" n={nn('guide')} t="الدليل التفصيلي"><h3 id={sid(k, 'guide')}>إزاي تشتغل على الموديول</h3><GuideView g={GUIDES[k]} /></Sec>}
      <Sec k={k} id="acc" n={nn('acc')} t="المحاسبة والربط">
        <h3 id={sid(k, 'acc')}>الأثر المحاسبي</h3>
        {c.acc ? <><div className="ents">{c.acc.map((r, j) => <Je key={j} r={r} />)}</div><p className="sm"><Ar>{c.accNote}</Ar></p></> : <p className="sm"><Ar>{c.accNote}</Ar></p>}
        {links.length > 0 && <><h3 id={sid(k, 'links')}>مربوط بـ</h3><div className="links">{links.map(e => { const o = e.a === k ? e.b : e.a; return <div key={e.a + e.b} className="lk" style={{ ['--c2' as string]: `var(${COL[o]})` }}><b><i />{e.t} ← {N[o]}</b><span><Ar>{e.d}</Ar></span><button className="lkgo" onClick={() => go(o)}>الذهاب إلى {N[o]}</button></div> })}</div></>}
      </Sec>
      {(CHK[k] || c.up) && <Sec k={k} id="chg" n={nn('chg')} t="Odoo 20 مقابل 19">
        {CHK[k] && <Vs k={k} list={data.CHG[CHK[k]]} />}
        {c.up && <><h3 id={sid(k, 'up')}>قايمة اختبار الترقية من 19 لـ 20</h3><ol className="steps">{c.up.map((s, j) => <li key={j}><span><Ar>{s}</Ar></span></li>)}</ol></>}
      </Sec>}
      <Sec k={k} id="more" n={nn('more')} t="اختبر نفسك">
        <h3 id={sid(k, 'quiz')}>اختبر نفسك</h3>
        <div className="qz">{c.quiz.map((q, j) => <details key={j}><summary><span><Ar>{q[0]}</Ar></span></summary><p><Ar>{q[1]}</Ar></p></details>)}</div>
        <h3 id={sid(k, 'note')}>ملاحظاتي</h3>
        <Note k={k} />
        <h3 id={sid(k, 'src')}>المصادر</h3>
        <ul className="srcs">{c.src.map(s => <li key={s[1]}><a href={s[1]} target="_blank" rel="noopener noreferrer">{s[0]}</a></li>)}</ul>
      </Sec>
      </div>)}
      <Pager k={k} done={done} onFinish={onFinish} onToggle={onToggle} go={go} />
      <ModuleComments k={k} name={who} />
    </section>)
}
void Fragment
