import type { Contact } from './departStage.constants'
import { DEFAULT_DAY_ROWS } from './departStage.constants'

export function OnePagerPreview({ days, contacts }: { days: { n: number; name: string; mi: number; hard?: boolean }[] | null; contacts: Contact[] }) {
  const dayRows = days
    ? days.map(d => `D${d.n} ${d.name} · ${d.mi} mi${d.hard ? ' ⚠' : ''}`)
    : DEFAULT_DAY_ROWS

  const emergencyContacts = contacts.filter(c => c.tone === 'red' || c.tone === 'amber')

  return (
    <div
      className="bg-bg border border-border rounded overflow-hidden font-mono text-text-dim"
      style={{ aspectRatio: '8.5 / 11', padding: '14px 16px', fontSize: 7, lineHeight: 1.5 }}
    >
      <div className="font-heading text-text mb-0.5" style={{ fontSize: 11, fontWeight: 800 }}>
        SIERRA HIGH ROUTE · AUG 11–19
      </div>
      <div className="text-amber tracking-[0.16em] mb-2" style={{ fontSize: 7 }}>
        RIDGELINE TRIP CARD
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-2" style={{ fontSize: 6 }}>
        <div><strong className="text-text">Party</strong><br />Casey M., Jamie T., Lin K., Rae P.</div>
        <div><strong className="text-text">InReach</strong><br />MAPSHARE/casey · check 8PM</div>
        <div><strong className="text-text">Entry</strong><br />Onion Valley · 8/12 7:30AM</div>
        <div><strong className="text-text">Exit</strong><br />Whitney Portal · 8/19 ~3PM</div>
      </div>

      <div className="border-t border-dashed border-border-mid my-1.5" />

      <div className="font-bold text-text mb-0.5" style={{ fontSize: 6, letterSpacing: '0.1em' }}>DAILY PLAN</div>
      {dayRows.map((row, i) => (
        <div key={i} style={{ fontSize: 6 }}>{row}</div>
      ))}

      <div className="border-t border-dashed border-border-mid my-1.5" />

      <div className="font-bold text-text mb-0.5" style={{ fontSize: 6, letterSpacing: '0.1em' }}>EMERGENCY</div>
      {emergencyContacts.map(c => (
        <div key={c.name} style={{ fontSize: 6 }}>{c.name} · {c.phone}</div>
      ))}
    </div>
  )
}
