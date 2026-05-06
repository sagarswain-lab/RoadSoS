import asyncio
import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

async def test_osm():
    lat, lng = 20.2605, 85.7955
    radius = 5000
    query = f"""
    [out:json][timeout:25];
    (
      node["amenity"~"hospital|clinic|doctors"](around:{radius},{lat},{lng});
      way["amenity"~"hospital|clinic|doctors"](around:{radius},{lat},{lng});
    );
    out center tags;
    """
    headers = {"User-Agent": "RoadSoS-SafetyCompanion/1.0"}
    async with httpx.AsyncClient(timeout=30, headers=headers) as client:
        try:
            resp = await client.post(OVERPASS_URL, data={"data": query})
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                elements = data.get("elements", [])
                print(f"Found {len(elements)} hospitals")
                for el in elements[:3]:
                    print(f"- {el.get('tags', {}).get('name')}")
            else:
                print(f"Error body: {resp.text}")
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_osm())
