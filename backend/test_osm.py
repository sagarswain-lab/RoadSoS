import asyncio
import httpx

OVERPASS_SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
]

async def test_osm():
    lat, lng = 20.2593, 85.7959
    radius = 5000

    # Compact single-line query — no whitespace issues
    query = (
        f'[out:json][timeout:25];'
        f'('
        f'node["amenity"~"hospital|clinic|doctors|police|fire_station|pharmacy"](around:{radius},{lat},{lng});'
        f'way["amenity"~"hospital|clinic|doctors|police|fire_station|pharmacy"](around:{radius},{lat},{lng});'
        f');'
        f'out center tags;'
    )

    # HONEST User-Agent — this is what fixes 406 errors
    headers = {"User-Agent": "RoadSoS/1.0 (hackathon-test)", "Accept": "application/json"}

    async with httpx.AsyncClient(timeout=25, headers=headers) as client:
        for url in OVERPASS_SERVERS:
            print(f"\n--- Trying {url} ---")
            try:
                resp = await client.post(url, data={"data": query})
                print(f"Status: {resp.status_code}")

                if resp.status_code == 200:
                    data = resp.json()
                    elements = data.get("elements", [])
                    print(f"Found {len(elements)} services!")
                    for el in elements[:5]:
                        name = el.get("tags", {}).get("name", "unnamed")
                        amenity = el.get("tags", {}).get("amenity", "?")
                        print(f"  - {name} ({amenity})")
                    if elements:
                        print("SUCCESS — stopping here.")
                        break
                else:
                    print(f"Body: {resp.text[:200]}")
            except Exception as e:
                print(f"Error: {repr(e)}")

if __name__ == "__main__":
    asyncio.run(test_osm())
