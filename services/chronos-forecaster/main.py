from contextlib import asynccontextmanager
from typing import List, Optional
import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

pipeline = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipeline
    print("[chronos] loading amazon/chronos-t5-mini …", flush=True)
    from chronos import ChronosPipeline
    pipeline = ChronosPipeline.from_pretrained(
        "amazon/chronos-t5-mini",
        device_map="cpu",
        torch_dtype=torch.float32,
    )
    print("[chronos] model ready", flush=True)
    yield


app = FastAPI(lifespan=lifespan)


class ForecastRequest(BaseModel):
    rev: List[float]
    net: List[float]
    ord: List[float]
    horizon: int = 1825
    num_samples: int = 20


class Series(BaseModel):
    median: List[float]
    p10: List[float]
    p90: List[float]
    rmse: Optional[float] = None


class ForecastResponse(BaseModel):
    rev: Series
    net: Series
    ord: Series


def _forecast_series(values: List[float], horizon: int, num_samples: int) -> Series:
    ctx = torch.tensor(values, dtype=torch.float32).unsqueeze(0)
    fc = pipeline.predict(ctx, prediction_length=horizon, num_samples=num_samples)
    samples = fc[0].numpy()  # [num_samples, horizon]

    median = np.quantile(samples, 0.5, axis=0).clip(0).tolist()
    p10 = np.quantile(samples, 0.1, axis=0).clip(0).tolist()
    p90 = np.quantile(samples, 0.9, axis=0).clip(0).tolist()

    rmse: Optional[float] = None
    if len(values) >= 60:
        holdout = 30
        train = values[:-holdout]
        actual = np.array(values[-holdout:])
        ctx_train = torch.tensor(train, dtype=torch.float32).unsqueeze(0)
        fc_train = pipeline.predict(ctx_train, prediction_length=holdout, num_samples=num_samples)
        pred = np.quantile(fc_train[0].numpy(), 0.5, axis=0).clip(0)
        rmse = float(np.sqrt(np.mean((actual - pred) ** 2)))

    return Series(median=median, p10=p10, p90=p90, rmse=rmse)


@app.post("/forecast", response_model=ForecastResponse)
def forecast(req: ForecastRequest):
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    horizon = min(req.horizon, 1825)
    return ForecastResponse(
        rev=_forecast_series(req.rev, horizon, req.num_samples),
        net=_forecast_series(req.net, horizon, req.num_samples),
        ord=_forecast_series(req.ord, horizon, req.num_samples),
    )


@app.get("/health")
def health():
    return {"ok": pipeline is not None}
