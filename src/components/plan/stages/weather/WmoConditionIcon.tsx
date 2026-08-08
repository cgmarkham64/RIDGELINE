import type { ReactElement } from 'react'

type WmoClass =
  | 'sun' | 'partly-cloudy' | 'overcast' | 'fog'
  | 'drizzle' | 'rain' | 'snow' | 'showers' | 'snow-showers' | 'thunderstorm'

// Assumes the exact WMO code set parseForecastDays/wmoLabel produce
// (0,1,2,3,45,48,51,53,55,61,63,65,71,73,75,77,80,81,82,85,86,95,96,99) —
// unmapped codes inside a range (e.g. 56/57, 66/67) would misclassify here.
const CLASS_RANGES: { max: number; cls: WmoClass }[] = [
  { max: 1,  cls: 'sun' },
  { max: 2,  cls: 'partly-cloudy' },
  { max: 3,  cls: 'overcast' },
  { max: 48, cls: 'fog' },
  { max: 55, cls: 'drizzle' },
  { max: 65, cls: 'rain' },
  { max: 77, cls: 'snow' },
  { max: 82, cls: 'showers' },
  { max: 86, cls: 'snow-showers' },
]

function classify(code: number): WmoClass {
  const match = CLASS_RANGES.find(r => code <= r.max)
  return match?.cls ?? 'thunderstorm'
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const AMB  = '#f59e0b'  // sun, lightning
const CLDS = '#94a3b8'  // clouds, fog
const RAIN = '#60a5fa'  // rain
const SNOW = '#93c5fd'  // snow

// ─── Cloud paths ──────────────────────────────────────────────────────────────
// Cloud sits in y≈8–16.5, leaving y=16.5–20 for precipitation
const CLOUD_D    = 'M4 14 Q4 11 7 11 Q7.5 8 11 9 Q14.5 9.5 14.5 12 Q16.5 12.5 16.5 14.5 Q16.5 16.5 14.5 16.5 H6 Q4 16.5 4 15 Z'
// Smaller cloud shifted lower-left for partly-cloudy
const CLOUD_SM_D = 'M3 15.5 Q3 13.5 5.5 13.5 Q6 11.5 8.5 12 Q11.5 12.5 11.5 14.5 Q13 14.5 13 16 Q13 18 11 18 H4.5 Q3 18 3 16.5 Z'

function Cloud()   { return <path d={CLOUD_D}    fill="none" stroke={CLDS} strokeWidth={1.5} strokeLinejoin="round" /> }
function CloudSm() { return <path d={CLOUD_SM_D} fill="none" stroke={CLDS} strokeWidth={1.5} strokeLinejoin="round" /> }

// ─── Rain drops ───────────────────────────────────────────────────────────────
// Each drop is a short angled line below the cloud
const RAIN_XS   = [5.5, 9.5, 13.5]  // rain (3 drops)
const SHOWER_XS = [4.5, 8,  11.5, 15]  // showers (4 drops, wider spread)

function RainDrops({ xs, heavy = false }: { xs: number[]; heavy?: boolean }) {
  return (
    <>
      {xs.map((x, i) => (
        <line key={i} x1={x} y1={17.5} x2={x - 1} y2={20}
          stroke={RAIN} strokeWidth={heavy ? 1.8 : 1.4} strokeLinecap="round" />
      ))}
    </>
  )
}

// ─── Snow crystals ────────────────────────────────────────────────────────────
const SNOW_XS = [5.5, 10, 14.5]

function SnowCrystals() {
  return (
    <>
      {SNOW_XS.map((cx, i) => {
        const cy = 19
        return (
          <g key={i}>
            <line x1={cx}   y1={cy - 2} x2={cx}   y2={cy + 1} stroke={SNOW} strokeWidth={1.3} strokeLinecap="round" />
            <line x1={cx - 1.7} y1={cy - 1} x2={cx + 1.7} y2={cy} stroke={SNOW} strokeWidth={1.3} strokeLinecap="round" />
            <line x1={cx + 1.7} y1={cy - 1} x2={cx - 1.7} y2={cy} stroke={SNOW} strokeWidth={1.3} strokeLinecap="round" />
          </g>
        )
      })}
    </>
  )
}

// ─── Lightning bolt ───────────────────────────────────────────────────────────
// Filled Z-shaped bolt, fits within y=16–20
function LightningBolt() {
  return <path d="M12 16.5 L8.5 19.5 H10.5 L9 20 L13 17 H11 Z" fill={AMB} stroke="none" />
}

// ─── Per-class glyphs ─────────────────────────────────────────────────────────

const SUN_RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]
const PARTLY_CLOUDY_RAY_ANGLES = [0, 60, 120, 180, 240, 300]
const DRIZZLE_DROP_XS = [6, 10, 14]

function Sun() {
  return (<>
    <circle cx="10" cy="10" r="4" stroke={AMB} strokeWidth={1.5} />
    {SUN_RAY_ANGLES.map(deg => (
      <line key={deg} x1="10" y1="2" x2="10" y2="4.5" stroke={AMB} strokeWidth={1.5} transform={`rotate(${deg} 10 10)`} />
    ))}
  </>)
}

function PartlyCloudy() {
  return (<>
    <circle cx="14" cy="6" r="2.8" stroke={AMB} strokeWidth={1.4} />
    {PARTLY_CLOUDY_RAY_ANGLES.map(deg => (
      <line key={deg} x1="14" y1="1.5" x2="14" y2="3.2" stroke={AMB} strokeWidth={1.3} transform={`rotate(${deg} 14 6)`} />
    ))}
    <CloudSm />
  </>)
}

function Fog() {
  return (<>
    <line x1="2" y1="6"  x2="18" y2="6"  stroke={CLDS} strokeWidth={1.5} />
    <line x1="2" y1="10" x2="18" y2="10" stroke={CLDS} strokeWidth={1.5} />
    <line x1="4" y1="14" x2="16" y2="14" stroke={CLDS} strokeWidth={1.5} />
  </>)
}

function Drizzle() {
  return (<>
    <Cloud />
    {DRIZZLE_DROP_XS.map((cx, i) => <circle key={i} cx={cx} cy={19} r={1.2} fill={RAIN} />)}
  </>)
}

function Rain()         { return (<><Cloud /><RainDrops xs={RAIN_XS} /></>) }
function Showers()      { return (<><Cloud /><RainDrops xs={SHOWER_XS} heavy /></>) }
function Snow()         { return (<><Cloud /><SnowCrystals /></>) }
function Thunderstorm() { return (<><Cloud /><LightningBolt /></>) }

const GLYPH_BY_CLASS: Record<WmoClass, () => ReactElement> = {
  'sun': Sun,
  'partly-cloudy': PartlyCloudy,
  'overcast': Cloud,
  'fog': Fog,
  'drizzle': Drizzle,
  'rain': Rain,
  'showers': Showers,
  'snow': Snow,
  'snow-showers': Snow,
  'thunderstorm': Thunderstorm,
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function WmoConditionIcon({ code, size = 16, title }: { code: number; size?: number; title?: string }) {
  const Glyph = GLYPH_BY_CLASS[classify(code)]

  return (
    <svg
      width={size} height={size} viewBox="0 0 20 20"
      fill="none" strokeLinecap="round" strokeLinejoin="round"
      aria-label={title} role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <Glyph />
    </svg>
  )
}
