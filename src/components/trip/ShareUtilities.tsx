import { useState } from 'react'

const COPY_FEEDBACK_TIMEOUT_MS = 2500

export function ShareUtilities() {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), COPY_FEEDBACK_TIMEOUT_MS)
    })
  }

  return (
    <div className="px-5 py-3 flex flex-col gap-0.5">
      <div className="flex items-center justify-between py-1.5">
        <div>
          <div className="font-sans text-body-sm font-medium text-text">Copy link</div>
          <div className="font-mono text-label text-text-dim">Share a direct link to this trip</div>
        </div>
        <button onClick={copyLink} className={`btn btn-sm shrink-0 ${copied ? 'btn-ghost' : 'btn-sky'}`}>
          {copied ? (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3 h-3 text-pine" style={{ strokeWidth: 2.5 }}><path d="M20 6L9 17l-5-5" /></svg><span className="text-pine">Copied</span></>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3 h-3" style={{ strokeWidth: 2 }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>Copy</>
          )}
        </button>
      </div>
      <div className="flex items-center justify-between py-1.5 opacity-50">
        <div>
          <div className="font-sans text-body-sm font-medium text-text">Export as PDF</div>
          <div className="font-mono text-label text-text-dim">Styled trip report with journal, map &amp; stats</div>
        </div>
        <span className="font-mono text-label tracking-widest uppercase text-text-dim border border-border rounded-[3px] px-[7px] py-[3px] shrink-0">
          Soon
        </span>
      </div>
    </div>
  )
}
