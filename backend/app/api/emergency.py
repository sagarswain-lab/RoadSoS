from fastapi import APIRouter, Depends, HTTPException
import aiosqlite
import json
from app.models.schemas import LocationRequest, EmergencyResponse
from app.services.osm import fetch_nearby_services
from app.services.geocoder import reverse_geocode
from app.database import get_db

router = APIRouter(prefix="/api/emergency", tags=["emergency"])

@router.post("/nearby", response_model=EmergencyResponse)
async def get_nearby_services(req: LocationRequest, db: aiosqlite.Connection = Depends(get_db)):
    # Check cache first (within 500m, last 10 mins)
    async with db.execute("""
        SELECT data FROM emergency_cache
        WHERE ABS(lat - ?) < 0.005 AND ABS(lng - ?) < 0.005
        AND created_at > datetime('now', '-10 minutes')
        ORDER BY created_at DESC LIMIT 1
    """, (req.lat, req.lng)) as cursor:
        cached = await cursor.fetchone()

    if cached:
        services_data = json.loads(cached["data"])
        from app.models.schemas import EmergencyService
        services = [EmergencyService(**s) for s in services_data]
    else:
        services = await fetch_nearby_services(req.lat, req.lng, req.radius)
        # Cache results only if we found something
        if services:
            await db.execute(
                "INSERT INTO emergency_cache (lat, lng, radius, data) VALUES (?, ?, ?, ?)",
                (req.lat, req.lng, req.radius, json.dumps([s.dict() for s in services]))
            )
            await db.commit()

    return EmergencyResponse(
        services=services,
        user_lat=req.lat,
        user_lng=req.lng,
        total_found=len(services)
    )

@router.get("/geocode")
async def geocode_location(lat: float, lng: float):
    result = await reverse_geocode(lat, lng)
    return result
