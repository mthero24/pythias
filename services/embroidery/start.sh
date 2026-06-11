#!/bin/bash
cd "$(dirname "$0")"
exec venv/bin/uvicorn api:app --host 0.0.0.0 --port 8765
