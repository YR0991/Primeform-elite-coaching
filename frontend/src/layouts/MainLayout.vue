<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Primeform Elite Coaching
        </q-toolbar-title>

        <q-btn
          flat
          dense
          round
          icon="logout"
          aria-label="Uitloggen"
          @click="onLogout"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header>
          Essential Links
        </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import EssentialLink from 'components/EssentialLink.vue'

const router = useRouter()

async function onLogout () {
  await signOut(auth)
  localStorage.removeItem('userId')
  await router.push('/login')
}

const linksList = [
  {
    title: 'Onboarding',
    caption: 'Start hier',
    icon: 'rocket_launch',
    link: '/onboarding'
  },
  {
    title: 'Check-in',
    caption: 'Dagelijkse check-in',
    icon: 'favorite',
    link: '/checkin'
  },
  {
    title: 'Dashboard',
    caption: 'Elite dashboard',
    icon: 'dashboard',
    link: '/dashboard'
  },
  {
    title: 'Docs',
    caption: 'quasar.dev',
    icon: 'school',
    link: 'https://quasar.dev'
  }
]

const leftDrawerOpen = ref(false)

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
