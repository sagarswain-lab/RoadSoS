from fastapi import APIRouter, Depends
import aiosqlite
import json
import uuid
from app.models.schemas import ChatRequest, ChatResponse
from app.services.chatbot import get_chatbot_response
from app.database import get_db

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, db: aiosqlite.Connection = Depends(get_db)):

    # Load session history from DB
    async with db.execute("""
        SELECT role, content FROM chat_history
        WHERE session_id = ?
        ORDER BY created_at ASC
        LIMIT 12
    """, (req.session_id,)) as cursor:
        rows = await cursor.fetchall()

    history = [{"role": row["role"], "content": row["content"]} for row in rows]

    # Check if we already have cached emergency services (from Emergency tab)
    cached_services = None
    if req.lat and req.lng:
        async with db.execute("""
            SELECT data FROM emergency_cache
            WHERE ABS(lat - ?) < 0.01 AND ABS(lng - ?) < 0.01
            AND created_at > datetime('now', '-30 minutes')
            ORDER BY created_at DESC LIMIT 1
        """, (req.lat, req.lng)) as cursor:
            cached = await cursor.fetchone()
        if cached:
            from app.models.schemas import EmergencyService
            cached_services = [EmergencyService(**s) for s in json.loads(cached["data"])]

    # Get AI response (pass cached services to avoid slow Overpass search)
    reply, services = await get_chatbot_response(
        message=req.message,
        history=history,
        lat=req.lat,
        lng=req.lng,
        language=req.language or "en",
        cached_services=cached_services
    )

    # Save user message + AI reply to history
    await db.execute(
        "INSERT INTO chat_history (session_id, role, content) VALUES (?, ?, ?)",
        (req.session_id, "user", req.message)
    )
    await db.execute(
        "INSERT INTO chat_history (session_id, role, content) VALUES (?, ?, ?)",
        (req.session_id, "assistant", reply)
    )
    await db.commit()

    return ChatResponse(
        reply=reply,
        services=services[:5] if services else None,
        session_id=req.session_id
    )

@router.delete("/{session_id}")
async def clear_history(session_id: str, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM chat_history WHERE session_id = ?", (session_id,))
    await db.commit()
    return {"message": "History cleared"}
