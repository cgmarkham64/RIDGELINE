import { IconBell, IconPlus } from '../../../icons'
import type { Contact } from './departStage.constants'
import { CONTACT_AVATAR_CLS } from './departStage.constants'

export function EmergencyContactsCard({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Emergency contacts</span>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
        >
          <IconPlus /> Contact
        </button>
      </div>
      {contacts.map((c, i) => (
        <div
          key={c.name}
          className={`grid items-center gap-3 py-2 ${i < contacts.length - 1 ? 'border-b border-border' : ''}`}
          style={{ gridTemplateColumns: '28px 1fr auto' }}
        >
          <span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${CONTACT_AVATAR_CLS[c.tone]}`}>
            <IconBell />
          </span>
          <div className="min-w-0">
            <div className="text-body-sm font-semibold text-text leading-snug">{c.name}</div>
            <div className="font-mono text-label text-text-dim mt-0.5">{c.role}</div>
          </div>
          <span className="font-mono text-caption text-text-mid whitespace-nowrap">{c.phone}</span>
        </div>
      ))}
    </div>
  )
}
