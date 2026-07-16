"""
JWT security layer (HS256) — zero external dependencies.

Implements sign/verify with Python's hmac + hashlib so the project needs no
new packages. Tokens carry {sub, role, name, adminRole?, department?, exp}
and are validated by the `require_auth` FastAPI dependency applied to every
protected router.

Env:
  JWT_SECRET   – signing key   (dev default below; set a real one in prod)
  JWT_TTL_HOURS– token lifetime (default 12)
  JWT_ENFORCE  – "false" disables enforcement (tokens still issued/validated
                 when present) — handy for debugging.
"""

import os
import hmac
import json
import time
import base64
import hashlib
from typing import Optional, Dict

from fastapi import Header, HTTPException, status

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me-grievance-portal")
JWT_TTL_HOURS = int(os.getenv("JWT_TTL_HOURS", "12"))
JWT_ENFORCE = os.getenv("JWT_ENFORCE", "true").lower() != "false"

_HEADER = {"alg": "HS256", "typ": "JWT"}


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(seg: str) -> bytes:
    return base64.urlsafe_b64decode(seg + "=" * (-len(seg) % 4))


def _sign(msg: bytes) -> str:
    return _b64url(hmac.new(JWT_SECRET.encode(), msg, hashlib.sha256).digest())


def create_token(claims: Dict) -> str:
    """Sign a JWT with an expiry claim added."""
    payload = {**claims, "exp": int(time.time()) + JWT_TTL_HOURS * 3600, "iat": int(time.time())}
    header_b64 = _b64url(json.dumps(_HEADER, separators=(",", ":")).encode())
    payload_b64 = _b64url(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{header_b64}.{payload_b64}".encode()
    return f"{header_b64}.{payload_b64}.{_sign(signing_input)}"


def decode_token(token: str) -> Optional[Dict]:
    """Verify signature + expiry. Returns claims dict, or None if invalid."""
    try:
        header_b64, payload_b64, sig = token.split(".")
        expected = _sign(f"{header_b64}.{payload_b64}".encode())
        if not hmac.compare_digest(sig, expected):
            return None
        claims = json.loads(_b64url_decode(payload_b64))
        if claims.get("exp", 0) < time.time():
            return None
        return claims
    except Exception:
        return None


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


# ─── FastAPI dependencies ─────────────────────────────────────────────────────

def require_auth(authorization: Optional[str] = Header(None)) -> Optional[Dict]:
    """
    Router-level guard: validates the `Authorization: Bearer <jwt>` header.
    Returns the token claims (available to endpoints that want them).
    """
    if not JWT_ENFORCE:
        # Enforcement off: pass through, but still surface claims if present.
        if authorization and authorization.startswith("Bearer "):
            return decode_token(authorization[7:])
        return None

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    claims = decode_token(authorization[7:])
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return claims


def require_admin(claims: Optional[Dict] = None) -> Dict:
    """Endpoint-level guard for admin-only actions (used with require_auth)."""
    if claims is None or claims.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required.",
        )
    return claims
