"""Tests for POST /auth/signup and POST /auth/login."""
import pytest
from httpx import AsyncClient
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
)


# ── Unit tests for auth_service ───────────────────────────────────────────────

class TestPasswordHashing:
    def test_hash_is_not_plain_text(self):
        hashed = hash_password("secret")
        assert hashed != "secret"

    def test_verify_correct_password(self):
        hashed = hash_password("mypassword")
        assert verify_password("mypassword", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("mypassword")
        assert verify_password("wrong", hashed) is False


class TestJWT:
    def test_token_encodes_and_decodes(self):
        import uuid
        uid = uuid.uuid4()
        token = create_access_token(uid, "user@test.com")
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == str(uid)
        assert payload["email"] == "user@test.com"

    def test_invalid_token_returns_none(self):
        assert decode_token("not.a.valid.token") is None

    def test_tampered_token_returns_none(self):
        import uuid
        token = create_access_token(uuid.uuid4(), "x@x.com")
        assert decode_token(token + "tampered") is None


# ── Integration tests for /auth endpoints ─────────────────────────────────────

class TestSignup:
    async def test_signup_returns_201_and_token(self, client: AsyncClient):
        resp = await client.post(
            "/auth/signup", json={"email": "new@example.com", "password": "pass1234"}
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["email"] == "new@example.com"
        assert data["token_type"] == "bearer"

    async def test_signup_duplicate_email_returns_400(self, client: AsyncClient):
        payload = {"email": "dup@example.com", "password": "pass1234"}
        await client.post("/auth/signup", json=payload)
        resp = await client.post("/auth/signup", json=payload)
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"]

    async def test_signup_invalid_email_returns_422(self, client: AsyncClient):
        resp = await client.post(
            "/auth/signup", json={"email": "not-an-email", "password": "pass1234"}
        )
        assert resp.status_code == 422


class TestLogin:
    async def test_login_valid_credentials(self, client: AsyncClient):
        await client.post(
            "/auth/signup", json={"email": "login@example.com", "password": "pass1234"}
        )
        resp = await client.post(
            "/auth/login", json={"email": "login@example.com", "password": "pass1234"}
        )
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    async def test_login_wrong_password_returns_401(self, client: AsyncClient):
        await client.post(
            "/auth/signup", json={"email": "login2@example.com", "password": "correct"}
        )
        resp = await client.post(
            "/auth/login", json={"email": "login2@example.com", "password": "wrong"}
        )
        assert resp.status_code == 401

    async def test_login_unknown_email_returns_401(self, client: AsyncClient):
        resp = await client.post(
            "/auth/login", json={"email": "ghost@example.com", "password": "pass"}
        )
        assert resp.status_code == 401

    async def test_token_is_valid_jwt(self, client: AsyncClient):
        await client.post(
            "/auth/signup", json={"email": "jwt@example.com", "password": "pass1234"}
        )
        resp = await client.post(
            "/auth/login", json={"email": "jwt@example.com", "password": "pass1234"}
        )
        token = resp.json()["access_token"]
        payload = decode_token(token)
        assert payload is not None
        assert payload["email"] == "jwt@example.com"
