from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.meeting import router as meeting_router

from app.routes.bot import router as bot_router

app = FastAPI(title="SummaRise API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meeting_router)

app.include_router(bot_router)


@app.get("/")
def root():
    return {
        "message": "SummaRise API Running"
    }