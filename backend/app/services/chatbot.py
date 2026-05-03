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

Supported languages: English, Hindi (हिंदी), Odia (ଓଡ଼ିଆ), Bengali (বাংলা), Tamil (தமிழ்), 
Sinhala (සිංහල), Thai (ภาษาไทย), Burmese (မြန်မာဘာသာ), Nepali (नेपाली)

When you detect emergency keywords like "accident", "crash", "injured", "blood", 
"unconscious" — respond with URGENT tone and immediate action steps.

When asked about first aid, use this format:
1. [Step] — [Brief explanation]
Keep it scannable for someone in panic.

For legal questions, cite the relevant country's Motor Vehicles Act or equivalent.
For road reports, confirm you'll help them file the report.

You have access to real-time nearby emergency services data which will be provided 
in the context when available."""

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

async def get_chatbot_response(
    message: str,
    history: List[dict],
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    language: str = "en"
) -> Tuple[str, Optional[List[EmergencyService]]]:

    groq_api_key = os.getenv("GROQ_API_KEY", "")
    if not groq_api_key:
        return "⚠️ Groq API key not configured. Add GROQ_API_KEY to your .env file.", None

    llm = ChatGroq(
        api_key=groq_api_key,
        model_name="llama-3.1-8b-instant",
        temperature=0.3,
        max_tokens=800
    )

    intent = detect_intent(message)
    services = None
    context_msg = ""

    # If emergency intent and location available, fetch services
    if intent in ("emergency", "general") and lat and lng:
        try:
            services = await fetch_nearby_services(lat, lng, radius=5000)
            if services:
                top3 = services[:3]
                services_text = "\n".join([
                    f"- {s.name} ({s.type}): {s.distance_km}km away"
                    + (f", Phone: {s.phone}" if s.phone else "")
                    + f" — {s.reason}"
                    for s in top3
                ])
                context_msg = f"\n\nNEARBY EMERGENCY SERVICES (real-time):\n{services_text}\nUser location: {lat:.4f}, {lng:.4f}"
        except Exception as e:
            print(f"Services fetch error: {e}")

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
