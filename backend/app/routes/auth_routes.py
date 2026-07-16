"""
Authentication routes — issue JWTs for the demo identity registry.

The registry mirrors the frontend's seeded demo accounts (CREDENTIALS.md).
Citizen flow: the frontend runs its simulated Aadhaar-OTP check first, then
exchanges the verified identity here for a signed JWT. Admin flow: username +
password validated server-side (SHA-256), then a JWT with role/department
claims is issued. All /api/complaints and /api/assistant routes require the
resulting Bearer token.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field

from app.services.security import create_token, sha256_hex, require_auth

router = APIRouter(prefix="/auth", tags=["Auth"])

# ─── Demo identity registry (mirrors frontend seeds / CREDENTIALS.md) ─────────

CITIZENS = [
    {"aadhaar": "123456789012", "mobile": "9876543210", "name": "Ananya Sharma"},
]

_ADMIN_PLAIN = [
    # username, password, name, adminRole, department
    ("admin", "admin123", "Super Administrator", "super_admin", None),
    ("water_admin", "water123", "Water Dept. Admin", "department_admin", "Water Supply Department"),
    ("electricity_admin", "electricity123", "Electricity Dept. Admin", "department_admin", "Electricity Department"),
    ("roads_admin", "roads123", "Roads Dept. Admin", "department_admin", "Roads and Drainage"),
    ("swm_admin", "swm123", "SWM Dept. Admin", "department_admin", "Solid Waste Management"),
    ("health_admin", "health123", "Health Dept. Admin", "department_admin", "Public Health"),
    ("traffic_admin", "traffic123", "Traffic Dept. Admin", "department_admin", "Traffic Police"),
]

# Only password HASHES are kept in memory at runtime.
ADMINS = {
    u: {"password_hash": sha256_hex(p), "name": n, "adminRole": r, "department": d}
    for u, p, n, r, d in _ADMIN_PLAIN
}


# ─── Schemas ──────────────────────────────────────────────────────────────────

class CitizenLoginRequest(BaseModel):
    aadhaar: str = Field(..., min_length=12, max_length=14)
    mobile: str = Field(..., min_length=10, max_length=10)


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/citizen/login", response_model=TokenResponse)
def citizen_login(payload: CitizenLoginRequest):
    """
    Issues a citizen JWT once the OTP step has been passed on the client.
    Validates the Aadhaar + mobile pair against the demo registry.
    """
    aadhaar = payload.aadhaar.replace(" ", "")
    match = next(
        (c for c in CITIZENS if c["aadhaar"] == aadhaar and c["mobile"] == payload.mobile),
        None,
    )
    if not match:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Aadhaar number or linked mobile number is incorrect.",
        )
    token = create_token({"sub": match["mobile"], "role": "citizen", "name": match["name"]})
    return TokenResponse(access_token=token, role="citizen", name=match["name"])


@router.post("/admin/login", response_model=TokenResponse)
def admin_login(payload: AdminLoginRequest):
    """Validates admin credentials server-side and issues an admin JWT."""
    admin = ADMINS.get(payload.username.lower())
    if not admin or admin["password_hash"] != sha256_hex(payload.password):
        # Generic message — never reveal which field was wrong.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )
    token = create_token({
        "sub": payload.username.lower(),
        "role": "admin",
        "name": admin["name"],
        "adminRole": admin["adminRole"],
        "department": admin["department"],
    })
    return TokenResponse(access_token=token, role="admin", name=admin["name"])


@router.get("/me")
def whoami(claims: Optional[dict] = Depends(require_auth)):
    """Returns the verified claims of the current session token."""
    return claims or {"authenticated": False}
