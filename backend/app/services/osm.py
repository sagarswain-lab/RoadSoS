import httpx
import math
from typing import List, Dict, Any
from urllib.parse import quote
from app.models.schemas import EmergencyService

# Overpass API servers - honest User-Agent is REQUIRED to avoid 406 errors
OVERPASS_SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
]

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
        # IMPORTANT: Overpass API requires an HONEST User-Agent.
        # Fake browser User-Agents cause 406 errors.
        _client = httpx.AsyncClient(
            timeout=25,
            headers={
                "User-Agent": "RoadSoS/1.0 (road-safety-hackathon; contact: sagarswain-lab)",
                "Accept": "application/json",
            }
        )
    return _client

def _build_query(lat: float, lng: float, radius: int) -> str:
    """Build a clean, compact Overpass QL query string."""
    return (
        f'[out:json][timeout:25];'
        f'('
        f'node["amenity"~"hospital|clinic|doctors|police|fire_station|pharmacy"](around:{radius},{lat},{lng});'
        f'way["amenity"~"hospital|clinic|doctors|police|fire_station|pharmacy"](around:{radius},{lat},{lng});'
        f'relation["amenity"~"hospital|clinic|doctors|police|fire_station|pharmacy"](around:{radius},{lat},{lng});'
        f'node["emergency"~"ambulance_station|medical_service"](around:{radius},{lat},{lng});'
        f');'
        f'out center tags;'
    )

def _parse_element(el: dict, lat: float, lng: float) -> EmergencyService | None:
    """Parse a single OSM element into an EmergencyService."""
    tags = el.get("tags", {})

    # Determine service type
    service_type = "other"
    amenity = tags.get("amenity")
    if amenity in ("hospital", "clinic", "doctors"):
        service_type = "hospital"
    elif amenity == "police":
        service_type = "police"
    elif amenity == "fire_station":
        service_type = "fire"
    elif amenity == "pharmacy":
        service_type = "pharmacy"
    elif tags.get("emergency") in ("ambulance_station", "medical_service"):
        service_type = "ambulance"
    elif tags.get("shop") in ("car_repair", "tyres"):
        service_type = "towing"

    elat = el.get("lat") or el.get("center", {}).get("lat")
    elng = el.get("lon") or el.get("center", {}).get("lon")
    if not elat or not elng:
        return None

    distance = haversine(lat, lng, elat, elng)
    phone = tags.get("phone") or tags.get("contact:phone") or tags.get("contact:mobile")
    name = tags.get("name") or tags.get("name:en") or service_type.replace("_", " ").title()

    return EmergencyService(
        id=str(el.get("id", "")),
        name=name,
        type=service_type,
        lat=elat,
        lng=elng,
        distance_km=round(distance, 2),
        address=tags.get("addr:full") or tags.get("addr:street"),
        phone=phone,
        score=round(score_service(el, distance, service_type), 1),
        reason=get_reason(el, distance, service_type),
        map_url=f"https://www.google.com/maps/search/?api=1&query={quote(name)}+@{elat},{elng}"
    )

async def fetch_nearby_services(lat: float, lng: float, radius: int = 5000) -> List[EmergencyService]:
    results = []
    client = get_client()
    query = _build_query(lat, lng, radius)

    for url in OVERPASS_SERVERS:
        try:
            # POST with form-encoded data is the OFFICIAL Overpass API method
            resp = await client.post(url, data={"data": query})

            if resp.status_code == 429:
                print(f"[RETRY] Rate limit on {url}")
                continue

            if resp.status_code != 200:
                print(f"[RETRY] HTTP {resp.status_code} on {url}")
                continue

            elements = resp.json().get("elements", [])
            for el in elements:
                svc = _parse_element(el, lat, lng)
                if svc:
                    results.append(svc)

            if results:
                print(f"[SUCCESS] Found {len(results)} services via {url}")
                break
            else:
                print(f"[INFO] 0 results on {url}, trying next...")

        except Exception as e:
            print(f"[ERROR] {url}: {repr(e)}")
            continue

    # Sort by distance (nearest first)
    results.sort(key=lambda x: x.distance_km)
    return results
