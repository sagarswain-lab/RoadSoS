# RoadSoS Backend

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate # for windows

pip install -r requirements.txt
copy .env.example .env # select no if .env file already exit 
# Add your GROQ_API_KEY to .env
```

## Run

```bash
set PYTHONIOENCODING=utf8 && uvicorn app.main:app --reload --port 8000
```

## API Docs
Open http://localhost:8000/docs


## Deployment (Render)
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment Variables: Add `GROQ_API_KEY` and `FRONTEND_URL`.