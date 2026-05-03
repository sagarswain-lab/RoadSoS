import httpx
from typing import Optional, Dict

NOMINATIM_URL = "https://nominatim.openstreetmap.org"
HEADERS = {"User-Agent": "RoadSoS-Hackathon/1.0"}

async def reverse_geocode(lat: float, lng: float) -> Dict:
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"{NOMINATIM_URL}/reverse",
                params={"lat": lat, "lon": lng, "format": "json"},
                headers=HEADERS
            )
            data = resp.json()
            address = data.get("address", {})
            return {
                "display_name": data.get("display_name", ""),
                "country": address.get("country", ""),
                "country_code": address.get("country_code", "IN").upper(),
                "state": address.get("state", ""),
                "city": address.get("city") or address.get("town") or address.get("village", ""),
                "road": address.get("road", "")
            }
        except Exception as e:
            print(f"Geocoding error: {e}")
            return {"country_code": "IN", "display_name": "Unknown location"}

async def forward_geocode(address: str) -> Optional[Dict]:
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"{NOMINATIM_URL}/search",
                params={"q": address, "format": "json", "limit": 1},
                headers=HEADERS
            )
            results = resp.json()
            if results:
                return {"lat": float(results[0]["lat"]), "lng": float(results[0]["lon"])}
        except Exception as e:
            print(f"Forward geocoding error: {e}")
        return None
