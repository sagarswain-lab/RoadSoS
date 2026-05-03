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

# Define allowed origins (including IPv6 for some browsers)
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://[::1]:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
]

# Add FRONTEND_URL from environment if it exists
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    if "," in frontend_url:
        ALLOWED_ORIGINS.extend([url.strip() for url in frontend_url.split(",")])
    else:
        ALLOWED_ORIGINS.append(frontend_url.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"DEBUG: Receiving {request.method} request to {request.url.path}")
    response = await call_next(request)
    print(f"DEBUG: Responding with status {response.status_code}")
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
