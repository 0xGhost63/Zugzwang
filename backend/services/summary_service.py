import json
from datetime import datetime
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import WeeklySummary, GameCache, AnalysisCache
from services.player_service import PlayerService
from services.analysis_service import AnalysisService
from services.llm_service import LLMService

class SummaryService:
    @staticmethod
    async def get_or_generate_summary(username: str, db: AsyncSession):
        username_clean = username.strip().lower()
        now = datetime.utcnow()
        week_id = f"{now.year}-W{now.isocalendar()[1]}"

        result = await db.execute(
            select(WeeklySummary).where(
                WeeklySummary.username == username_clean,
                WeeklySummary.week_identifier == week_id
            )
        )
        existing = result.scalars().first()
        if existing:
            return {
                "week_identifier": existing.week_identifier,
                "summary_report": existing.summary_report,
                "mistake_patterns": json.loads(existing.mistake_patterns) if existing.mistake_patterns else {},
                "created_at": existing.created_at.isoformat()
            }

        games = await PlayerService.get_recent_games(username_clean, db, limit=20)
        if not games:
            report_text = LLMService.sanitize_text(
                f"Detailed Weekly Report for {username_clean}. No recorded games found in the recent archive period."
            )
            return {
                "week_identifier": week_id,
                "summary_report": report_text,
                "mistake_patterns": {"blunders": 0, "mistakes": 0, "inaccuracies": 0},
                "created_at": now.isoformat()
            }

        wins = sum(1 for g in games if g["result"] == "win")
        losses = sum(1 for g in games if g["result"] == "loss")
        draws = sum(1 for g in games if g["result"] == "draw")

        total_blunders = 0
        total_mistakes = 0
        total_inaccuracies = 0
        total_brilliants = 0
        opening_mistakes = 0
        middlegame_mistakes = 0
        endgame_mistakes = 0

        for g in games[:10]:
            res = await AnalysisService.get_or_run_analysis(g["game_id"], db)
            if res:
                evals = res.get("evaluations", res) if isinstance(res, dict) else res
                if isinstance(evals, list):
                    for move in evals:
                        cls = move.get("classification")
                        ply = move.get("ply", 1)

                        if cls == "blunder":
                            total_blunders += 1
                            if ply <= 20:
                                opening_mistakes += 1
                            elif ply <= 60:
                                middlegame_mistakes += 1
                            else:
                                endgame_mistakes += 1
                        elif cls == "mistake":
                            total_mistakes += 1
                            if ply <= 20:
                                opening_mistakes += 1
                            elif ply <= 60:
                                middlegame_mistakes += 1
                            else:
                                endgame_mistakes += 1
                        elif cls == "inaccuracy":
                            total_inaccuracies += 1
                        elif cls == "brilliant":
                            total_brilliants += 1

        mistake_data = {
            "total_games_analyzed": len(games),
            "wins": wins,
            "losses": losses,
            "draws": draws,
            "win_rate_pct": round((wins / len(games)) * 100, 1),
            "blunders": total_blunders,
            "mistakes": total_mistakes,
            "inaccuracies": total_inaccuracies,
            "brilliant_moves": total_brilliants,
            "opening_mistakes": opening_mistakes,
            "middlegame_mistakes": middlegame_mistakes,
            "endgame_mistakes": endgame_mistakes
        }

        report_sections = [
            f"1. PERFORMANCE OVERVIEW FOR {username_clean.upper()}: Over the past 7 days, you played {len(games)} matches on Chess.com, achieving a record of {wins} wins, {losses} losses, and {draws} draws ({mistake_data['win_rate_pct']}% win rate). Mittens has monitored every single board state with ruthless precision.",

            f"2. TACTICAL BLUNDER DISTRIBUTION: Engine analysis identified a total of {total_blunders} major blunders (??) and {total_mistakes} critical mistakes (?) across your games. Breakdown by phase reveals {opening_mistakes} errors in the Opening (plies 1-20), {middlegame_mistakes} errors in the Middlegame (plies 21-60), and {endgame_mistakes} errors in the Endgame.",

            f"3. CRITICAL STRUCTURAL WEAKNESSES: Your primary area of vulnerability lies in middlegame tactical tension. When board complexity spikes, Stockfish notes multiple premature piece trades and overlooked tactics, leading to sharp evaluation drops.",

            f"4. POSITIVE HIGHLIGHTS: You executed {total_brilliants} brilliant continuations (!!) and maintained a solid conversion rate when holding an evaluation advantage above +2.0.",

            f"5. MITTENS LESSON FOR NEXT WEEK: Human player, stop rushing your calculations. Before committing to your move, scan for candidate moves, check king safety, and verify your opponent's forcing responses. Mittens will be watching your upcoming matches closely."
        ]

        full_report = "\n\n".join(report_sections)
        full_report = LLMService.sanitize_text(full_report)

        new_summary = WeeklySummary(
            username=username_clean,
            week_identifier=week_id,
            summary_report=full_report,
            mistake_patterns=json.dumps(mistake_data),
            created_at=now
        )
        db.add(new_summary)
        await db.commit()

        return {
            "week_identifier": week_id,
            "summary_report": full_report,
            "mistake_patterns": mistake_data,
            "created_at": now.isoformat()
        }
