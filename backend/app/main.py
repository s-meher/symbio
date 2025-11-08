"""
FastAPI application for LendLocal AI demo.

All data lives in-memory and resets when the server restarts.
External integrations (Knot, xAI, Nessie, X) are mocked and can be enabled
later via environment flags.
"""

from __future__ import annotations

import os
import random
import string
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load optional env keys for future integrations.
KNOT_API_KEY = os.getenv("KNOT_API_KEY")
GROK_API_KEY = os.getenv("GROK_API_KEY")
NESSIE_API_KEY = os.getenv("NESSIE_API_KEY")
X_API_KEY = os.getenv("X_API_KEY")
BANK_AVG_RATE = float(os.getenv("BANK_AVG_RATE", "9.5"))

INTEGRATIONS_ENABLED = {
    "knot": bool(KNOT_API_KEY),
    "grok": bool(GROK_API_KEY),
    "nessie": bool(NESSIE_API_KEY),
    "x": bool(X_API_KEY),
}

app = FastAPI(title="LendLocal AI API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _generate_id(prefix: str) -> str:
    return f"{prefix}_{''.join(random.choices(string.ascii_lowercase + string.digits, k=8))}"


# ---- In-memory stores ----
users: Dict[str, Dict] = {}
borrow_reasons: Dict[str, str] = {}
borrow_amounts: Dict[str, float] = {}
matches: Dict[str, Dict] = {}
posts: List[Dict] = []


# ---- Models ----
class Geo(BaseModel):
    lat: float
    lng: float


class UserCreateRequest(BaseModel):
    role: str = Field(pattern="^(borrower|lender)$")
    geo: Geo
    min_rate: Optional[float] = None
    max_amount: Optional[float] = None


class VerifyIdRequest(BaseModel):
    user_id: Optional[str] = None


class BorrowReasonRequest(BaseModel):
    user_id: str
    reason: str


class BorrowAmountRequest(BaseModel):
    user_id: str
    amount: float


class BorrowOptionsRequest(BaseModel):
    user_id: str


class BorrowDeclineRequest(BaseModel):
    user_id: str


class LoanRequest(BaseModel):
    user_id: str


class NessieTransferRequest(BaseModel):
    match_id: str


class FeedPostRequest(BaseModel):
    user_id: str
    text: str
    share_opt_in: bool


PRINCETON_BOUNDS = {
    "lat_min": 40.330,
    "lat_max": 40.380,
    "lng_min": -74.700,
    "lng_max": -74.620,
}


def _validate_princeton(geo: Geo) -> bool:
    return (
        PRINCETON_BOUNDS["lat_min"] <= geo.lat <= PRINCETON_BOUNDS["lat_max"]
        and PRINCETON_BOUNDS["lng_min"] <= geo.lng <= PRINCETON_BOUNDS["lng_max"]
    )


def _require_user(user_id: str) -> Dict:
    user = users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# --- Auth/Session ---
# Request: {"role":"borrower|lender","geo":{"lat":float,"lng":float},"min_rate?":float,"max_amount?":float}
# Response: {"user_id":string,"role":"borrower|lender"}
@app.post("/users/create")
def create_user(payload: UserCreateRequest):
    if not _validate_princeton(payload.geo):
        raise HTTPException(status_code=422, detail="Service is limited to Princeton area users.")

    user_id = _generate_id("user")
    users[user_id] = {
        "role": payload.role,
        "geo": payload.geo.model_dump(),
        "min_rate": payload.min_rate or 3.5,
        "max_amount": payload.max_amount or 1500.0,
        "created_at": datetime.utcnow().isoformat(),
    }
    return {"user_id": user_id, "role": payload.role}


# Request: {"user_id":string}
# Response: {"verified":true,"message":"ID verified"}
@app.post("/verify-id")
def verify_id(payload: VerifyIdRequest):
    if payload.user_id and payload.user_id not in users:
        raise HTTPException(status_code=404, detail="Unknown user")
    # Stub: Always succeeds regardless of external integrations.
    return {"verified": True, "message": "ID verified"}


# --- Borrow flow ---
# Request: {"user_id":string,"reason":string}
# Response: {"ok":true}
@app.post("/borrow/reason")
def save_borrow_reason(payload: BorrowReasonRequest):
    user = _require_user(payload.user_id)
    if user["role"] != "borrower":
        raise HTTPException(status_code=400, detail="Only borrowers can set reasons.")
    if not payload.reason.strip():
        raise HTTPException(status_code=422, detail="Reason is required.")
    borrow_reasons[payload.user_id] = payload.reason.strip()
    return {"ok": True}


# Request: {"user_id":string,"amount":number}
# Response: {"ok":true}
@app.post("/borrow/amount")
def save_borrow_amount(payload: BorrowAmountRequest):
    user = _require_user(payload.user_id)
    if user["role"] != "borrower":
        raise HTTPException(status_code=400, detail="Only borrowers can set amounts.")
    if payload.amount <= 0:
        raise HTTPException(status_code=422, detail="Amount must be positive.")
    borrow_amounts[payload.user_id] = payload.amount
    return {"ok": True}


def _risk_logic(user_id: str) -> Dict:
    amount = borrow_amounts.get(user_id, 0)
    user = _require_user(user_id)
    ceiling = user.get("max_amount", 1500)
    ratio = amount / ceiling if ceiling else 1
    ratio = min(max(ratio, 0), 1.2)
    base_score = max(5, 95 - ratio * 60)
    score = round(base_score)
    if score >= 70:
        label = "low"
        recommendation = "yes"
    elif score >= 45:
        label = "med"
        recommendation = "maybe"
    else:
        label = "high"
        recommendation = "no"
    explanation = (
        f"Request of ${amount:.0f} vs savings capacity suggests {label} risk relative to peers."
    )
    return {
        "score": score,
        "label": label,
        "explanation": explanation,
        "recommendation": recommendation,
    }


# Response: {"score":0-100,"label":"low|med|high","explanation":string,"recommendation":"yes|maybe|no"}
@app.get("/borrow/risk")
def get_borrow_risk(user_id: str):
    _require_user(user_id)
    if user_id not in borrow_amounts:
        raise HTTPException(status_code=404, detail="Borrow amount not set.")
    return _risk_logic(user_id)


# Request: {"user_id":string}
# Response: {"combos":[{"id":"c1","total":number,"parts":[{"lenderId":"l1","amount":number,"rate":number}]}]}
@app.post("/borrow/options")
def get_borrow_options(payload: BorrowOptionsRequest):
    _require_user(payload.user_id)
    amount = borrow_amounts.get(payload.user_id)
    if not amount:
        raise HTTPException(status_code=404, detail="Borrow amount missing.")

    combos = []
    splits = [
        [1.0],
        [0.6, 0.4],
        [0.5, 0.3, 0.2],
    ]
    for idx, split in enumerate(splits, start=1):
        parts = []
        for lender_idx, pct in enumerate(split, start=1):
            parts.append(
                {
                    "lenderId": f"l{idx}{lender_idx}",
                    "amount": round(amount * pct, 2),
                    "rate": round(1.5 + lender_idx * 0.75, 2),
                }
            )
        combos.append({"id": f"c{idx}", "total": round(amount, 2), "parts": parts})
    return {"combos": combos}


# Request: {"user_id":string}
# Response: {"feedback":string}
@app.post("/borrow/decline")
def borrow_decline(payload: BorrowDeclineRequest):
    user = _require_user(payload.user_id)
    risk = _risk_logic(payload.user_id)
    feedback = (
        f"Risk score {risk['score']} suggests waiting. "
        f"Reduce your request by ${borrow_amounts.get(payload.user_id, 0) * 0.2:.0f} or add savings."
    )
    return {"feedback": feedback}


# --- Match + transfers ---
# Request: {"user_id":string}
# Response: {"match_id":string,"total_amount":number,"lenders":[{"id":string,"amount":number,"rate":number}],"risk_score":number,"ai_advice":string}
@app.post("/loans/request")
def create_loan_request(payload: LoanRequest):
    _require_user(payload.user_id)
    amount = borrow_amounts.get(payload.user_id)
    if not amount:
        raise HTTPException(status_code=404, detail="Borrow amount missing.")
    risk = _risk_logic(payload.user_id)
    lenders = [
        {"id": f"lender_{idx}", "amount": round(amount / 2 if idx == 1 else amount / 2, 2), "rate": 2.5 + idx}
        for idx in range(1, 3)
    ]
    match_id = _generate_id("match")
    advice = "Great fit—community lenders ready." if risk["recommendation"] == "yes" else "Matched with cautious lenders."
    matches[match_id] = {
        "user_id": payload.user_id,
        "total_amount": amount,
        "lenders": lenders,
        "risk_score": risk["score"],
    }
    return {
        "match_id": match_id,
        "total_amount": amount,
        "lenders": lenders,
        "risk_score": risk["score"],
        "ai_advice": advice,
    }


# Request: {"match_id":string}
# Response: {"txn_id":string,"message":"Funds transferred (mock)"}
@app.post("/nessie/transfer")
def mock_transfer(payload: NessieTransferRequest):
    match = matches.get(payload.match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")
    txn_id = _generate_id("txn")
    return {"txn_id": txn_id, "message": "Funds transferred (mock)"}


# --- Community feed ---
# Request: {"user_id":string,"text":string,"share_opt_in":boolean}
# Response: {"post_id":string,"preview":string}
@app.post("/feed/post")
def create_feed_post(payload: FeedPostRequest):
    user = _require_user(payload.user_id)
    if not payload.text.strip():
        raise HTTPException(status_code=422, detail="Text required.")
    post_id = _generate_id("post")
    post_entry = {
        "id": post_id,
        "user_id": payload.user_id if payload.share_opt_in else None,
        "text": payload.text.strip(),
        "ts": datetime.utcnow().isoformat(),
        "userRole": user["role"],
    }
    posts.insert(0, post_entry)
    preview = f"{'Someone' if not post_entry['user_id'] else 'You'} shared an update."
    return {"post_id": post_id, "preview": preview}


# Response: {"posts":[{"id":string,"text":string,"ts":ISO8601,"userRole":"borrower|lender"}]}
@app.get("/feed")
def get_feed():
    return {"posts": posts}


# --- Dashboards ---
# Response: {"next_payment":{"amount":number,"due_in_weeks":number},"total_owed_year":number,"savings_vs_bank_year":number}
@app.get("/dashboard/borrower")
def borrower_dashboard(user_id: str):
    _require_user(user_id)
    amount = borrow_amounts.get(user_id, 200.0)
    next_payment = round(min(amount / 10, 50), 2)
    return {
        "next_payment": {"amount": next_payment, "due_in_weeks": 1},
        "total_owed_year": round(amount, 2),
        "savings_vs_bank_year": round((BANK_AVG_RATE / 100) * amount, 2),
    }


# Response: {"next_payment":{"amount":number,"due_in_weeks":number},"expected_revenue_year":number}
@app.get("/dashboard/lender")
def lender_dashboard(user_id: str):
    user = _require_user(user_id)
    capital = user.get("max_amount", 1500)
    return {
        "next_payment": {"amount": round(capital * 0.01, 2), "due_in_weeks": 1},
        "expected_revenue_year": round(capital * 0.12, 2),
    }
