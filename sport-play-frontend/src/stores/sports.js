import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSports, getSport } from '../api/sports'

export const useSportsStore = defineStore('sports', () => {
  const sports = ref([])
  const currentSport = ref(null)

  const fetchSports = async () => {
    const res = await getSports()
    sports.value = res.data
  }

  const fetchSport = async (id) => {
    const res = await getSport(id)
    currentSport.value = res.data
  }

  return { sports, currentSport, fetchSports, fetchSport }
})