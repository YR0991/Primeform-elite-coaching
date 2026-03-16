/**
 * DRS (Daily Readiness Score) Calculator
 * Berekent dagelijkse bereidheidsscores op basis van HRV, RHR en subjectieve metingen.
 */

/**
 * Berekent HRV-score door vandaag te vergelijken met 28-daags gemiddelde.
 * +10% of meer boven gemiddelde = 100, op gemiddelde = 50, -10% of meer onder = 0.
 * Lineaire interpolatie daartussen.
 *
 * @param {number} todayHRV - HRV-waarde van vandaag
 * @param {number} avg28dayHRV - 28-daags gemiddelde HRV
 * @returns {number} Score van 0-100
 */
export function calculateHRVScore (todayHRV, avg28dayHRV) {
  if (avg28dayHRV <= 0) return 50

  const ratio = todayHRV / avg28dayHRV

  if (ratio <= 0.9) return 0
  if (ratio >= 1.1) return 100
  if (ratio <= 1.0) return 50 * (ratio - 0.9) / 0.1
  return 50 + 50 * (ratio - 1.0) / 0.1
}

/**
 * Berekent RHR-score (omgekeerde logica van HRV: lager = beter).
 * -10% of meer onder gemiddelde = 100, op gemiddelde = 50, +10% of meer boven = 0.
 * Lineaire interpolatie daartussen.
 *
 * @param {number} todayRHR - Rusthartslag van vandaag
 * @param {number} avg28dayRHR - 28-daags gemiddelde rusthartslag
 * @returns {number} Score van 0-100
 */
export function calculateRHRScore (todayRHR, avg28dayRHR) {
  if (avg28dayRHR <= 0) return 50

  const ratio = todayRHR / avg28dayRHR

  if (ratio <= 0.9) return 100
  if (ratio >= 1.1) return 0
  if (ratio <= 1.0) return 100 - 50 * (ratio - 0.9) / 0.1
  return 50 - 50 * (ratio - 1.0) / 0.1
}

/**
 * Combineert subjectieve scores (slaap, energie, stress) tot één score.
 * Slaap en energie: hoger (1-5) = beter. Stress: hoger = slechter (geïnverteerd).
 *
 * @param {number} sleep - Slaapkwaliteit 1-5
 * @param {number} energy - Energieniveau 1-5
 * @param {number} stress - Stressniveau 1-5 (wordt geïnverteerd)
 * @returns {number} Score van 0-100
 */
export function calculateSubjectiveScore (sleep, energy, stress) {
  const sleepScore = Math.max(0, Math.min(100, ((sleep - 1) / 4) * 100))
  const energyScore = Math.max(0, Math.min(100, ((energy - 1) / 4) * 100))
  const stressScore = Math.max(0, Math.min(100, ((5 - stress) / 4) * 100))

  return (sleepScore + energyScore + stressScore) / 3
}

/**
 * Berekent de totale DRS met weging: HRV 40%, RHR 25%, subjectief 35%.
 *
 * @param {number} hrvScore - HRV-component score (0-100)
 * @param {number} rhrScore - RHR-component score (0-100)
 * @param {number} subjectiveScore - Subjectieve component score (0-100)
 * @returns {{ score: number, status: 'green'|'amber'|'red', breakdown: { hrv: number, rhr: number, subjective: number } }}
 */
export function calculateDRS (hrvScore, rhrScore, subjectiveScore) {
  const score = hrvScore * 0.4 + rhrScore * 0.25 + subjectiveScore * 0.35

  let status
  if (score >= 75) status = 'green'
  else if (score >= 45) status = 'amber'
  else status = 'red'

  return {
    score: Math.round(score * 10) / 10,
    status,
    breakdown: {
      hrv: Math.round(hrvScore * 10) / 10,
      rhr: Math.round(rhrScore * 10) / 10,
      subjective: Math.round(subjectiveScore * 10) / 10
    }
  }
}

/**
 * Berekent het rollend gemiddelde van de laatste X dagen.
 *
 * @param {number[]} valuesArray - Array van waarden (chronologisch, nieuwste laatste)
 * @param {number} days - Aantal dagen voor het gemiddelde
 * @returns {number} Gemiddelde van de laatste X waarden, of van alle beschikbare waarden
 */
export function calculateRollingAverage (valuesArray, days) {
  if (!valuesArray?.length || days <= 0) return 0

  const slice = valuesArray.slice(-days)
  const sum = slice.reduce((acc, val) => acc + val, 0)

  return sum / slice.length
}
