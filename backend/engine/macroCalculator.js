/**
 * Macro Calculator
 * Berekent BMR, TDEE-factoren, workout-verbranding en dagelijkse macro's.
 */

/**
 * Berekent BMR (Basal Metabolic Rate) met de Mifflin-St Jeor formule.
 *
 * @param {number} weight - Gewicht in kg
 * @param {number} height - Lengte in cm
 * @param {number} age - Leeftijd in jaren
 * @param {string} gender - 'male' of 'female'
 * @returns {number} BMR in kcal
 */
export function calculateBMR (weight, height, age, gender) {
  const base = (10 * weight) + (6.25 * height) - (5 * age)

  return gender === 'male' ? base + 5 : base - 161
}

/**
 * Geeft de TDEE vermenigvuldigingsfactor op basis van DRS-status en dagtype.
 *
 * @param {string} drsStatus - 'green' | 'amber' | 'red'
 * @param {string} dayType - 'heavy' | 'moderate' | 'rest'
 * @returns {number} TDEE-factor
 */
export function getTDEEFactor (drsStatus, dayType) {
  if (drsStatus === 'red') return 1.2

  const factors = {
    green: { heavy: 1.7, moderate: 1.5, rest: 1.3 },
    amber: { heavy: 1.55, moderate: 1.4, rest: 1.25 }
  }

  return factors[drsStatus]?.[dayType] ?? 1.2
}

/**
 * Schat de kcal-verbranding van een workout op basis van duur, intensiteit en gewicht.
 * Gebruikt MET-waarden en een absorptiefactor van 0.6.
 *
 * @param {number} durationMinutes - Duur in minuten
 * @param {number} intensityZone - Intensiteitszone 1-5
 * @param {number} weightKg - Gewicht in kg
 * @returns {number} Geschatte verbranding in kcal
 */
export function calculateWorkoutKcal (durationMinutes, intensityZone, weightKg) {
  const metValues = { 1: 4, 2: 5, 3: 6, 4: 8, 5: 10 }
  const met = metValues[Math.min(5, Math.max(1, Math.round(intensityZone)))] ?? 6

  const hours = durationMinutes / 60
  const rawKcal = met * weightKg * hours

  return Math.round(rawKcal * 0.6)
}

/**
 * Geeft de macro-verdeling in percentages op basis van dagtype en DRS-status.
 * Bij rode DRS-status wordt altijd de rest-verdeling gebruikt.
 *
 * @param {string} dayType - 'heavy' | 'moderate' | 'rest'
 * @param {string} drsStatus - 'green' | 'amber' | 'red'
 * @returns {{ carbs: number, protein: number, fat: number }}
 */
export function getMacroDistribution (dayType, drsStatus) {
  if (drsStatus === 'red') {
    return { carbs: 0.25, protein: 0.35, fat: 0.40 }
  }

  switch (dayType) {
    case 'heavy':
      return { carbs: 0.50, protein: 0.30, fat: 0.20 }
    case 'moderate':
      return { carbs: 0.40, protein: 0.32, fat: 0.28 }
    case 'rest':
    default:
      return { carbs: 0.25, protein: 0.35, fat: 0.40 }
  }
}

/**
 * Berekent de dagelijkse macro's in grammen.
 * Eiwit is minimaal 2.0g/kg lichaamsgewicht.
 *
 * @param {number} bmr - BMR in kcal
 * @param {number} tdeeFactor - TDEE vermenigvuldigingsfactor
 * @param {number} workoutKcal - Extra kcal van workout
 * @param {{ carbs: number, protein: number, fat: number }} macroDistribution - Percentages (0-1)
 * @param {number} weightKg - Gewicht in kg
 * @returns {{ kcal: number, carbs_g: number, protein_g: number, fat_g: number }}
 */
export function calculateDailyMacros (bmr, tdeeFactor, workoutKcal, macroDistribution, weightKg) {
  const kcal = Math.round(bmr * tdeeFactor + workoutKcal)

  const minProteinG = 2.0 * weightKg

  let proteinG = (kcal * macroDistribution.protein) / 4
  if (proteinG < minProteinG) {
    proteinG = minProteinG
  }

  const proteinKcal = proteinG * 4
  const remainingKcal = kcal - proteinKcal

  const carbFatTotal = macroDistribution.carbs + macroDistribution.fat
  const carbsKcal = remainingKcal * (macroDistribution.carbs / carbFatTotal)
  const fatKcal = remainingKcal * (macroDistribution.fat / carbFatTotal)

  const carbsG = carbsKcal / 4
  const fatG = fatKcal / 9

  return {
    kcal,
    carbs_g: Math.round(carbsG),
    protein_g: Math.round(proteinG),
    fat_g: Math.round(fatG)
  }
}
