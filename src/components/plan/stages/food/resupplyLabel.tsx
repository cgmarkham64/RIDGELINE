import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { OZ_PER_LB } from './foodStage.helpers'
import type { ResupplyLabelData } from './resupplyLabel.types'

const AMBER = '#b8792f'
const DIM   = '#666666'
const BORDER = '#cccccc'

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  tripTitle: { fontSize: 9, color: DIM, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  stopName: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  meta: { fontSize: 10, color: DIM, marginBottom: 18 },
  addressBox: {
    borderWidth: 1.5, borderColor: '#1a1a1a', borderRadius: 4, padding: 16,
    marginBottom: 20, minHeight: 80, justifyContent: 'center',
  },
  addressLine: { fontSize: 13, lineHeight: 1.5 },
  sectionLabel: { fontSize: 9, color: DIM, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: BORDER,
  },
  itemName: { flex: 1 },
  itemQty: { width: 40, textAlign: 'right', color: DIM },
  itemWeight: { width: 60, textAlign: 'right', color: DIM },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  totalsLabel: { fontSize: 10, fontWeight: 700 },
  totalsValue: { fontSize: 10, fontWeight: 700, color: AMBER },
})

function AddressBlock({ holdAddress }: { holdAddress: string }) {
  const lines = holdAddress.split('\n')
  return (
    <View style={styles.addressBox}>
      {lines.map((line, i) => <Text key={i} style={styles.addressLine}>{line || ' '}</Text>)}
    </View>
  )
}

function ContentsList({ items }: { items: ResupplyLabelData['items'] }) {
  if (items.length === 0) {
    return <Text style={{ color: DIM, fontStyle: 'italic' }}>No meals planned for this box yet</Text>
  }
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemQty}>×{item.qty}</Text>
          <Text style={styles.itemWeight}>{item.weightOz.toFixed(1)} oz</Text>
        </View>
      ))}
    </View>
  )
}

export function ResupplyLabelDocument({ data }: { data: ResupplyLabelData }) {
  const dayRange = data.fromDay === data.toDay ? `Day ${data.fromDay}` : `Day ${data.fromDay}–${data.toDay}`
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <Text style={styles.tripTitle}>{data.tripTitle}</Text>
        <Text style={styles.stopName}>{data.stopName}</Text>
        <Text style={styles.meta}>{data.boxLabel} · {dayRange}{data.shipBy ? ` · Ship by ${data.shipBy}` : ''}</Text>

        <Text style={styles.sectionLabel}>Hold for hiker — mail to</Text>
        <AddressBlock holdAddress={data.holdAddress} />

        <Text style={styles.sectionLabel}>Contents</Text>
        <ContentsList items={data.items} />

        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Total</Text>
          <Text style={styles.totalsValue}>{data.kcalTotal.toLocaleString()} kcal · {(data.weightOz / OZ_PER_LB).toFixed(1)} lb</Text>
        </View>
      </Page>
    </Document>
  )
}
