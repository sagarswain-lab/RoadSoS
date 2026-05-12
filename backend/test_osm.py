import asyncio
import httpx

# Primary and fallback Overpass API servers
OVERPASS_SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter"
]

async def test_osm():
    # Bhubaneswar coordinates from your log
    lat, lng = 20.2593, 85.7959
    radius = 5000
    
    combined_filter = '["amenity"~"hospital|clinic|doctors|police|fire_station|pharmacy"]'
    query = f"""
    [out:json][timeout:25];
    (
      node{combined_filter}(around:{radius},{lat},{lng});
      way{combined_filter}(around:{radius},{lat},{lng});
      relation{combined_filter}(around:{radius},{lat},{lng});
    );
    out center tags;
    """
    
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RoadSoS/1.0"}
    async with httpx.AsyncClient(timeout=30, headers=headers) as client:
        for url in OVERPASS_SERVERS:
            print(f"\nTrying {url}...")
            try:
                resp = await client.post(url, content=query)
                print(f"Status: {resp.status_code}")
                if resp.status_code == 200:
                    data = resp.json()
                    elements = data.get("elements", [])
                    print(f"Found {len(elements)} services")
                    for el in elements[:5]:
                        tags = el.get('tags', {})
                        name = tags.get('name') or tags.get('amenity')
                        print(f"- {name}")
                    
                    if elements:
                        print("SUCCESS!")
                        break
                else:
                    print(f"Server returned error: {resp.status_code}")
            except Exception as e:
                print(f"Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(test_osm())
