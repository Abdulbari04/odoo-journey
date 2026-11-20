import { LEVELS } from './levels'
import { N, COL, ORDER } from './Chapter'
import { ILL } from './Stations'

// صفحة تعريفية تظهر قبل تسجيل الدخول أو إنشاء الحساب
export function Landing({ onGo, theme, onTheme }: { onGo: (m: 'in' | 'up') => void; theme: 'light' | 'dark'; onTheme: () => void }) {
  const feats: [string, string][] = [
    ['شرح مباشر ومنظّم', 'كل موديول في صفحة واحدة بأقسام مرتّبة: الفهم، الدليل التفصيلي، المحاسبة والربط، ثم الاختبار.'],
    ['قيود محاسبية بمبالغها', 'يُعرض أثر كل عملية في القيد المحاسبي كاملًا بالمدين والدائن والمبلغ.'],
    ['اختبار في نهاية كل مستوى', 'تجتاز المستوى بأربع إجابات صحيحة من خمس، ثم يُفتح المستوى التالي.'],
    ['اختبار دخول للمتقدمين', 'إن كنت تعرف المحتوى مسبقًا، فاجتز اختبار الدخول وانتقل مباشرةً إلى المستوى الذي يناسبك.'],
  ]
  return (
    <div id="landing" role="region" aria-label="التعريف بالدورة">
      <header className="ld-top">
        <div className="ent-logo"><b>O</b><span>خريطة أودو 20</span></div>
        <div className="ld-act">
          <button className="ld-btn ghost" onClick={onTheme} aria-label="تبديل الوضع">{theme === 'dark' ? '☀' : '☾'}</button>
          <button className="ld-btn ghost" onClick={() => onGo('in')}>تسجيل الدخول</button>
          <button className="ld-btn" onClick={() => onGo('up')}>إنشاء حساب</button>
        </div>
      </header>

      <main className="ld-main">
        <section className="ld-hero">
          <div className="ent-kicker">رحلة تعليمية بالعربية</div>
          <h1 className="hm-ttl"><i className="wm" dir="ltr">Odoo</i> 20 Consultant</h1>
          <p className="ld-lead">مسار متدرّج يأخذك من أساسيات النظام إلى مستوى مستشار Odoo، بشرح مبسّط وأمثلة محاسبية وتطبيقية، واختبار في نهاية كل مستوى لقياس تقدّمك.</p>
          <div className="ld-cta">
            <button className="ld-btn big" onClick={() => onGo('up')}>ابدأ الرحلة بإنشاء حساب <b>←</b></button>
            <button className="ld-btn big ghost" onClick={() => onGo('in')}>لدي حساب بالفعل</button>
          </div>
          <div className="ld-nums">
            <span><b>{LEVELS.length}</b> مستويات</span>
            <span><b>{ORDER.length}</b> موديولًا</span>
            <span><b>{LEVELS.length}</b> اختبارات</span>
            <span>Odoo <b>20</b> مقابل 19</span>
          </div>
        </section>

        <section className="ld-sec" aria-labelledby="ld-h1">
          <h2 id="ld-h1">محتوى الرحلة</h2>
          <p className="ld-sub">سبعة مستويات مترابطة، كل مستوى يبني على ما قبله.</p>
          <ol className="ld-lv">
            {LEVELS.map(l => (
              <li key={l.id}>
                <span className="ld-n">{l.id}</span>
                <div className="ld-b">
                  <h3>{l.t}</h3>
                  <p>{l.d}</p>
                  <div className="ld-ms">
                    {l.ch.map(k => <span key={k} className="ld-m" style={{ ['--cc' as string]: `var(${COL[k]})` }}><svg className="ent-near" viewBox="-120 -250 240 260" aria-hidden="true">{ILL[k]}</svg>{N[k]}</span>)}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="ld-sec" aria-labelledby="ld-h2">
          <h2 id="ld-h2">كيف تعمل الدورة</h2>
          <div className="ld-feats">
            {feats.map(([t, d], i) => <div key={t} className="ld-f"><i>{i + 1}</i><h3>{t}</h3><p>{d}</p></div>)}
          </div>
        </section>

        <section className="ld-end">
          <h2>ابدأ من حيث أنت</h2>
          <p>أنشئ حسابًا ليُحفظ تقدّمك واختباراتك، وتابع من حيث توقفت في أي وقت.</p>
          <div className="ld-cta c">
            <button className="ld-btn big" onClick={() => onGo('up')}>إنشاء حساب</button>
            <button className="ld-btn big ghost" onClick={() => onGo('in')}>تسجيل الدخول</button>
          </div>
        </section>
        <footer className="ld-foot">المحتوى تعليمي، ومبنيّ على وثائق Odoo الرسمية وملاحظات الإصدار.</footer>
      </main>
    </div>
  )
}
