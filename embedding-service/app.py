import logging
import os
from typing import Any, Dict, List, Optional

from fastapi import Body, FastAPI, HTTPException, Request
from pydantic import BaseModel, model_validator
from sentence_transformers import SentenceTransformer


logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("embedding-service")

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
MAX_TEXT_CHARS = int(os.getenv("MAX_TEXT_CHARS", "10000"))
DEFAULT_BATCH_SIZE = int(os.getenv("EMBEDDING_BATCH_SIZE", "32"))

app = FastAPI(title="RecruitJobIT Embedding Service", version="1.0.0")
model: Optional[SentenceTransformer] = None
vector_size: int = 0


class EmbedRequest(BaseModel):
    text: Optional[str] = None
    texts: Optional[List[str]] = None

    @model_validator(mode="after")
    def validate_payload(self) -> "EmbedRequest":
        has_text = self.text is not None
        has_texts = self.texts is not None and len(self.texts) > 0
        if has_text == has_texts:
            raise ValueError("Payload phải có đúng một trường: text hoặc texts")
        return self


def truncate_text(text: str) -> str:
    if text is None:
        return " "
    normalized = text.strip()
    if normalized == "":
        return " "
    if len(normalized) <= MAX_TEXT_CHARS:
        return normalized
    return normalized[:MAX_TEXT_CHARS]


@app.on_event("startup")
def on_startup() -> None:
    global model, vector_size
    logger.info("Loading embedding model: %s", MODEL_NAME)
    model = SentenceTransformer(MODEL_NAME)
    vector_size = model.get_sentence_embedding_dimension()
    logger.info("Model loaded. vector_size=%s", vector_size)


@app.get("/health")
def health() -> dict:
    if model is None:
        raise HTTPException(status_code=503, detail="Model chưa sẵn sàng")
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "vectorSize": vector_size,
    }


@app.post("/embed")
async def embed(request: Request) -> dict:
    if model is None:
        raise HTTPException(status_code=503, detail="Model chưa sẵn sàng")

    try:
        # FastAPI/Pydantic can return 422 before hitting handler if body is empty/invalid JSON.
        # We parse raw request body ourselves and fallback to a safe default.
        payload: Dict[str, Any] = {}
        try:
            payload = await request.json()
            if payload is None:
                payload = {}
            if not isinstance(payload, dict):
                payload = {}
        except Exception:
            payload = {}

        req = EmbedRequest(**payload) if payload else EmbedRequest(text=" ")

        if req.text is not None:
            input_text = truncate_text(req.text)
            vector = model.encode(
                input_text,
                normalize_embeddings=True,
                convert_to_numpy=True,
                show_progress_bar=False,
            )
            return {
                "vector": vector.astype("float32").tolist(),
                "dimensions": vector_size,
            }

        input_texts = [truncate_text(item) for item in (req.texts or [])]
        vectors = model.encode(
            input_texts,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
            batch_size=max(DEFAULT_BATCH_SIZE, 1),
        )
        return {
            "vectors": vectors.astype("float32").tolist(),
            "dimensions": vector_size,
        }
    except Exception as ex:  # pragma: no cover
        logger.exception("Embedding failed")
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(ex)}")
