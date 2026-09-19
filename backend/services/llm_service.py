import os
import re
import json
import httpx
from config import settings

class LLMService:
    PRIMARY_MODELS = [
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b"
    ]

    @staticmethod
    def sanitize_text(text: str) -> str:
        if not text:
            return ""
        text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
        text = re.sub(r"<think>.*", "", text, flags=re.DOTALL)
        text = text.replace("—", ", ").replace("--", ", ")
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"
            "\U0001F300-\U0001F5FF"
            "\U0001F680-\U0001F6FF"
            "\U0001F1E0-\U0001F1FF"
            "\u2600-\u26FF"
            "\u2700-\u27BF"
            "]+",
            flags=re.UNICODE
        )
        text = emoji_pattern.sub("", text)
        return text.strip()

    @classmethod
    async def generate_move_commentary(cls, move_data: dict) -> str:
        api_key = settings.GROQ_API_KEY or settings.OPENAI_API_KEY

        if not api_key:
            return cls._generate_fallback_commentary(move_data)

        moved_color = move_data.get('player_color', 'white')
        target_color = move_data.get('target_user_color', moved_color)
        is_user_move = (moved_color == target_color)
        actor = "You" if is_user_move else "Your opponent"

        played_move = move_data.get('played_move_san', '')
        best_move = move_data.get('best_move_san', '')

        played_line = " -> ".join(move_data.get('played_line_continuation', []))
        best_line = " -> ".join(move_data.get('best_line_continuation', []))

        classification = move_data.get('classification', 'good')
        is_check = move_data.get('is_check', False)
        is_capture = move_data.get('is_capture', False)

        prompt = f"""You are Mittens, a 2800 ELO Grandmaster cat chess analyst.
Provide a highly critical, logical, deep tactical analysis explaining concrete move possibilities for a voice audio reader.

MOVE METRICS:
- Actor: {actor} ({moved_color})
- Move Played: {played_move} (Is Capture: {is_capture}, Is Check: {is_check}, Quality: {classification.upper()})
- Played Move Continuation Line: {played_line if played_line else played_move}

- Stockfish Top Recommended Move: {best_move if best_move else 'N/A'}
- Top Engine Continuation Line: {best_line if best_line else best_move}

REQUIRED CRITICAL ANALYSIS STRUCTURE (2-3 concise spoken sentences):
1. THE CONCRETE POSSIBLITY PLAYED: Explain what playing {played_move} actually leads to tactically in the continuation line ({played_line}) (e.g. piece exposure, pin, open file, or loss of central control).
2. THE ALTERNATIVE POSSIBLITY: Explain what playing the engine move {best_move} would have achieved in its continuation line ({best_line}) and why that possibility is tactically superior or inferior.
3. CONCRETE POSITIONAL TERMS: Cite specific tactical motifs (fork, pin, tempo, king safety, active outpost, central pawn anchor).

CRITICAL FORMATTING RULES:
- Output ONLY the final 2-3 spoken analysis sentences directly.
- Do NOT output any thinking, internal scratchpad, or <think> tags.
- Do NOT mention raw evaluation numbers, centipawns, 'at 0 eval', or engine score formulas. Talk like a real Grandmaster!
- Do NOT use emojis or em dashes."""

        if settings.GROQ_API_KEY:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"}

            for model in cls.PRIMARY_MODELS:
                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.5,
                    "max_tokens": 150
                }
                try:
                    async with httpx.AsyncClient(timeout=4.0) as client:
                        res = await client.post(url, headers=headers, json=payload)
                        if res.status_code == 200:
                            data = res.json()
                            content = data["choices"][0]["message"]["content"]
                            clean = cls.sanitize_text(content)
                            if clean and len(clean) > 10:
                                return clean
                except Exception as e:
                    continue

        if settings.OPENAI_API_KEY:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"}
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.5,
                    "max_tokens": 120
                }
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.post(url, headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        content = data["choices"][0]["message"]["content"]
                        return cls.sanitize_text(content)
            except Exception:
                pass

        return cls._generate_fallback_commentary(move_data)

    @classmethod
    def _generate_fallback_commentary(cls, move_data: dict) -> str:
        played = move_data.get("played_move_san", "this move")
        best = move_data.get("best_move_san", "")
        classification = move_data.get("classification", "good")
        moved_color = move_data.get("player_color", "white")
        target_color = move_data.get("target_user_color", moved_color)
        is_user_move = (moved_color == target_color)
        actor = "You" if is_user_move else "Your opponent"

        played_line = " -> ".join(move_data.get("played_line_continuation", [])[:3])
        best_line = " -> ".join(move_data.get("best_line_continuation", [])[:3])

        if classification == "blunder":
            if is_user_move:
                commentary = f"You blundered with {played}, allowing the tactical possibility {played_line} which compromises king safety. Playing {best} would have forced {best_line}, securing an active defense."
            else:
                commentary = f"Your opponent blundered with {played}, opening the tactical possibility {played_line}. Responding with {best} ({best_line}) exploits their weak piece coordination."
        elif classification == "mistake":
            if is_user_move:
                commentary = f"You played {played}, conceding spatial control and allowing {played_line}. The possibility {best_line} following {best} maintained superior central pressure."
            else:
                commentary = f"Your opponent played {played}, handing you positional initiative along {played_line}. Playing {best} locks down central outposts."
        elif classification == "brilliant":
            commentary = f"Brilliant tactical vision! {actor} executed {played}, opening the winning possibility {played_line} that dismantles opponent piece coordination."
        elif classification == "best":
            commentary = f"{actor} played the optimal move {played}, establishing the strong continuation {played_line} to control key central squares."
        else:
            commentary = f"{actor} played {played}, entering the tactical line {played_line} and maintaining positional equilibrium."

        return cls.sanitize_text(commentary)
