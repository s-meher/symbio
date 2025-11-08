# LendLocal AI Monorepo

FastAPI backend + React frontend for the lend/match prototype described in the Phase A–H brief.

## Backend

```bash
cd lendlocal-ai/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API keeps everything in memory, so restarting the server clears users, matches, and posts. CORS is open for `http://localhost:3000`.

## Frontend

```bash
cd lendlocal-ai/frontend
npm install
npm run dev
```

The React app (Vite) runs on port 3000 and expects the backend on 8000. Routes mirror the storyboard order and store the active user in `localStorage`.

## Environment

Copy `.env.example` to `.env` and set:

```
KNOT_API_KEY=
GROK_API_KEY=
NESSIE_API_KEY=
X_API_KEY=
BANK_AVG_RATE=9.5
```

Keys toggle optional integrations that are stubbed for now.
