export function TripHeroBackground() {
  return (
    <>
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, #1c1308 0%, #2e2618 22%, #3c3c2c 48%, #5a6858 72%, #8a9a88 100%)' }}
      />

      {/* Mountain silhouette */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1200 200"
          preserveAspectRatio="xMidYMax slice"
          style={{ display: 'block', width: '100%', height: 200 }}
        >
          <polygon
            points="0,200 130,200 230,68 340,140 470,28 590,108 710,44 840,125 970,62 1100,138 1200,90 1200,200"
            fill="#0f0d0b"
            opacity="0.97"
          />
          <polygon
            points="0,200 80,200 170,105 280,160 400,55 510,122 630,50 760,130 890,68 1020,148 1130,88 1200,120 1200,200"
            fill="#13100a"
            opacity="0.52"
          />
        </svg>
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(15,13,11,1) 0%, rgba(15,13,11,0.55) 32%, rgba(15,13,11,0.1) 65%, transparent 100%)' }}
      />
    </>
  )
}
