const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

interface NominatimResult {
  lat: string
  lon: string
}

/**
 * Forward-geocodes a location string to lat/lng using Nominatim.
 * Returns null if not found or fetch fails.
 */
export async function nominatimGeocode(
  location: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(location)}&format=json&limit=1`

  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    })

    if (!res.ok) return null

    const data = (await res.json()) as NominatimResult[]

    if (!data.length) return null

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    }
  } catch {
    return null
  }
}