import base64
import edge_tts

class TTSService:
    # Microsoft Edge Neural Voices: en-US-ChristopherNeural, en-US-GuyNeural, en-US-EricNeural
    DEFAULT_VOICE = "en-US-ChristopherNeural"

    @classmethod
    async def generate_speech_base64(cls, text: str, voice: str = None) -> str:
        if not text:
            return ""

        clean_text = text.replace("*", "").replace("_", "").replace("#", "").strip()
        if not clean_text:
            return ""

        target_voice = voice or cls.DEFAULT_VOICE

        try:
            communicate = edge_tts.Communicate(clean_text, target_voice)
            audio_bytes = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_bytes += chunk["data"]

            if not audio_bytes:
                return ""

            b64_str = base64.b64encode(audio_bytes).decode("utf-8")
            return f"data:audio/mp3;base64,{b64_str}"
        except Exception as e:
            print("Edge-TTS Generation Error:", e)
            return ""
