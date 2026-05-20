from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional
import numpy as np
import pandas as pd
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

pipeline = None
executor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipeline, executor
    print("[chronos] loading amazon/chronos-t5-mini …", flush=True)
    from chronos import ChronosPipeline
    pipeline = ChronosPipeline.from_pretrained(
        "amazon/chronos-t5-mini",
        device_map="cpu",
        dtype=torch.float32,
    )
    executor = ThreadPoolExecutor(max_workers=2)
    print("[chronos] model ready", flush=True)
    yield
    executor.shutdown(wait=False)


app = FastAPI(lifespan=lifespan)


class ForecastRequest(BaseModel):
    dates: List[str]
    rev: List[float]
    net: List[float]
    ord: List[float]
    horizon: int = 1825
    num_samples: int = 20


class ChronosSeries(BaseModel):
    median: List[float]
    p10: List[float]
    p90: List[float]
    rmse: Optional[float] = None


class ProphetSeries(BaseModel):
    forecast: List[float]
    lower: List[float]
    upper: List[float]
    rmse: Optional[float] = None


class ForecastResponse(BaseModel):
    rev: ChronosSeries
    net: ChronosSeries
    ord: ChronosSeries
    prophet_rev: Optional[ProphetSeries] = None
    prophet_net: Optional[ProphetSeries] = None
    prophet_ord: Optional[ProphetSeries] = None


def _chronos_series(values: List[float], horizon: int, num_samples: int) -> ChronosSeries:
    ctx = torch.tensor(values, dtype=torch.float32).unsqueeze(0)
    fc = pipeline.predict(ctx, prediction_length=horizon, num_samples=num_samples)
    samples = fc[0].numpy()

    median = np.quantile(samples, 0.5, axis=0).clip(0).tolist()
    p10    = np.quantile(samples, 0.1, axis=0).clip(0).tolist()
    p90    = np.quantile(samples, 0.9, axis=0).clip(0).tolist()

    rmse: Optional[float] = None
    if len(values) >= 60:
        holdout = 30
        actual = np.array(values[-holdout:])
        ctx_train = torch.tensor(values[:-holdout], dtype=torch.float32).unsqueeze(0)
        fc_train = pipeline.predict(ctx_train, prediction_length=holdout, num_samples=num_samples)
        pred = np.quantile(fc_train[0].numpy(), 0.5, axis=0).clip(0)
        rmse = float(np.sqrt(np.mean((actual - pred) ** 2)))

    return ChronosSeries(median=median, p10=p10, p90=p90, rmse=rmse)


def _prophet_series(dates: List[str], values: List[float], horizon: int) -> ProphetSeries:
    from prophet import Prophet

    df = pd.DataFrame({
        "ds": pd.to_datetime(dates),
        "y":  [max(0.0, v) for v in values],
    })

    m = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode="additive",
        changepoint_prior_scale=0.05,
        interval_width=0.8,
    )
    m.fit(df)

    future = m.make_future_dataframe(periods=horizon, freq="D")
    fc = m.predict(future).tail(horizon)

    point = fc["yhat"].clip(0).tolist()
    lower = fc["yhat_lower"].clip(0).tolist()
    upper = fc["yhat_upper"].clip(0).tolist()

    rmse: Optional[float] = None
    if len(values) >= 60:
        holdout = 30
        actual = np.array(values[-holdout:])
        m2 = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            seasonality_mode="additive",
            changepoint_prior_scale=0.05,
        )
        m2.fit(df.iloc[:-holdout].copy())
        fc2 = m2.predict(m2.make_future_dataframe(periods=holdout, freq="D")).tail(holdout)
        rmse = float(np.sqrt(np.mean((actual - fc2["yhat"].clip(0).values) ** 2)))

    return ProphetSeries(forecast=point, lower=lower, upper=upper, rmse=rmse)


@app.post("/forecast", response_model=ForecastResponse)
def forecast(req: ForecastRequest):
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    horizon = min(req.horizon, 1825)

    def run_chronos():
        return (
            _chronos_series(req.rev, horizon, req.num_samples),
            _chronos_series(req.net, horizon, req.num_samples),
            _chronos_series(req.ord, horizon, req.num_samples),
        )

    def run_prophet():
        try:
            return (
                _prophet_series(req.dates, req.rev, horizon),
                _prophet_series(req.dates, req.net, horizon),
                _prophet_series(req.dates, req.ord, horizon),
            )
        except Exception as e:
            print(f"[prophet] failed: {e}", flush=True)
            return None

    fut_c = executor.submit(run_chronos)
    fut_p = executor.submit(run_prophet)
    c_rev, c_net, c_ord = fut_c.result()
    prophet = fut_p.result()

    resp = ForecastResponse(rev=c_rev, net=c_net, ord=c_ord)
    if prophet:
        resp.prophet_rev, resp.prophet_net, resp.prophet_ord = prophet
    return resp


@app.get("/health")
def health():
    return {"ok": pipeline is not None}
