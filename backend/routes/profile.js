import express from 'express'
import { db } from '../config/firebase.js'
import { ELITE_USERS } from '../config/collections.js'

const router = express.Router()

router.post('/profile', async (req, res) => {
  try {
    const {
      userId,
      name,
      gender,
      weight_kg,
      height_cm,
      age,
      sport_profile_id,
      event_name,
      event_date,
      level,
      strava_min_week_hours,
      strava_max_week_hours
    } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'userId is verplicht' })
    }

    const profileData = {
      userId,
      name: name ?? '',
      gender: gender ?? 'M',
      weight_kg: weight_kg ?? 70,
      height_cm: height_cm ?? 170,
      age: age ?? 30,
      sport_profile_id: sport_profile_id ?? '',
      event_name: event_name ?? '',
      event_date: event_date ?? '',
      level: level ?? 'beginner',
      strava_min_week_hours: strava_min_week_hours ?? 6,
      strava_max_week_hours: strava_max_week_hours ?? 10,
      physiology_module: gender === 'V' ? 'A' : 'B',
      plan_generated: false,
      created_at: new Date().toISOString()
    }

    await db.collection(ELITE_USERS).doc(userId).set(profileData, { merge: true })

    res.status(201).json({ success: true, userId })
  } catch (error) {
    console.error('Profile POST error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

router.get('/profile', async (req, res) => {
  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'userId query param is verplicht' })
    }

    const doc = await db.collection(ELITE_USERS).doc(userId).get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Profiel niet gevonden' })
    }

    res.json(doc.data())
  } catch (error) {
    console.error('Profile GET error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

export default router
