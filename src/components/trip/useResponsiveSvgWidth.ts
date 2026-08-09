import { useRef, useState, useLayoutEffect } from 'react'
import { VB_W_DEFAULT } from './elevationProfile.geometry'

export function useResponsiveSvgWidth() {
  const [containerW, setContainerW] = useState(VB_W_DEFAULT)
  const svgRef = useRef<SVGSVGElement>(null)

  useLayoutEffect(() => {
    const el = svgRef.current
    if (!el) return
    const { width } = el.getBoundingClientRect()
    if (width > 0) setContainerW(Math.floor(width))
    const obs = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width)
      if (w > 0) setContainerW(w)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return { svgRef, containerW }
}
