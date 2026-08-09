import { IconPlus, IconExternalLink } from '../../../icons'
import { linkDomain, isBookable } from './permitsListView.helpers'
import { isSafeExternalUrl } from '../../../../lib/utils'
import type { PermitLink } from '../../types'

type PermitResourceLinkRowProps = {
  link: PermitLink
  canEdit: boolean
  canLookup: boolean
  lookupLoading: boolean
  onSearch: (name: string) => void
}

function LinkTitle({ safe, url, title }: { safe: boolean; url: string; title: string }) {
  if (!safe) {
    return (
      <span title="Unsafe link scheme — not rendered as a clickable link" className="flex-1 min-w-0 font-heading text-body-sm font-bold text-text-dim truncate">
        {title}
      </span>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 font-heading text-body-sm font-bold text-text hover:text-amber transition-colors truncate no-underline">
      {title}
    </a>
  )
}

export function PermitResourceLinkRow({ link, canEdit, canLookup, lookupLoading, onSearch }: PermitResourceLinkRowProps) {
  const bookable = isBookable(link.url)
  const domain = linkDomain(link.url)
  const safe = isSafeExternalUrl(link.url)

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 border rounded-lg transition-colors ${
        bookable
          ? 'bg-surface border-border hover:border-border-mid hover:bg-surface-2'
          : 'bg-surface-2 border-border opacity-70 hover:opacity-100'
      }`}
    >
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded border font-mono text-label tracking-[0.06em] uppercase font-semibold shrink-0 ${
        bookable ? 'bg-pine-dim border-pine-border text-pine' : 'bg-transparent border-border text-text-dim'
      }`}>
        {domain}
      </span>
      <LinkTitle safe={safe} url={link.url} title={link.title} />
      {bookable && canEdit && canLookup && (
        <button
          onClick={() => onSearch(link.title)}
          disabled={lookupLoading}
          title="Look up and add this permit"
          className="inline-flex items-center gap-1 font-mono text-label tracking-[0.06em] uppercase text-text-dim hover:text-amber transition-colors bg-transparent border-none cursor-pointer shrink-0 px-1 py-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <IconPlus size={9} /> Add
        </button>
      )}
      {safe && (
        <a href={link.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-text-dim hover:text-amber transition-colors">
          <IconExternalLink size={12} />
        </a>
      )}
    </div>
  )
}
