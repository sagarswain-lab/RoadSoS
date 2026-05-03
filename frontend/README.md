# RoadSoS Frontend

## Setup & Run

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Build for production
```bash
npm run build
npm run preview
```

## Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```
Set environment variable: VITE_API_URL=https://your-backend.onrender.com
