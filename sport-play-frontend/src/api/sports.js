import axios from 'axios'

const BASE = '/api'

export const getSports = () => axios.get(`${BASE}/sports`)
export const getSport = (id) => axios.get(`${BASE}/sports/${id}`)