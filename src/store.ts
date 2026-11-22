// تخزين المفاتيح: سحابة Claude (db) لو متاحة، وإلا localStorage على الجهاز
type Doc = { set(d: Record<string, unknown>): Promise<void> }
type Cloud = { doc: Doc; uid: string }
type Backend = 'claude' | 'sb' | 'local'
let backend: Backend = 'local'
export const getBackend = () => backend
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sb: any = null
const SB_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const hasSupabase = !!(SB_URL && SB_KEY)
export type Profile = { name: string; job: string }

let cloud: Cloud | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbh: any = null
let cache: Record<string, string> = {}
let timer: number | undefined
let busy: Promise<void> | null = null
let dirty = false
let profile: Profile | null = null
const errs = new Set<(m: string) => void>()

export const isCloud = () => !!cloud
export const onSyncError = (f: (m: string) => void) => { errs.add(f); return () => { errs.delete(f) } }

export function get(k: string): string | null {
  if (cloud) return cache[k] ?? null
  try { return localStorage.getItem(k) } catch { return null }
}
async function flush() {
  if (!cloud) return
  if (busy) { dirty = true; return }
  dirty = false
  busy = cloud.doc.set({ ...profile, kv: cache, updatedAt: Date.now() }).catch(e => { errs.forEach(f => f(String(e?.message || e?.code || 'error'))) }).finally(() => { busy = null; if (dirty) void flush() })
  await busy
}
export function set(k: string, v: string) {
  if (cloud) { cache[k] = v; clearTimeout(timer); timer = window.setTimeout(() => void flush(), 800); return }
  try { localStorage.setItem(k, v) } catch { /* ignore */ }
}

// يحاول يفتح قاعدة بيانات Claude: يرجّع {profile|null} لو السحابة شغالة، أو undefined لو مش متاحة
export async function initCloud(): Promise<{ profile: Profile | null } | undefined> {
  try {
    const c = (window as unknown as { claude?: { use(n: string): Promise<any> } }).claude // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!c?.use) return undefined
    const [db, user] = await Promise.all([c.use('db'), c.use('user')])
    if (!db || !user) return undefined
    if (user.can && user.can('data.write') === false) return undefined
    const uid = await user.id()
    if (!uid) return undefined
    dbh = db
    const doc = db.doc('data/users/' + uid + '/profile')
    const snap = await doc.get()
    cloud = { doc, uid }; backend = 'claude'
    const d = snap.exists ? snap.data() : null
    if (d && d.name) { profile = { name: String(d.name), job: String(d.job || '') }; cache = { ...(d.kv as Record<string, string> || {}) }; return { profile } }
    return { profile: null }
  } catch { cloud = null; return undefined }
}
export async function createProfile(p: Profile) { profile = p; cache = {}; await flush() }

// ---- Supabase (قاعدة بيانات أونلاين لما الموقع يتنشر على GitHub Pages) ----
export async function initSupabase(): Promise<{ profile: Profile | null } | 'noauth'> {
  await ensureSb()
  const { data } = await sb.auth.getSession()
  return data.session ? loadSb(data.session.user.id) : 'noauth'
}
async function loadSb(uid: string): Promise<{ profile: Profile | null }> {
  const { data, error } = await sb.from('profiles').select('name,job,kv').eq('id', uid).maybeSingle()
  if (error) throw error
  cloud = { uid, doc: { set: async d => { const { error: e } = await sb.from('profiles').upsert({ id: uid, name: d.name, job: d.job, kv: d.kv, updated_at: new Date().toISOString() }); if (e) throw e } } }
  backend = 'sb'
  if (data?.name) { profile = { name: data.name, job: data.job || '' }; cache = { ...(data.kv || {}) }; return { profile } }
  return { profile: null }
}
export async function sbSignIn(email: string, password: string) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error
  return loadSb(data.user.id)
}
// بيرجّع null لو لازم تأكّد الإيميل الأول
export async function sbSignUp(email: string, password: string, p: Profile): Promise<{ profile: Profile } | null> {
  const { data, error } = await sb.auth.signUp({ email, password }); if (error) throw error
  if (!data.session) return null
  await loadSb(data.user.id); await createProfile(p); return { profile: p }
}
export async function signOut() {
  if (backend === 'sb' && sb) await sb.auth.signOut()
  cloud = null; cache = {}; profile = null; backend = 'local'
}

