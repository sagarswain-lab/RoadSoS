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
      // Fallback to Bhubaneswar
      console.warn('GPS error, using fallback:', err.message)
      setLocation({ lat: 20.2961, lng: 85.8245, accuracy: 1000 })
      setLoading(false)
    }

    // Use watchPosition for LIVE tracking (updates as user moves)
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 15000,
    })

    // Cleanup: stop watching when component unmounts
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { location, error, loading }
}
