// Shenandoah scale: difficulty = √(gain_ft × 2 × miles)
// Original NPS thresholds top out at 150 ("strenuous") — calibrated for Shenandoah day hikes.
// Backpacking threshold scaled up to 350 to account for multi-day context and Sierra-scale terrain.

const BACKPACKING_HARD_THRESHOLD = 350

export function shenandoahScore(mi: number, gainFt: number): number {
  return Math.sqrt(gainFt * 2 * mi)
}

export function suggestHard(mi: number, gainFt: number): boolean {
  return shenandoahScore(mi, gainFt) >= BACKPACKING_HARD_THRESHOLD
}