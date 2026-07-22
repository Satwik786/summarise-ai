from pathlib import Path
import shutil

from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel

from app.services.speech_service import speech_service
from app.services.ai_service import ai_service

router = APIRouter(
    prefix="/meeting",
    tags=["Meeting"]
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


class AnalyzeRequest(BaseModel):
    transcript: str


@router.post("/start")
def start_meeting():
    return {
        "status": "recording",
        "message": "Recording started"
    }


@router.post("/stop")
def stop_meeting():
    return {
        "status": "stopped"
    }


@router.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    try:
        filepath = UPLOAD_DIR / "meeting.webm"

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        transcript = speech_service.transcribe(str(filepath))

        return {
            "success": True,
            "transcript": transcript
        }

    except Exception as e:
        import traceback
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        ai_result = ai_service.analyze_meeting(request.transcript)

        return {
            "success": True,
            **ai_result
        }

    except Exception as e:
        import traceback
        traceback.print_exc()

        return {
            "success": False,
            "summary": "AI analysis is temporarily unavailable. Please try again in a few moments.",
            "discussion_points": [],
            "action_items": [],
            "task_assignments": [],
            "error": str(e),
        }