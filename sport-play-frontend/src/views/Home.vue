<template>
  <div class="page">

    <!-- HERO -->
    <section class="hero">
      <div class="hero-content">
        <h1>Sport Play <span>Иркутск</span></h1>
        <p>Запишись на спортивное занятие в несколько кликов</p>
        <button @click="scrollToSports">Выбрать спорт</button>
      </div>
    </section>

    <!-- ВИДЫ СПОРТА -->
    <section class="sports" ref="sportsSection">
      <h2>Виды спорта</h2>
      <div class="sports-grid">
        <div
          v-for="sport in sports"
          :key="sport.id"
          class="sport-card"
          @click="$router.push(`/sport/${sport.id}`)"
        >
          <img :src="sport.image_url" :alt="sport.name" />
          <div class="sport-card-body">
            <h3>{{ sport.name }}</h3>
            <p>{{ sport.description }}</p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const sports = ref([])
const sportsSection = ref(null)

onMounted(async () => {
  const res = await axios.get('http://localhost:3000/api/sports')
  sports.value = res.data
})

const scrollToSports = () => {
  sportsSection.value.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.page {
  font-family: system-ui;
  background: #f5f5f5;
  min-height: 100vh;
}

/* HERO */
.hero {
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
}

.hero-content h1 {
  font-size: 64px;
  font-weight: 800;
  margin-bottom: 16px;
}

.hero-content h1 span {
  color: #e94560;
}

.hero-content p {
  font-size: 20px;
  opacity: 0.8;
  margin-bottom: 40px;
}

.hero-content button {
  padding: 16px 40px;
  background: #e94560;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}

.hero-content button:hover {
  transform: scale(1.05);
  background: #c73652;
}

/* SPORTS */
.sports {
  padding: 80px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.sports h2 {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 40px;
  text-align: center;
}

.sports-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.sport-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  transition: 0.3s;
}

.sport-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.15);
}

.sport-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.sport-card-body {
  padding: 20px;
}

.sport-card-body h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}

.sport-card-body p {
  color: #666;
  font-size: 14px;
}
</style>