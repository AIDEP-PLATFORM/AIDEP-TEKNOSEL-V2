# ─── OSRM Türkiye Harita Kurulum Scripti ───────────────────────
# Bu script'i AIDEP_YENI klasöründe çalıştırın:
#   PowerShell'i Yönetici olarak aç → cd C:\Users\emrul\Desktop\AIDEP_YENI
#   .\setup-osrm.ps1

$ErrorActionPreference = "Stop"
$dataDir = Join-Path $PSScriptRoot "osrm-data"
$pbfFile = Join-Path $dataDir "turkey-latest.osm.pbf"
$osrmFile = Join-Path $dataDir "turkey-latest.osrm"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  AIDEP - OSRM Kurulum Scripti" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Klasör oluştur
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
    Write-Host "[1/4] osrm-data klasoru olusturuldu." -ForegroundColor Green
} else {
    Write-Host "[1/4] osrm-data klasoru zaten mevcut." -ForegroundColor Yellow
}

# 2. Türkiye PBF indir (eğer yoksa)
if (Test-Path $pbfFile) {
    Write-Host "[2/4] turkey-latest.osm.pbf zaten mevcut, indirme atlaniyor." -ForegroundColor Yellow
} else {
    Write-Host "[2/4] Turkiye harita verisi indiriliyor (~900MB)..." -ForegroundColor Cyan
    Write-Host "      Kaynak: download.geofabrik.de" -ForegroundColor Gray
    $url = "https://download.geofabrik.de/europe/turkey-latest.osm.pbf"

    # wget varsa kullan, yoksa Invoke-WebRequest
    if (Get-Command wget -ErrorAction SilentlyContinue) {
        wget -O $pbfFile $url
    } else {
        $ProgressPreference = 'SilentlyContinue'  # hız icin
        Invoke-WebRequest -Uri $url -OutFile $pbfFile -UseBasicParsing
    }
    Write-Host "[2/4] Indirme tamamlandi." -ForegroundColor Green
}

# 3. OSRM verisi zaten işlenmişse atla
if (Test-Path $osrmFile) {
    Write-Host "[3/4] turkey-latest.osrm zaten mevcut, isleme atlaniyor." -ForegroundColor Yellow
} else {
    Write-Host "[3/4] Harita isleniyor (3 adim, 10-20 dakika surebilir)..." -ForegroundColor Cyan
    Write-Host ""

    Write-Host "  [3a] osrm-extract calisiyor..." -ForegroundColor Gray
    docker run --rm -t -v "${dataDir}:/data" `
        ghcr.io/project-osrm/osrm-backend `
        osrm-extract -p /opt/car.lua /data/turkey-latest.osm.pbf
    Write-Host "  [3a] Extract tamamlandi." -ForegroundColor Green

    Write-Host "  [3b] osrm-partition calisiyor..." -ForegroundColor Gray
    docker run --rm -t -v "${dataDir}:/data" `
        ghcr.io/project-osrm/osrm-backend `
        osrm-partition /data/turkey-latest.osrm
    Write-Host "  [3b] Partition tamamlandi." -ForegroundColor Green

    Write-Host "  [3c] osrm-customize calisiyor..." -ForegroundColor Gray
    docker run --rm -t -v "${dataDir}:/data" `
        ghcr.io/project-osrm/osrm-backend `
        osrm-customize /data/turkey-latest.osrm
    Write-Host "  [3c] Customize tamamlandi." -ForegroundColor Green
}

# 4. OSRM container'ı başlat
Write-Host ""
Write-Host "[4/4] OSRM container baslatiliyor..." -ForegroundColor Cyan
docker compose up -d osrm
Write-Host "[4/4] OSRM container baslatildi." -ForegroundColor Green

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  OSRM hazir! Test etmek icin:" -ForegroundColor Green
Write-Host "  curl http://localhost:5000/health" -ForegroundColor White
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
