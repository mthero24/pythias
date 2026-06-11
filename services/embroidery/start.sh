#!/bin/bash
cd "$(dirname "$0")"
exec uvicorn api:app --host 0.0.0.0 --port 8765
