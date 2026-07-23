import type { Schedule } from '../types'

// Mirrors the server's resolver (service/oncall.go) closely enough for
// at-a-glance display: overrides win, else the highest-position layer, with
// members rotating every rotation_length_days from the layer's start_at.
export function resolveOnCall(schedule: Schedule, at = new Date()): string | null {
  for (const o of schedule.overrides ?? []) {
    if (at >= new Date(o.start_at) && at < new Date(o.end_at)) return o.user_id
  }
  let oncall: string | null = null
  for (const l of schedule.layers ?? []) {
    const n = l.user_ids.length
    if (n === 0) continue
    const days = l.rotation_length_days > 0 ? l.rotation_length_days : 7
    const period = days * 24 * 60 * 60 * 1000
    const elapsed = Math.max(at.getTime() - new Date(l.start_at).getTime(), 0)
    const idx = Math.floor(elapsed / period) % n
    oncall = l.user_ids[idx]
  }
  return oncall
}
