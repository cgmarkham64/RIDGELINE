import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import gearItemsRouter from './routes/gearItems'
import journalDaysRouter from './routes/journalDays'
import journalScanRouter from './routes/journalScan'
import loadoutsRouter from './routes/loadouts'
import tripsRouter from './routes/trips'

const app = express()
const PORT = process.env.PORT ?? 8000
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/ridgeline'

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '10mb' }))

app.use('/api/gear-items', gearItemsRouter)
app.use('/api/journal-days', journalDaysRouter)
app.use('/api/journal-scan', journalScanRouter)
app.use('/api/loadouts', loadoutsRouter)
app.use('/api/trips', tripsRouter)

app.get('/health', (_req, res) => res.json({ ok: true }))

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err)
    process.exit(1)
  })
