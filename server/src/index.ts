import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRouter from './routes/auth'
import gearItemsRouter from './routes/gearItems'
import journalDaysRouter from './routes/journalDays'
import journalScanRouter from './routes/journalScan'
import loadoutsRouter from './routes/loadouts'
import tripsRouter from './routes/trips'
import usersRouter from './routes/users'
import notificationsRouter from './routes/notifications'
import { requireAuth } from './middleware/auth'

const app = express()
const PORT = process.env.PORT ?? 8000
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/ridgeline'

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '10mb' }))

// Public routes
app.use('/api/auth', authRouter)

// Protected routes — all require a valid JWT
app.use('/api/gear-items', requireAuth, gearItemsRouter)
app.use('/api/journal-days', requireAuth, journalDaysRouter)
app.use('/api/journal-scan', requireAuth, journalScanRouter)
app.use('/api/loadouts', requireAuth, loadoutsRouter)
app.use('/api/trips', requireAuth, tripsRouter)
app.use('/api/users', requireAuth, usersRouter)
app.use('/api/notifications', requireAuth, notificationsRouter)

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
