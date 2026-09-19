import pytest
from services.llm_service import LLMService

def test_emoji_removal():
    raw_text = "Meow! 🐱 That move was a blunder 💥! You lost -2.5 cp."
    sanitized = LLMService.sanitize_text(raw_text)
    assert "🐱" not in sanitized
    assert "💥" not in sanitized
    assert "Meow! That move was a blunder ! You lost -2.5 cp." in sanitized or "Meow!" in sanitized

def test_em_dash_removal():
    raw_text = "Playing Nf3—a strong choice—keeps white in control."
    sanitized = LLMService.sanitize_text(raw_text)
    assert "—" not in sanitized
    assert "Nf3, a strong choice, keeps white" in sanitized

def test_combined_sanitization():
    raw_text = "Purr 🐈—that move was terrible 😱!"
    sanitized = LLMService.sanitize_text(raw_text)
    assert "🐈" not in sanitized
    assert "😱" not in sanitized
    assert "—" not in sanitized
