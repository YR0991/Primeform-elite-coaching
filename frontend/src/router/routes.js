const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/onboarding' },
      { path: 'onboarding', component: () => import('pages/EliteOnboarding.vue') },
      { path: 'checkin', component: () => import('pages/EliteCheckin.vue') },
      { path: 'dashboard', component: () => import('pages/EliteDashboard.vue') }
    ]
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
