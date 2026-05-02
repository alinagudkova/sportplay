import axios from 'axios'

const BASE = 'http://localhost:3000/api'

export const register = (data) => axios.post(`${BASE}/auth/register`, data)
export const login = (data) => axios.post(`${BASE}/auth/login`, data)