async function ensureSb() { if (!sb) { const { createClient } = await import('@supabase/supabase-js'); sb = createClient(SB_URL!, SB_KEY!) } }

// ---- إحصائيات الاستخدام (بتروح مكان الأدمن يقراه) ----
export type Row = { id: string; email?: string | null; data: Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any
export async function pushStats(s: object) {
  try {
    if (backend === 'claude' && cloud && dbh) await dbh.doc('stats/' + cloud.uid).set(s)
    else if (backend === 'sb' && sb && cloud) {
      const { data } = await sb.auth.getSession()
      await sb.from('stats').upsert({ user_id: cloud.uid, email: data.session?.user?.email ?? null, data: s, updated_at: new Date().toISOString() })
    }
  } catch { /* الإحصائيات مش لازم توقّف الموقع */ }
}
// أدمن Claude: أي حد عنده صلاحية Editor أو Owner على الصفحة
export async function adminClaude(): Promise<Row[] | 'denied' | null> {
  try {
    const c = (window as unknown as { claude?: { use(n: string): Promise<any> } }).claude // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!c?.use) return null
    const [db, user] = await Promise.all([c.use('db'), c.use('user')])
    if (!db || !user) return null
    if (!(user.canEdit && user.canEdit())) return 'denied'
    const snap = await db.collection('stats').get()
    return snap.docs.map((d: any) => ({ id: d.id, data: d.data() })) // eslint-disable-line @typescript-eslint/no-explicit-any
  } catch { return null }
}
export async function adminSb(email: string, password: string): Promise<Row[]> {
  await ensureSb()
  const { data, error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error
  const a = await sb.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle()
  if (!a.data) { await sb.auth.signOut(); throw new Error('notadmin') }
  const r = await sb.from('stats').select('user_id,email,data'); if (r.error) throw r.error
  return r.data.map((x: any) => ({ id: x.user_id, email: x.email, data: x.data })) // eslint-disable-line @typescript-eslint/no-explicit-any
}
export async function adminSbOut() { try { await ensureSb(); await sb.auth.signOut() } catch { /* ignore */ } }

// ---- المجتمع: تعليقات الموديولات ----
export type Cmt = { id: string; uid: string; k: string; name: string; text: string; t: number; mine: boolean; rep?: string; rn?: string }
const LOCAL_C = 'odoo20-comments'
const rdLocal = (): Cmt[] => { try { return JSON.parse(localStorage.getItem(LOCAL_C) || '[]') } catch { return [] } }
export async function cmtList(): Promise<Cmt[]> {
  let out: Cmt[] = []
  try {
    if (backend === 'claude' && cloud && dbh) {
      const snap = await dbh.collection('comments').get()
      for (const d of snap.docs) for (const it of (d.data().items || [])) out.push({ ...it, uid: d.id, mine: d.id === cloud.uid })
    } else if (backend === 'sb' && sb && cloud) {
      let r = await sb.from('comments').select('id,user_id,name,module,text,created_at,reply_to,reply_name').order('created_at', { ascending: false }).limit(300)
      if (r.error) r = await sb.from('comments').select('id,user_id,name,module,text,created_at').order('created_at', { ascending: false }).limit(300)
      if (r.error) throw r.error
      out = r.data.map((x: any) => ({ id: x.id, uid: x.user_id, k: x.module, name: x.name, text: x.text, t: Date.parse(x.created_at), mine: x.user_id === cloud!.uid, rep: x.reply_to || undefined, rn: x.reply_name || undefined })) // eslint-disable-line @typescript-eslint/no-explicit-any
    } else out = rdLocal().map(c => ({ ...c, uid: 'me', mine: true }))
  } catch { /* لو التحميل فشل نعرض قايمة فاضية */ }
  return out.sort((a, b) => b.t - a.t)
}
export async function cmtAdd(k: string, name: string, text: string, reply?: { id: string; name: string }): Promise<void> {
  const c = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), k, name, text: text.slice(0, 400), t: Date.now(), ...(reply ? { rep: reply.id, rn: reply.name } : {}) }
  if (backend === 'claude' && cloud && dbh) {
    const ref = dbh.doc('comments/' + cloud.uid); const snap = await ref.get()
    const items = ((snap.exists ? snap.data().items : []) || []) as object[]
    await ref.set({ items: [...items, c].slice(-100) })
  } else if (backend === 'sb' && sb && cloud) {
    let r = await sb.from('comments').insert({ user_id: cloud.uid, name, module: k, text: c.text, ...(reply ? { reply_to: reply.id, reply_name: reply.name } : {}) })
    if (r.error && reply) r = await sb.from('comments').insert({ user_id: cloud.uid, name, module: k, text: c.text })
    if (r.error) throw r.error
  } else localStorage.setItem(LOCAL_C, JSON.stringify([...rdLocal(), c].slice(-200)))
}
export async function cmtDel(id: string): Promise<void> {
  if (backend === 'claude' && cloud && dbh) {
    const ref = dbh.doc('comments/' + cloud.uid); const snap = await ref.get()
    await ref.set({ items: ((snap.exists ? snap.data().items : []) as { id: string }[]).filter(x => x.id !== id) })
  } else if (backend === 'sb' && sb && cloud) { const r = await sb.from('comments').delete().eq('id', id); if (r.error) throw r.error }
  else localStorage.setItem(LOCAL_C, JSON.stringify(rdLocal().filter(x => x.id !== id)))
}
export const cmtShared = () => backend !== 'local'

