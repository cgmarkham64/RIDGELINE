import { useState } from 'react'
import type { Trip } from '../../types'

interface Props {
  trip: Trip
  onClose: () => void
}

export function ShareDialog({ trip, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-mid rounded-lg w-full max-w-[420px] mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="font-heading text-[14px] font-extrabold text-text">
              Share trip
            </div>
            <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-text-dim mt-[3px]">
              {trip.title}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-sm flex items-center justify-center bg-surface-2 border border-border cursor-pointer text-text-dim"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-[14px] h-[14px]"
              style={{ strokeWidth: 2 }}
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="px-5 py-4 flex flex-col gap-[10px]">
          {/* Copy link */}
          <div
            className="rounded-md px-4 py-[14px] transition-all duration-200"
            style={{
              border: `1px solid ${copied ? 'var(--pine-border)' : 'var(--border)'}`,
              background: copied ? 'var(--pine-dim)' : 'var(--surface2)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-heading text-[12px] font-bold text-text mb-[3px]">
                  Copy link
                </div>
                <div className="font-mono text-[9px] tracking-[0.08em] text-text-dim">
                  Share a direct link to this trip
                </div>
              </div>
              <button
                onClick={copyLink}
                className={`btn btn-sm shrink-0 ${copied ? 'btn-ghost' : 'btn-sky'}`}
              >
                {copied ? (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="w-3 h-3 text-pine"
                      style={{ strokeWidth: 2.5 }}
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span className="text-pine">Copied</span>
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="w-3 h-3"
                      style={{ strokeWidth: 2 }}
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Export PDF */}
          <div className="border border-border rounded-md px-4 py-[14px] bg-surface-2 opacity-60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-heading text-[12px] font-bold text-text mb-[3px]">
                  Export as PDF
                </div>
                <div className="font-mono text-[9px] tracking-[0.08em] text-text-dim">
                  Styled trip report with journal, map &amp; stats
                </div>
              </div>
              <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-text-dim border border-border rounded-[3px] px-[7px] py-[3px] shrink-0">
                Coming soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}