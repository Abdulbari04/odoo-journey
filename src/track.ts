// تتبّع استخدام الموقع: بيتخزن مع حساب المستخدم، وبيتبعت نسخة منه للأدمن
import * as store from './store'

export type Stat = {
  name: string; job: string; joined: number; last: number; visits: number
  done: number; levels: number; exams: number; passes: number
  searches: string[]; mods: Record<string, number>
}
let s: Stat | null = null
let timer: number | undefined
const key = (n: string) => 'odoo20-stat-' + n.trim().toLowerCase()

const flush = () => {
  if (!s) return
  const j = JSON.stringify(s); store.set(key(s.name), j); void store.pushStats(s)
}
const later = () => { clearTimeout(timer); timer = window.setTimeout(flush, 3000) }

export function start(u: { name: string; job: string }) {
  let o: Partial<Stat> = {}
  try { o = JSON.parse(store.get(key(u.name)) || '{}') } catch { /* جديد */ }
  const now = Date.now()
  s = { name: u.name, job: u.job, joined: o.joined || now, last: now, visits: (o.visits || 0) + 1, done: o.done || 0, levels: o.levels || 0, exams: o.exams || 0, passes: o.passes || 0, searches: o.searches || [], mods: o.mods || {} }
  flush()
}
export function progress(done: number, levels: number) { if (s && (s.done !== done || s.levels !== levels)) { s.done = done; s.levels = levels; s.last = Date.now(); later() } }
export function module_(k: string) { if (s) { s.mods[k] = (s.mods[k] || 0) + 1; s.last = Date.now(); later() } }
export function search(q: string) { if (s) { s.searches = [q.slice(0, 60), ...s.searches.filter(x => x !== q)].slice(0, 30); later() } }
export function exam(passed: boolean) { if (s) { s.exams++; if (passed) s.passes++; s.last = Date.now(); later() } }
export const stop = () => { clearTimeout(timer); flush(); s = null }
