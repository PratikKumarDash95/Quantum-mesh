"""QuantumMesh AI Engine.

FastAPI service that:
  - Ingests historical traffic samples
  - Predicts near-future load per service using a sliding-window
    linear regression model (cheap, deterministic, replaceable with
    LSTM/Prophet later)
  - Recommends load-balancer weights for downstream gateway routing
"""

from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Dict, List
import numpy as np
from sklearn.linear_model import LinearRegression
from collections import defaultdict, deque
from datetime import datetime
import threading

app = FastAPI(
    title="QuantumMesh AI Engine",
    version="1.0.0",
    description="Traffic prediction and adaptive routing for QuantumMesh.",
)


class TrafficPoint(BaseModel):
    service: str
    timestamp: datetime
    requests_per_second: float
    cpu_percent: float = 0.0
    latency_ms: float = 0.0


class PredictionRequest(BaseModel):
    service: str
    horizon_seconds: int = Field(default=60, ge=5, le=3600)


class PredictionResponse(BaseModel):
    service: str
    predicted_rps: float
    confidence: float
    horizon_seconds: int


class WeightRecommendation(BaseModel):
    service: str
    weights: Dict[str, float]


WINDOW = 120
_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=WINDOW))
_lock = threading.Lock()


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "UP", "service": "ai-engine"}


@app.post("/api/ai/ingest")
def ingest(point: TrafficPoint) -> Dict[str, str]:
    with _lock:
        _history[point.service].append(point)
    return {"status": "accepted"}


@app.post("/api/ai/ingest/batch")
def ingest_batch(points: List[TrafficPoint]) -> Dict[str, int]:
    with _lock:
        for p in points:
            _history[p.service].append(p)
    return {"ingested": len(points)}


@app.post("/api/ai/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest) -> PredictionResponse:
    with _lock:
        series = list(_history.get(req.service, []))

    if len(series) < 5:
        return PredictionResponse(
            service=req.service,
            predicted_rps=0.0,
            confidence=0.0,
            horizon_seconds=req.horizon_seconds,
        )

    timestamps = np.array(
        [p.timestamp.timestamp() for p in series], dtype=np.float64
    ).reshape(-1, 1)
    rps = np.array([p.requests_per_second for p in series], dtype=np.float64)

    model = LinearRegression()
    model.fit(timestamps, rps)

    future_t = timestamps[-1, 0] + req.horizon_seconds
    predicted = float(model.predict(np.array([[future_t]]))[0])
    predicted = max(0.0, predicted)

    confidence = float(model.score(timestamps, rps))
    confidence = max(0.0, min(1.0, confidence))

    return PredictionResponse(
        service=req.service,
        predicted_rps=round(predicted, 2),
        confidence=round(confidence, 3),
        horizon_seconds=req.horizon_seconds,
    )


@app.get("/api/ai/recommend/{service}", response_model=WeightRecommendation)
def recommend(service: str) -> WeightRecommendation:
    """Return per-instance weights based on inverse predicted CPU usage."""
    with _lock:
        series = list(_history.get(service, []))

    if not series:
        return WeightRecommendation(service=service, weights={})

    by_instance: Dict[str, List[float]] = defaultdict(list)
    for p in series[-30:]:
        by_instance.setdefault(p.service, []).append(p.cpu_percent)

    weights: Dict[str, float] = {}
    for instance, cpus in by_instance.items():
        avg_cpu = sum(cpus) / len(cpus) if cpus else 0.0
        weights[instance] = round(1.0 / (1.0 + avg_cpu / 100.0), 4)

    return WeightRecommendation(service=service, weights=weights)


@app.get("/api/ai/services")
def services() -> Dict[str, int]:
    with _lock:
        return {svc: len(points) for svc, points in _history.items()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
