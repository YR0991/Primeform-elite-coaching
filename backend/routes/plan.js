import express from 'express'
import { db } from '../config/firebase.js'
import { ELITE_USERS, ELITE_PLANS } from '../config/collections.js'
import { generatePlan } from '../engine/planGenerator.js'
import { sportProfiles } from '../data/sportProfiles.js'

const router = express.Router()

/**
 * Bouwt userData voor planGenerator uit Firestore user document.
 */
function buildUserData (user, userId) {
  const sp = user.sport_profile_id ? sportProfiles.find(p => p.id === user.sport_profile_id) : null
  const intensityDist = sp?.intensity_distribution
    ? `${sp.intensity_distribution.zone2_pct}% zone2 / ${sp.intensity_distribution.high_pct}% hoog`
    : (user.intensity_distribution ?? '70% zone2 / 30% hoog')

  const stravaMin = user.strava_min_week_hours ?? 4
  const stravaMax = user.strava_max_week_hours ?? 10
  const weeklyHours = user.weekly_volume_hours ?? (stravaMin + stravaMax) / 2

  return {
    userId,
    name: user.name ?? 'Atleet',
    gender: user.gender ?? 'M',
    weight_kg: user.weight_kg ?? 70,
    height_cm: user.height_cm ?? 170,
    age: user.age ?? 30,
    event_name: user.event_name ?? 'Wedstrijd',
    event_date: user.event_date,
    level: user.level ?? 'beginner',
    weekly_volume_hours: weeklyHours,
    intensity_distribution: intensityDist,
    strava_max_week_hours: stravaMax,
    strava_min_week_hours: stravaMin
  }
}

router.post('/plan/generate', async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'userId is verplicht' })
    }

    // 1. Haal gebruikersprofiel op
    const userDoc = await db.collection(ELITE_USERS).doc(userId).get()
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Gebruiker niet gevonden' })
    }

    const user = userDoc.data()
    const { sport_profile_id, event_date, level } = user

    const hasStravaData = user.strava_min_week_hours != null && user.strava_max_week_hours != null

    if (!sport_profile_id || !event_date || !level || !hasStravaData) {
      return res.status(400).json({
        error: 'Profiel mist vereiste velden: sport_profile_id, event_date, level en Strava baseline data (strava_min_week_hours, strava_max_week_hours)'
      })
    }

    // 2. Laad sportprofiel
    const sportProfile = sportProfiles.find(p => p.id === sport_profile_id)
    if (!sportProfile) {
      return res.status(400).json({
        error: `Sportprofiel '${sport_profile_id}' niet gevonden`
      })
    }

    // 3. Genereer plan
    const userData = buildUserData(user, userId)
    const planWeeks = await generatePlan(userData, sportProfile)

    // 4. Sla elke week op in elite_plans
    const now = new Date().toISOString()

    for (const week of planWeeks) {
      const docId = `${userId}_${week.week_number}`
      await db.collection(ELITE_PLANS).doc(docId).set({
        userId,
        week_number: week.week_number,
        week_label: week.week_label,
        phase: week.phase,
        volume_indicator: week.volume_indicator,
        focus: week.focus,
        macro_character: week.macro_character,
        workouts: week.workouts ?? {},
        created_at: now
      })
    }

    // 5. Update gebruikersprofiel
    await db.collection(ELITE_USERS).doc(userId).update({
      plan_generated: true,
      plan_generated_at: now
    })

    // 6. Geef terug
    res.status(201).json({
      success: true,
      weeks_generated: planWeeks.length
    })
  } catch (error) {
    console.error('Plan generate error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

router.get('/plan/current', async (req, res) => {
  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'userId query param is verplicht' })
    }

    // Haal gebruiker op voor plan_generated_at
    const userDoc = await db.collection(ELITE_USERS).doc(userId).get()
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Gebruiker niet gevonden' })
    }

    const user = userDoc.data()
    const planGeneratedAt = user.plan_generated_at

    if (!planGeneratedAt) {
      return res.status(404).json({ error: 'Geen plan gegenereerd voor deze gebruiker' })
    }

    // Bepaal huidige weeknummer binnen het plan
    const planStart = new Date(planGeneratedAt)
    const now = new Date()
    const msPerWeek = 7 * 24 * 60 * 60 * 1000
    const weeksSinceStart = Math.floor((now - planStart) / msPerWeek)
    const currentWeekNumber = weeksSinceStart + 1

    const docId = `${userId}_${currentWeekNumber}`
    const planDoc = await db.collection(ELITE_PLANS).doc(docId).get()

    if (!planDoc.exists) {
      return res.status(404).json({
        error: 'Geen weekplan gevonden voor de huidige week',
        current_week_number: currentWeekNumber
      })
    }

    const weekPlan = planDoc.data()
    res.json(weekPlan)
  } catch (error) {
    console.error('Plan current error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

export default router
