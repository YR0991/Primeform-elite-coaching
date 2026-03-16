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

app.use('/api/elite', checkinRouter)
app.use('/api/elite', dailyOutputRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
