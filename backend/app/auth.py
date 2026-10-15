from functools import lru_cache
from urllib.parse import urlsplit

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .settings import get_settings

_bearer = HTTPBearer(auto_error=False)


@lru_cache
def _jwks_client(jwks_url: str) -> jwt.PyJWKClient:
    return jwt.PyJWKClient(jwks_url)


class AuthenticatedUser:
    def __init__(self, subject: str, email: str) -> None:
        self.subject = subject
        self.email = email


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> AuthenticatedUser:
    settings = get_settings()
    allowlist = settings.admin_emails_list
    auth_url = settings.neon_auth_url.rstrip("/")
    parsed = urlsplit(auth_url)

    if not auth_url or not parsed.scheme or not parsed.netloc or not allowlist:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Neon Auth and a non-empty ADMIN_EMAILS allowlist must be configured.",
        )
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token.")

    audience = f"{parsed.scheme}://{parsed.netloc}"
    try:
        signing_key = _jwks_client(
            f"{auth_url}/.well-known/jwks.json"
        ).get_signing_key_from_jwt(credentials.credentials)
        payload = jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["EdDSA", "RS256", "ES256"],
            audience=audience,
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError as error:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid bearer token."
        ) from error

    email = payload.get("email")
    if (
        payload.get("emailVerified") is not True
        or not isinstance(email, str)
        or email.strip().lower() not in allowlist
    ):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "This account is not authorized.",
        )

    return AuthenticatedUser(subject=payload["sub"], email=email)
