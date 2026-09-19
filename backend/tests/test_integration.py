import json
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
import database
from main import app
from services.llm_service import LLMService
from services.analysis_service import EngineEvaluator

@pytest_asyncio.fixture(autouse=True)
async def setup_inmemory_db(monkeypatch):
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    monkeypatch.setattr(database, "engine", test_engine)
    monkeypatch.setattr(
        database,
        "AsyncSessionLocal",
        async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    )
    async with test_engine.begin() as conn:
        await conn.run_sync(database.Base.metadata.create_all)

@pytest.mark.asyncio
async def test_full_app_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Healthcheck root endpoint
        root_res = await client.get("/")
        assert root_res.status_code == 200
        assert root_res.json()["project"] == "Zugzwang"

        # 2. Test Player Profile search (hikaru)
        profile_res = await client.get("/api/players/hikaru")
        assert profile_res.status_code == 200
        profile_data = profile_res.json()
        assert "profile" in profile_data
        assert "stats" in profile_data

        # 3. Test Games list fetching
        games_res = await client.get("/api/players/hikaru/games?limit=5")
        assert games_res.status_code == 200
        games_data = games_res.json()
        assert "games" in games_data
        assert len(games_data["games"]) > 0

        target_game = games_data["games"][0]
        game_id = target_game["game_id"]

        # 4. Test Engine Game Analysis
        analyze_res = await client.post(f"/api/games/{game_id}/analyze")
        assert analyze_res.status_code == 200
        analysis_data = analyze_res.json()
        assert "evaluations" in analysis_data
        evals = analysis_data["evaluations"]
        assert len(evals) > 0

        first_eval = evals[0]
        assert "played_move_san" in first_eval
        assert "best_move_san" in first_eval
        assert "eval_cp" in first_eval
        assert "classification" in first_eval

        # 5. Test Mittens Commentary generation & Strict Content Rules
        comm_res = await client.post(f"/api/games/{game_id}/commentary", json=first_eval)
        assert comm_res.status_code == 200
        commentary = comm_res.json()["commentary"]
        assert len(commentary) > 0

        # Assert strict constraints: NO EMOJIS, NO EM DASHES
        assert "—" not in commentary
        assert "--" not in commentary

        # 6. Test Weekly Summary generation
        summary_res = await client.get("/api/summary/hikaru")
        assert summary_res.status_code == 200
        summary_data = summary_res.json()
        assert "summary_report" in summary_data
        assert "—" not in summary_data["summary_report"]
        assert summary_data["is_subscribed"] is True

        # 7. Test Subscription toggle
        sub_res = await client.post("/api/subscription/hikaru", json={"is_subscribed": False})
        assert sub_res.status_code == 200
        assert sub_res.json()["is_subscribed"] is False

        # Re-fetch summary and verify subscription status updated
        summary_res2 = await client.get("/api/summary/hikaru")
        assert summary_res2.json()["is_subscribed"] is False

def test_engine_evaluator_pgn_parser():
    pgn = """
[Event "Test Match"]
[Site "Chess.com"]
[Date "2026.01.01"]
[White "Hikaru"]
[Black "Magnus"]
[Result "1/2-1/2"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1/2-1/2
"""
    evaluator = EngineEvaluator()
    evals = evaluator.evaluate_game(pgn)
    assert len(evals) == 6
    for ev in evals:
        assert "played_move_san" in ev
        assert "eval_delta" in ev
        assert "classification" in ev

def test_mittens_commentary_sanitization_rules():
    blunder_data = {
        "ply": 12,
        "played_move_san": "Qxf7+",
        "played_move_uci": "f3f7",
        "player_color": "white",
        "best_move_san": "Nf3",
        "classification": "blunder",
        "eval_cp": -4.2,
        "eval_delta": -3.8
    }
    commentary = LLMService._generate_fallback_commentary(blunder_data)
    assert "blunder" in commentary.lower()
    assert "—" not in commentary
    assert "🐱" not in commentary
