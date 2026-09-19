import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import database
from main import app

@pytest_asyncio.fixture(autouse=True)
async def setup_test_database(monkeypatch):
    # Use in-memory SQLite database for tests
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    from database import Base

    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    monkeypatch.setattr(database, "engine", test_engine)
    monkeypatch.setattr(database, "AsyncSessionLocal", async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False))

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["project"] == "Zugzwang"

@pytest.mark.asyncio
async def test_commentary_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "ply": 1,
            "played_move_san": "e4",
            "played_move_uci": "e2e4",
            "player_color": "white",
            "best_move_san": "e4",
            "classification": "best",
            "eval_cp": 0.3,
            "eval_delta": 0.1
        }
        response = await client.post("/api/games/test_game_1/commentary", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "commentary" in data
        assert "—" not in data["commentary"]
