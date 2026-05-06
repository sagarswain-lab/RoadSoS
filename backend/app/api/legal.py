from fastapi import APIRouter, Depends
import aiosqlite
import json
import os
from langchain_groq import ChatGroq
#from langchain.schema import SystemMessage, HumanMessage
from langchain_core.messages import SystemMessage, HumanMessage
from app.models.schemas import LegalRequest, LegalResponse
from app.database import get_db

router = APIRouter(prefix="/api/legal", tags=["legal"])

# Load laws database
LAWS_PATH = os.path.join(os.path.dirname(__file__), "../../../data/laws/bimstec_laws.json")
try:
    with open(LAWS_PATH, "r", encoding="utf-8") as f:
        LAWS_DB = json.load(f)
except Exception as e:
    print(f"Could not load laws DB: {e}")
    LAWS_DB = {}

LEGAL_SYSTEM_PROMPT = """You are a legal assistant specializing in road traffic laws for 
BIMSTEC countries (Bangladesh, Bhutan, India, Myanmar, Nepal, Sri Lanka, Thailand).

You will be given:
1. A user question about traffic laws or accident rights
2. Relevant legal data for their country

RULES:
- ALWAYS detect user's language and reply IN THE SAME LANGUAGE
- Be clear and practical — not overly technical
- Always recommend consulting a lawyer for serious cases
- Cite relevant law sections where possible
- Keep answers concise (max 200 words)
- Always mention relevant helpline numbers from the country data
- Start with the most important point

Format your response as:
📋 [Direct answer to question]

📌 Key points:
• [Point 1]
• [Point 2]

📞 Helplines: [relevant numbers]"""

_llm_instance = None

def get_llm():
    global _llm_instance
    if _llm_instance is None:
        groq_key = os.getenv("GROQ_API_KEY", "")
        if not groq_key:
            return None
        _llm_instance = ChatGroq(
            api_key=groq_key,
            model_name="llama-3.1-8b-instant",
            temperature=0.2,
            max_tokens=500
        )
    return _llm_instance

@router.post("", response_model=LegalResponse)
async def get_legal_advice(req: LegalRequest, db: aiosqlite.Connection = Depends(get_db)):
    country_code = req.country.upper() if req.country else "IN"
    country_data = LAWS_DB.get(country_code, LAWS_DB.get("IN", {}))

    # Build context from laws DB
    context = f"""
Country: {country_data.get('country', 'India')}
Emergency Number: {country_data.get('emergency_number', '112')}
Key Laws: {', '.join(country_data.get('key_laws', []))}

Rights After Accident:
{json.dumps(country_data.get('rights_after_accident', []), indent=2)}

What To Tell Police:
{json.dumps(country_data.get('what_to_tell_police', []), indent=2)}

Common Fines:
{json.dumps(country_data.get('common_fines', []), indent=2)}

Helplines:
{json.dumps(country_data.get('helplines', {}), indent=2)}

Insurance Steps:
{json.dumps(country_data.get('insurance_steps', []), indent=2)}
"""

    llm = get_llm()
    if not llm:
        return LegalResponse(
            answer="⚠️ AI service not configured. Please add GROQ_API_KEY to your .env file.",
            country=country_data.get("country", "India"),
            relevant_laws=country_data.get("key_laws", [])
        )

    lang_hint = f"\nUser's preferred language: {req.language}. Respond in this language." if req.language else ""
    messages = [
        SystemMessage(content=LEGAL_SYSTEM_PROMPT + lang_hint),
        HumanMessage(content=f"Country legal data:\n{context}\n\nUser question: {req.question}")
    ]

    try:
        response = await llm.ainvoke(messages)
        return LegalResponse(
            answer=response.content,
            country=country_data.get("country", "India"),
            relevant_laws=country_data.get("key_laws", [])
        )
    except Exception as e:
        print(f"Legal LLM error: {e}")
        return LegalResponse(
            answer=f"Unable to get AI response. Please call emergency services: {country_data.get('emergency_number', '112')}",
            country=country_data.get("country", "India"),
            relevant_laws=country_data.get("key_laws", [])
        )

@router.get("/country/{country_code}")
async def get_country_laws(country_code: str):
    """Get raw legal data for a country"""
    data = LAWS_DB.get(country_code.upper())
    if not data:
        return {"error": f"No data for country code: {country_code}"}
    return data

@router.get("/countries")
async def list_countries():
    """List all supported countries"""
    return [
        {"code": code, "country": data.get("country"), "emergency": data.get("emergency_number")}
        for code, data in LAWS_DB.items()
    ]
