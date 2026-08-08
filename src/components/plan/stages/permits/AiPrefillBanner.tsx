import type { AiPrefillInfo } from './freeformDialog.types'

const BANNER_CLS: Record<AiPrefillInfo['confidence'], string> = {
  high:   'bg-pine-dim border-pine-border',
  medium: 'bg-amber-dim border-amber-border',
  low:    'bg-red-dim border-red-border',
}

const LABEL_CLS: Record<AiPrefillInfo['confidence'], string> = {
  high:   'text-pine',
  medium: 'text-amber',
  low:    'text-red',
}

const LABEL_TEXT: Record<AiPrefillInfo['confidence'], string> = {
  high:   'Verify',
  medium: 'Review carefully',
  low:    'Low confidence',
}

export function AiPrefillBanner({ aiPrefill }: { aiPrefill: AiPrefillInfo }) {
  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded border mb-4 ${BANNER_CLS[aiPrefill.confidence]}`}>
      <span className={`font-mono text-label font-bold tracking-widest uppercase shrink-0 mt-0.5 ${LABEL_CLS[aiPrefill.confidence]}`}>
        {LABEL_TEXT[aiPrefill.confidence]}
      </span>
      <span className="text-caption text-text-mid leading-relaxed">{aiPrefill.verificationNote}</span>
    </div>
  )
}
