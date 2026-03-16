<template>
  <q-page class="elite-dashboard">
    <div v-if="loading" class="flex flex-center" style="min-height: 60vh">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <div v-else-if="error" class="dashboard-container">
      <q-banner class="bg-negative text-white rounded-borders">
        {{ error }}
      </q-banner>
    </div>

    <div v-else-if="output" class="dashboard-container">
      <!-- 1. DRS STATUS KAART -->
      <section class="drs-card" :class="output.drs.status">
        <div class="drs-dot" />
        <div class="drs-score">{{ output.drs.score }}</div>
        <div class="drs-status-label">{{ statusLabel }}</div>
        <div class="drs-breakdown">
          <span>HRV {{ output.drs.breakdown.hrv }}</span>
          <span>RHR {{ output.drs.breakdown.rhr }}</span>
          <span>Energie {{ output.drs.breakdown.subjective }}</span>
        </div>
      </section>

      <!-- 2. ORACLE BERICHT -->
      <section class="oracle-card">
        <div class="oracle-header">● PrimeForm Elite · {{ formattedTime }}</div>
        <p class="oracle-message">{{ output.oracle_message }}</p>
        <div class="oracle-footer">
          DRS {{ output.drs.score }} · {{ workoutStatusLabel }}
        </div>
      </section>

      <!-- 3. WORKOUT VAN VANDAAG -->
      <section class="workout-card">
        <div class="workout-header">
          <h3 class="workout-name">{{ output.adapted_workout.name }}</h3>
          <q-badge
            v-if="output.workout_adapted"
            color="orange"
            class="workout-badge"
          >
            Aangepast op basis van jouw status vandaag
          </q-badge>
        </div>
        <p class="workout-duration">{{ output.adapted_workout.duration_minutes }} minuten</p>
        <p v-if="output.adapted_workout.description" class="workout-description">
          {{ output.adapted_workout.description }}
        </p>
      </section>

      <!-- 4. MACRO'S VANDAAG -->
      <section class="macros-section">
        <div class="macro-card">
          <div class="macro-value">{{ output.macros.kcal }}</div>
          <div class="macro-label">Kcal</div>
        </div>
        <div class="macro-card">
          <div class="macro-value">{{ output.macros.carbs_g }}<span class="macro-unit">g</span></div>
          <div class="macro-label">Koolhydraten</div>
        </div>
        <div class="macro-card">
          <div class="macro-value">{{ output.macros.protein_g }}<span class="macro-unit">g</span></div>
          <div class="macro-label">Eiwitten</div>
        </div>
        <div class="macro-card">
          <div class="macro-value">{{ output.macros.fat_g }}<span class="macro-unit">g</span></div>
          <div class="macro-label">Vetten</div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

const loading = ref(true)
const error = ref(null)
const output = ref(null)

const statusLabel = computed(() => {
  if (!output.value?.drs) return ''
  const labels = { green: 'Groen', amber: 'Amber', red: 'Rood' }
  return labels[output.value.drs.status] ?? output.value.drs.status
})

const workoutStatusLabel = computed(() => {
  if (!output.value) return ''
  return output.value.workout_adapted ? 'Aangepast' : 'Gepland'
})

const formattedTime = computed(() => {
  if (!output.value?.createdAt) return new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  return new Date(output.value.createdAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
})

async function fetchDailyOutput () {
  const userId = localStorage.getItem('userId') || 'demo-user'
  const date = new Date().toISOString().split('T')[0]

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/elite/daily-output?userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}`
    )
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Kon dagelijkse output niet ophalen')
    }

    output.value = data
  } catch (e) {
    error.value = e.message || 'Er is iets misgegaan'
  } finally {
    loading.value = false
  }
}

onMounted(fetchDailyOutput)
</script>

<style lang="sass" scoped>
.elite-dashboard
  padding: 24px
  padding-bottom: 48px

.dashboard-container
  max-width: 480px
  margin: 0 auto

.drs-card
  background: white
  border-radius: 16px
  padding: 32px
  text-align: center
  margin-bottom: 24px
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06)

  &.green .drs-dot
    background: #21BA45

  &.amber .drs-dot
    background: #F2C037

  &.red .drs-dot
    background: #C10015

.drs-dot
  width: 80px
  height: 80px
  border-radius: 50%
  margin: 0 auto 16px
  background: #ccc

.drs-score
  font-size: 2.5rem
  font-weight: 700
  color: #1a1a1a
  margin-bottom: 4px

.drs-status-label
  font-size: 1rem
  color: #666
  margin-bottom: 16px

.drs-breakdown
  display: flex
  justify-content: center
  gap: 24px
  font-size: 0.85rem
  color: #888

.oracle-card
  background: #f5f5f5
  border-radius: 12px
  padding: 20px
  margin-bottom: 24px

.oracle-header
  font-size: 0.75rem
  color: #888
  margin-bottom: 12px

.oracle-message
  font-size: 1rem
  line-height: 1.6
  color: #333
  margin: 0 0 12px 0
  white-space: pre-wrap

.oracle-footer
  font-size: 0.75rem
  color: #888

.workout-card
  background: white
  border-radius: 12px
  padding: 20px
  margin-bottom: 24px
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06)

.workout-header
  display: flex
  align-items: flex-start
  justify-content: space-between
  gap: 12px
  margin-bottom: 8px

.workout-name
  font-size: 1.25rem
  font-weight: 600
  color: #1a1a1a
  margin: 0

.workout-badge
  flex-shrink: 0
  font-size: 0.7rem

.workout-duration
  font-size: 0.95rem
  color: #666
  margin: 0 0 8px 0

.workout-description
  font-size: 0.9rem
  color: #555
  line-height: 1.5
  margin: 0

.macros-section
  display: grid
  grid-template-columns: repeat(4, 1fr)
  gap: 12px
  @media (max-width: 400px)
    grid-template-columns: repeat(2, 1fr)

.macro-card
  background: white
  border-radius: 12px
  padding: 16px
  text-align: center
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06)
  border: 1px solid #f0f0f0

.macro-value
  font-size: 1.5rem
  font-weight: 700
  color: #1D9E75

.macro-unit
  font-size: 0.9em
  font-weight: 500
  opacity: 0.8

.macro-label
  font-size: 0.7rem
  color: #888
  margin-top: 4px
</style>