// ---- الملفات الشخصية والمتصدرين ----
export type Person = { id: string; name: string; job: string; bio: string; avatar: string; pts: number; mods: number; lvls: number; t: number; me: boolean; cw?: number; cs?: number; cn?: number; code?: string; inv?: string }
const LOCAL_P = 'odoo20-person'
// بيانات إضافية بتتبعت مع الملف الشخصي: نتيجة المسابقة وكود الدعوة
export type Contest = { w: number; s: number; n: number }
export const readContest = (): Contest | null => { try { return JSON.parse(get('odoo20-contest') || 'null') } catch { return null } }
export function myCode(): string {
  let c = get('odoo20-code')
  if (!c) { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c = Array.from({ length: 6 }, () => A[Math.floor(Math.random() * A.length)]).join(''); set('odoo20-code', c) }
  return c
}
export async function pushPerson(p0: Omit<Person, 'id' | 't' | 'me'>): Promise<void> {
  const t = Date.now(); const ct = readContest(); const inv = get('odoo20-inv') || ''
  const p = { ...p0, code: myCode(), inv, ...(ct ? { cw: ct.w, cs: ct.s, cn: ct.n } : {}) }
  try {
    if (backend === 'claude' && cloud && dbh) await dbh.doc('people/' + cloud.uid).set({ ...p, t })
    else if (backend === 'sb' && sb && cloud) {
      const base = { user_id: cloud.uid, name: p.name, job: p.job, bio: p.bio, avatar: p.avatar, pts: p.pts, mods: p.mods, lvls: p.lvls, updated_at: new Date(t).toISOString() }
      let r = await sb.from('people').upsert({ ...base, code: p.code, inv: p.inv, cw: p.cw ?? null, cs: p.cs ?? null, cn: p.cn ?? null })
      if (r.error) r = await sb.from('people').upsert(base)
      if (r.error) throw r.error
    } else localStorage.setItem(LOCAL_P, JSON.stringify({ ...p, t }))
  } catch { /* مش لازم يوقّف الموقع */ }
}
export async function listPeople(): Promise<Person[]> {
  try {
    if (backend === 'claude' && cloud && dbh) {
      const snap = await dbh.collection('people').get()
      return snap.docs.map((d: any) => ({ id: d.id, name: '', job: '', bio: '', avatar: '', pts: 0, mods: 0, lvls: 0, t: 0, ...d.data(), me: d.id === cloud!.uid })) // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (backend === 'sb' && sb && cloud) {
      let r = await sb.from('people').select('user_id,name,job,bio,avatar,pts,mods,lvls,updated_at,code,inv,cw,cs,cn').order('pts', { ascending: false }).limit(200)
      if (r.error) r = await sb.from('people').select('user_id,name,job,bio,avatar,pts,mods,lvls,updated_at').order('pts', { ascending: false }).limit(200)
      if (r.error) throw r.error
      return r.data.map((x: any) => ({ id: x.user_id, name: x.name, job: x.job || '', bio: x.bio || '', avatar: x.avatar || '', pts: x.pts, mods: x.mods, lvls: x.lvls, cw: x.cw ?? undefined, cs: x.cs ?? undefined, cn: x.cn ?? undefined, code: x.code || undefined, inv: x.inv || undefined, t: Date.parse(x.updated_at), me: x.user_id === cloud!.uid })) // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const m = JSON.parse(localStorage.getItem(LOCAL_P) || 'null')
    return m ? [{ id: 'me', ...m, me: true }] : []
  } catch { return [] }
}

// ---- التفاعلات على التعليقات ----
export type Rx = { c: string; u: string; e: string; mine: boolean }
const LOCAL_R = 'odoo20-rx'
export async function rxList(): Promise<Rx[]> {
  try {
    if (backend === 'claude' && cloud && dbh) {
      const snap = await dbh.collection('reactions').get(); const out: Rx[] = []
      for (const d of snap.docs) for (const it of (d.data().items || [])) out.push({ c: it.c, e: it.e, u: d.id, mine: d.id === cloud.uid })
      return out
    }
    if (backend === 'sb' && sb && cloud) {
      const r = await sb.from('reactions').select('comment_id,user_id,emoji').limit(3000); if (r.error) throw r.error
      return r.data.map((x: any) => ({ c: x.comment_id, u: x.user_id, e: x.emoji, mine: x.user_id === cloud!.uid })) // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    return (JSON.parse(localStorage.getItem(LOCAL_R) || '[]') as { c: string; e: string }[]).map(x => ({ ...x, u: 'me', mine: true }))
  } catch { return [] }
}
// بيضيف التفاعل لو مش موجود وبيشيله لو موجود (تفاعل واحد من كل نوع لكل شخص على التعليق)
export async function rxToggle(c: string, e: string, on: boolean): Promise<void> {
  if (backend === 'claude' && cloud && dbh) {
    const ref = dbh.doc('reactions/' + cloud.uid); const snap = await ref.get()
    const items = ((snap.exists ? snap.data().items : []) || []) as { c: string; e: string }[]
    const rest = items.filter(x => !(x.c === c && x.e === e))
    await ref.set({ items: (on ? [...rest, { c, e }] : rest).slice(-300) })
  } else if (backend === 'sb' && sb && cloud) {
    const r = on ? await sb.from('reactions').upsert({ comment_id: c, user_id: cloud.uid, emoji: e }) : await sb.from('reactions').delete().eq('comment_id', c).eq('user_id', cloud.uid).eq('emoji', e)
    if (r.error) throw r.error
  } else {
    const items = (JSON.parse(localStorage.getItem(LOCAL_R) || '[]') as { c: string; e: string }[]).filter(x => !(x.c === c && x.e === e))
    localStorage.setItem(LOCAL_R, JSON.stringify(on ? [...items, { c, e }] : items))
  }
}

// ---- فيديوهات شرح الموديولات (الأدمن بيرفعها أو يحط لينك، والكل بيشوفها) ----
export type Vid = { url: string; kind: 'link' | 'file' }
const LOCAL_V = 'odoo20-videos'
let vcache: Promise<Record<string, Vid>> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cw = () => (window as unknown as { claude?: { use(n: string): Promise<any> } }).claude
async function cdb() { if (dbh) return dbh; try { const c = cw(); return c?.use ? await c.use('db') : null } catch { return null } }
const rdV = (): Record<string, Vid> => { try { return JSON.parse(localStorage.getItem(LOCAL_V) || '{}') } catch { return {} } }
export function videoList(force = false): Promise<Record<string, Vid>> {
  if (!vcache || force) {
    vcache = (async () => {
      let out: Record<string, Vid> = {}
      try {
        const db = backend !== 'sb' ? await cdb() : null
        if (db) { const snap = await db.collection('videos').get(); for (const d of snap.docs) { const x = d.data(); if (x?.url) out[d.id] = { url: x.url, kind: x.kind === 'file' ? 'file' : 'link' } } }
        else if (hasSupabase && backend !== 'local') {
          await ensureSb(); const r = await sb.from('videos').select('module,url,kind'); if (r.error) throw r.error
          for (const x of r.data) out[x.module] = { url: x.url, kind: x.kind === 'file' ? 'file' : 'link' } // eslint-disable-line
        } else out = rdV()
      } catch { /* لو فشل نعرض الصورة الافتراضية */ }
      return out
    })()
  }
  return vcache
}
export async function videoSet(k: string, v: Vid | null): Promise<void> {
  const db = backend !== 'sb' ? await cdb() : null
  if (db) { if (v) await db.doc('videos/' + k).set({ url: v.url, kind: v.kind, t: Date.now() }); else await db.doc('videos/' + k).delete() }
  else if (hasSupabase && backend !== 'local') {
    await ensureSb()
    const r = v ? await sb.from('videos').upsert({ module: k, url: v.url, kind: v.kind, updated_at: new Date().toISOString() }) : await sb.from('videos').delete().eq('module', k)
    if (r.error) throw r.error
  } else { const m = rdV(); if (v) m[k] = v; else delete m[k]; localStorage.setItem(LOCAL_V, JSON.stringify(m)) }
  vcache = null
}
// رفع ملف فيديو: Supabase Storage أو أصول صفحة Claude. على الجهاز المحلي مفيش مكان مشترك.
export const videoUploadable = () => (backend !== 'sb' && !!cw()) || (hasSupabase && backend !== 'local')
export async function videoUpload(k: string, file: File): Promise<string> {
  if (backend !== 'sb' && cw()) {
    const a = await cw()!.use('assets'); if (!a) throw new Error('noassets')
    const r = await a.upload(file); return r.url as string
  }
  if (hasSupabase && backend !== 'local') {
    await ensureSb(); const path = `${k}-${Date.now()}.${(file.name.split('.').pop() || 'mp4').toLowerCase()}`
    const up = await sb.storage.from('videos').upload(path, file, { upsert: true, contentType: file.type || 'video/mp4' }); if (up.error) throw up.error
    return sb.storage.from('videos').getPublicUrl(path).data.publicUrl as string
  }
  throw new Error('nolocal')
}

// ---- رسائل مباشرة بين المستخدمين ----
export type Msg = { id: string; from: string; fn: string; to: string; tn: string; text: string; t: number; mine: boolean }
export const myUid = () => cloud?.uid || ''
// الرسائل محتاجة مكان مشترك: صفحة Claude أو Supabase (على الجهاز المحلي مفيش حد تراسله)
export const msgCapable = () => (backend === 'claude' && !!cloud && !!dbh) || (backend === 'sb' && !!sb && !!cloud)
export async function msgList(): Promise<Msg[]> {
  try {
    const me = myUid()
    if (backend === 'claude' && cloud && dbh) {
      const snap = await dbh.collection('messages').get(); const out: Msg[] = []
      for (const d of snap.docs) for (const x of (d.data().items || [])) if (d.id === me || x.to === me) out.push({ id: x.id, from: d.id, fn: x.fn || '', to: x.to, tn: x.tn || '', text: x.text, t: x.t, mine: d.id === me })
      return out.sort((a, b) => a.t - b.t)
    }
    if (backend === 'sb' && sb && cloud) {
      const r = await sb.from('messages').select('id,from_user,to_user,from_name,to_name,text,created_at').order('created_at', { ascending: true }).limit(800); if (r.error) throw r.error
      return r.data.map((x: any) => ({ id: x.id, from: x.from_user, fn: x.from_name || '', to: x.to_user, tn: x.to_name || '', text: x.text, t: Date.parse(x.created_at), mine: x.from_user === me })) // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  } catch { /* لو فشل نعرض صندوق فاضي */ }
  return []
}
export async function msgSend(to: string, tn: string, fn: string, text: string): Promise<void> {
  const t = text.trim().slice(0, 1000); if (!t) return
  if (backend === 'claude' && cloud && dbh) {
    const ref = dbh.doc('messages/' + cloud.uid); const snap = await ref.get()
    const items = ((snap.exists ? snap.data().items : []) || []) as object[]
    await ref.set({ items: [...items, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), to, tn, fn, text: t, t: Date.now() }].slice(-300) })
  } else if (backend === 'sb' && sb && cloud) {
    const r = await sb.from('messages').insert({ from_user: cloud.uid, to_user: to, from_name: fn, to_name: tn, text: t }); if (r.error) throw r.error
  } else throw new Error('nomsg')
}
