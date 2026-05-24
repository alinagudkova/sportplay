import http from 'k6/http'
import { sleep } from 'k6'

export const options = {
  vus: 50,        // 50 виртуальных пользователей
  duration: '30s' // 30 секунд
}

export default function() {
  http.get('https://sportplay.458000.ru/api/sports')
  sleep(1)
}