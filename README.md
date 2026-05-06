# 🛡️ RoadSoS — Your Complete Road Safety Companion

> Emergency help · Legal guidance · Road reporting — All in one AI-powered app

Built for **Road Safety Hackathon 2026** — IIT Madras / CoERS

---

## Features
- 🚨 **Emergency services** — Nearest hospitals, police, ambulance via OpenStreetMap
- ⏱️ **Golden hour timer** — Live urgency countdown after accident
- 📤 **One-tap SOS** — Share location via WhatsApp instantly
- 🤖 **AI chatbot** — Natural language emergency help in 8 languages
- ⚖️ **DriveLegal** — Know your rights, fines, laws after an accident
- 🛣️ **RoadWatch** — Report dangerous roads with photo + GPS
- 📡 **Offline mode** — Works with no internet (PWA)
- 🩺 **First aid guide** — Step-by-step while waiting for help

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| AI | Groq API + LangChain |
| Maps | OpenStreetMap + Overpass API |
| Geocoding | Nominatim |
| Database | SQLite |
| Offline | Vite PWA Plugin |
| Hosting | Vercel (frontend) + Render (backend) |

**Total cost: ₹0**

---

## Quick Start

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env # select no if .env file already exit 
# Edit .env → add GROQ_API_KEY
set PYTHONIOENCODING=utf8 && uvicorn app.main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Project Structure
```
roadsos/
├── backend/
│   ├── app/
│   │   ├── api/          ← route handlers
│   │   ├── services/     ← OSM, geocoder, chatbot, ranking
│   │   ├── models/       ← Pydantic schemas
│   │   ├── database.py   ← SQLite setup
│   │   └── main.py       ← FastAPI entry point
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/   ← Map, Chat, SOS, Legal, Report
│       ├── hooks/        ← useGeolocation
│       ├── services/     ← API calls
│       └── App.jsx       ← Main app
└── data/
    ├── laws/             ← BIMSTEC traffic laws JSON
    └── firstaid/         ← First aid knowledge base
```

## BIMSTEC Countries Supported
Bangladesh · Bhutan · India · Myanmar · Nepal · Sri Lanka · Thailand

---

*Built with ❤️ for road safety across BIMSTEC nations*
