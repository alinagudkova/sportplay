import axios from 'axios'
const BASE = '/api'

export const register = (data) => axios.post(`${BASE}/auth/register`, data)
export const login = (data) => axios.post(`${BASE}/auth/login`, data)