import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `Je bent de planning engine van PrimeForm Elite.
Je taak is het samenstellen van een periodiseringsplan op basis van aangeleverde atleetdata.

Je berekent NIETS zelf. Alle inputwaarden zijn vastgesteld door het systeem. Jouw taak is uitsluitend het structureren van die waarden in een coherent weekschema.

Outputregels:
- Altijd in weken gestructureerd
- Per week: fase, volume_indicator, focus, macro_character
- Geef ALLEEN een JSON array terug, geen tekst eromheen
- Geen markdown, geen uitleg, alleen de JSON array`

/**
 * Berekent het aantal beschikbare weken tussen vandaag en event_date.
 *
 * @param {string} eventDateStr - Datum in YYYY-MM-DD
 * @returns {number}
 */
function getAvailableWeeks (eventDateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const eventDate = new Date(eventDateStr)
  eventDate.setHours(0, 0, 0, 0)

  const diffMs = eventDate - today
  const diffWeeks = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000))

  return Math.max(1, diffWeeks)
}

/**
 * Bepaalt deload-weken en taper/race-structuur.
 *
 * @param {number} totalWeeks
 * @param {number} deloadFrequencyWeeks
 * @param {number} taperWeeks
 * @returns {{ deloadWeeks: number[], taperStartWeek: number, raceWeek: number }}
 */
function getPeriodizationPattern (totalWeeks, deloadFrequencyWeeks, taperWeeks) {
  const raceWeek = totalWeeks
  const taperStartWeek = Math.max(1, totalWeeks - taperWeeks + 1)

  const deloadWeeks = []
  for (let w = deloadFrequencyWeeks; w < taperStartWeek; w += deloadFrequencyWeeks) {
    deloadWeeks.push(w)
  }

  return { deloadWeeks, taperStartWeek, raceWeek }
}

/**
 * Bouwt de user prompt met atleetdata en sportprofiel.
 *
 * @param {Object} userData
 * @param {Object} sportProfile
 * @param {number} totalWeeks
 * @param {Object} periodization
 * @returns {string}
 */
function buildUserPrompt (userData, sportProfile, totalWeeks, periodization) {
  const { deloadWeeks, taperStartWeek, raceWeek } = periodization

  return `Genereer een periodiseringsplan als JSON array.

**Atleet:**
- Naam: ${userData.name}
- Geslacht: ${userData.gender === 'M' ? 'man' : 'vrouw'}
- Gewicht: ${userData.weight_kg} kg, Lengte: ${userData.height_cm} cm, Leeftijd: ${userData.age}
- Niveau: ${userData.level}
- Event: ${userData.event_name} op ${userData.event_date}

**Volume & intensiteit:**
- Wekelijkse volume: ${userData.weekly_volume_hours} uur
- Intensiteitsverdeling: ${userData.intensity_distribution}
- Strava bereik: ${userData.strava_min_week_hours}-${userData.strava_max_week_hours} uur/week

**Sport DNA profiel (${sportProfile.name}):**
- Energiesysteem: ${sportProfile.energy_system}
- Periodiseringsmodel: ${sportProfile.periodization_model}
- Kritieke limiters: ${sportProfile.critical_limiters.join(', ')}
- Volume karakter: ${sportProfile.volume_character}
- Zwakste schakel logica: ${sportProfile.weakest_link_logic}
- Intensiteit: ${sportProfile.intensity_distribution.zone2_pct}% zone2 / ${sportProfile.intensity_distribution.high_pct}% hoog
- Deload: elke ${sportProfile.deload_frequency_weeks} weken
- Taper: ${sportProfile.taper_weeks} weken voor het event

**Planstructuur (${totalWeeks} weken):**
- Deload-weken: ${deloadWeeks.join(', ') || 'geen'}
- Taper start: week ${taperStartWeek}
- Wedstrijdweek: week ${raceWeek}

**Output formaat:** JSON array met ${totalWeeks} weken. Elke week heeft:
- week_number, week_label (bijv. "Week 1 — Basisfase")
- phase: "base" | "build" | "peak" | "deload" | "taper" | "race"
- volume_indicator (percentage 0-100)
- focus (korte beschrijving)
- macro_character: "high_carb" | "moderate" | "low_carb"
- workouts: object met sleutels "1" t/m "7" (maandag-zondag)
  - Elke workout: name, duration_minutes, intensity_zone (1-5), type ("run"|"strength"|"cardio"|"recovery"|"race"), description

Geef ALLEEN de JSON array terug.`
}

/**
 * Extraheert en parset JSON uit de Claude response.
 *
 * @param {string} text
 * @returns {Array}
 */
function parsePlanJson (text) {
  let cleaned = text.trim()

  const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
  if (jsonMatch) {
    cleaned = jsonMatch[0]
  }

  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    throw new Error(`Ongeldige JSON in plan response: ${e.message}`)
  }
}

/**
 * Genereert een trainingsplan via de Claude API.
 *
 * @param {Object} userData - Atleetgegevens (userId, name, gender, weight_kg, height_cm, age, event_name, event_date, level, weekly_volume_hours, intensity_distribution, strava_max_week_hours, strava_min_week_hours)
 * @param {Object} sportProfile - Sport DNA profiel uit /backend/data/sportProfiles.js
 * @returns {Promise<Array<{ week_number: number, week_label: string, phase: string, volume_indicator: number, focus: string, macro_character: string, workouts: Object }>>} Array van weekplannen
 */
export async function generatePlan (userData, sportProfile) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is niet geconfigureerd in .env')
  }

  const totalWeeks = getAvailableWeeks(userData.event_date)
  const periodization = getPeriodizationPattern(
    totalWeeks,
    sportProfile.deload_frequency_weeks,
    sportProfile.taper_weeks
  )

  const userPrompt = buildUserPrompt(userData, sportProfile, totalWeeks, periodization)

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  })

  const textBlock = message.content?.find(block => block.type === 'text')
  const rawText = textBlock?.text?.trim() ?? ''

  if (!rawText) {
    throw new Error('Geen response ontvangen van Claude')
  }

  return parsePlanJson(rawText)
}
