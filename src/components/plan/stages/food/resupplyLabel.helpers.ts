import type { MealItem } from '../../types'
import type { ResupplyLabelData, ResupplyLabelItem } from './resupplyLabel.types'

export function aggregateItemsByName(items: MealItem[]): ResupplyLabelItem[] {
  const byName = new Map<string, ResupplyLabelItem>()
  for (const item of items) {
    const qty = item.qty ?? 1
    const existing = byName.get(item.name)
    if (existing) {
      existing.qty += qty
      existing.weightOz += item.weightOz
    } else {
      byName.set(item.name, { name: item.name, qty, weightOz: item.weightOz })
    }
  }
  return Array.from(byName.values())
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function labelDateSlug(data: ResupplyLabelData): string {
  if (data.shipBy.trim() !== '') return slugify(data.shipBy)
  return data.fromDay === data.toDay ? `day${data.fromDay}` : `day${data.fromDay}-${data.toDay}`
}

export async function downloadResupplyLabel(data: ResupplyLabelData) {
  const [{ pdf }, { ResupplyLabelDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./resupplyLabel'),
  ])
  const blob = await pdf(ResupplyLabelDocument({ data })).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `resupply-${slugify(data.tripTitle)}-${labelDateSlug(data)}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
