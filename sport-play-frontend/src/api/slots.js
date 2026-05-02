import axios from 'axios'

const BASE = '/api'

export const getSlots = () => axios.get(`${BASE}/slots`)
export const bookSlot = (slot_id, token) => axios.post(
  `${BASE}/book`,
  { slot_id },
  { headers: { Authorization: `Bearer ${token}` } }
)