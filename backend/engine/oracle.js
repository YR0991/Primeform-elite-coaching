import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `Je bent de AI Oracle van PrimeForm Elite. Je bent de persoonlijke performance coach van de atleet. Je spreekt altijd in het Nederlands.

Je taak is uitsluitend het omzetten van data naar een kort, menselijk coaching bericht. Jij berekent NIETS zelf. Alle getallen die je ontvangt zijn vastgesteld door het systeem en zijn correct.

Toonregels:
- Maximaal 5 zinnen
- Geen vragen stellen
- Één concrete actie als conclusie
- Direct, warm, geen bullshit
- Nooit betuttelend
- Nooit meer dan één emoji per bericht, alleen als het natuurlijk aanvoelt

Je mag NOOIT:
- Getallen aanpassen of afronden
- Twijfelen aan de data
- Alternatieve acties voorstellen naast de opgegeven actie
- Medisch advies geven`

/**
 * Bouwt de user prompt op basis van athleteData.
 *
 * @param {Object} athleteData - Atleetgegevens
 * @returns {string}
 */
function buildUserPrompt (athleteData) {
  const {
    name,
    gender,
    weight_kg,
    physiology_module,
    cycle_phase,
    drs,
    hrv,
    body_battery,
    rhr,
    sleep_score,
    energy,
    stress,
    calendar_summary,
    planned_workout,
    adapted_workout,
    workout_adapted,
    adaptation_reason,
    macros
  } = athleteData

  const cycleSection =
    physiology_module === 'A' && cycle_phase
      ? `\nCyclusfase: ${cycle_phase}`
      : ''

  return `Geef een kort coaching bericht voor ${name} (${gender === 'M' ? 'man' : 'vrouw'}, ${weight_kg} kg).${cycleSection}

**DRS:** ${drs.status} (score: ${drs.score})
- HRV: ${drs.breakdown.hrv}, RHR: ${drs.breakdown.rhr}, Subjectief: ${drs.breakdown.subjective}

**HRV:** vandaag ${hrv.today}, 28-d gemiddelde ${hrv.avg28day}, verschil ${hrv.pct_diff}%
${body_battery != null ? `**Body Battery:** ${body_battery}` : ''}

**Subjectief:** slaap ${sleep_score}/5, energie ${energy}/5, stress ${stress}/5
**Rusthartslag:** ${rhr} bpm

**Agenda:** ${calendar_summary}

**Workout vandaag:**
${workout_adapted ? `Aangepast van gepland naar: ${adapted_workout.name} (${adapted_workout.duration_minutes} min, zone ${adapted_workout.intensity_zone}, type ${adapted_workout.type})
Reden: ${adaptation_reason || 'DRS aanpassing'}` : `Gepland: ${planned_workout.name} (${planned_workout.duration_minutes} min, zone ${planned_workout.intensity_zone}, type ${planned_workout.type})`}

**Macro's vandaag:** ${macros.kcal} kcal — ${macros.carbs_g}g koolhydraten, ${macros.protein_g}g eiwit, ${macros.fat_g}g vet

Schrijf nu het coaching bericht.`
}

/**
 * Genereert het dagelijkse coaching bericht via de Claude API.
 *
 * @param {Object} athleteData - Atleetgegevens
 * @returns {Promise<string>} Het gegenereerde coaching bericht
 */
export async function generateOracleMessage (athleteData) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is niet geconfigureerd in .env')
  }

  const client = new Anthropic({ apiKey })
  const userPrompt = buildUserPrompt(athleteData)

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  })

  const textBlock = message.content?.find(block => block.type === 'text')
  return textBlock?.text?.trim() ?? ''
}
