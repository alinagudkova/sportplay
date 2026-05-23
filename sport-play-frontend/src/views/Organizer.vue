<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'

const router = useRouter()
const authStore = useAuthStore()
const { token, user } = storeToRefs(authStore)

const tab = ref('halls')
const halls = ref([])
const sports = ref([])
const selectedHall = ref(null)
const slotBookings = ref([])
const searchQuery = ref('')
const searchResults = ref([])
const message = ref('')
const error = ref('')

// Формы
const hallForm = ref({ name: '', address: '', description: '', sport_id: '', image_url: '' })
const slotForm = ref({ hall_id: '', date: '', time: '', max_participants: 10, price: 0 })
const topupForm = ref({ user_id: '', amount: '', userName: '' })
const manualForm = ref({ slot_id: '', client_name: '' })

const headers = computed => ({ Authorization: `Bearer ${token.value}` })

const authHeaders = () => ({ Authorization: `Bearer ${token.value}` })

onMounted(async () => {
  if (!token.value) { router.push('/login'); return }
  await loadHalls()
  const res = await axios.get('/api/sports')
  sports.value = res.data
})

const loadHalls = async () => {
  const res = await axios.get('/api/organizer/halls', { headers: authHeaders() })
  halls.value = res.data
}

const createHall = async () => {
  try {
    error.value = ''
    await axios.post('/api/organizer/halls', hallForm.value, { headers: authHeaders() })
    message.value = 'Зал создан!'
    hallForm.value = { name: '', address: '', description: '', sport_id: '', image_url: '' }
    await loadHalls()
  } catch (err) { error.value = err.response?.data?.error || 'Ошибка' }
}

const createSlot = async () => {
  try {
    error.value = ''
    await axios.post('/api/organizer/slots', slotForm.value, { headers: authHeaders() })
    message.value = 'Слот создан!'
    slotForm.value = { hall_id: slotForm.value.hall_id, date: '', time: '', max_participants: 10, price: 0 }
  } catch (err) { error.value = err.response?.data?.error || 'Ошибка' }
}

const loadSlotBookings = async (slotId) => {
  selectedHall.value = slotId
  const res = await axios.get(`/api/organizer/slots/${slotId}/bookings`, { headers: authHeaders() })
  slotBookings.value = res.data
}

const removeBooking = async (bookingId) => {
  if (!confirm('Удалить участника?')) return
  await axios.delete(`/api/admin/bookings/${bookingId}`, { headers: authHeaders() })
  slotBookings.value = slotBookings.value.filter(b => b.id !== bookingId)
}

const addManual = async () => {
  try {
    await axios.post('/api/admin/bookings', manualForm.value, { headers: authHeaders() })
    message.value = 'Участник добавлен!'
    if (selectedHall.value) await loadSlotBookings(selectedHall.value)
    manualForm.value.client_name = ''
  } catch (err) { error.value = err.response?.data?.error || 'Ошибка' }
}

const searchUsers = async () => {
  if (searchQuery.value.length < 2) return
  const res = await axios.get(`/api/users/search?q=${searchQuery.value}`, { headers: authHeaders() })
  searchResults.value = res.data
}

const selectUser = (u) => {
  topupForm.value.user_id = u.id
  topupForm.value.userName = `${u.name} (${u.email}) — баланс: ${u.balance} ₽`
  searchResults.value = []
  searchQuery.value = ''
}

const topupBalance = async () => {
  try {
    error.value = ''
    await axios.post('/api/balance/add', {
      user_id: topupForm.value.user_id,
      amount: Number(topupForm.value.amount)
    }, { headers: authHeaders() })
    message.value = `Баланс пополнен на ${topupForm.value.amount} ₽`
    topupForm.value = { user_id: '', amount: '', userName: '' }
  } catch (err) { error.value = err.response?.data?.error || 'Ошибка' }
}
</script>

