import asyncio

from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from app.services.bot_service import bot_service
from app.services.speech_service import speech_service
from app.services.ai_service import ai_service


router = APIRouter(
    prefix="/bot",
    tags=["bot"]
)


# Latest completed bot meeting result.
# For our current single-user MVP this is enough.
latest_bot_result = None


class JoinMeetingRequest(BaseModel):
    meeting_url: str


# Join Google Meet

@router.post("/join")
async def join_meeting(request: JoinMeetingRequest):
    global latest_bot_result

    try:
        # Clear the previous meeting result
        latest_bot_result = None

        result = await asyncio.to_thread(
            bot_service.open_meeting,
            request.meeting_url
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        print("BOT ERROR:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Unable to open Google Meet"
        )


# Receive bot recording

@router.post("/recording")
async def save_bot_recording(
    file: UploadFile = File(...)
):
    global latest_bot_result

    try:
        # 1. Save recording

        recordings_dir = (
            Path(__file__).resolve().parents[2]
            / "recordings"
        )

        recordings_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        timestamp = datetime.now().strftime(
            "%Y%m%d_%H%M%S"
        )

        file_path = (
            recordings_dir
            / f"meeting_{timestamp}.webm"
        )

        contents = await file.read()

        with open(file_path, "wb") as recording:
            recording.write(contents)

        print("BOT RECORDING SAVED:", file_path)
        print(
            "RECORDING SIZE:",
            len(contents),
            "bytes"
        )


        # 2. Whisper

        print("STARTING TRANSCRIPTION")

        transcript = await asyncio.to_thread(
            speech_service.transcribe,
            str(file_path)
        )

        print("TRANSCRIPTION COMPLETE")
        print("TRANSCRIPT:", transcript)


        # 3. Gemini

        print("STARTING AI ANALYSIS")

        ai_result = await asyncio.to_thread(
            ai_service.analyze_meeting,
            transcript
        )

        print("AI ANALYSIS COMPLETE")


        # 4. Build result

        latest_bot_result = {
            "success": True,

            "filename": file_path.name,
            "size": len(contents),

            "transcript": transcript,

            "summary": ai_result.get(
                "summary",
                ""
            ),

            "discussion_points": ai_result.get(
                "discussion_points",
                []
            ),

            "action_items": ai_result.get(
                "action_items",
                []
            ),

            "task_assignments": ai_result.get(
                "task_assignments",
                []
            ),
        }


        # Extension still receives the result
        return latest_bot_result


    except Exception as error:
        import traceback

        traceback.print_exc()

        print(
            "BOT RECORDING PROCESSING ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# React checks this endpoint for completed results

@router.get("/result")
async def get_bot_result():
    if latest_bot_result is None:
        return {
            "ready": False
        }

    return {
        "ready": True,
        **latest_bot_result
    }