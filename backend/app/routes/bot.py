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


# In-memory MVP state

latest_bot_result = None
stop_requested = False
recording_started = False


# Request models

class JoinMeetingRequest(BaseModel):
    meeting_url: str


# Join Google Meet

@router.post("/join")
async def join_meeting(request: JoinMeetingRequest):
    global latest_bot_result
    global stop_requested
    global recording_started

    try:
        # Clear state from previous meeting
        latest_bot_result = None
        stop_requested = False

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
        print(
            "BOT ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to open Google Meet"
        )

# Recorder notifies backend that recording has started

@router.post("/recording-started")
async def recording_started_endpoint():
    global recording_started

    recording_started = True

    print(
        "RECORDING STARTED"
    )

    return {
        "success": True
    }

# Receive and process bot recording

@router.post("/recording")
async def save_bot_recording(
    file: UploadFile = File(...)
):
    global latest_bot_result
    global recording_started

    print("AI ANALYSIS COMPLETE")

    try:
        # 1. Save recording

        recordings_dir = (
            Path(__file__).resolve().parents[2]
            / "recordings"
        )

        recordings_dir.mkdir(
            parents=True,
            exist_ok=True
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

        print(
            "BOT RECORDING SAVED:",
            file_path
        )

        print(
            "RECORDING SIZE:",
            len(contents),
            "bytes"
        )


        # 2. Whisper transcription

        print("STARTING TRANSCRIPTION")

        transcript = await asyncio.to_thread(
            speech_service.transcribe,
            str(file_path)
        )

        print("TRANSCRIPTION COMPLETE")

        print(
            "TRANSCRIPT:",
            transcript
        )


        # 3. Gemini analysis

        print("STARTING AI ANALYSIS")

        ai_result = await asyncio.to_thread(
            ai_service.analyze_meeting,
            transcript
        )

        print("AI ANALYSIS COMPLETE")


        # 4. Build frontend result

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

         # 5. Close completed bot session

        print(
            "MEETING PROCESSING COMPLETE"
        )

        await asyncio.to_thread(
            bot_service.close_bot
        )


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
            detail=str(error)
        )


# Frontend polls for completed result

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


# Frontend requests recording stop

@router.post("/stop")
async def stop_bot():
    global stop_requested
    global recording_started

    # No recorder was ever started
    if not recording_started:

        print(
            "STOP REQUESTED BEFORE RECORDING STARTED"
        )

        await asyncio.to_thread(
            bot_service.close_bot
        )

        recording_started = False
        stop_requested = False

        raise HTTPException(
            status_code=400,
            detail="Recording was never started."
        )

    stop_requested = True

    print("BOT STOP REQUESTED")

    return {
        "success": True,
        "message": "Recording stop requested"
    }


# Recorder polls for stop request

@router.get("/stop-status")
async def get_stop_status():
    global stop_requested

    if stop_requested:
        stop_requested = False

        print(
            "RECORDER RECEIVED STOP REQUEST"
        )

        return {
            "stop": True
        }

    return {
        "stop": False
    }


# Reset stop state

@router.post("/reset-stop")
async def reset_stop():
    global stop_requested

    stop_requested = False

    return {
        "success": True
    }