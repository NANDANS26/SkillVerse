from fastapi import FastAPI
from app.api.v1.match import router as match_router
from app.api.v1.parse import router as parse_router
from app.api.v1.embed import router as embed_router

app = FastAPI(title="SkillVerse AI Backend", version="1.0")

app.include_router(parse_router, prefix="/api/v1")
app.include_router(match_router, prefix="/api/v1")
app.include_router(embed_router, prefix="/api/v1")

@app.get("/api/v1/health")
def health():
    return {"status": "ok", "message": "ML service running"}
