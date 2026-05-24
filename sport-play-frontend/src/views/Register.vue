<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')

const register = async () => {
  try {
    error.value = ''
    await authStore.register(name.value, email.value, password.value)
    router.push('/login')
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка регистрации'
  }
}
// ← строку с userData удали
</script>

<template>
  <div class="page">
    <div class="card">
      <h1>Регистрация</h1>

      <p class="error" v-if="error">{{ error }}</p>

      <input v-model="name" placeholder="Имя" />
      <input v-model="email" placeholder="Email" type="email" />
      <input v-model="password" placeholder="Пароль" type="password" />

      <button @click="register">Создать аккаунт</button>

      <p class="link">
        Уже есть аккаунт?
        <span @click="router.push('/login')">Войти</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
  font-family: system-ui;
}

.card {
  background: white;
  border-radius: 24px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

h1 {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 30px;
  color: #1a1a2e;
}

input {
  width: 100%;
  padding: 14px;
  border: 2px solid #eee;
  border-radius: 12px;
  font-size: 16px;
  margin-bottom: 16px;
  outline: none;
  transition: 0.3s;
  box-sizing: border-box;
}

input:focus { border-color: #e94560; }

button {
  width: 100%;
  padding: 16px;
  background: #e94560;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
  margin-top: 8px;
}

button:hover { background: #c73652; }

.error {
  background: #fff0f0;
  color: #e94560;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 14px;
}

.link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.link span {
  color: #e94560;
  cursor: pointer;
  font-weight: 600;
}
</style>