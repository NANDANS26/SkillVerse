from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ParseReq(BaseModel):
    text: str

@router.post("/parse_jd")
def parse_jd(req: ParseReq):
    # very simple rule extractor
    words = req.text.split()
    skills = [w.replace(",", "") for w in words if w[0].isupper() and len(w) > 2]

    return {
        "skills_extracted": list(set(skills)),
        "clean_text": req.text
    }
