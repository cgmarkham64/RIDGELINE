import { CompanionTagInput } from './CompanionTagInput'

type CompanionsSectionProps = {
  companions: string[]
  onChange: (tags: string[]) => void
  onMentionAdded: (sub: string) => void
  pendingInviteCount: number
}

export function CompanionsSection({ companions, onChange, onMentionAdded, pendingInviteCount }: CompanionsSectionProps) {
  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim shrink-0">Companions</span>
        <hr className="flex-1 border-0 border-t border-border" />
      </div>
      <div className="mb-5">
        <CompanionTagInput tags={companions} onChange={onChange} onMentionAdded={onMentionAdded} />
        {pendingInviteCount > 0 && (
          <p className="font-mono text-label text-text-dim mt-2">
            {pendingInviteCount === 1
              ? 'Will send 1 collaboration invite on save'
              : `Will send ${pendingInviteCount} collaboration invites on save`}
          </p>
        )}
      </div>
    </>
  )
}
