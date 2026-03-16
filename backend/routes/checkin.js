import express from 'express'

const router = express.Router()
import { db } from '../config/firebase.js'
import { ELITE_CHECKINS } from '../config/collections.js'
import {
  calculateHRVScore,
  calculateRHRScore,
  calculateSubjectiveScore,
  calculateDRS,
  calculateRollingAverage
} from '../engine/drsCalculator.js'

router.post('/checkin', async (req, res) => {
  try {
    const {
      userId,
      date,
      hrv,
      rhr,
      sleep_score,
      energy,
      stress
    } = req.body

    if (!userId || !date || hrv == null || rhr == null || sleep_score == null || energy == null || stress == null) {
      return res.status(400).json({
        error: 'Missing required fields: userId, date, hrv, rhr, sleep_score, energy, stress'
      })
    }

    // 1. Haal de laatste 28 check-ins op uit Firestore
    const checkinsSnapshot = await db.collection(ELITE_CHECKINS)
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .limit(28)
      .get()

    const previousCheckins = checkinsSnapshot.docs.map(doc => doc.data())
    const chronologicalCheckins = [...previousCheckins].reverse()

    // 2. Berekent 7-daags en 28-daags gemiddelde voor HRV en RHR
    const hrvValues = chronologicalCheckins.map(c => c.hrv)
    const rhrValues = chronologicalCheckins.map(c => c.rhr)

    const avgHrv28 = hrvValues.length > 0 ? calculateRollingAverage(hrvValues, 28) : hrv
    const avgRhr28 = rhrValues.length > 0 ? calculateRollingAverage(rhrValues, 28) : rhr
    const avgHrv7 = hrvValues.length > 0 ? calculateRollingAverage(hrvValues, 7) : hrv
    const avgRhr7 = rhrValues.length > 0 ? calculateRollingAverage(rhrValues, 7) : rhr

    // 3. Roept de DRS calculator aan
    const hrvScore = calculateHRVScore(hrv, avgHrv28)
    const rhrScore = calculateRHRScore(rhr, avgRhr28)
    const subjectiveScore = calculateSubjectiveScore(sleep_score, energy, stress)
    const drs = calculateDRS(hrvScore, rhrScore, subjectiveScore)

    // 4. Slaat de check-in op in Firestore
    const checkinData = {
      userId,
      date,
      hrv,
      rhr,
      sleep_score,
      energy,
      stress,
      drs: {
        score: drs.score,
        status: drs.status,
        breakdown: drs.breakdown
      },
      avg_hrv_7d: Math.round(avgHrv7 * 10) / 10,
      avg_hrv_28d: Math.round(avgHrv28 * 10) / 10,
      avg_rhr_7d: Math.round(avgRhr7 * 10) / 10,
      avg_rhr_28d: Math.round(avgRhr28 * 10) / 10,
      createdAt: new Date().toISOString()
    }

    const docRef = await db.collection(ELITE_CHECKINS).add(checkinData)

    // 5. Geeft de DRS terug in de response
    res.status(201).json({
      id: docRef.id,
      drs: {
        score: drs.score,
        status: drs.status,
        breakdown: drs.breakdown
      }
    })
  } catch (error) {
    console.error('Check-in error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

export default router
