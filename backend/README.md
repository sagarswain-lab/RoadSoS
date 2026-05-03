# RoadSoS Backend

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add your GROQ_API_KEY to .env
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## API Docs
Open http://localhost:8000/docs
