import axios from 'axios'

const BASE = 'http://localhost:3000/api'

export const getHalls = () => axios.get(`${BASE}/halls`)
export const getHall = (id) => axios.get(`${BASE}/halls/${id}`)