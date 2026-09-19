import io
import os
import json
import math
import chess
import chess.pgn
import chess.engine
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from models import AnalysisCache, GameCache
from config import settings
from services.llm_service import LLMService

class EngineEvaluator:
    def __init__(self):
        self.engine_path = settings.STOCKFISH_PATH

    def _get_engine(self):
        if os.path.exists(self.engine_path) and os.access(self.engine_path, os.X_OK):
            try:
                return chess.engine.SimpleEngine.popen_uci(self.engine_path)
            except Exception:
                return None
        return None

    def evaluate_game(self, pgn_string: str, player_color: str = "white"):
        game = chess.pgn.read_game(io.StringIO(pgn_string))
        if not game:
            return []

        board = game.board()
        engine = self._get_engine()

        evaluations = []
        prev_eval_cp = 0.0

        for ply, move in enumerate(game.mainline_moves()):
            is_check = board.is_check()
            is_capture = board.is_capture(move)
            san_move = board.san(move)
            uci_move = move.uci()
            turn_color = board.turn
            moved_color_str = "white" if turn_color == chess.WHITE else "black"

            piece_moved = board.piece_at(move.from_square)
            piece_captured = board.piece_at(move.to_square)

            best_move_uci = ""
            best_move_san = ""
            best_line_continuation = []
            alt_move_san = ""
            alt_line_continuation = []
            eval_before_cp = prev_eval_cp

            if engine:
                try:
                    info_before = engine.analyse(board, chess.engine.Limit(time=0.08), multipv=2)
                    if isinstance(info_before, list) and len(info_before) > 0:
                        best_entry = info_before[0]
                        pv_best = best_entry.get("pv", [])
                        if len(pv_best) > 0:
                            best_m = pv_best[0]
                            best_move_uci = best_m.uci()
                            try:
                                best_move_san = board.san(best_m)
                            except Exception:
                                best_move_san = best_move_uci

                            temp_b = board.copy()
                            b_line = []
                            for pm in pv_best[:5]:
                                try:
                                    b_line.append(temp_b.san(pm))
                                    temp_b.push(pm)
                                except Exception:
                                    break
                            best_line_continuation = b_line

                        if len(info_before) > 1:
                            alt_entry = info_before[1]
                            pv_alt = alt_entry.get("pv", [])
                            if len(pv_alt) > 0:
                                alt_m = pv_alt[0]
                                try:
                                    alt_move_san = board.san(alt_m)
                                except Exception:
                                    alt_move_san = alt_m.uci()

                                temp_b = board.copy()
                                a_line = []
                                for pm in pv_alt[:5]:
                                    try:
                                        a_line.append(temp_b.san(pm))
                                        temp_b.push(pm)
                                    except Exception:
                                        break
                                alt_line_continuation = a_line
                except Exception:
                    pass

            if not best_move_san:
                legal_moves = list(board.legal_moves)
                if legal_moves:
                    best_m = legal_moves[0]
                    best_move_uci = best_m.uci()
                    try:
                        best_move_san = board.san(best_m)
                    except Exception:
                        best_move_san = best_move_uci
                    best_line_continuation = [best_move_san]

            board.push(move)
            fen_after = board.fen()

            eval_cp = 0.0
            mate_in = None
            played_line_continuation = []

            if engine:
                try:
                    info_after = engine.analyse(board, chess.engine.Limit(time=0.08))
                    score = info_after.get("score")
                    pv_after = info_after.get("pv", [])

                    if score:
                        if score.is_mate():
                            mate_in = score.relative.mate()
                            eval_cp = 10000.0 if (mate_in and mate_in > 0) else -10000.0
                        else:
                            cp = score.white().score(mate_score=10000)
                            eval_cp = cp / 100.0 if cp is not None else 0.0

                    temp_b = board.copy()
                    p_line = []
                    for pm in pv_after[:5]:
                        try:
                            p_line.append(temp_b.san(pm))
                            temp_b.push(pm)
                        except Exception:
                            break
                    played_line_continuation = p_line
                except Exception:
                    eval_cp = self._python_fallback_cp(board)
            else:
                eval_cp = self._python_fallback_cp(board)

            if turn_color == chess.WHITE:
                eval_delta = eval_cp - prev_eval_cp
            else:
                eval_delta = prev_eval_cp - eval_cp

            is_best = (san_move == best_move_san) or (best_move_san == "")

            is_sacrifice = False
            if piece_moved and is_best:
                piece_vals = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9}
                moved_val = piece_vals.get(piece_moved.piece_type, 0)
                captured_val = piece_vals.get(piece_captured.piece_type, 0) if piece_captured else 0
                if moved_val > captured_val + 1 and moved_val >= 3 and eval_delta >= -0.2:
                    is_sacrifice = True

            classification, symbol = self._classify_move(eval_delta, is_best, is_capture, is_check, is_sacrifice)

            eval_item = {
                "ply": ply + 1,
                "move_number": (ply // 2) + 1,
                "player_color": moved_color_str,
                "target_user_color": player_color,
                "played_move_san": san_move,
                "played_move_uci": uci_move,
                "played_line_continuation": played_line_continuation,
                "best_move_san": best_move_san if best_move_san else san_move,
                "best_move_uci": best_move_uci if best_move_uci else uci_move,
                "best_line_continuation": best_line_continuation,
                "alt_move_san": alt_move_san,
                "alt_line_continuation": alt_line_continuation,
                "eval_before": round(eval_before_cp, 2),
                "eval_cp": round(eval_cp, 2),
                "mate_in": mate_in,
                "eval_delta": round(eval_delta, 2),
                "classification": classification,
                "symbol": symbol,
                "is_check": is_check,
                "is_capture": is_capture,
                "fen": fen_after
            }

            eval_item["commentary"] = LLMService._generate_fallback_commentary(eval_item)

            evaluations.append(eval_item)
            prev_eval_cp = eval_cp

        if engine:
            try:
                engine.quit()
            except Exception:
                pass

        return evaluations

    def _python_fallback_cp(self, board: chess.Board):
        piece_values = {
            chess.PAWN: 1.0,
            chess.KNIGHT: 3.05,
            chess.BISHOP: 3.25,
            chess.ROOK: 5.0,
            chess.QUEEN: 9.5,
            chess.KING: 0.0
        }
        white_material = 0.0
        black_material = 0.0
        center_squares = [chess.E4, chess.D4, chess.E5, chess.D5]

        for square, piece in board.piece_map().items():
            val = piece_values.get(piece.piece_type, 0.0)
            if square in center_squares:
                val += 0.15
            if piece.color == chess.WHITE:
                white_material += val
            else:
                black_material += val

        return round(white_material - black_material, 2)

    def _classify_move(self, eval_delta: float, is_best: bool, is_capture: bool, is_check: bool, is_sacrifice: bool) -> tuple:
        if is_sacrifice and is_best and eval_delta >= -0.2:
            return ("brilliant", "!!")
        elif is_best or eval_delta >= -0.1:
            return ("best", "BEST")
        elif eval_delta >= -0.35:
            return ("good", "!?")
        elif eval_delta >= -0.9:
            return ("inaccuracy", "?!")
        elif eval_delta >= -2.0:
            return ("mistake", "?")
        else:
            return ("blunder", "??")

class AnalysisService:
    @staticmethod
    def calculate_win_percent(eval_cp: float) -> float:
        # Chess.com Win Percent Model: 50 + 50 * tanh(eval / 400)
        return 50.0 + 50.0 * math.tanh(eval_cp / 4.0)

    @staticmethod
    def calculate_move_accuracy(eval_before: float, eval_after: float, color: str) -> float:
        w_before = AnalysisService.calculate_win_percent(eval_before if color == "white" else -eval_before)
        w_after = AnalysisService.calculate_win_percent(eval_after if color == "white" else -eval_after)
        delta_w = max(0.0, w_before - w_after)

        # Chess.com accuracy curve: 103.1668 * exp(-0.04354 * delta_w) - 3.1669
        raw_acc = 103.1668 * math.exp(-0.04354 * delta_w) - 3.1669
        return max(0.0, min(100.0, raw_acc))

    @staticmethod
    def calculate_accuracy_summary(evaluations: list, player_color: str):
        white_evals = [e for e in evaluations if e.get('player_color') == 'white']
        black_evals = [e for e in evaluations if e.get('player_color') == 'black']

        def calc_player_accuracy(group, color):
            if not group:
                return {
                    "overall": 100.0,
                    "phases": {
                        "opening": {"accuracy": 100.0, "moves": 0, "errors": 0},
                        "middlegame": {"accuracy": 100.0, "moves": 0, "errors": 0},
                        "endgame": {"accuracy": 100.0, "moves": 0, "errors": 0}
                    }
                }

            opening = [e for e in group if e['ply'] <= 20]
            middlegame = [e for e in group if 21 <= e['ply'] <= 60]
            endgame = [e for e in group if e['ply'] > 60]

            def calc_phase_acc(p_group):
                if not p_group:
                    return {"accuracy": None, "moves": 0, "errors": 0}
                accuracies = [AnalysisService.calculate_move_accuracy(e.get('eval_before', 0.0), e.get('eval_cp', 0.0), color) for e in p_group]
                avg_acc = sum(accuracies) / len(accuracies)
                errors = sum(1 for e in p_group if e.get('classification') in ['blunder', 'mistake'])
                return {"accuracy": round(avg_acc, 1), "moves": len(p_group), "errors": errors}

            all_accuracies = [AnalysisService.calculate_move_accuracy(e.get('eval_before', 0.0), e.get('eval_cp', 0.0), color) for e in group]
            overall_acc = sum(all_accuracies) / len(all_accuracies) if all_accuracies else 100.0

            return {
                "overall": round(overall_acc, 1),
                "phases": {
                    "opening": calc_phase_acc(opening),
                    "middlegame": calc_phase_acc(middlegame),
                    "endgame": calc_phase_acc(endgame)
                }
            }

        target_color = player_color.lower()
        opponent_color = "black" if target_color == "white" else "white"

        player_stats = calc_player_accuracy(white_evals if target_color == "white" else black_evals, target_color)
        opponent_stats = calc_player_accuracy(black_evals if target_color == "white" else white_evals, opponent_color)

        return {
            "player": {
                "color": target_color,
                "overall": player_stats["overall"],
                "phases": player_stats["phases"]
            },
            "opponent": {
                "color": opponent_color,
                "overall": opponent_stats["overall"],
                "phases": opponent_stats["phases"]
            }
        }

    @staticmethod
    async def get_or_run_analysis(game_id: str, db: AsyncSession):
        game_db = await db.get(GameCache, game_id)
        player_color = "white"
        if game_db and game_db.username and game_db.black_player and game_db.username.lower() == game_db.black_player.lower():
            player_color = "black"

        result = await db.get(AnalysisCache, game_id)
        if result:
            evaluations = json.loads(result.evaluations)
            accuracy = AnalysisService.calculate_accuracy_summary(evaluations, player_color)
            return {"evaluations": evaluations, "accuracy": accuracy}

        if not game_db or not game_db.pgn:
            return None

        evaluator = EngineEvaluator()
        evaluations = evaluator.evaluate_game(game_db.pgn, player_color=player_color)

        new_analysis = AnalysisCache(
            game_id=game_id,
            evaluations=json.dumps(evaluations),
            created_at=datetime.utcnow()
        )
        db.add(new_analysis)
        await db.commit()

        accuracy = AnalysisService.calculate_accuracy_summary(evaluations, player_color)
        return {"evaluations": evaluations, "accuracy": accuracy}
