from pathlib import Path
import whisper

# Load the model once when the server starts
model = whisper.load_model("base")


class SpeechService:
    def transcribe(self, audio_path: str) -> str:
        """
        Transcribe audio using a local Whisper model.
        """

        path = Path(audio_path)

        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        result = model.transcribe(str(path))

        return result["text"].strip()


speech_service = SpeechService()