import * as store from './store'
import { LEVELS } from './levels'

// توزيع النقاط: الإجمالي 35,000
export const MOD_PTS = 1000 // لكل موديول مكتمل (23 × 1000 = 23,000)
export const LV_PTS = [1500, 1500, 1500, 1500, 2000, 2000, 2000] // لكل مستوى يُجتاز اختباره (= 12,000)
export const MAX_PTS = 23 * MOD_PTS + LV_PTS.reduce((a, b) => a + b, 0)
export const fmtN = (n: number) => n.toLocaleString('en-US')

const KEY = 'odoo20-pen'
export type Pen = Record<number, number> // رقم المستوى -> عدد الإجابات الخاطئة التراكمي
export const readPen = (): Pen => { try { return JSON.parse(store.get(KEY) || '{}') } catch { return {} } }
// قيمة السؤال الصحيح في مستوى معيّن
export const qVal = (levelId: number) => LV_PTS[levelId - 1] / (LEVELS[levelId - 1]?.exam.length || 5)
// كل إجابة خاطئة تخصم قيمة سؤال صحيح من نفس المستوى
export function addPen(levelId: number, wrong: number) {
  if (wrong <= 0) return
  const p = readPen(); p[levelId] = (p[levelId] || 0) + wrong
  store.set(KEY, JSON.stringify(p)); window.dispatchEvent(new Event('odoo20-pen'))
}
export function calcPts(mods: number, passed: Record<number, boolean>, pen: Pen) {
  const lv = LEVELS.reduce((s, l) => s + (passed[l.id] ? LV_PTS[l.id - 1] : 0), 0)
  const cut = Object.entries(pen).reduce((s, [id, n]) => s + n * qVal(Number(id)), 0)
  return Math.max(0, Math.round(mods * MOD_PTS + lv - cut))
}
export const rankOf = (p: number) => (p >= 25000 ? 'مستشار' : p >= 15000 ? 'محلّل' : p >= 7000 ? 'ممارس' : p >= 2000 ? 'متعلّم' : 'مبتدئ')

// مكافأة الدعوة: +500 نقطة عن كل صديق دعوته وأنهى موديولًا واحدًا على الأقل، بحد أقصى 10 أصدقاء
export const INV_PTS = 500, INV_MAX = 10
export const invBonus = (n: number) => Math.min(Math.max(n, 0), INV_MAX) * INV_PTS
