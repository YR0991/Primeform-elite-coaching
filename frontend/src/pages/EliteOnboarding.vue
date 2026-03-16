<template>
  <q-page class="elite-onboarding">
    <div class="onboarding-container">
      <header class="onboarding-header">
        <h1 class="title">PrimeForm Elite</h1>
        <div class="step-indicator">
          <span v-for="s in 3" :key="s" class="step-dot" :class="{ active: step >= s }" />
        </div>
      </header>

      <!-- STAP 1 — Jouw profiel -->
      <section v-show="step === 1" class="step-section">
        <h2 class="step-title">Jouw profiel</h2>
        <q-form @submit="nextStep" class="onboarding-form">
          <q-input
            v-model="form.name"
            label="Naam"
            outlined
            dense
            :rules="[val => !!val || 'Naam is verplicht']"
            class="q-mb-md"
          />
          <div class="q-mb-md">
            <label class="field-label">Geslacht</label>
            <q-btn-toggle
              v-model="form.gender"
              spread
              no-caps
              toggle-color="primary"
              :options="[
                { label: 'Man', value: 'M' },
                { label: 'Vrouw', value: 'V' }
              ]"
              color="#1D9E75"
              class="gender-toggle"
            />
          </div>
          <q-input
            v-model.number="form.age"
            type="number"
            label="Leeftijd"
            outlined
            dense
            :rules="[val => val > 0 && val < 120 || 'Voer een geldige leeftijd in']"
            class="q-mb-md"
          />
          <q-input
            v-model.number="form.weight_kg"
            type="number"
            label="Gewicht (kg)"
            outlined
            dense
            :rules="[val => val > 0 && val < 300 || 'Voer een geldig gewicht in']"
            class="q-mb-md"
          />
          <q-input
            v-model.number="form.height_cm"
            type="number"
            label="Lengte (cm)"
            outlined
            dense
            :rules="[val => val > 0 && val < 250 || 'Voer een geldige lengte in']"
            class="q-mb-md"
          />
          <q-btn type="submit" label="Volgende" unelevated no-caps class="submit-btn" />
        </q-form>
      </section>

      <!-- STAP 2 — Jouw event -->
      <section v-show="step === 2" class="step-section">
        <h2 class="step-title">Jouw event</h2>
        <div class="sport-cards q-mb-lg">
          <q-card
            v-for="profile in sportProfiles"
            :key="profile.id"
            class="sport-card"
            :class="{ selected: form.sport_profile_id === profile.id }"
            clickable
            @click="form.sport_profile_id = profile.id"
          >
            <q-card-section class="text-center">
              {{ profile.name }}
            </q-card-section>
          </q-card>
        </div>
        <div class="q-mb-md">
          <label class="field-label">Niveau</label>
          <q-btn-toggle
            v-model="form.level"
            spread
            no-caps
            toggle-color="primary"
            :options="[
              { label: 'Beginner', value: 'beginner' },
              { label: 'Gevorderd', value: 'advanced' }
            ]"
            color="#1D9E75"
            class="level-toggle"
          />
        </div>
        <q-input
          v-model="form.event_date"
          label="Eventdatum"
          outlined
          dense
          mask="####-##-##"
          placeholder="YYYY-MM-DD"
          :rules="[val => !!val && /^\d{4}-\d{2}-\d{2}$/.test(val) || 'Voer een geldige datum in (YYYY-MM-DD)']"
          class="q-mb-md"
        >
          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="form.event_date" minimal />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-input
          v-model="form.event_name"
          label="Eventnaam (optioneel)"
          outlined
          dense
          class="q-mb-md"
        />
        <div class="step-actions">
          <q-btn flat label="Terug" no-caps @click="step--" />
          <q-btn label="Volgende" unelevated no-caps class="submit-btn" @click="nextStep" />
        </div>
      </section>

      <!-- STAP 3 — Bevestiging -->
      <section v-show="step === 3" class="step-section">
        <h2 class="step-title">Bevestiging</h2>
        <q-card v-if="!generating" flat bordered class="summary-card">
          <q-card-section>
            <p><strong>Naam:</strong> {{ form.name }}</p>
            <p><strong>Geslacht:</strong> {{ form.gender === 'M' ? 'Man' : 'Vrouw' }}</p>
            <p><strong>Leeftijd:</strong> {{ form.age }}</p>
            <p><strong>Gewicht:</strong> {{ form.weight_kg }} kg</p>
            <p><strong>Lengte:</strong> {{ form.height_cm }} cm</p>
            <p><strong>Sport:</strong> {{ selectedProfile?.name }}</p>
            <p><strong>Niveau:</strong> {{ form.level === 'beginner' ? 'Beginner' : 'Gevorderd' }}</p>
            <p><strong>Eventdatum:</strong> {{ form.event_date }}</p>
            <p v-if="form.event_name"><strong>Eventnaam:</strong> {{ form.event_name }}</p>
          </q-card-section>
        </q-card>
        <div v-else class="generating-state">
          <q-spinner-dots color="primary" size="50px" />
          <p class="generating-text">Jouw plan wordt gegenereerd...</p>
        </div>
        <div v-if="!generating" class="step-actions">
          <q-btn flat label="Terug" no-caps @click="step--" />
          <q-btn
            label="Plan genereren"
            unelevated
            no-caps
            class="submit-btn"
            @click="generatePlan"
          />
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

