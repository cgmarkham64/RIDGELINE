const SPARK_WIDTH = 1000
const SPARK_HEIGHT = 60
const SPARK_PAD = 4

export function ElevSparkline({ elevs }: { elevs: number[] }) {
  if (elevs.length < 2) return null
  const min = Math.min(...elevs)
  const max = Math.max(...elevs)
  const range = max - min || 1
  const pts = elevs.map((e, i): [number, number] => [
    (i / (elevs.length - 1)) * SPARK_WIDTH,
    SPARK_HEIGHT - SPARK_PAD - ((e - min) / range) * (SPARK_HEIGHT - SPARK_PAD * 2),
  ])
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const fill = `${d} L${SPARK_WIDTH},${SPARK_HEIGHT} L0,${SPARK_HEIGHT} Z`
  return (
    <svg viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`} style={{ width: '100%', height: 44 }} preserveAspectRatio="none">
      <path d={fill} fill="var(--amber)" fillOpacity={0.08} />
      <path d={d} fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
