import os
from langchain_groq import ChatGroq
#from langchain.schema import SystemMessage, HumanMessage, AIMessage
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.services.osm import fetch_nearby_services
from app.models.schemas import EmergencyService
from typing import List, Optional, Tuple
import json

# GROQ_API_KEY is fetched inside the function to ensure it's up to date

SYSTEM_PROMPT = """You are RoadSoS, an AI-powered road safety companion for BIMSTEC countries 
(Bangladesh, Bhutan, India, Myanmar, Nepal, Sri Lanka, Thailand).

Your 3 core functions:
1. EMERGENCY HELP — guide users to nearest hospitals, ambulances, police after road accidents
2. LEGAL GUIDANCE — explain traffic laws, rights after accidents, what to tell police, fines
3. ROAD REPORTING — help users report dangerous road conditions to authorities

CRITICAL RULES:
- ALWAYS detect the user's language and reply IN THE SAME LANGUAGE.
- Support transliteration (e.g., if user writes Odia in English letters, reply in Odia).
- Be calm, clear, and fast — people may be in crisis
- If user seems to be in an accident RIGHT NOW, prioritize emergency services first
- For first aid questions, give clear step-by-step instructions
- Always mention the golden hour (first 60 minutes after accident are critical)
- Keep responses concise — injured people can't read long paragraphs
- If location is provided, give location-specific advice

ABSOLUTE RULE — NEVER FABRICATE DATA:
- ONLY mention hospital/police/pharmacy names that are explicitly listed in the NEARBY SERVICES section below.
- If no NEARBY SERVICES section is present, say "Please check the Emergency tab for real-time nearby services" or "call 112".
- NEVER guess, invent, or recall hospital names from your training data. This is a safety-critical app.
- NEVER say things like "some nearby hospitals include..." unless those names come from the provided real-time data.

Supported languages: English, Hindi, Odia, Bengali, Tamil, Sinhala, Thai, Burmese, Nepali

When you detect emergency keywords like "accident", "crash", "injured", "blood", 
"unconscious" — respond with URGENT tone and immediate action steps.

When asked about first aid, use this format:
1. [Step] — [Brief explanation]
Keep it scannable for someone in panic.

For legal questions, cite the relevant country's Motor Vehicles Act or equivalent.
For road reports, confirm you'll help them file the report."""

EMERGENCY_KEYWORDS = [
    "accident", "crash", "injured", "blood", "unconscious", "help", "emergency",
    "hospital", "ambulance", "police", "hurt", "pain", "bleeding", "faint",
    # Hindi
    "दुर्घटना", "चोट", "अस्पताल", "खून", "मदद", "एम्बुलेंस",
    # Bengali  
    "দুর্ঘটনা", "আহত", "হাসপাতাল", "রক্ত", "সাহায্য",
    # Tamil
    "விபத்து", "காயம்", "மருத்துவமனை", "உதவி",
]

FIRST_AID_KEYWORDS = [
    "first aid", "cpr", "bleeding", "fracture", "burn", "choking",
    "प्राथमिक चिकित्सा", "সিপিআর", "প্রাথমিক চিকিৎসা"
]

def detect_intent(message: str) -> str:
    msg_lower = message.lower()
    if any(kw in msg_lower for kw in EMERGENCY_KEYWORDS):
        return "emergency"
    if any(kw in msg_lower for kw in FIRST_AID_KEYWORDS):
        return "firstaid"
    if any(kw in msg_lower for kw in ["law", "legal", "fine", "rights", "police", "challan",
                                        "कानून", "जुर्माना", "अधिकार", "আইন", "জরিমানা"]):
        return "legal"
    if any(kw in msg_lower for kw in ["report", "pothole", "road", "damage", "broken",
                                       "रिपोर्ट", "सड़क", "রিপোর্ট", "রাস্তা"]):
        return "report"
    return "general"

_llm_instance = None

def get_llm():
    global _llm_instance
    if _llm_instance is None:
        groq_api_key = os.getenv("GROQ_API_KEY", "")
        if not groq_api_key:
            return None
        _llm_instance = ChatGroq(
            api_key=groq_api_key,
            model_name="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=800
        )
    return _llm_instance

async def get_chatbot_response(
    message: str,
    history: List[dict],
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    language: str = "en",
    cached_services: Optional[List[EmergencyService]] = None
) -> Tuple[str, Optional[List[EmergencyService]]]:

    llm = get_llm()
    if not llm:
        return "Groq API key not configured. Add GROQ_API_KEY to your .env file.", None

    intent = detect_intent(message)
    services = cached_services  # Use cached data from Emergency tab if available
    context_msg = ""

    # Reverse-geocode to get human-readable location name
    if lat and lng:
        try:
            from app.services.geocoder import reverse_geocode
            geo = await reverse_geocode(lat, lng)
            area = geo.get("area") or geo.get("suburb") or ""
            city = geo.get("city") or geo.get("state") or ""
            country = geo.get("country") or ""
            # Build the most specific location text: "Jagamara, Bhubaneswar, India"
            parts = [p for p in [area, city, country] if p]
            location_text = ", ".join(parts) if parts else "your area"
            context_msg = f"\n\nUser's location: {location_text} (GPS available, do NOT ask for location)"
        except Exception:
            context_msg = f"\n\nUser's GPS: {lat:.4f}, {lng:.4f} (location IS available, do NOT ask for it)"

    # For emergency intent, get nearby services
    if intent == "emergency" and lat and lng:
        # If no cached services, try fetching fresh data
        if not services:
            try:
                import asyncio
                services = await asyncio.wait_for(fetch_nearby_services(lat, lng, radius=5000), timeout=8.0)
            except Exception as e:
                print(f"Services fetch error in chatbot: {e}")
                services = None

        if services:
            # Filter to only hospitals for "nearest hospital" type queries
            if any(kw in message.lower() for kw in ["hospital", "clinic", "doctor"]):
                hospital_services = [s for s in services if s.type == "hospital"]
                top = hospital_services[:5] if hospital_services else services[:5]
            else:
                top = services[:5]
            
            services_text = "\n".join([
                f"- {s.name} ({s.type}): {s.distance_km}km away"
                + (f", Phone: {s.phone}" if s.phone else "")
                for s in top
            ])
            context_msg += f"\n\nNEARBY SERVICES (REAL-TIME DATA — ONLY mention these names):\n{services_text}"
        else:
            context_msg += "\n\nNo real-time service data available. Tell the user to check the Emergency tab in the app or call 112. DO NOT guess or make up any hospital/service names."

    # Build message history for LangChain
    lang_hint = f"\nUser's preferred language: {language}. Respond in this language." if language else ""
    lc_messages = [SystemMessage(content=SYSTEM_PROMPT + context_msg + lang_hint)]

    for msg in history[-6:]:  # Last 6 messages for context
        if msg["role"] == "user":
            lc_messages.append(HumanMessage(content=msg["content"]))
        else:
            lc_messages.append(AIMessage(content=msg["content"]))

    lc_messages.append(HumanMessage(content=message))

    try:
        response = await llm.ainvoke(lc_messages)
        return response.content, services
    except Exception as e:
        print(f"LLM error: {e}")
        return f"I'm having trouble connecting right now. For immediate help, call 112 (India) or your local emergency number.", None