<template>
  <div class="page">
    <div class="content">
      <h1>Панель организатора</h1>

      <div class="msg success" v-if="message">{{ message }}</div>
      <div class="msg error" v-if="error">{{ error }}</div>

      <!-- ТАБЫ -->
      <div class="tabs">
        <button :class="{ active: tab === 'halls' }" @click="tab = 'halls'">🏟 Залы</button>
        <button :class="{ active: tab === 'slots' }" @click="tab = 'slots'">📅 Слоты</button>
        <button :class="{ active: tab === 'participants' }" @click="tab = 'participants'">👥 Участники</button>
        <button :class="{ active: tab === 'balance' }" @click="tab = 'balance'">💰 Баланс</button>
      </div>

      <!-- ЗАЛЫ -->
      <div v-if="tab === 'halls'">
        <div class="card">
          <h2>Создать зал</h2>
          <input v-model="hallForm.name" placeholder="Название зала" />
          <input v-model="hallForm.address" placeholder="Адрес (будет показан на карте 2ГИС)" />
          <textarea v-model="hallForm.description" placeholder="Описание" rows="3"></textarea>
          <select v-model="hallForm.sport_id">
            <option value="" disabled>Выберите вид спорта</option>
            <option v-for="s in sports" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
          <input v-model="hallForm.image_url" placeholder="Ссылка на фото зала (необязательно)" />
          <button @click="createHall">Создать зал</button>
        </div>

        <h2>Мои залы</h2>
        <div class="hall-item" v-for="h in halls" :key="h.id">
          <div>
            <strong>{{ h.name }}</strong>
            <p>📍 {{ h.address }}</p>
            <p>🏅 {{ h.sport_name }}</p>
          </div>
          <span class="hall-id">ID: {{ h.id }}</span>
        </div>
        <div class="empty" v-if="halls.length === 0">Залов пока нет</div>
      </div>

      <!-- СЛОТЫ -->
      <div v-if="tab === 'slots'">
        <div class="card">
          <h2>Создать слот записи</h2>
          <select v-model="slotForm.hall_id">
            <option value="" disabled>Выберите зал</option>
            <option v-for="h in halls" :key="h.id" :value="h.id">{{ h.name }}</option>
          </select>
          <input v-model="slotForm.date" type="date" />
          <input v-model="slotForm.time" type="time" />
          <input v-model.number="slotForm.max_participants" type="number" placeholder="Макс. участников" min="1" />
          <input v-model.number="slotForm.price" type="number" placeholder="Стоимость (0 = бесплатно)" min="0" />
          <button @click="createSlot">Создать слот</button>
        </div>
      </div>

      <!-- УЧАСТНИКИ -->
      <div v-if="tab === 'participants'">
        <div class="card">
          <h2>Участники слота</h2>
          <div class="row">
            <input v-model="manualForm.slot_id" placeholder="ID слота" style="width:120px" />
            <button @click="loadSlotBookings(manualForm.slot_id)">Загрузить</button>
          </div>

          <div v-if="slotBookings.length > 0">
            <div class="participant" v-for="b in slotBookings" :key="b.id">
              <div>
                <strong>{{ b.client_name }}</strong>
                <span v-if="b.email"> · {{ b.email }}</span>
                <span class="status-tag" :class="b.status">{{ b.status }}</span>
              </div>
              <button class="del-btn" @click="removeBooking(b.id)">Удалить</button>
            </div>
          </div>

          <h3 style="margin-top:24px">Добавить участника вручную</h3>
          <div class="row">
            <input v-model="manualForm.client_name" placeholder="Имя участника" />
            <button @click="addManual">Добавить</button>
          </div>
        </div>
      </div>

      <!-- БАЛАНС -->
      <div v-if="tab === 'balance'">
        <div class="card">
          <h2>Пополнить баланс пользователя</h2>
          <p class="hint">Пользователь передал вам наличные — введите его имя или email и пополните баланс</p>

          <input v-model="searchQuery" @input="searchUsers" placeholder="Поиск по имени или email" />

          <div class="search-results" v-if="searchResults.length > 0">
            <div class="search-item" v-for="u in searchResults" :key="u.id" @click="selectUser(u)">
              {{ u.name }} · {{ u.email }} · {{ u.balance }} ₽
            </div>
          </div>

          <div class="selected-user" v-if="topupForm.userName">
            ✅ {{ topupForm.userName }}
          </div>

          <input v-model.number="topupForm.amount" type="number" placeholder="Сумма в рублях" min="1" />
          <button @click="topupBalance" :disabled="!topupForm.user_id || !topupForm.amount">
            Пополнить баланс
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f5f5f5; font-family: system-ui; padding-top: 80px; }
.content { max-width: 800px; margin: 0 auto; padding: 40px; }
h1 { font-size: 32px; font-weight: 800; color: #1a1a2e; margin-bottom: 24px; }
h2 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 16px; }
h3 { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px; }
.tabs { display: flex; gap: 8px; margin-bottom: 32px; flex-wrap: wrap; }
.tabs button {
  padding: 10px 20px; border: none; border-radius: 12px;
  background: white; cursor: pointer; font-size: 14px;
  font-weight: 600; color: #666; transition: 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.tabs button.active { background: #e94560; color: white; }
.card {
  background: white; border-radius: 20px; padding: 30px;
  margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
input, select, textarea {
  width: 100%; padding: 12px 14px; border: 2px solid #eee;
  border-radius: 12px; font-size: 15px; margin-bottom: 12px;
  outline: none; transition: 0.2s; box-sizing: border-box;
  font-family: system-ui;
}
input:focus, select:focus, textarea:focus { border-color: #e94560; }
button {
  padding: 12px 24px; background: #e94560; color: white;
  border: none; border-radius: 12px; font-size: 15px;
  font-weight: 600; cursor: pointer; transition: 0.2s;
}
button:hover { background: #c73652; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.row input { margin-bottom: 0; }
.hall-item {
  background: white; border-radius: 14px; padding: 16px 20px;
  margin-bottom: 12px; display: flex; justify-content: space-between;
  align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.hall-item p { color: #666; font-size: 14px; margin-top: 4px; }
.hall-id { color: #999; font-size: 13px; }
.participant {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; border-bottom: 1px solid #f0f0f0;
}
.del-btn { background: #fff0f0; color: #e94560; padding: 6px 14px; font-size: 13px; }
.del-btn:hover { background: #e94560; color: white; }
.status-tag {
  display: inline-block; margin-left: 8px; padding: 2px 8px;
  border-radius: 10px; font-size: 12px; font-weight: 600;
}
.status-tag.active { background: #e8f5e9; color: #2e7d32; }
.status-tag.cancelled { background: #fff0f0; color: #e94560; }
.search-results {
  background: white; border: 2px solid #eee; border-radius: 12px;
  margin-bottom: 12px; overflow: hidden;
}
.search-item {
  padding: 12px 16px; cursor: pointer; font-size: 14px;
  border-bottom: 1px solid #f0f0f0; transition: 0.2s;
}
.search-item:hover { background: #fff0f3; }
.selected-user {
  background: #e8f5e9; color: #2e7d32; padding: 10px 16px;
  border-radius: 12px; margin-bottom: 12px; font-size: 14px; font-weight: 600;
}
.hint { color: #999; font-size: 14px; margin-bottom: 16px; }
.msg { padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; font-weight: 600; }
.msg.success { background: #e8f5e9; color: #2e7d32; }
.msg.error { background: #fff0f0; color: #e94560; }
.empty { color: #999; text-align: center; padding: 20px; }
</style>