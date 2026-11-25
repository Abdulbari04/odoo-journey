import { useEffect, useState, type ReactNode } from 'react'
import * as store from './store'

// بيحوّل لينك يوتيوب/فيميو/درايف لعنوان تضمين، أو null لو مش معروف
export function embedOf(u: string): string | null {
  try {
    const x = new URL(u); const h = x.hostname.replace(/^www\./, '')
    if (h === 'youtu.be') return 'https://www.youtube-nocookie.com/embed/' + x.pathname.slice(1)
    if (h.endsWith('youtube.com')) { const id = x.searchParams.get('v') || x.pathname.split('/').filter(Boolean).pop(); return id ? 'https://www.youtube-nocookie.com/embed/' + id : null }
    if (h === 'vimeo.com') return 'https://player.vimeo.com/video/' + x.pathname.split('/').filter(Boolean).pop()
    if (h === 'drive.google.com') { const m = x.pathname.match(/\/d\/([^/]+)/); return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null }
  } catch { /* ignore */ }
  return null
}
const isFile = (u: string) => /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(u)

// بوستر افتراضي بمقاس الفيديو 16:9 لحد ما الأدمن يرفع الفيديو
function Poster({ title, icon, idx, total, lvl, kick, foot }: { title: string; icon: ReactNode; idx: number; total: number; lvl: number; kick?: string; foot?: string }) {
  return (
    <div className="vp" role="img" aria-label={`بوستر فيديو شرح موديول ${title}`}>
      <svg className="vp-bg" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><pattern id="vpg" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M8 0H0V8" fill="none" stroke="currentColor" strokeWidth=".25" opacity=".35" /></pattern></defs>
        <rect width="160" height="90" fill="url(#vpg)" />
        <circle cx="140" cy="12" r="34" fill="currentColor" opacity=".16" /><circle cx="14" cy="86" r="26" fill="currentColor" opacity=".12" />
        <path d="M0 70 Q40 52 80 66 T160 56 V90 H0Z" fill="currentColor" opacity=".13" />
      </svg>
      <div className="vp-in">
        <span className="vp-k">{kick || '🎬 فيديو شرح الموديول'}</span>
        <div className="vp-m"><span className="vp-i">{icon}</span><h3>{title}</h3></div>
        <span className="vp-f">{foot || `الموديول ${idx + 1} من ${total} · المستوى ${lvl}`}</span>
      </div>
      <span className="vp-play" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M8 5v14l11-7z" fill="currentColor" /></svg></span>
      <span className="vp-soon">الفيديو قريبًا</span>
    </div>)
}

export function ModuleVideo({ k, title, icon, idx, total, lvl }: { k: string; title: string; icon: ReactNode; idx: number; total: number; lvl: number }) {
  const [v, setV] = useState<store.Vid | null>(null)
  useEffect(() => { let off = false; setV(null); void store.videoList().then(m => { if (!off) setV(m[k] || null) }); return () => { off = true } }, [k])
  if (!v) return <Poster title={title} icon={icon} idx={idx} total={total} lvl={lvl} />
  const emb = v.kind === 'link' ? embedOf(v.url) : null
  return (
    <figure className="vid">
      <div className="vid-box">
        {v.kind === 'file' || isFile(v.url)
          ? <video controls preload="metadata" playsInline src={v.url} />
          : emb ? <iframe src={emb} title={`فيديو شرح ${title}`} allow="fullscreen; picture-in-picture" allowFullScreen loading="lazy" />
            : <a className="vid-ext" href={v.url} target="_blank" rel="noopener noreferrer">▶ افتح فيديو شرح {title}</a>}
      </div>
      {(emb || (!isFile(v.url) && v.kind === 'link')) && <figcaption><a href={v.url} target="_blank" rel="noopener noreferrer">فتح الفيديو في صفحة جديدة ↗</a></figcaption>}
    </figure>)
}