const step = ref(1)
const generating = ref(false)

const sportProfiles = [
  { id: 'hyrox_recreational', name: 'Hyrox Recreational' },
  { id: 'hyrox_pro', name: 'Hyrox Pro/Elite' },
  { id: 'triathlon_703', name: 'Triathlon 70.3' },
  { id: 'triathlon_ironman', name: 'Triathlon Ironman' },
  { id: 'marathon', name: 'Marathon' },
  { id: 'half_marathon', name: 'Halve Marathon' },
  { id: '10km', name: '10km' }
]

const form = reactive({
  name: '',
  gender: 'M',
  age: null,
  weight_kg: null,
  height_cm: null,
  sport_profile_id: '',
  level: 'beginner',
  event_date: '',
  event_name: ''
})

const selectedProfile = computed(() =>
  sportProfiles.find(p => p.id === form.sport_profile_id)
)

function nextStep () {
  if (step.value === 1) {
    step.value = 2
  } else if (step.value === 2) {
    if (!form.sport_profile_id) {
      $q.notify({ type: 'warning', message: 'Selecteer een sportprofiel' })
      return
    }
    if (!form.event_date) {
      $q.notify({ type: 'warning', message: 'Voer de eventdatum in' })
      return
    }
    step.value = 3
  }
}

async function generatePlan () {
  let userId = localStorage.getItem('userId')
  if (!userId) {
    userId = crypto.randomUUID?.() ?? `user_${Date.now()}`
    localStorage.setItem('userId', userId)
  }
  localStorage.setItem('userName', form.name)

  generating.value = true

  try {
    const profileRes = await fetch(`${apiBaseUrl}/api/elite/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        name: form.name,
        gender: form.gender,
        weight_kg: form.weight_kg,
        height_cm: form.height_cm,
        age: form.age,
        sport_profile_id: form.sport_profile_id,
        event_name: form.event_name || form.event_date,
        event_date: (form.event_date || '').replace(/\//g, '-'),
        level: form.level,
        strava_min_week_hours: 6,
        strava_max_week_hours: 10
      })
    })

    const profileData = await profileRes.json()
    if (!profileRes.ok) {
      throw new Error(profileData.error || 'Profiel opslaan mislukt')
    }

    const planRes = await fetch(`${apiBaseUrl}/api/elite/plan/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })

    const planData = await planRes.json()
    if (!planRes.ok) {
      throw new Error(planData.error || 'Plan genereren mislukt')
    }

    $q.notify({ type: 'positive', message: 'Plan gegenereerd!' })
    router.push('/checkin')
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Er is iets misgegaan' })
  } finally {
    generating.value = false
  }
}

onMounted(() => {
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 7)
  if (!form.event_date) {
    form.event_date = minDate.toISOString().split('T')[0]
  }
})
</script>

<style lang="sass" scoped>
.elite-onboarding
  padding: 24px
  padding-bottom: 48px

.onboarding-container
  max-width: 480px
  margin: 0 auto

.onboarding-header
  margin-bottom: 32px

.title
  font-size: 1.5rem
  font-weight: 600
  color: #1a1a1a
  margin: 0 0 16px 0

.step-indicator
  display: flex
  gap: 8px

.step-dot
  width: 8px
  height: 8px
  border-radius: 50%
  background: #ddd
  transition: background 0.2s

  &.active
    background: #1D9E75

.step-title
  font-size: 1.25rem
  font-weight: 600
  color: #333
  margin: 0 0 24px 0

.field-label
  display: block
  font-size: 0.875rem
  color: #666
  margin-bottom: 8px

.gender-toggle,
.level-toggle
  border: 1px solid #ddd
  border-radius: 8px

.sport-cards
  display: grid
  grid-template-columns: repeat(2, 1fr)
  gap: 12px

.sport-card
  border-radius: 12px
  border: 2px solid #eee
  transition: all 0.2s

  &.selected
    border-color: #1D9E75
    background: rgba(29, 158, 117, 0.08)

.submit-btn
  background: #1D9E75 !important
  color: white !important
  font-weight: 600
  padding: 12px 24px
  border-radius: 8px

.step-actions
  display: flex
  justify-content: space-between
  align-items: center
  margin-top: 24px

.summary-card
  border-radius: 12px
  margin-bottom: 24px

  p
    margin: 0 0 8px 0
    font-size: 0.95rem

.generating-state
  text-align: center
  padding: 48px 24px

.generating-text
  margin-top: 16px
  font-size: 1rem
  color: #666
</style>
