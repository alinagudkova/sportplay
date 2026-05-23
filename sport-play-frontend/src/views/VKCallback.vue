<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const deviceId = params.get('device_id')
  const state = params.get('state')

  // Ищем verifier который сохранили через перехват
  let codeVerifier = ''
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('ss_') && key.toLowerCase().includes('verif')) {
      codeVerifier = localStorage.getItem(key) || ''
      console.log('found verifier key:', key, 'value:', codeVerifier)
      break
    }
  }

  // Показываем всё что есть в localStorage для отладки
  console.log('localStorage keys:', Object.keys(localStorage))

  if (code && deviceId) {
    try {
      const res = await axios.post('/api/auth/vk', {
        code,
        device_id: deviceId,
        state,
        code_verifier: codeVerifier
      })
      // Чистим временные ключи
      Object.keys(localStorage)
        .filter(k => k.startsWith('ss_'))
        .forEach(k => localStorage.removeItem(k))

      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      window.location.href = '/'
    } catch (err) {
      console.error(err)
      window.location.href = '/login'
    }
  } else {
    window.location.href = '/login'
  }
})
  // В auth store при login и vk callback:
localStorage.setItem('user', JSON.stringify({ ...userData, role: res.data.user.role }))

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