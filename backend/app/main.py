from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(env_path)

if os.getenv("GROQ_API_KEY"):
    print("✅ GROQ_API_KEY detected")
else:
    print("⚠️ GROQ_API_KEY NOT detected in .env")

from app.database import init_db
from app.api.emergency import router as emergency_router
from app.api.chat import router as chat_router
from app.api.legal import router as legal_router
from app.api.report import router as report_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="RoadSoS API",
    description="Your complete road safety companion — emergency help, legal guidance, road reporting",
    version="1.0.0",
    lifespan=lifespan
)

def get_allowed_origins():
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]
    frontend_url = os.getenv("FRONTEND_URL", "")
    if frontend_url:
        origins.append(frontend_url)
    return origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    # Production-ready logging can be more structured, but keeping it simple for hackathon
    response = await call_next(request)
    return response

app.include_router(emergency_router)
app.include_router(chat_router)
app.include_router(legal_router)
app.include_router(report_router)

@app.get("/")
async def root():
    return {
        "app": "RoadSoS",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "emergency": "/api/emergency/nearby",
            "chat":      "/api/chat",
            "geocode":   "/api/emergency/geocode",
            "docs":      "/docs"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    from fastapi.responses import Response
    return Response(status_code=204)
