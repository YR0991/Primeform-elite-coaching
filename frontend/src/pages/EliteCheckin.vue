<template>
  <q-page class="elite-checkin">
    <div class="checkin-container">
      <!-- Header -->
      <header class="checkin-header">
        <h1 class="greeting">Goedemorgen {{ userName }}</h1>
        <p class="date">{{ formattedDate }}</p>
      </header>

      <!-- Form -->
      <q-card v-if="!drsResult" flat bordered class="checkin-card">
        <q-card-section>
          <q-form @submit="onSubmit" class="checkin-form">
            <q-input
              v-model.number="form.hrv"
              type="number"
              label="HRV"
              outlined
              dense
              :rules="[val => val > 0 || 'Voer een geldige HRV in']"
              class="q-mb-md"
            />

            <q-input
              v-model.number="form.rhr"
              type="number"
              label="Rusthartslag (bpm)"
              outlined
              dense
              :rules="[val => val > 0 && val < 250 || 'Voer een geldige hartslag in']"
              class="q-mb-md"
            />

            <div class="q-mb-lg">
              <label class="slider-label">Slaapkwaliteit</label>
              <q-slider
                v-model="form.sleep_score"
                :min="1"
                :max="5"
                :step="1"
                label
                :label-value="sleepLabel"
                color="#1D9E75"
                class="q-mt-sm"
              />
              <div class="slider-ends">
                <span>Slecht</span>
                <span>Uitstekend</span>
              </div>
            </div>

            <div class="q-mb-lg">
              <label class="slider-label">Energieniveau</label>
              <q-slider
                v-model="form.energy"
                :min="1"
                :max="5"
                :step="1"
                label
                :label-value="form.energy"
                color="#1D9E75"
                class="q-mt-sm"
              />
            </div>

            <div class="q-mb-lg">
              <label class="slider-label">Stressniveau</label>
              <q-slider
                v-model="form.stress"
                :min="1"
                :max="5"
                :step="1"
                label
                :label-value="stressLabel"
                color="#1D9E75"
                class="q-mt-sm"
              />
              <div class="slider-ends">
                <span>Laag</span>
                <span>Hoog</span>
              </div>
            </div>

            <q-btn
              type="submit"
              label="Verstuur check-in"
              unelevated
              no-caps
              size="lg"
              :loading="loading"
              :disable="loading"
              class="submit-btn full-width"
            />
          </q-form>
        </q-card-section>
      </q-card>

      <!-- DRS Result -->
      <q-card v-else flat bordered class="drs-result-card">
        <q-card-section class="text-center">
          <div class="drs-status" :class="drsResult.status">
            <q-icon :name="statusIcon" size="48px" />
            <span class="drs-score">{{ drsResult.score }}</span>
          </div>
          <p class="drs-label">Daily Readiness Score</p>
          <p class="redirect-msg">Je wordt doorgestuurd naar je dashboard...</p>
        </q-card-section>
      </q-card>
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

const userName = ref('Atleet')
const loading = ref(false)
const drsResult = ref(null)

const form = reactive({
  hrv: null,
  rhr: null,
  sleep_score: 3,
  energy: 3,
  stress: 3
})

const today = new Date()
const formattedDate = computed(() => {
  return today.toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const sleepLabel = computed(() => {
  const labels = ['', 'Slecht', 'Matig', 'Redelijk', 'Goed', 'Uitstekend']
  return labels[form.sleep_score] || form.sleep_score
})

const stressLabel = computed(() => {
  const labels = ['', 'Laag', 'Licht', 'Gemiddeld', 'Hoog', 'Zeer hoog']
  return labels[form.stress] || form.stress
})

const statusIcon = computed(() => {
  if (!drsResult.value) return 'circle'
  return drsResult.value.status === 'green' ? 'check_circle' : drsResult.value.status === 'amber' ? 'warning' : 'cancel'
})

async function onSubmit () {
  const userId = localStorage.getItem('userId') || 'demo-user'
  loading.value = true
  drsResult.value = null

  try {
    const response = await fetch(`${apiBaseUrl}/api/elite/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        date: today.toISOString().split('T')[0],
        hrv: form.hrv,
        rhr: form.rhr,
        sleep_score: form.sleep_score,
        energy: form.energy,
        stress: form.stress
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Check-in mislukt')
    }

    drsResult.value = data.drs

    // Genereer dagelijkse output (voor dashboard)
    const dateStr = today.toISOString().split('T')[0]
    await fetch(`${apiBaseUrl}/api/elite/daily-output`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, date: dateStr })
    }).catch(() => {}) // Negeer fout — dashboard toont dan lege staat

    setTimeout(() => {
      router.push('/elite/dashboard')
    }, 2000)
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Check-in mislukt. Probeer het opnieuw.'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const storedName = localStorage.getItem('userName')
  if (storedName) userName.value = storedName
})
</script>

<style lang="sass" scoped>
.elite-checkin
  padding: 24px
  max-width: 480px
  margin: 0 auto

.checkin-container
  padding-top: 16px

.checkin-header
  margin-bottom: 32px

.greeting
  font-size: 1.5rem
  font-weight: 600
  color: #1a1a1a
  margin: 0 0 4px 0

.date
  font-size: 0.95rem
  color: #666
  margin: 0

.checkin-card
  border-radius: 12px
  overflow: hidden

.checkin-form
  padding: 8px 0

.slider-label
  display: block
  font-size: 0.875rem
  font-weight: 500
  color: #333
  margin-bottom: 4px

.slider-ends
  display: flex
  justify-content: space-between
  font-size: 0.75rem
  color: #888
  margin-top: 4px

.submit-btn
  background: #1D9E75 !important
  color: white !important
  font-weight: 600
  padding: 14px
  margin-top: 8px
  border-radius: 8px

.drs-result-card
  border-radius: 12px
  padding: 40px 24px

.drs-status
  display: flex
  align-items: center
  justify-content: center
  gap: 12px
  margin-bottom: 8px

  &.green
    color: #21BA45

  &.amber
    color: #F2C037

  &.red
    color: #C10015

.drs-score
  font-size: 2.5rem
  font-weight: 700

.drs-label
  font-size: 0.9rem
  color: #666
  margin: 0 0 24px 0

.redirect-msg
  font-size: 0.85rem
  color: #999
  margin: 0
</style>
