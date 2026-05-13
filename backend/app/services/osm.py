import httpx
import math
from typing import List, Dict, Any
from app.models.schemas import EmergencyService

# Primary and fallback Overpass API servers
OVERPASS_SERVERS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter"
]

SERVICE_QUERIES = {
    "hospital": '["amenity"~"hospital|clinic|doctors"]',
    "police": '["amenity"="police"]',
    "ambulance": '["emergency"~"ambulance_station|medical_service"]',
    "fire": '["amenity"="fire_station"]',
    "pharmacy": '["amenity"="pharmacy"]',
    "towing": '["shop"~"car_repair|tyres"]["service"~"towing|recovery"]',
}

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def score_service(service: dict, distance_km: float, service_type: str) -> float:
    score = 100 - (distance_km * 10)
    if service_type == "hospital":
        tags = service.get("tags", {})
        if tags.get("emergency") == "yes":
            score += 30
        if tags.get("healthcare") == "hospital":
            score += 20
        if tags.get("trauma_level"):
            score += 15
    return max(0, score)

def get_reason(service: dict, distance_km: float, service_type: str) -> str:
    tags = service.get("tags", {})
    reasons = []
    reasons.append(f"{distance_km:.1f}km away")
    if tags.get("emergency") == "yes":
        reasons.append("has emergency dept")
    if tags.get("phone") or tags.get("contact:phone"):
        reasons.append("phone available")
    if distance_km < 1:
        reasons.append("very close")
    return " · ".join(reasons)

_client = None

def get_client():
    global _client
    if _client is None:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
        }
        _client = httpx.AsyncClient(timeout=30, headers=headers)
    return _client

async def fetch_nearby_services(lat: float, lng: float, radius: int = 5000) -> List[EmergencyService]:
    results = []
    client = get_client()
    
    # Combined query for better performance
    combined_filter = '["amenity"~"hospital|clinic|doctors|police|fire_station|pharmacy"]'
    query = f"""
    [out:json][timeout:20];
    (
      node{combined_filter}(around:{radius},{lat},{lng});
      way{combined_filter}(around:{radius},{lat},{lng});
      relation{combined_filter}(around:{radius},{lat},{lng});
      node["emergency"~"ambulance_station|medical_service"](around:{radius},{lat},{lng});
      node["shop"~"car_repair|tyres"]["service"~"towing|recovery"](around:{radius},{lat},{lng});
    );
    out center tags;
    """

    for url in OVERPASS_SERVERS:
        try:
            # Using content=query instead of data={'data': query} is often more reliable
            resp = await client.post(url, content=query)
            
            if resp.status_code == 429:
                print(f"Overpass rate limit hit on {url}, trying next server...")
                continue
                
            if resp.status_code != 200:
                print(f"Overpass error {resp.status_code} on {url}, trying next...")
                continue
            
            elements = resp.json().get("elements", [])
            for el in elements:
                tags = el.get("tags", {})
                
                # Determine service type from tags
                service_type = "other"
                amenity = tags.get("amenity")
                if amenity in ["hospital", "clinic", "doctors"]: service_type = "hospital"
                elif amenity == "police": service_type = "police"
                elif amenity == "fire_station": service_type = "fire"
                elif amenity == "pharmacy": service_type = "pharmacy"
                elif tags.get("emergency") in ["ambulance_station", "medical_service"]: service_type = "ambulance"
                elif tags.get("shop") in ["car_repair", "tyres"]: service_type = "towing"

                elat = el.get("lat") or el.get("center", {}).get("lat")
                elng = el.get("lon") or el.get("center", {}).get("lon")
                if not elat or not elng: continue

                distance = haversine(lat, lng, elat, elng)
                phone = tags.get("phone") or tags.get("contact:phone") or tags.get("contact:mobile")
                name = tags.get("name") or tags.get("name:en") or service_type.replace("_", " ").title()

                service = EmergencyService(
                    id=str(el.get("id", "")),
                    name=name,
                    type=service_type,
                    lat=elat,
                    lng=elng,
                    distance_km=round(distance, 2),
                    address=tags.get("addr:full") or tags.get("addr:street"),
                    phone=phone,
                    score=round(score_service(el, distance, service_type), 1),
                    reason=get_reason(el, distance, service_type)
                )
                results.append(service)
            
            if results:
                print(f"[SUCCESS] Found {len(results)} services using {url}")
                break
            else:
                print(f"[INFO] No results found on {url}, trying fallback...")
                
        except Exception as e:
            print(f"Overpass error on {url}: {e}")
            continue
            
    results.sort(key=lambda x: x.score or 0, reverse=True)
    return results
