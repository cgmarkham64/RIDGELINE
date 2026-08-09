import { TagInput } from './TagInput'

type WildlifeSectionProps = {
  wildlife: string[]
  onChange: (tags: string[]) => void
}

export function WildlifeSection({ wildlife, onChange }: WildlifeSectionProps) {
  return (
    <>
      <div className="flex items-center gap-3 mb-3 mt-1">
        <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim shrink-0">Wildlife</span>
        <hr className="flex-1 border-0 border-t border-border" />
      </div>
      <div className="mb-5">
        <TagInput tags={wildlife} placeholder="Bear, Marmot, Clark's Nutcracker…" onChange={onChange} />
      </div>
    </>
  )
}
