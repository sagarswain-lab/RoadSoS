import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000, // Increased to 60s for AI and OSM data
})

export const emergencyAPI = {
  getNearby: (lat, lng, radius = 5000) =>
    api.post('/api/emergency/nearby', { lat, lng, radius }).then(r => r.data),

  geocode: (lat, lng) =>
    api.get('/api/emergency/geocode', { params: { lat, lng } }).then(r => r.data),
}

export const chatAPI = {
  send: (message, sessionId, lat, lng, language = 'en') =>
    api.post('/api/chat', { message, session_id: sessionId, lat, lng, language }).then(r => r.data),
}

export const legalAPI = {
  ask: (question, country = 'IN', language = 'en') =>
    api.post('/api/legal', { question, country, language }).then(r => r.data),
}

export const reportAPI = {
  submit: (data) =>
    api.post('/api/report', data).then(r => r.data),

  getStatus: (reportId) =>
    api.get(`/api/report/status/${reportId}`).then(r => r.data),
}

export default api
