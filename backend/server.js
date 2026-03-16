import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import checkinRouter from './routes/checkin.js'
import dailyOutputRouter from './routes/dailyOutput.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'primeform-elite-backend' })
})

app.get('/test-firebase', async (req, res) => {
  try {
    const { db } = await import('./config/firebase.js')
    const test = await db.collection('_test').limit(1).get()
    res.json({ status: 'firebase ok', connected: true })
  } catch (error) {
    res.json({ status: 'firebase error', message: error.message })
  }
})

app.use('/api/elite', checkinRouter)
app.use('/api/elite', dailyOutputRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
