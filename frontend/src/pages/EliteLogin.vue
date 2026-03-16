<template>
  <div class="elite-login flex flex-center">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">PrimeForm Elite</h1>
      </div>

      <q-form @submit="onSubmit" class="login-form">
        <q-input
          v-model="email"
          type="email"
          label="E-mail"
          outlined
          dense
          :rules="[val => !!val || 'E-mail is verplicht']"
          class="q-mb-md"
        />
        <q-input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          label="Wachtwoord"
          outlined
          dense
          :rules="[val => !!val || 'Wachtwoord is verplicht']"
          class="q-mb-md"
        >
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <q-banner v-if="error" class="bg-negative text-white rounded-borders q-mb-md">
          {{ error }}
        </q-banner>

        <q-btn
          type="submit"
          label="Inloggen"
          color="primary"
          :loading="loading"
          unelevated
          no-caps
          class="login-btn full-width"
        />
      </q-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../config/firebase'

const router = useRouter()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    const userId = userCredential.user.uid
    localStorage.setItem('userId', userId)
    await router.push('/onboarding')
  } catch (err) {
    error.value = 'Ongeldige inloggegevens'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="sass" scoped>
.elite-login
  background: linear-gradient(180deg, #f5f7fa 0%, #e4e8ec 100%)
  min-height: 100vh

.login-card
  width: 100%
  max-width: 360px
  padding: 2rem
  background: white
  border-radius: 12px
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08)

.login-header
  text-align: center
  margin-bottom: 2rem

.login-title
  font-size: 1.5rem
  font-weight: 700
  color: #1D9E75
  margin: 0

.login-btn
  margin-top: 0.5rem
</style>
