const routes = [
  {
    path: '/login',
    component: () => import('pages/EliteLogin.vue')
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/login' },
      { path: 'onboarding', component: () => import('pages/EliteOnboarding.vue'), meta: { requiresAuth: true } },
      { path: 'checkin', component: () => import('pages/EliteCheckin.vue'), meta: { requiresAuth: true } },
      { path: 'dashboard', component: () => import('pages/EliteDashboard.vue'), meta: { requiresAuth: true } }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
