import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'
import routes from './routes'

function getCurrentUser () {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach(async (to, _from, next) => {
    if (process.env.SERVER) {
      next()
      return
    }
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const isLoginPage = to.path === '/login'
    const user = await getCurrentUser()
    if (requiresAuth && !user) {
      next('/login')
    } else if (isLoginPage && user) {
      next('/onboarding')
    } else {
      next()
    }
  })

  return Router
})
