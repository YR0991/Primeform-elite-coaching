/**
 * Workout Adapter
 * Past geplande workouts aan op basis van DRS (Daily Readiness Score).
 */

/**
 * Past de geplande workout aan op basis van DRS-status.
 *
 * @param {Object} plannedWorkout - Geplande workout
 * @param {string} plannedWorkout.name - Naam van de workout
 * @param {number} plannedWorkout.duration_minutes - Duur in minuten
 * @param {number} plannedWorkout.intensity_zone - Intensiteitszone 1-5
 * @param {string} plannedWorkout.type - Type workout
 * @param {string} plannedWorkout.description - Beschrijving
 * @param {string} drsStatus - 'green' | 'amber' | 'red'
 * @returns {Object} Aangepaste workout
 */
export function adaptWorkout (plannedWorkout, drsStatus) {
  if (drsStatus === 'green') {
    return { ...plannedWorkout }
  }

  if (drsStatus === 'red') {
    return ensureRecoveryDuration({
      name: 'Actief herstel',
      duration_minutes: 30,
      intensity_zone: 1,
      type: 'recovery',
      description: 'DRS rood — rust en herstel vandaag'
    })
  }

  if (drsStatus === 'amber') {
    const adaptedDuration = Math.round(plannedWorkout.duration_minutes * 0.8)
    const adaptedZone = Math.max(1, plannedWorkout.intensity_zone - 1)
    const adjustmentNote = 'Aangepast: DRS amber — verminderde intensiteit en duur.'

    const result = {
      ...plannedWorkout,
      duration_minutes: adaptedDuration,
      intensity_zone: adaptedZone,
      description: [plannedWorkout.description, adjustmentNote].filter(Boolean).join(' ')
    }
    return ensureRecoveryDuration(result)
  }

  return ensureRecoveryDuration({ ...plannedWorkout })
}

/**
 * Zorgt dat herstelworkouts altijd 30 minuten tonen.
 */
function ensureRecoveryDuration (workout) {
  if ((workout.type === 'recovery' || workout.type === 'rest') && (!workout.duration_minutes || workout.duration_minutes === 0)) {
    return { ...workout, duration_minutes: 30 }
  }
  return workout
}

/**
 * Bepaalt het dagtype op basis van de aangepaste workout.
 *
 * @param {Object} adaptedWorkout - Aangepaste workout
 * @param {number} adaptedWorkout.intensity_zone - Intensiteitszone 1-5
 * @param {string} adaptedWorkout.type - Type workout
 * @returns {'heavy' | 'moderate' | 'rest'}
 */
export function getDayType (adaptedWorkout) {
  const { intensity_zone, type } = adaptedWorkout

  if (intensity_zone >= 4 || type === 'strength') {
    return 'heavy'
  }

  if (intensity_zone === 2 || intensity_zone === 3) {
    return 'moderate'
  }

  return 'rest'
}
