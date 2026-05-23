<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'

const router = useRouter()
const authStore = useAuthStore()
const { user, token } = storeToRefs(authStore)

const bookings = ref([])
const balance = ref(0)
const cancelling = ref(null)

onMounted(async () => {
  if (!token.value) { router.push('/login'); return }
  const res = await axios.get('/api/profile', {
    headers: { Authorization: `Bearer ${token.value}` }
  })
  bookings.value = res.data.bookings
  balance.value = res.data.balance
})

const activeBookings = computed(() => bookings.value.filter(b => b.status === 'active'))
const pastBookings = computed(() => bookings.value.filter(b => b.status !== 'active'))

const formatDate = (date) => new Date(date).toLocaleDateString('ru-RU', {
  day: 'numeric', month: 'long', weekday: 'short'
})

const cancel = async (bookingId) => {
  if (!confirm('Отменить запись?')) return
  cancelling.value = bookingId
  try {
    await axios.post(`/api/cancel/${bookingId}`, {}, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    const b = bookings.value.find(b => b.id === bookingId)
    if (b) b.status = 'cancelled'
    // Обновляем баланс если была оплата
    const res = await axios.get('/api/profile', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    balance.value = res.data.balance
  } catch (err) {
    alert(err.response?.data?.error || 'Ошибка отмены')
  } finally {
    cancelling.value = null
  }
}
</script>

<template>
  <div class="page">
    <div class="content">

      <div class="profile-header">
        <div class="avatar">{{ user?.name?.[0] }}</div>
        <div>
          <h1>{{ user?.name }}</h1>
          <p>{{ user?.email }}</p>
          <div class="balance">💰 Баланс: {{ balance }} ₽</div>
        </div>
      </div>

      <section>
        <h2>Предстоящие занятия</h2>
        <div v-if="activeBookings.length === 0" class="empty">Нет активных записей</div>
        <div class="booking-card" v-for="b in activeBookings" :key="b.id">
          <img :src="b.sport_image" :alt="b.sport_name" />
          <div class="booking-info">
            <span class="sport-tag">{{ b.sport_name }}</span>
            <h3>{{ b.hall_name }}</h3>
            <p>📍 {{ b.address }}</p>
            <p>🗓 {{ formatDate(b.date) }}, {{ b.time.slice(0, 5) }}</p>
            <p v-if="b.price > 0">💳 {{ b.price }} ₽</p>
          </div>
          <div class="card-right">
            <span class="status active">Активна</span>
            <button
              class="cancel-btn"
              @click="cancel(b.id)"
              :disabled="cancelling === b.id"
            >
              {{ cancelling === b.id ? '...' : 'Отменить' }}
            </button>
          </div>
        </div>
      </section>

      <section class="past">
        <h2>История занятий</h2>
        <div v-if="pastBookings.length === 0" class="empty">История пока пуста</div>
        <div class="booking-card past-card" v-for="b in pastBookings" :key="b.id">
          <img :src="b.sport_image" :alt="b.sport_name" />
          <div class="booking-info">
            <span class="sport-tag">{{ b.sport_name }}</span>
            <h3>{{ b.hall_name }}</h3>
            <p>📍 {{ b.address }}</p>
            <p>🗓 {{ formatDate(b.date) }}, {{ b.time.slice(0, 5) }}</p>
          </div>
          <span class="status" :class="b.status">
            {{ b.status === 'cancelled' ? 'Отменена' : 'Завершена' }}
          </span>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f5f5f5; font-family: system-ui; padding-top: 80px; }
.content { max-width: 900px; margin: 0 auto; padding: 40px; }
.profile-header {
  display: flex; align-items: center; gap: 24px;
  background: white; border-radius: 20px; padding: 30px;
  margin-bottom: 40px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.avatar {
  width: 80px; height: 80px; background: #e94560; color: white;
  border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-size: 36px; font-weight: 700; flex-shrink: 0;
}
.profile-header h1 { font-size: 28px; font-weight: 800; color: #1a1a2e; }
.profile-header p { color: #666; margin-top: 4px; }
.balance {
  margin-top: 8px; font-size: 16px; font-weight: 700;
  color: #2e7d32; background: #e8f5e9; padding: 4px 12px;
  border-radius: 20px; display: inline-block;
}
section { margin-bottom: 40px; }
h2 { font-size: 24px; font-weight: 700; margin-bottom: 20px; color: #1a1a2e; }
.booking-card {
  background: white; border-radius: 16px; padding: 20px;
  display: flex; align-items: center; gap: 20px;
  margin-bottom: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.past-card { opacity: 0.7; }
.booking-card img { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; }
.booking-info { flex: 1; }
.sport-tag {
  background: #fff0f3; color: #e94560;
  padding: 2px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 600;
}
.booking-info h3 { font-size: 18px; font-weight: 700; margin: 8px 0 4px; }
.booking-info p { color: #666; font-size: 14px; margin-top: 2px; }
.card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.status { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; }
.status.active { background: #e8f5e9; color: #2e7d32; }
.status.completed { background: #f5f5f5; color: #999; }
.status.cancelled { background: #fff0f0; color: #e94560; }
.cancel-btn {
  background: #fff0f0; color: #e94560; border: none;
  padding: 6px 14px; border-radius: 20px; font-size: 13px;
  font-weight: 600; cursor: pointer; transition: 0.2s;
}
.cancel-btn:hover { background: #e94560; color: white; }
.cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.empty { color: #999; padding: 20px; text-align: center; background: white; border-radius: 16px; }
</style>