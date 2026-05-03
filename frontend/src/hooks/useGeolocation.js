import { useState, useEffect } from 'react'

export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLoading(false)
      return
    }

    const onSuccess = (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      })
      setLoading(false)
    }

    const onError = (err) => {
      // Fallback to Bhubaneswar (IIT Madras is Chennai, but dev location)
      console.warn('GPS error, using fallback:', err.message)
      setLocation({ lat: 20.2961, lng: 85.8245, accuracy: 1000 })
      setLoading(false)
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    })
  }, [])

  return { location, error, loading }
}
