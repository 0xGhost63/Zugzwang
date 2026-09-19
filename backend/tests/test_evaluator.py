import pytest
from services.analysis_service import EngineEvaluator

def test_engine_evaluator_pgn():
    sample_pgn = """
[Event "Sample Game"]
[Site "Chess.com"]
[Date "2026.01.01"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 1-0
"""
    evaluator = EngineEvaluator()
    evals = evaluator.evaluate_game(sample_pgn)

    assert len(evals) == 6
    assert evals[0]["played_move_san"] == "e4"
    assert evals[0]["player_color"] == "white"
    assert "classification" in evals[0]
    assert "eval_cp" in evals[0]
    assert "eval_delta" in evals[0]
    assert "fen" in evals[0]
