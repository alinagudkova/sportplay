<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { useSportsStore } from '../stores/sports'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const sportsStore = useSportsStore()
const { currentSport } = storeToRefs(sportsStore)

const halls = ref([])

onMounted(async () => {
  await sportsStore.fetchSport(route.params.id)
  const res = await axios.get(`/api/sports/${route.params.id}/halls`)
  halls.value = res.data
})
</script>

<template>
  <div class="page" v-if="currentSport">

    <!-- НАЗАД -->
    <button class="back" @click="router.push('/')">← Назад</button>

    <!-- HERO -->
    <section class="sport-hero">
      <img :src="currentSport.image_url" :alt="currentSport.name" />
      <div class="sport-hero-content">
        <h1>{{ currentSport.name }}</h1>
        <p>{{ currentSport.description }}</p>
      </div>
    </section>

    <!-- ЗАЛЫ -->
    <section class="halls">
      <h2>Залы в Иркутске</h2>
      <div class="halls-grid">
        <div
          v-for="hall in halls"
          :key="hall.id"
          class="hall-card"
          @click="router.push(`/hall/${hall.id}`)"
        >
          <div class="hall-card-body">
            <h3>{{ hall.name }}</h3>
            <p>📍 {{ hall.address }}</p>
            <p class="desc">{{ hall.description }}</p>
          </div>
          <span class="arrow">→</span>
        </div>
      </div>
    </section>

  </div>
  <div v-else class="loading">Загрузка...</div>
</template>

<style scoped>
.page {
  font-family: system-ui;
  min-height: 100vh;
  background: #f5f5f5;
}

.back {
  position: fixed;
  top: 20px;
  left: 20px;
  padding: 10px 20px;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 14px;
  z-index: 100;
  transition: 0.3s;
}

.back:hover {
  background: rgba(0,0,0,0.8);
}

.sport-hero {
  position: relative;
  height: 60vh;
}

.sport-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sport-hero-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40px;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  color: white;
}

.sport-hero-content h1 {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 8px;
}

.sport-hero-content p {
  font-size: 18px;
  opacity: 0.9;
}

.halls {
  padding: 60px 40px;
  max-width: 900px;
  margin: 0 auto;
}

.halls h2 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 30px;
}

.halls-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hall-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hall-card:hover {
  transform: translateX(8px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.hall-card h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
}

.hall-card p { color: #333; font-size: 14px; margin-top: 4px; }

.desc {
  margin-top: 8px !important;
}

.arrow {
  font-size: 24px;
  color: #e94560;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 24px;
  color: #666;
}
</style>