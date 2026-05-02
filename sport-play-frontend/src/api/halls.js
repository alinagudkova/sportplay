import axios from 'axios'

const BASE = '/api'

export const getHalls = () => axios.get(`${BASE}/halls`)
export const getHall = (id) => axios.get(`${BASE}/halls/${id}`)