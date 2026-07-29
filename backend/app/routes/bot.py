import asyncio

from datetime import datetime, timedelta
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
last_heartbeat = None

async def recorder_watchdog():

    global recording_started
    global last_heartbeat
    global stop_requested

    while True:

        await asyncio.sleep(5)

        if not recording_started:
            continue

        if last_heartbeat is None:
            continue

        if (
            datetime.now() - last_heartbeat
        ) > timedelta(seconds=15):

            print(
                "RECORDER HEARTBEAT LOST"
            )

            await asyncio.to_thread(
                bot_service.close_bot
            )

            recording_started = False
            stop_requested = False
            last_heartbeat = None

            print(
                "WATCHDOG CLEANUP COMPLETE"
            )


# Request models

class JoinMeetingRequest(BaseModel):
    meeting_url: str

class AnalyzeRecordingRequest(BaseModel):
    filename: str


# Join Google Meet

@router.post("/join")
async def join_meeting(request: JoinMeetingRequest):
    global latest_bot_result
    global stop_requested
    global recording_started
    global last_heartbeat

    try:
        # Clear state from previous meeting
        latest_bot_result = None
        stop_requested = False
        recording_started = False
        last_heartbeat = None

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
    global last_heartbeat

    recording_started = True

    last_heartbeat = datetime.now()

    print(
        "RECORDING STARTED"
    )

    return {
        "success": True
    }

# Recorder heartbeat

@router.post("/heartbeat")
async def recorder_heartbeat():
    global last_heartbeat

    last_heartbeat = datetime.now()

    print(
        "RECORDER HEARTBEAT"
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
    global last_heartbeat
    global stop_requested

    # Recording successfully reached backend.
    # Stop watchdog monitoring while processing the file.
    recording_started = False
    last_heartbeat = None
    stop_requested = False


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

        try:

            ai_result = await asyncio.to_thread(
                ai_service.analyze_meeting,
                transcript
            )

            print("AI ANALYSIS COMPLETE")

            ai_success = True

        except Exception as error:

            print(
                "AI ANALYSIS FAILED:",
                repr(error)
            )

            ai_success = False

            ai_result = {
                "summary": (
                    "AI analysis is temporarily unavailable. "
                    "Please try again."
                ),
                "discussion_points": [],
                "action_items": [],
                "task_assignments": [],
            }


        # 4. Build frontend result

        latest_bot_result = {
            "success": ai_success,

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

        recording_started = False
        last_heartbeat = None
        stop_requested = False

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

# List saved bot recordings

@router.get("/recordings")
async def get_saved_recordings():

    recordings_dir = (
        Path(__file__).resolve().parents[2]
        / "recordings"
    )

    if not recordings_dir.exists():
        return {
            "recordings": []
        }

    recordings = []

    for file_path in recordings_dir.glob("*.webm"):

        file_stats = file_path.stat()

        recordings.append({
            "filename": file_path.name,
            "size": file_stats.st_size,
            "created_at": datetime.fromtimestamp(
                file_stats.st_mtime
            ).isoformat(),
        })

    recordings.sort(
        key=lambda recording: recording["created_at"],
        reverse=True
    )

    return {
        "recordings": recordings
    }

# Analyze a saved bot recording

@router.post("/recordings/analyze")
async def analyze_saved_recording(
    request: AnalyzeRecordingRequest
):
    try:
        recordings_dir = (
            Path(__file__).resolve().parents[2]
            / "recordings"
        )

        # Only allow a filename, not an arbitrary path
        filename = Path(request.filename).name

        if filename != request.filename:
            raise HTTPException(
                status_code=400,
                detail="Invalid recording filename."
            )

        file_path = (
            recordings_dir
            / filename
        )

        if (
            not file_path.exists()
            or not file_path.is_file()
            or file_path.suffix.lower() != ".webm"
        ):
            raise HTTPException(
                status_code=404,
                detail="Recording not found."
            )

        print(
            "ANALYZING SAVED RECORDING:",
            file_path.name
        )

        # Transcribe saved recording

        print(
            "STARTING SAVED RECORDING TRANSCRIPTION"
        )

        transcript = await asyncio.to_thread(
            speech_service.transcribe,
            str(file_path)
        )

        print(
            "SAVED RECORDING TRANSCRIPTION COMPLETE"
        )

        print(
            "TRANSCRIPT:",
            transcript
        )

        # Analyze transcript with Gemini

        print(
            "STARTING SAVED RECORDING AI ANALYSIS"
        )

        try:
            ai_result = await asyncio.to_thread(
                ai_service.analyze_meeting,
                transcript
            )

            ai_success = True

            print(
                "SAVED RECORDING AI ANALYSIS COMPLETE"
            )

        except Exception as error:
            print(
                "SAVED RECORDING AI ANALYSIS FAILED:",
                repr(error)
            )

            ai_success = False

            ai_result = {
                "summary": (
                    "AI analysis is temporarily unavailable. "
                    "Please try again."
                ),
                "discussion_points": [],
                "action_items": [],
                "task_assignments": [],
            }

        return {
            "success": ai_success,
            "filename": file_path.name,
            "size": file_path.stat().st_size,
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

    except HTTPException:
        raise

    except Exception as error:
        import traceback

        traceback.print_exc()

        print(
            "SAVED RECORDING PROCESSING ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

# Frontend requests recording stop

@router.post("/stop")
async def stop_bot():
    global stop_requested
    global recording_started
    global last_heartbeat

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
        last_heartbeat = None

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