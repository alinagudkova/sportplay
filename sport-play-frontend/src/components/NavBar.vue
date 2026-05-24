<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'

const router = useRouter()
const authStore = useAuthStore()
const { user, token } = storeToRefs(authStore)

const logout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-content">
      <span class="logo" @click="router.push('/')">Sport Play</span>

      <div class="links">
  <span @click="router.push('/')">Главная</span>
  <template v-if="token">
    <span 
      v-if="user?.role === 'organizer' || user?.role === 'admin'" 
      @click="router.push('/organizer')"
    >
      Панель организатора
    </span>
    <span @click="router.push('/profile')">{{ user?.name }}</span>
    <span class="logout" @click="logout">Выйти</span>
  </template>
  <template v-else>
    <span @click="router.push('/login')">Войти</span>
  </template>
</div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 22px;
  font-weight: 800;
  color: white;
  cursor: pointer;
}

.logo span { color: #e94560; }

.links {
  display: flex;
  gap: 24px;
  align-items: center;
}

.links span {
  color: rgba(255,255,255,0.8);
  cursor: pointer;
  font-size: 15px;
  transition: 0.3s;
}

.links span:hover { color: white; }

.logout { color: #e94560 !important; }
</style>