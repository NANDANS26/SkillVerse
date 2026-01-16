from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class EmbedReq(BaseModel):
    candidate: dict

@router.post("/embed_candidate")
def embed_candidate(req: EmbedReq):
    # for hackathon version: no live index updating
    return {"status": "ok", "message": "Dynamic indexing disabled in demo"}
