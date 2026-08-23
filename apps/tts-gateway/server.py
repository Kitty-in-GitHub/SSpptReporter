"""
Minimal OpenAI-compatible TTS gateway for SSreporter (Edge-TTS, CPU-only).

Listens on PORT (default 5050). No API key required by default.
"""

from __future__ import annotations

import os
from typing import Literal

import edge_tts
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "5050"))
DEFAULT_VOICE = os.environ.get("DEFAULT_VOICE", "zh-CN-XiaoxiaoNeural")
DEFAULT_MODEL = os.environ.get("DEFAULT_MODEL", "tts-1")

app = FastAPI(title="SSreporter TTS Gateway", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SpeechRequest(BaseModel):
    model: str = DEFAULT_MODEL
    input: str = Field(..., min_length=1, max_length=4096)
    voice: str | None = None
    response_format: Literal["mp3", "opus", "aac", "flac", "wav", "pcm"] = "mp3"
    speed: float = Field(default=1.0, ge=0.25, le=4.0)


def speed_to_rate(speed: float) -> str:
    percent = int(round((speed - 1.0) * 100))
    percent = max(-75, min(100, percent))
    return f"{percent:+d}%"


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "engine": "edge-tts"}


@app.get("/v1/models")
async def list_models() -> dict:
    return {
        "object": "list",
        "data": [
            {"id": "tts-1", "object": "model", "owned_by": "ssreporter"},
            {"id": "tts-1-hd", "object": "model", "owned_by": "ssreporter"},
        ],
    }


@app.post("/v1/audio/speech")
async def create_speech(body: SpeechRequest) -> Response:
    voice = (body.voice or DEFAULT_VOICE).strip()
    rate = speed_to_rate(body.speed)

    audio = bytearray()
    communicate = edge_tts.Communicate(body.input, voice, rate=rate)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])

    if not audio:
        return Response(status_code=500, content="TTS produced no audio")

    # Edge-TTS returns mp3; other response_format values are not transcoded in MVP.
    media_type = "audio/mpeg"
    return Response(content=bytes(audio), media_type=media_type)


def main() -> None:
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT, log_level="info")


if __name__ == "__main__":
    main()
