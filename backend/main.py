import os
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import databases
import sqlalchemy

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://kubestate:Kb$9xLm2#pQr7wNz@postgres.stateful-app.svc.cluster.local:5432/kubestate",
)

database = databases.Database(DATABASE_URL)

metadata = sqlalchemy.MetaData()

profiles = sqlalchemy.Table(
    "profiles",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True, autoincrement=True),
    sqlalchemy.Column("name", sqlalchemy.String(100), nullable=False),
    sqlalchemy.Column("role", sqlalchemy.String(100), nullable=False),
    sqlalchemy.Column("tool", sqlalchemy.String(100), nullable=False),
    sqlalchemy.Column("headline", sqlalchemy.String(255), nullable=False),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = sqlalchemy.create_engine(DATABASE_URL)
    metadata.create_all(engine)
    await database.connect()
    yield
    await database.disconnect()


app = FastAPI(title="DevOps Profile Card API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProfileRequest(BaseModel):
    name: str
    role: str
    tool: str
    headline: str


class ProfileResponse(BaseModel):
    status: str
    profile_card: str
    id: int | None = None


class StatsResponse(BaseModel):
    total_profiles: int
    latest: dict | None = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ready")
async def ready():
    try:
        await database.fetch_one("SELECT 1")
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return {"status": "not ready", "database": str(e)}


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    total = await database.fetch_val("SELECT COUNT(*) FROM profiles")
    latest = await database.fetch_one(
        "SELECT * FROM profiles ORDER BY id DESC LIMIT 1"
    )
    latest_dict = dict(latest) if latest else None
    if latest_dict and "created_at" in latest_dict:
        latest_dict["created_at"] = str(latest_dict["created_at"])
    return StatsResponse(total_profiles=total, latest=latest_dict)


@app.get("/api/profiles")
async def list_profiles():
    rows = await database.fetch_all("SELECT * FROM profiles ORDER BY id DESC LIMIT 50")
    result = []
    for row in rows:
        d = dict(row)
        if "created_at" in d:
            d["created_at"] = str(d["created_at"])
        result.append(d)
    return result


@app.post("/api/profile", response_model=ProfileResponse)
async def create_profile(req: ProfileRequest):
    query = profiles.insert().values(
        name=req.name,
        role=req.role,
        tool=req.tool,
        headline=req.headline,
    )
    record_id = await database.execute(query)
    card = (
        f"{req.name} is a {req.role} who enjoys working with {req.tool}. "
        f"LinkedIn headline: {req.headline}."
    )
    return ProfileResponse(status="success", profile_card=card, id=record_id)
