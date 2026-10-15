import unittest
from unittest.mock import patch

import jwt
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.auth import require_admin
from app.settings import Settings


class RequireAdminTests(unittest.TestCase):
    def setUp(self) -> None:
        self.settings = Settings(
            neon_auth_url="https://auth.example.test",
            admin_emails="admin@example.com",
        )
        self.credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="test-token",
        )

    def test_missing_auth_configuration_fails_closed(self) -> None:
        for settings in (
            Settings(neon_auth_url="", admin_emails="admin@example.com"),
            Settings(
                neon_auth_url="https://auth.example.test",
                admin_emails="",
            ),
        ):
            with self.subTest(settings=settings):
                with patch("app.auth.get_settings", return_value=settings):
                    with self.assertRaises(HTTPException) as raised:
                        require_admin(self.credentials)
                self.assertEqual(raised.exception.status_code, 503)

    def test_missing_token_is_rejected(self) -> None:
        with patch("app.auth.get_settings", return_value=self.settings):
            with self.assertRaises(HTTPException) as raised:
                require_admin(None)
        self.assertEqual(raised.exception.status_code, 401)

    def test_invalid_token_is_rejected(self) -> None:
        with (
            patch("app.auth.get_settings", return_value=self.settings),
            patch("app.auth._jwks_client") as jwks_client,
            patch("app.auth.jwt.decode", side_effect=jwt.InvalidTokenError),
        ):
            jwks_client.return_value.get_signing_key_from_jwt.return_value.key = "key"
            with self.assertRaises(HTTPException) as raised:
                require_admin(self.credentials)
        self.assertEqual(raised.exception.status_code, 401)

    def test_allowlisted_user_is_accepted(self) -> None:
        with (
            patch("app.auth.get_settings", return_value=self.settings),
            patch("app.auth._jwks_client") as jwks_client,
            patch(
                "app.auth.jwt.decode",
                return_value={
                    "sub": "user-1",
                    "email": "ADMIN@example.com",
                    "email_verified": True,
                },
            ),
        ):
            jwks_client.return_value.get_signing_key_from_jwt.return_value.key = "key"
            user = require_admin(self.credentials)
        self.assertEqual(user.subject, "user-1")
        self.assertEqual(user.email, "ADMIN@example.com")

    def test_unverified_allowlisted_user_is_rejected(self) -> None:
        for payload in (
            {
                "sub": "user-1",
                "email": "admin@example.com",
                "email_verified": False,
            },
            {"sub": "user-1", "email": "admin@example.com"},
        ):
            with self.subTest(payload=payload):
                with (
                    patch("app.auth.get_settings", return_value=self.settings),
                    patch("app.auth._jwks_client") as jwks_client,
                    patch("app.auth.jwt.decode", return_value=payload),
                ):
                    signing_key = (
                        jwks_client.return_value.get_signing_key_from_jwt.return_value
                    )
                    signing_key.key = "key"
                    with self.assertRaises(HTTPException) as raised:
                        require_admin(self.credentials)
                self.assertEqual(raised.exception.status_code, 403)

    def test_non_allowlisted_user_is_rejected(self) -> None:
        with (
            patch("app.auth.get_settings", return_value=self.settings),
            patch("app.auth._jwks_client") as jwks_client,
            patch(
                "app.auth.jwt.decode",
                return_value={
                    "sub": "user-2",
                    "email": "other@example.com",
                    "email_verified": True,
                },
            ),
        ):
            jwks_client.return_value.get_signing_key_from_jwt.return_value.key = "key"
            with self.assertRaises(HTTPException) as raised:
                require_admin(self.credentials)
        self.assertEqual(raised.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
