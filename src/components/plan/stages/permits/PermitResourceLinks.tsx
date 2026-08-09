import { PermitResourceLinkRow } from './PermitResourceLinkRow'
import type { PermitLink } from '../../types'

type PermitResourceLinksProps = {
  links: PermitLink[]
  canEdit: boolean
  canLookup: boolean
  lookupLoading: boolean
  onSearch: (name: string) => void
}

export function PermitResourceLinks({ links, canEdit, canLookup, lookupLoading, onSearch }: PermitResourceLinksProps) {
  if (links.length === 0) return null

  return (
    <section>
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">Permit &amp; access resources</div>
      <div className="flex flex-col gap-2">
        {links.map((link, i) => (
          <PermitResourceLinkRow key={i} link={link} canEdit={canEdit} canLookup={canLookup} lookupLoading={lookupLoading} onSearch={onSearch} />
        ))}
      </div>
    </section>
  )
}
