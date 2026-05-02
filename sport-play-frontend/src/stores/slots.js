import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSlots, bookSlot as bookSlotApi } from '../api/slots'
import { useAuthStore } from './auth'

export const useSlotsStore = defineStore('slots', () => {
  const slots = ref([])

  const fetchSlots = async () => {
    const res = await getSlots()
    slots.value = res.data
  }

  const bookSlot = async (slot_id) => {
    const auth = useAuthStore()
    await bookSlotApi(slot_id, auth.token.value)
    await fetchSlots()
  }

  return { slots, fetchSlots, bookSlot }
})