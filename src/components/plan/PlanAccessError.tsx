// Vertical bars — 6 bars with ~23px gaps
const JAIL_BAR_X_POSITIONS = [14, 47, 80, 114, 147, 180]

export function PlanAccessError({ is403 }: { is403: boolean }) {
  return (
    <div className="flex h-full items-center justify-center w-full">
      <div className="text-center max-w-xs px-6">

        {/* Bear peeking over a food bag */}
        <svg viewBox="0 0 200 200" width="180" height="180" className="mx-auto mb-5" aria-hidden="true">

          {/* ── Food bag (hero) ── */}
          {/* Bag body */}
          <rect x="22" y="108" width="156" height="88" rx="14" fill="#f0a030"/>
          {/* Bag shading */}
          <rect x="22" y="108" width="156" height="88" rx="14" fill="url(#bagShade)"/>
          {/* Gathered neck / cinch */}
          <rect x="54" y="96" width="92" height="22" rx="9" fill="#c47820"/>
          {/* Drawstring loop */}
          <path d="M84 96 Q100 82 116 96" stroke="#a36010" strokeWidth="4" fill="none" strokeLinecap="round"/>
          {/* Cord toggle */}
          <rect x="94" y="78" width="12" height="8" rx="3" fill="#7a4810"/>
          {/* Bag label area */}
          <rect x="60" y="126" width="80" height="46" rx="8" fill="#e09020" opacity="0.5"/>

          {/* ── Bear head peeking over the top ── */}
          {/* Ear backs (behind head) */}
          <circle cx="67"  cy="86" r="16" fill="#7a4820"/>
          <circle cx="133" cy="86" r="16" fill="#7a4820"/>
          {/* Head */}
          <circle cx="100" cy="98" r="44" fill="#9a5e2e"/>
          {/* Ear fronts */}
          <circle cx="67"  cy="86" r="10" fill="#b97840"/>
          <circle cx="133" cy="86" r="10" fill="#b97840"/>
          {/* Snout */}
          <ellipse cx="100" cy="113" rx="17" ry="12" fill="#b97840"/>
          {/* Nose */}
          <ellipse cx="100" cy="106" rx="6.5" ry="4.5" fill="#2a1008"/>
          {/* Caught expression: wide eyes, one brow up one furrowed */}
          <circle cx="85"  cy="92" r="6.5" fill="#2a1008"/>
          <circle cx="115" cy="92" r="6.5" fill="#2a1008"/>
          <circle cx="83"  cy="90" r="2.5" fill="white" opacity="0.9"/>
          <circle cx="113" cy="90" r="2.5" fill="white" opacity="0.9"/>
          {/* Left brow — raised high (surprised) */}
          <path d="M78 82 Q85 77 92 81" stroke="#2a1008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          {/* Right brow — furrowed inward (guilty) */}
          <path d="M108 79 Q115 82 122 79" stroke="#2a1008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          {/* Mouth — small flat "uh oh" line */}
          <path d="M93 120 Q100 118 107 120" stroke="#2a1008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          {/* Paws gripping bag rim */}
          <ellipse cx="46"  cy="110" rx="18" ry="11" fill="#9a5e2e"/>
          <ellipse cx="154" cy="110" rx="18" ry="11" fill="#9a5e2e"/>
          {/* Paw toe lines */}
          <line x1="36" y1="106" x2="34" y2="114" stroke="#7a4820" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="46" y1="104" x2="46" y2="113" stroke="#7a4820" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="56" y1="106" x2="58" y2="114" stroke="#7a4820" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="144" y1="106" x2="142" y2="114" stroke="#7a4820" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="154" y1="104" x2="154" y2="113" stroke="#7a4820" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="164" y1="106" x2="166" y2="114" stroke="#7a4820" strokeWidth="1.5" strokeLinecap="round"/>

          {/* ── Jail bars (foreground — drawn last so they sit in front) ── */}
          {/* Horizontal crossbars */}
          <rect x="0" y="0"   width="200" height="11" fill="#1a1410"/>
          <rect x="0" y="189" width="200" height="11" fill="#1a1410"/>
          <rect x="0" y="94"  width="200" height="9"  fill="#1a1410"/>
          {JAIL_BAR_X_POSITIONS.map(x => (
            <g key={x}>
              <rect x={x}   y="0" width="10" height="200" rx="3" fill="#1a1410"/>
              <rect x={x+1} y="0" width="3"  height="200" rx="2" fill="#2e2620" opacity="0.7"/>
            </g>
          ))}

          <defs>
            <linearGradient id="bagShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="white" stopOpacity="0.12"/>
              <stop offset="100%" stopColor="black" stopOpacity="0.18"/>
            </linearGradient>
          </defs>
        </svg>

        <div className="font-heading text-[17px] font-extrabold text-text mb-2">
          {is403 ? 'Looks like you got uninvited' : 'Something scared us off the trail'}
        </div>
        <p className="text-body text-text-mid leading-relaxed">
          {is403
            ? "You no longer have access to this trip. If you think this is a mistake, contact the trip owner — they'll know what to do."
            : "We hit an unexpected snag loading this trip. Try refreshing the page to get back on track."}
        </p>
      </div>
    </div>
  )
}
