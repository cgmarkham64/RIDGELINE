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
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border-mid)',
          borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 420,
          margin: '0 16px', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
              Share trip
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--text-dim)', marginTop: 3,
            }}>
              {trip.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 'var(--r-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-dim)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 14, height: 14, strokeWidth: 2 }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Copy link */}
          <div style={{
            border: `1px solid ${copied ? 'var(--pine-border)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)', padding: '14px 16px',
            background: copied ? 'var(--pine-dim)' : 'var(--surface2)',
            transition: 'all 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                  Copy link
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
                  Share a direct link to this trip
                </div>
              </div>
              <button onClick={copyLink} className={`btn btn-sm ${copied ? 'btn-ghost' : 'btn-sky'}`} style={{ flexShrink: 0 }}>
                {copied ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 12, height: 12, strokeWidth: 2.5, color: 'var(--pine)' }}>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span style={{ color: 'var(--pine)' }}>Copied</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 12, height: 12, strokeWidth: 2 }}>
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
          <div style={{
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            padding: '14px 16px', background: 'var(--surface2)', opacity: 0.6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                  Export as PDF
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
                  Styled trip report with journal, map &amp; stats
                </div>
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--text-dim)',
                border: '1px solid var(--border)', borderRadius: 3,
                padding: '3px 7px', flexShrink: 0,
              }}>
                Coming soon
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}