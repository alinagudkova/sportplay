<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { token, user } = storeToRefs(authStore)

const hall = ref(null)
const slots = ref([])
const selectedSlot = ref(null)
const participants = ref([])
const showAuth = ref(false)
const rating = ref(null)
const userRating = ref(0)
const userComment = ref('')
const ratingSubmitted = ref(false)

onMounted(async () => {
  const [hallRes, slotsRes, ratingRes] = await Promise.all([
    axios.get(`/api/halls/${route.params.id}`),
    axios.get(`/api/halls/${route.params.id}/slots`),
    axios.get(`/api/halls/${route.params.id}/rating`)
  ])
  hall.value = hallRes.data
  slots.value = slotsRes.data
  rating.value = ratingRes.data

  if (hallRes.data.address && typeof ymaps !== 'undefined') {
    setTimeout(() => {
      ymaps.ready(() => {
        const map = new ymaps.Map('map', { center: [52.2978, 104.2964], zoom: 14 })
        ymaps.geocode(hallRes.data.address).then(res => {
          const obj = res.geoObjects.get(0)
          if (obj) {
            const coords = obj.geometry.getCoordinates()
            map.setCenter(coords, 15)
            map.geoObjects.add(new ymaps.Placemark(coords,
              { balloonContent: hallRes.data.name },
              { preset: 'islands#redDotIcon' }
            ))
          }
        })
      })
    }, 500)
  }
})

const selectSlot = async (slot) => {
  if (!token.value) { showAuth.value = true; return }
  selectedSlot.value = slot
  const res = await axios.get(`/api/slots/${slot.id}/participants`)
  participants.value = res.data
}

const bookSlot = async () => {
  try {
    await axios.post(
      '/api/book',
      { slot_id: selectedSlot.value.id },
      { headers: { Authorization: `Bearer ${token.value}` } }
    )
    alert('Вы записаны!')
    selectedSlot.value = null
    const res = await axios.get(`/api/halls/${route.params.id}/slots`)
    slots.value = res.data
  } catch (err) {
    alert(err.response?.data?.error || 'Ошибка записи')
  }
}

const submitRating = async () => {
  if (!token.value) { showAuth.value = true; return }
  try {
    await axios.post(
      `/api/halls/${route.params.id}/rating`,
      { rating: userRating.value, comment: userComment.value },
      { headers: { Authorization: `Bearer ${token.value}` } }
    )
    ratingSubmitted.value = true
    const res = await axios.get(`/api/halls/${route.params.id}/rating`)
    rating.value = res.data
  } catch (err) {
    alert(err.response?.data?.error || 'Ошибка')
  }
}

const formatDate = (date) => new Date(date).toLocaleDateString('ru-RU', {
  day: 'numeric', month: 'long', weekday: 'short'
})
</script>

<template>
  <div class="page" v-if="hall">

    <button class="back" @click="router.go(-1)">← Назад</button>

    <section class="hall-hero" :style="hall.image_url ? `background-image: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${hall.image_url}); background-size: cover; background-position: center;` : ''">
      <div class="hall-hero-content">
        <div class="sport-tag">{{ hall.sport_name }}</div>
        <h1>{{ hall.name }}</h1>
        <p>{{ hall.description }}</p>
      </div>
    </section>

    <div class="content">

      <section class="slots">
        <h2>Доступные слоты</h2>
        <div class="slots-grid">
          <div
            v-for="slot in slots" :key="slot.id"
            class="slot-card"
            :class="{ active: selectedSlot?.id === slot.id }"
            @click="selectSlot(slot)"
          >
            <div class="slot-date">{{ formatDate(slot.date) }}</div>
            <div class="slot-time">{{ slot.time.slice(0, 5) }}</div>
            <div class="slot-spots">{{ slot.booked_count }}/{{ slot.max_participants }} мест</div>
          </div>
        </div>
      </section>

      <section class="slot-detail" v-if="selectedSlot">
        <h2>{{ formatDate(selectedSlot.date) }}, {{ selectedSlot.time.slice(0, 5) }}</h2>
        <div class="participants" v-if="participants.length">
          <h3>Уже записались:</h3>
          <div class="participant" v-for="p in participants" :key="p.name">
            <div class="avatar">{{ p.name[0] }}</div>
            <span>{{ p.name }}</span>
          </div>
        </div>
        <p v-else class="no-participants">Пока никто не записался — будь первым!</p>
        <button class="book-btn" @click="bookSlot">Записаться</button>
      </section>

      <section class="map-section" v-if="hall.address">
        <h2>На карте</h2>
        <div id="map" style="width: 100%; height: 400px; border-radius: 16px;"></div>
      </section>

      <!-- РЕЙТИНГ — внутри .content -->
      <section class="rating-section" v-if="rating">
        <h2>Рейтинг зала</h2>
        <div class="rating-summary">
          <div class="rating-avg">{{ rating.avg ? Number(rating.avg).toFixed(1) : '—' }}</div>
          <div>
            <div class="stars">
              <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(rating.avg) }">★</span>
            </div>
            <div class="rating-count">{{ rating.count }} оценок</div>
          </div>
        </div>

        <div class="rate-form" v-if="!ratingSubmitted">
          <h3>Оставить оценку</h3>
          <div class="stars-input">
            <span v-for="i in 5" :key="i" class="star-btn" :class="{ selected: i <= userRating }" @click="userRating = i">★</span>
          </div>
          <textarea v-model="userComment" placeholder="Ваш отзыв (необязательно)" rows="3"></textarea>
          <button class="book-btn" @click="submitRating" :disabled="!userRating">Отправить оценку</button>
        </div>
        <div v-else class="rating-thanks">✅ Спасибо за оценку!</div>

        <div class="reviews" v-if="rating.reviews?.length">
          <h3>Отзывы</h3>
          <div class="review" v-for="r in rating.reviews" :key="r.created_at">
            <div class="review-header">
              <strong>{{ r.user_name }}</strong>
              <div class="stars small">
                <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= r.rating }">★</span>
              </div>
            </div>
            <p v-if="r.comment">{{ r.comment }}</p>
          </div>
        </div>
      </section>

    </div>

    <div class="modal-overlay" v-if="showAuth" @click.self="showAuth = false">
      <div class="modal">
        <h2>Войдите чтобы записаться</h2>
        <button @click="router.push('/login')">Войти</button>
        <button class="secondary" @click="router.push('/register')">Зарегистрироваться</button>
      </div>
    </div>

  </div>
  <div v-else class="loading">Загрузка...</div>
