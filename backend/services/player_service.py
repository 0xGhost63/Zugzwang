import json
import httpx
from datetime import datetime, timezone
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import PlayerCache, GameCache
from config import settings
from services.llm_service import LLMService

HEADERS = {
    "User-Agent": settings.CHESS_COM_USER_AGENT
}

class PlayerService:
    @staticmethod
    async def get_player_profile(username: str, db: AsyncSession):
        username_clean = username.strip().lower()

        # Check DB cache first
        result = await db.execute(select(PlayerCache).where(PlayerCache.username == username_clean))
        cached = result.scalars().first()

        if cached:
            time_diff = (datetime.utcnow() - cached.updated_at).total_seconds()
            if time_diff < 600:
                return {
                    "profile": json.loads(cached.profile_data),
                    "stats": json.loads(cached.stats_data)
                }

        async with httpx.AsyncClient(headers=HEADERS, timeout=10.0) as client:
            profile_url = f"https://api.chess.com/pub/player/{username_clean}"
            res_profile = await client.get(profile_url)
            if res_profile.status_code == 404:
                return None
            res_profile.raise_for_status()
            profile_data = res_profile.json()

            stats_url = f"https://api.chess.com/pub/player/{username_clean}/stats"
            res_stats = await client.get(stats_url)
            stats_data = res_stats.json() if res_stats.status_code == 200 else {}

        if cached:
            cached.profile_data = json.dumps(profile_data)
            cached.stats_data = json.dumps(stats_data)
            cached.updated_at = datetime.utcnow()
        else:
            new_cache = PlayerCache(
                username=username_clean,
                profile_data=json.dumps(profile_data),
                stats_data=json.dumps(stats_data),
                updated_at=datetime.utcnow()
            )
            db.add(new_cache)

        await db.commit()
        return {
            "profile": profile_data,
            "stats": stats_data
        }

    @staticmethod
    async def get_player_analytics(username: str, db: AsyncSession):
        username_clean = username.strip().lower()
        player_data = await PlayerService.get_player_profile(username_clean, db)
        if not player_data:
            return None

        games = await PlayerService.get_recent_games(username_clean, db, limit=40)
        profile = player_data["profile"]
        stats = player_data["stats"]

        # Calculate win/loss breakdown
        wins = sum(1 for g in games if g["result"] == "win")
        losses = sum(1 for g in games if g["result"] == "loss")
        draws = sum(1 for g in games if g["result"] == "draw")
        total = len(games) if games else 1

        white_games = [g for g in games if g["player_color"] == "white"]
        black_games = [g for g in games if g["player_color"] == "black"]

        white_win_pct = round((sum(1 for g in white_games if g["result"] == "win") / len(white_games) * 100), 1) if white_games else 50.0
        black_win_pct = round((sum(1 for g in black_games if g["result"] == "win") / len(black_games) * 100), 1) if black_games else 50.0

        # High-level AI Player Insights
        strengths = []
        weaknesses = []

        rapid_rating = stats.get("chess_rapid", {}).get("last", {}).get("rating", 0)
        blitz_rating = stats.get("chess_blitz", {}).get("last", {}).get("rating", 0)
        bullet_rating = stats.get("chess_bullet", {}).get("last", {}).get("rating", 0)

        if rapid_rating > blitz_rating:
            strengths.append("High classical calculation depth in longer time controls")
        if blitz_rating > 1800:
            strengths.append("Fast tactical intuition and blitz reflex speed")
        if white_win_pct > 55:
            strengths.append("Dominant opening initiative with White pieces")

        if black_win_pct < 45:
            weaknesses.append("Lower win rate defending as Black against central pawn pushes")
        if losses > wins:
            weaknesses.append("Prone to tactical blunders under high defensive pressure")
        if bullet_rating < blitz_rating - 100:
            weaknesses.append("Time management decay in bullet time scrambles")

        if not strengths:
            strengths = ["Solid piece coordination", "Active king safety awareness"]
        if not weaknesses:
            weaknesses = ["Slight passive play in endgames", "Occasional pawn structure weakening"]

        return {
            "username": username_clean,
            "profile": profile,
            "stats": stats,
            "analytics": {
                "total_analyzed_games": len(games),
                "win_rate": round((wins / total) * 100, 1),
                "wins": wins,
                "losses": losses,
                "draws": draws,
                "white_win_pct": white_win_pct,
                "black_win_pct": black_win_pct,
                "strengths": strengths,
                "weaknesses": weaknesses,
                "playstyle": "Aggressive Tactical Striker" if wins > losses else "Solid Positional Grinder",
                "verdict": f"Mittens sees {username_clean} as a player with strong {strengths[0].lower()}, but exploitable when challenged by {weaknesses[0].lower()}."
            }
        }

    @staticmethod
    async def get_recent_games(username: str, db: AsyncSession, limit: int = 20):
        username_clean = username.strip().lower()

        async with httpx.AsyncClient(headers=HEADERS, timeout=10.0) as client:
            archives_url = f"https://api.chess.com/pub/player/{username_clean}/games/archives"
            res_archives = await client.get(archives_url)
            if res_archives.status_code != 200:
                return []

            archives = res_archives.json().get("archives", [])
            if not archives:
                return []

            recent_archives = archives[-2:] if len(archives) >= 2 else archives[-1:]
            all_games = []

            for archive_url in reversed(recent_archives):
                res_games = await client.get(archive_url)
                if res_games.status_code == 200:
                    archive_data = res_games.json()
                    games_list = archive_data.get("games", [])
                    all_games.extend(reversed(games_list))
                    if len(all_games) >= limit * 2:
                        break

        processed_games = []
        for g in all_games[:limit]:
            white = g.get("white", {})
            black = g.get("black", {})

            w_user = white.get("username", "").lower()
            b_user = black.get("username", "").lower()

            is_player_white = (w_user == username_clean)
            player_info = white if is_player_white else black
            opponent_info = black if is_player_white else white

            user_result = player_info.get("result", "")
            if user_result in ["win"]:
                game_outcome = "win"
            elif user_result in ["checkmated", "resigned", "timeout", "abandoned", "lose"]:
                game_outcome = "loss"
            else:
                game_outcome = "draw"

            end_timestamp = g.get("end_time")
            end_dt = datetime.fromtimestamp(end_timestamp, tz=timezone.utc) if end_timestamp else None

            url_parts = g.get("url", "").split("/")
            game_id = url_parts[-1] if url_parts[-1] else f"{username_clean}_{end_timestamp}"

            game_obj = {
                "game_id": game_id,
                "url": g.get("url", ""),
                "pgn": g.get("pgn", ""),
                "time_class": g.get("time_class", "unknown"),
                "time_control": g.get("time_control", ""),
                "white_player": white.get("username", "Unknown"),
                "white_rating": white.get("rating", 0),
                "black_player": black.get("username", "Unknown"),
                "black_rating": black.get("rating", 0),
                "player_color": "white" if is_player_white else "black",
                "opponent": opponent_info.get("username", "Unknown"),
                "opponent_rating": opponent_info.get("rating", 0),
                "result": game_outcome,
                "result_detail": user_result,
                "end_time": end_dt.isoformat() if end_dt else "",
                "end_timestamp": end_timestamp
            }

            if g.get("pgn"):
                db_game = await db.get(GameCache, game_id)
                if not db_game:
                    new_game_cache = GameCache(
                        game_id=game_id,
                        username=username_clean,
                        pgn=g.get("pgn", ""),
                        white_player=white.get("username", ""),
                        black_player=black.get("username", ""),
                        white_rating=white.get("rating", 0),
                        black_rating=black.get("rating", 0),
                        result=game_outcome,
                        time_class=g.get("time_class", ""),
                        end_time=end_dt,
                        raw_json=json.dumps(g)
                    )
                    db.add(new_game_cache)

            processed_games.append(game_obj)

        await db.commit()
        return processed_games
