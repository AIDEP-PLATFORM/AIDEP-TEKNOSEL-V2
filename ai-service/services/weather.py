"""
Hava durumu servisi — Open-Meteo API

meteorology_score hesaplama:
    yağmur / kar      → +0.30
    rüzgar > 50 km/h  → +0.20
    sıcaklık < 5°C    → +0.10
    sıcaklık > 35°C   → +0.10
    ─────────────────────────
    max ham skor       → 0.70  → normalize: 0-1

API başarısız olursa 0.0 döner (sistemi durdurmaz).
"""

import logging

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

_RAIN_CODES = set(range(51, 68)) | set(range(80, 100))
_SNOW_CODES = set(range(71, 78))
_MAX_RAW    = 0.70


async def _fetch_weather(latitude: float, longitude: float) -> dict:
    """Ham Open-Meteo verisini çeker. Hata olursa exception fırlatır."""
    params = {
        "latitude":       latitude,
        "longitude":      longitude,
        "current":        "temperature_2m,precipitation,windspeed_10m,weathercode",
        "windspeed_unit": "kmh",
        "timezone":       "auto",
    }
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(settings.WEATHER_API_URL, params=params)
        resp.raise_for_status()
        return resp.json()["current"]


def _compute_score(temperature: float, wind_speed: float,
                   precipitation: float, weather_code: int) -> float:
    raw = 0.0
    if precipitation > 0 or weather_code in _RAIN_CODES or weather_code in _SNOW_CODES:
        raw += 0.30
    if wind_speed > 50:
        raw += 0.20
    if temperature < 5:
        raw += 0.10
    if temperature > 35:
        raw += 0.10
    return round(min(raw, _MAX_RAW) / _MAX_RAW, 4)


async def get_meteorology_score(latitude: float, longitude: float) -> float:
    """0-1 arası meteorology_score döner. Hata olursa 0.0."""
    try:
        c = await _fetch_weather(latitude, longitude)
        score = _compute_score(
            float(c["temperature_2m"]),
            float(c["windspeed_10m"]),
            float(c["precipitation"]),
            int(c["weathercode"]),
        )
        logger.info(
            "Hava | lat=%.3f lon=%.3f temp=%.1f°C wind=%.1fkm/h "
            "precip=%.1fmm code=%d → score=%.3f",
            latitude, longitude,
            float(c["temperature_2m"]), float(c["windspeed_10m"]),
            float(c["precipitation"]), int(c["weathercode"]), score,
        )
        return score
    except Exception as exc:
        logger.warning("Hava durumu alinamadi (varsayilan 0.0): %s", exc)
        return 0.0


async def get_weather_detail(latitude: float, longitude: float) -> dict:
    """Ham hava verisi + meteorology_score döner (endpoint için)."""
    try:
        c = await _fetch_weather(latitude, longitude)
        temperature   = float(c["temperature_2m"])
        wind_speed    = float(c["windspeed_10m"])
        precipitation = float(c["precipitation"])
        weather_code  = int(c["weathercode"])
        score = _compute_score(temperature, wind_speed, precipitation, weather_code)
        return {
            "latitude":          latitude,
            "longitude":         longitude,
            "temperature_c":     temperature,
            "wind_speed_kmh":    wind_speed,
            "precipitation_mm":  precipitation,
            "weather_code":      weather_code,
            "meteorology_score": score,
            "source":            "open-meteo",
        }
    except Exception as exc:
        logger.warning("Hava durumu detayi alinamadi: %s", exc)
        return {
            "latitude":          latitude,
            "longitude":         longitude,
            "meteorology_score": 0.0,
            "source":            "fallback",
            "error":             str(exc),
        }
