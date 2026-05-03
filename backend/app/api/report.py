from fastapi import APIRouter, Depends, HTTPException
import aiosqlite
import uuid
from datetime import datetime
from app.models.schemas import ReportRequest, ReportResponse, ReportStatus
from app.services.geocoder import reverse_geocode
from app.database import get_db

router = APIRouter(prefix="/api/report", tags=["report"])

# Authority routing by country and road type
AUTHORITY_MAP = {
    "IN": {
        "pothole":     "National Highways Authority of India — nhidcl@gmail.com",
        "flooding":    "State PWD (Public Works Department)",
        "signage":     "State Highway Authority",
        "lighting":    "Municipal Corporation",
        "default":     "Ministry of Road Transport & Highways — helpline@morth.nic.in"
    },
    "BD": { "default": "Roads and Highways Department — info@rhd.gov.bd" },
    "LK": { "default": "Road Development Authority — info@rda.gov.lk" },
    "TH": { "default": "Department of Highways Thailand — doh@doh.go.th" },
    "NP": { "default": "Department of Roads Nepal — dor@dor.gov.np" },
    "MM": { "default": "Department of Highways Myanmar" },
    "BT": { "default": "Department of Roads Bhutan — dor@dor.gov.bt" },
}

CONDITION_LABELS = {
    "pothole":      "Pothole / Road Damage",
    "flooding":     "Flooding / Waterlogging",
    "signage":      "Missing / Damaged Signage",
    "lighting":     "Street Light Not Working",
    "barrier":      "Broken Safety Barrier",
    "debris":       "Debris / Obstruction on Road",
    "erosion":      "Road Erosion / Landslide",
    "other":        "Other Road Issue"
}

def get_authority(country: str, condition: str) -> str:
    country_map = AUTHORITY_MAP.get(country.upper(), AUTHORITY_MAP["IN"])
    return country_map.get(condition, country_map.get("default", "Local Road Authority"))

@router.post("", response_model=ReportResponse)
async def submit_report(req: ReportRequest, db: aiosqlite.Connection = Depends(get_db)):
    report_id = f"RSR-{uuid.uuid4().hex[:8].upper()}"

    # Geocode to get country if not provided
    country = req.country or "IN"
    try:
        geo = await reverse_geocode(req.lat, req.lng)
        country = geo.get("country_code", req.country or "IN")
    except Exception:
        pass

    authority = get_authority(country, req.condition)
    condition_label = CONDITION_LABELS.get(req.condition, req.condition)

    await db.execute("""
        INSERT INTO road_reports
            (id, lat, lng, condition, description, photo_base64, country, status, authority_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Submitted', ?)
    """, (
        report_id, req.lat, req.lng, condition_label,
        req.description, req.photo_base64, country, authority
    ))
    await db.commit()

    return ReportResponse(
        report_id=report_id,
        status="Submitted",
        message=f"Report {report_id} submitted successfully. Routed to: {authority}",
        authority=authority
    )

@router.get("/status/{report_id}", response_model=ReportStatus)
async def get_report_status(report_id: str, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("""
        SELECT id, status, condition, created_at, updated_at
        FROM road_reports WHERE id = ?
    """, (report_id,)) as cursor:
        row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")

    # Ensure timestamps are treated as UTC by appending 'Z'
    created_at = row["created_at"]
    updated_at = row["updated_at"]
    
    # SQLite CURRENT_TIMESTAMP is YYYY-MM-DD HH:MM:SS, we need YYYY-MM-DDTHH:MM:SSZ
    if " " in str(created_at) and "T" not in str(created_at):
        created_at = str(created_at).replace(" ", "T") + "Z"
    if " " in str(updated_at) and "T" not in str(updated_at):
        updated_at = str(updated_at).replace(" ", "T") + "Z"

    return ReportStatus(
        report_id=row["id"],
        status=row["status"],
        condition=row["condition"],
        created_at=created_at,
        updated_at=updated_at
    )

@router.get("/all")
async def get_all_reports(db: aiosqlite.Connection = Depends(get_db)):
    """Get all reports — for admin/demo purposes"""
    async with db.execute("""
        SELECT id, lat, lng, condition, status, country, created_at
        FROM road_reports ORDER BY created_at DESC LIMIT 50
    """) as cursor:
        rows = await cursor.fetchall()
    return [dict(row) for row in rows]
