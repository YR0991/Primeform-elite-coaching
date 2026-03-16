import express from 'express'
import { db } from '../config/firebase.js'
import {
  ELITE_USERS,
  ELITE_CHECKINS,
  ELITE_PLANS,
  ELITE_DAILY_OUTPUT
} from '../config/collections.js'
import { adaptWorkout, getDayType } from '../engine/workoutAdapter.js'
import {
  calculateBMR,
  getTDEEFactor,
  calculateWorkoutKcal,
  getMacroDistribution,
  calculateDailyMacros
} from '../engine/macroCalculator.js'
import { generateOracleMessage } from '../engine/oracle.js'

const router = express.Router()

/**
 * Berekent ISO week string (bijv. "2025-W12") voor een datum.
 */
function getISOWeek (dateStr) {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * Dag van de week voor trainingsplan: 1=maandag, 7=zondag.
 */
function getPlanDayKey (dateStr) {
  const day = new Date(dateStr).getDay()
  return day === 0 ? 7 : day
}

const DEFAULT_WORKOUT = {
  name: 'Rust',
  duration_minutes: 0,
  intensity_zone: 1,
  type: 'rest',
  description: 'Rustdag'
}

router.get('/daily-output', async (req, res) => {
  try {
    const { userId, date } = req.query

    if (!userId || !date) {
      return res.status(400).json({
        error: 'Missing required query params: userId, date'
      })
    }

    const snapshot = await db.collection(ELITE_DAILY_OUTPUT)
      .where('userId', '==', userId)
      .where('date', '==', date)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Geen dagelijkse output gevonden voor deze datum' })
    }

    const data = snapshot.docs[0].data()
    res.json({
      drs: data.drs,
      adapted_workout: data.adapted_workout,
      workout_adapted: data.workout_adapted,
      macros: data.macros,
      oracle_message: data.oracle_message,
      date: data.date,
      createdAt: data.createdAt
    })
  } catch (error) {
    console.error('Daily output GET error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

router.post('/daily-output', async (req, res) => {
  try {
    const { userId, date } = req.body

    if (!userId || !date) {
      return res.status(400).json({
        error: 'Missing required fields: userId, date'
      })
    }

    // 1. Haal gebruikersprofiel op
    const userDoc = await db.collection(ELITE_USERS).doc(userId).get()
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Gebruiker niet gevonden' })
    }
    const user = userDoc.data()

    // 2. Haal check-in van vandaag op
    const checkinSnapshot = await db.collection(ELITE_CHECKINS)
      .where('userId', '==', userId)
      .where('date', '==', date)
      .limit(1)
      .get()

    if (checkinSnapshot.empty) {
      return res.status(404).json({ error: 'Geen check-in gevonden voor deze datum' })
    }
    const checkin = checkinSnapshot.docs[0].data()

    const drs = checkin.drs
    const drsStatus = drs.status

    // 3. Haal geplande workout op
    const isoWeek = getISOWeek(date)
    const dayKey = getPlanDayKey(date)

    const planSnapshot = await db.collection(ELITE_PLANS)
      .where('userId', '==', userId)
      .where('week', '==', isoWeek)
      .limit(1)
      .get()

    let plannedWorkout = DEFAULT_WORKOUT
    if (!planSnapshot.empty) {
      const plan = planSnapshot.docs[0].data()
      const workoutForDay = plan.workouts?.[String(dayKey)] ?? plan.workouts?.[dayKey]
      if (workoutForDay) {
        plannedWorkout = {
          name: workoutForDay.name ?? 'Workout',
          duration_minutes: workoutForDay.duration_minutes ?? 0,
          intensity_zone: workoutForDay.intensity_zone ?? 1,
          type: workoutForDay.type ?? 'rest',
          description: workoutForDay.description ?? ''
        }
      }
    }

    // 4. Pas workout aan op basis van DRS
    const adaptedWorkout = adaptWorkout(plannedWorkout, drsStatus)
    const workoutAdapted = JSON.stringify(plannedWorkout) !== JSON.stringify(adaptedWorkout)
    const adaptationReason = workoutAdapted
      ? (drsStatus === 'red' ? 'DRS rood' : drsStatus === 'amber' ? 'DRS amber' : null)
      : null

    // 5. Bepaal dagtype
    const dayType = getDayType(adaptedWorkout)

    // 6-10. Macro-berekeningen
    const weightKg = user.weight_kg ?? 70
    const heightCm = user.height_cm ?? 170
    const age = user.age ?? 30
    const gender = user.gender === 'V' ? 'female' : 'male'

    const bmr = calculateBMR(weightKg, heightCm, age, gender)

    const tdeeFactor = getTDEEFactor(drsStatus, dayType)
    const workoutKcal = calculateWorkoutKcal(
      adaptedWorkout.duration_minutes,
      adaptedWorkout.intensity_zone,
      weightKg
    )
    const macroDistribution = getMacroDistribution(dayType, drsStatus)
    const macros = calculateDailyMacros(
      bmr,
      tdeeFactor,
      workoutKcal,
      macroDistribution,
      weightKg
    )

    // 11. Genereer Oracle bericht
    const avgHrv28 = checkin.avg_hrv_28d ?? checkin.hrv
    const hrvPctDiff = avgHrv28 > 0
      ? Math.round(((checkin.hrv - avgHrv28) / avgHrv28) * 100)
      : 0

    const athleteData = {
      name: user.name ?? 'Atleet',
      gender: user.gender ?? 'M',
      weight_kg: weightKg,
      physiology_module: user.physiology_module ?? 'B',
      cycle_phase: user.cycle_phase ?? null,
      drs,
      hrv: {
        today: checkin.hrv,
        avg28day: avgHrv28,
        pct_diff: hrvPctDiff
      },
      body_battery: user.body_battery ?? null,
      rhr: checkin.rhr,
      sleep_score: checkin.sleep_score,
      energy: checkin.energy,
      stress: checkin.stress,
      calendar_summary: user.calendar_summary ?? 'Geen agenda-gegevens',
      planned_workout: plannedWorkout,
      adapted_workout: adaptedWorkout,
      workout_adapted: workoutAdapted,
      adaptation_reason: adaptationReason,
      macros
    }

    const oracleMessage = await generateOracleMessage(athleteData)

    // 12. Sla dagresultaat op
    const dailyOutputData = {
      userId,
      date,
      drs,
      planned_workout: plannedWorkout,
      adapted_workout: adaptedWorkout,
      workout_adapted: workoutAdapted,
      adaptation_reason: adaptationReason,
      day_type: dayType,
      macros,
      oracle_message: oracleMessage,
      createdAt: new Date().toISOString()
    }

    await db.collection(ELITE_DAILY_OUTPUT).add(dailyOutputData)

    // 13. Geef resultaat terug
    res.status(201).json({
      drs,
      adapted_workout: adaptedWorkout,
      macros,
      oracle_message: oracleMessage,
      date
    })
  } catch (error) {
    console.error('Daily output error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

export default router
