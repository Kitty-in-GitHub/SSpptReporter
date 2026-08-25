"""
OpenAI-compatible TTS + optional ASR gateway for SSreporter.

TTS: Edge-TTS (CPU). ASR: Faster-Whisper when installed (optional).
Listens on PORT (default 5050). No API key required by default.
"""

from __future__ import annotations

import os
import tempfile
from typing import Any, Literal

import edge_tts
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "5050"))
DEFAULT_VOICE = os.environ.get("DEFAULT_VOICE", "zh-CN-XiaoxiaoNeural")
DEFAULT_MODEL = os.environ.get("DEFAULT_MODEL", "tts-1")
WHISPER_MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")

app = FastAPI(title="SSreporter Voice Gateway", version="0.2.0")

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

_whisper_model: Any | None = None
_whisper_load_error: str | None = None


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


def whisper_available() -> bool:
    try:
        import faster_whisper  # noqa: F401

        return True
    except ImportError:
        return False


def get_whisper_model() -> Any:
    global _whisper_model, _whisper_load_error
    if _whisper_model is not None:
        return _whisper_model
    if _whisper_load_error is not None:
        raise RuntimeError(_whisper_load_error)

    try:
        from faster_whisper import WhisperModel

        _whisper_model = WhisperModel(
            WHISPER_MODEL_SIZE,
            device="cpu",
            compute_type="int8",
        )
        return _whisper_model
    except Exception as error:  # noqa: BLE001
        _whisper_load_error = str(error)
        raise RuntimeError(_whisper_load_error) from error


@app.get("/health")
async def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "engine": "edge-tts",
        "asr": whisper_available(),
        "whisper_model": WHISPER_MODEL_SIZE if whisper_available() else "",
    }


@app.get("/v1/models")
async def list_models() -> dict:
    data = [
        {"id": "tts-1", "object": "model", "owned_by": "ssreporter"},
        {"id": "tts-1-hd", "object": "model", "owned_by": "ssreporter"},
    ]
    if whisper_available():
        data.append(
            {"id": "whisper-1", "object": "model", "owned_by": "ssreporter"},
        )
    return {"object": "list", "data": data}


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


@app.post("/v1/audio/transcriptions")
async def create_transcription(
    file: UploadFile = File(...),
    model: str = Form(default="whisper-1"),
    language: str = Form(default="zh"),
) -> JSONResponse:
    del model  # OpenAI-compatible field; local size comes from WHISPER_MODEL

    if not whisper_available():
        return JSONResponse(
            status_code=503,
            content={
                "error": {
                    "message": (
                        "本机 ASR 未安装。请运行 npm run setup:asr "
                        "（或 pip install -r apps/tts-gateway/requirements-asr.txt）后重启网关。"
                    ),
                    "type": "asr_not_installed",
                }
            },
        )

    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
    raw = await file.read()
    if not raw:
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "message": "上传音频为空",
                    "type": "invalid_request_error",
                }
            },
        )

    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(raw)
            tmp_path = tmp.name

        whisper = get_whisper_model()
        segments, _info = whisper.transcribe(
            tmp_path,
            language=language or "zh",
            vad_filter=True,
        )
        text = "".join(segment.text for segment in segments).strip()
        return JSONResponse(content={"text": text})
    except Exception as error:  # noqa: BLE001
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "message": f"ASR 转写失败：{error}",
                    "type": "asr_error",
                }
            },
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


def main() -> None:
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT, log_level="info")


if __name__ == "__main__":
    main()
