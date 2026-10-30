# Backend/app/api/v1/parse.py
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ParseReq(BaseModel):
    text: str = ""

@router.post("/parse_jd")
def parse_jd(req: ParseReq):
    words = req.text.split() if req.text else []
    skills = [
        w.replace(",", "").replace(".", "").replace(";", "")
        for w in words
        if w and len(w) > 2 and w[0].isupper()
    ]

    return {
        "success": True,
        "skills_extracted": list(set(skills)),
        "clean_text": req.text
    }