</template>

<style scoped>
.page { font-family: system-ui; min-height: 100vh; background: #f5f5f5; }

.back {
  position: fixed; top: 20px; left: 20px;
  padding: 10px 20px; background: rgba(0,0,0,0.5);
  color: white; border: none; border-radius: 50px;
  cursor: pointer; font-size: 14px; z-index: 100; transition: 0.3s;
}
.back:hover { background: rgba(0,0,0,0.8); }

.hall-hero {
  height: 50vh; background: linear-gradient(135deg, #0f3460, #16213e);
  display: flex; align-items: flex-end; padding: 40px; color: white;
}
.sport-tag {
  background: #e94560; padding: 4px 12px; border-radius: 20px;
  font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 12px;
}
.hall-hero-content h1 { font-size: 42px; font-weight: 800; margin-bottom: 8px; }
.hall-hero-content p { opacity: 0.8; margin-top: 4px; }

.content { max-width: 900px; margin: 0 auto; padding: 40px; color: black; }
.slots h2, .slot-detail h2 { font-size: 28px; font-weight: 700; margin-bottom: 20px; }

.slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
.slot-card {
  background: white; color: black; border-radius: 16px; padding: 20px;
  cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: 0.3s; text-align: center; border: 2px solid transparent;
}
.slot-card:hover { transform: translateY(-4px); }
.slot-card.active { border-color: #e94560; }
.slot-date { font-size: 13px; color: #333; margin-bottom: 6px; }
.slot-time { font-size: 28px; font-weight: 800; color: #1a1a2e; }
.slot-spots { font-size: 13px; color: #444; margin-top: 6px; }

.slot-detail {
  margin-top: 40px; background: white; border-radius: 20px;
  padding: 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.participants { margin: 20px 0; }
.participants h3 { font-size: 16px; color: #666; margin-bottom: 12px; }
.participant { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.avatar {
  width: 36px; height: 36px; background: #e94560; color: white;
  border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-weight: 700;
}
.no-participants { color: #999; margin: 20px 0; }

.book-btn {
  width: 100%; padding: 16px; background: #e94560; color: white;
  border: none; border-radius: 12px; font-size: 18px; font-weight: 600;
  cursor: pointer; transition: 0.3s; margin-top: 10px;
}
.book-btn:hover { background: #c73652; }
.book-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.map-section { margin-top: 40px; }
.map-section h2 { font-size: 28px; font-weight: 700; margin-bottom: 20px; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 200;
}
.modal { background: white; border-radius: 20px; padding: 40px; text-align: center; width: 360px; }
.modal h2 { font-size: 22px; margin-bottom: 20px; color: black; }
.modal button {
  width: 100%; padding: 14px; background: #e94560; color: white;
  border: none; border-radius: 12px; font-size: 16px;
  font-weight: 600; cursor: pointer; margin-bottom: 10px;
}
.modal .secondary { background: #f5f5f5; color: black; }

.loading { display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 24px; color: #666; }

.rating-section {
  margin-top: 40px; background: white; border-radius: 20px;
  padding: 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.rating-section h2 { font-size: 28px; font-weight: 700; margin-bottom: 20px; }
.rating-summary { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
.rating-avg { font-size: 64px; font-weight: 800; color: #1a1a2e; line-height: 1; }
.stars { display: flex; gap: 4px; }
.star { font-size: 24px; color: #ddd; }
.star.filled { color: #f59e0b; }
.stars.small .star { font-size: 16px; }
.rating-count { color: #666; font-size: 14px; margin-top: 4px; }

.rate-form { margin-bottom: 24px; }
.rate-form h3 { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
.stars-input { display: flex; gap: 8px; margin-bottom: 12px; }
.star-btn { font-size: 36px; color: #ddd; cursor: pointer; transition: 0.2s; }
.star-btn.selected { color: #f59e0b; }
.star-btn:hover { transform: scale(1.2); }
.rate-form textarea {
  width: 100%; padding: 12px; border: 2px solid #eee; border-radius: 12px;
  font-size: 15px; font-family: system-ui; resize: vertical;
  outline: none; box-sizing: border-box; margin-bottom: 12px;
}
.rate-form textarea:focus { border-color: #e94560; }
.rating-thanks { color: #2e7d32; font-weight: 600; padding: 12px; background: #e8f5e9; border-radius: 12px; }

.reviews h3 { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #1a1a2e; }
.review { padding: 16px 0; border-bottom: 1px solid #f0f0f0; }
.review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.review p { color: #444; font-size: 14px; margin: 0; }
</style>