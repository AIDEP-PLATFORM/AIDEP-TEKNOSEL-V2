FROM python:3.11-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


FROM base AS development

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]


FROM base AS production

RUN addgroup --system aidep && adduser --system --ingroup aidep aidep
USER aidep

COPY . .

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health')"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
