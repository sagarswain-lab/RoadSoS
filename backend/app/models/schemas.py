from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class LocationRequest(BaseModel):
    lat: float
    lng: float
    radius: Optional[int] = 5000

class EmergencyService(BaseModel):
    id: str
    name: str
    type: str
    lat: float
    lng: float
    distance_km: float
    address: Optional[str] = None
    phone: Optional[str] = None
    open_now: Optional[bool] = None
    score: Optional[float] = None
    reason: Optional[str] = None
    map_url: Optional[str] = None

class EmergencyResponse(BaseModel):
    services: List[EmergencyService]
    user_lat: float
    user_lng: float
    total_found: int

class ChatRequest(BaseModel):
    message: str
    session_id: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    language: Optional[str] = "en"

class ChatResponse(BaseModel):
    reply: str
    services: Optional[List[EmergencyService]] = None
    session_id: str

class ReportRequest(BaseModel):
    lat: float
    lng: float
    condition: str
    description: Optional[str] = None
    photo_base64: Optional[str] = None
    country: Optional[str] = "IN"

class ReportResponse(BaseModel):
    report_id: str
    status: str
    message: str
    authority: Optional[str] = None

class ReportStatus(BaseModel):
    report_id: str
    status: str
    condition: str
    created_at: str
    updated_at: str

class LegalRequest(BaseModel):
    question: str
    country: Optional[str] = "IN"
    language: Optional[str] = "en"

class LegalResponse(BaseModel):
    answer: str
    country: str
    relevant_laws: Optional[List[str]] = None
