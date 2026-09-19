import json
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import GameCache
from services.player_service import PlayerService
from services.analysis_service import AnalysisService
from services.llm_service import LLMService
from services.tts_service import TTSService
from services.summary_service import SummaryService
from services.subscription_service import SubscriptionService

router = APIRouter(prefix="/api")

@router.get("")
@router.get("/")
async def api_health():
    return {"status": "online", "project": "Zugzwang"}

@router.get("/players/{username}")
async def get_player_profile(username: str, db: AsyncSession = Depends(get_db)):
    data = await PlayerService.get_player_profile(username, db)
    if not data:
        raise HTTPException(status_code=404, detail="Player not found on Chess.com")
    return data

@router.get("/players/{username}/analytics")
async def get_player_analytics(username: str, db: AsyncSession = Depends(get_db)):
    data = await PlayerService.get_player_analytics(username, db)
    if not data:
        raise HTTPException(status_code=404, detail="Player not found on Chess.com")
    return data

@router.get("/players/{username}/games")
async def get_player_games(
    username: str,
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    games = await PlayerService.get_recent_games(username, db, limit=limit)
    return {"username": username, "count": len(games), "games": games}

@router.get("/games/{game_id}")
async def get_game_detail(game_id: str, db: AsyncSession = Depends(get_db)):
    game = await db.get(GameCache, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return {
        "game_id": game.game_id,
        "username": game.username,
        "pgn": game.pgn,
        "white_player": game.white_player,
        "black_player": game.black_player,
        "white_rating": game.white_rating,
        "black_rating": game.black_rating,
        "result": game.result,
        "time_class": game.time_class,
        "end_time": game.end_time.isoformat() if game.end_time else ""
    }

@router.post("/games/{game_id}/analyze")
async def analyze_game(game_id: str, db: AsyncSession = Depends(get_db)):
    res = await AnalysisService.get_or_run_analysis(game_id, db)
    if res is None:
        raise HTTPException(status_code=404, detail="Game PGN unavailable for analysis")

    if isinstance(res, dict) and "evaluations" in res:
        return {"game_id": game_id, "evaluations": res["evaluations"], "accuracy": res.get("accuracy")}
    return {"game_id": game_id, "evaluations": res, "accuracy": None}

@router.post("/games/{game_id}/commentary")
async def get_move_commentary(
    game_id: str,
    ply_data: dict = Body(...),
    db: AsyncSession = Depends(get_db)
):
    commentary = await LLMService.generate_move_commentary(ply_data)
    audio_url = await TTSService.generate_speech_base64(commentary)
    return {
        "game_id": game_id,
        "ply": ply_data.get("ply"),
        "commentary": commentary,
        "audio_url": audio_url
    }

@router.get("/summary/{username}")
async def get_weekly_summary(username: str, db: AsyncSession = Depends(get_db)):
    summary = await SummaryService.get_or_generate_summary(username, db)
    is_subscribed = await SubscriptionService.get_subscription(username, db)
    summary["is_subscribed"] = is_subscribed
    return summary

@router.post("/subscription/{username}")
async def update_subscription(
    username: str,
    payload: dict = Body(...),
    db: AsyncSession = Depends(get_db)
):
    is_subscribed = payload.get("is_subscribed", True)
    updated = await SubscriptionService.toggle_subscription(username, is_subscribed, db)
    return {"username": username, "is_subscribed": updated}
