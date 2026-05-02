import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Sport from '../views/Sport.vue'
import Hall from '../views/Hall.vue'
import Profile from '../views/Profile.vue'
import Articles from '../views/Articles.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/sport/:id', component: Sport },
    { path: '/hall/:id', component: Hall },
    { path: '/profile', component: Profile },
    { path: '/articles', component: Articles },
  ]
})

export default router