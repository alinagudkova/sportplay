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

  // Берём verifier который сохранили перед редиректом
  const codeVerifier = localStorage.getItem('vk_code_verifier') || ''
  console.log('codeVerifier:', codeVerifier)

  if (code && deviceId) {
    try {
      const res = await axios.post('/api/auth/vk', {
        code,
        device_id: deviceId,
        state,
        code_verifier: codeVerifier
      })

      localStorage.removeItem('vk_code_verifier')
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