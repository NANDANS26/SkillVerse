# Backend/app/core/auth.py
import hmac
import os
from typing import Optional
from fastapi import Header, HTTPException, status

DEFAULT_SECRET = "skillverse-internal-service-secret-local-dev"

def get_service_secret() -> str:
    env_mode = os.environ.get("ENV", os.environ.get("ENVIRONMENT", os.environ.get("NODE_ENV", "development"))).lower()
    secret = os.environ.get("ML_SERVICE_SECRET")
    if env_mode == "production":
        if not secret or secret == DEFAULT_SECRET:
            raise RuntimeError("CRITICAL: ML_SERVICE_SECRET must be explicitly set to a strong non-default secret in production environments.")
    return secret or DEFAULT_SECRET

def verify_service_token(x_service_token: Optional[str] = Header(None, alias="X-Service-Token")):
    secret = get_service_secret()
    if not x_service_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Missing internal service token"
        )
    if not hmac.compare_digest(x_service_token, secret):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid internal service token"
        )
    return True
