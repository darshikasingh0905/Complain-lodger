from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.services import chat_service, ai_service

router = APIRouter(
    prefix="/assistant",
    tags=["Assistant"],
)


# ─── Chatbot ──────────────────────────────────────────────────────────────────

class ChatTurn(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: List[ChatTurn] = Field(default_factory=list)
    citizen_phone: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    source: str  # 'ollama' or 'fallback'


@router.post("/chat", response_model=ChatResponse)
def assistant_chat(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Civic Sathi chatbot. Injects the citizen's own complaints into the LLM
    context so it can answer status questions truthfully; falls back to a
    deterministic responder when Ollama is offline.
    """
    return chat_service.chat(
        db,
        message=payload.message,
        history=[t.model_dump() for t in payload.history],
        citizen_phone=payload.citizen_phone,
    )


# ─── Voice assist (any-language dictation → English complaint draft) ─────────

class VoiceAssistRequest(BaseModel):
    transcript: str = Field(..., min_length=1, max_length=2000)
    language: str = Field("en", description="BCP-47-ish code of the spoken language, e.g. 'hi', 'mr', 'ta'")


class VoiceAssistResponse(BaseModel):
    title: str
    description: str
    detected_language: str
    translated: bool
    source: str  # 'ollama' or 'fallback'


@router.post("/voice-assist", response_model=VoiceAssistResponse)
def voice_assist(payload: VoiceAssistRequest):
    """
    Takes a raw speech transcript (any Indian language) and returns a clean
    English complaint draft: a short title + a formal description. Falls back
    to the raw transcript when Ollama is offline.
    """
    return ai_service.voice_assist(payload.transcript, payload.language)
