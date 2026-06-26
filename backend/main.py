from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="DevOps Profile Card API", version="1.0.0")

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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ready")
def ready():
    return {"status": "ready"}


@app.post("/api/profile", response_model=ProfileResponse)
def create_profile(req: ProfileRequest):
    card = (
        f"{req.name} is a {req.role} who enjoys working with {req.tool}. "
        f"LinkedIn headline: {req.headline}."
    )
    return ProfileResponse(status="success", profile_card=card)
