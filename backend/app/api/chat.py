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

    # Get AI response
    reply, services = await get_chatbot_response(
        message=req.message,
        history=history,
        lat=req.lat,
        lng=req.lng,
        language=req.language or "en"
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
        services=services[:3] if services else None,
        session_id=req.session_id
    )

@router.delete("/{session_id}")
async def clear_history(session_id: str, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM chat_history WHERE session_id = ?", (session_id,))
    await db.commit()
    return {"message": "History cleared"}
