# Backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.match import router as match_router
from app.api.v1.parse import router as parse_router
from app.api.v1.embed import router as embed_router
from app.api.v1.recommend import router as recommend_router

app = FastAPI(title="SkillVerse AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parse_router, prefix="/api/v1")
app.include_router(match_router, prefix="/api/v1")
app.include_router(embed_router, prefix="/api/v1")
app.include_router(recommend_router, prefix="/api/v1")

@app.on_event("startup")
def startup_event():
    # Warm up models on startup so subsequent requests experience zero cold-start delay
    try:
        from app.core.embeddings import EmbeddingService
        from app.core.live_index import get_live_index
        from app.core.ranker import Ranker
        embedder = EmbeddingService()
        _ = embedder.embed("SkillVerse warmup")
        _ = get_live_index()
        _ = Ranker()
        print("[Startup] All ML models and vector indexes initialized and warmed up successfully.")
    except Exception as e:
        print(f"[Startup Warning] ML warmup encountered error: {e}")

@app.get("/")
def root():
    return {"status": "ok", "service": "SkillVerse AI Intelligence Backend", "version": "1.0.0"}

@app.get("/api/v1/health")
def health():
    live_index_status = "unavailable"
    indexed_count = 0
    ranker_status = "unavailable"
    try:
        from app.core.live_index import get_live_index
        idx_mgr = get_live_index()
        if idx_mgr is not None and hasattr(idx_mgr, "index"):
            live_index_status = "loaded"
            indexed_count = int(idx_mgr.index.ntotal)
    except Exception as e:
        live_index_status = f"error: {str(e)}"

    try:
        from app.core.ranker import Ranker
        ranker = Ranker()
        if ranker is not None and hasattr(ranker, "model"):
            ranker_status = "loaded"
    except Exception as e:
        ranker_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "message": "ML service running",
        "service": "SkillVerse AI Microservice",
        "live_index": live_index_status,
        "indexed_candidates": indexed_count,
        "ranker": ranker_status
    }
