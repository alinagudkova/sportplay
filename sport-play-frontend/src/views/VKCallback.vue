onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.slice(1))
  
  const code = params.get('code') || hashParams.get('code')
  const deviceId = params.get('device_id') || hashParams.get('device_id')

  console.log('URL:', window.location.href)
  console.log('code:', code, 'deviceId:', deviceId)

  if (code && deviceId) {
    try {
      const res = await axios.post('/api/auth/vk', { code, device_id: deviceId })
      authStore.token.value = res.data.token
      authStore.user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      router.push('/')
    } catch (err) {
      console.error(err)
      router.push('/login')
    }
  } else {
    console.log('Нет code или deviceId')
    router.push('/login')
  }
})