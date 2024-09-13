import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

export const getGyms = async (token: string) => {
  const response = await api.get('/user/gyms', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export const createGym = async (token: string, gymData: Partial<Gym>) => {
  const response = await api.post('/gyms', gymData, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

// Other API calls...