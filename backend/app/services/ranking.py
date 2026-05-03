from typing import List
from datetime import datetime
from app.models.schemas import EmergencyService

TRAUMA_KEYWORDS = ["trauma", "emergency", "casualty", "icu", "critical"]
NIGHT_PENALTY   = 15   # deduct if hospital may be closed at night
TRAUMA_BONUS    = 30
EMERGENCY_BONUS = 25
PHONE_BONUS     = 10
CLOSE_BONUS     = 20   # < 1 km

def is_night_hours() -> bool:
    hour = datetime.now().hour
    return hour < 6 or hour > 22

def rank_services(services: List[EmergencyService]) -> List[EmergencyService]:
    night = is_night_hours()

    for service in services:
        score = 100.0

        # Distance penalty (10 pts per km)
        score -= service.distance_km * 10

        # Proximity bonus
        if service.distance_km < 1.0:
            score += CLOSE_BONUS

        # Phone available bonus
        if service.phone:
            score += PHONE_BONUS

        # Hospital-specific scoring
        if service.type == "hospital":
            name_lower = service.name.lower()
            if any(kw in name_lower for kw in TRAUMA_KEYWORDS):
                score += TRAUMA_BONUS
            # Night penalty for small clinics
            if night and not any(kw in name_lower for kw in ["hospital", "medical"]):
                score -= NIGHT_PENALTY

        # Ambulance always high priority
        if service.type == "ambulance":
            score += EMERGENCY_BONUS

        # Police always available
        if service.type == "police":
            score += 5  # slight bonus (always open)

        service.score = round(max(0, score), 1)

        # Generate human-readable reason
        reasons = [f"{service.distance_km:.1f}km away"]
        if service.phone:
            reasons.append("phone available")
        if service.distance_km < 1:
            reasons.append("very close")
        if service.type == "ambulance":
            reasons.append("emergency unit")
        if service.type == "hospital" and any(
            kw in service.name.lower() for kw in TRAUMA_KEYWORDS
        ):
            reasons.append("trauma centre")
        if night and service.type == "police":
            reasons.append("open 24/7")
        service.reason = " · ".join(reasons)

    services.sort(key=lambda s: s.score or 0, reverse=True)
    return services
