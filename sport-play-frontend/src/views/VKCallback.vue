<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.slice(1))
  
  const code = params.get('code') || hashParams.get('code')
  const deviceId = params.get('device_id') || hashParams.get('device_id')

  if (code && deviceId) {
    try {
      const res = await axios.post('/api/auth/vk', { code, device_id: deviceId })
      localStorage.setItem('token', res.data.token)
localStorage.setItem('user', JSON.stringify(res.data.user))
window.location.href = '/'
    } catch (err) {
      console.error(err)
      router.push('/login')
    }
  } else {
    router.push('/login')
  }
})
</script>

<template>
  <div class="loading">Входим через ВКонтакте...</div>
</template>

<style scoped>
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 24px;
  color: #666;
  font-family: system-ui;
}
</style>