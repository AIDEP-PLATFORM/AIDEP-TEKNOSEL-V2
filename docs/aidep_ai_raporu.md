# AIDEP — AI Geliştirme Raporu
**Tarih:** 13 Mayıs 2026  
**Hazırlayan:** AIDEP Ekibi  
**Deadline:** 15 Mayıs 2026

---

## 1. Mevcut Durum

| Bileşen | Durum | Notlar |
|---------|-------|--------|
| YOLOv8m modeli | ✅ Mevcut | Eğitilmiş model dosyası hazır |
| YOLOv8 inference API | ❌ Yapılmadı | Sprint 1'de geliştirilecek |
| XGBoost veri seti | ❌ Yapılmadı | Sprint 1'de oluşturulacak |
| XGBoost modeli | ❌ Yapılmadı | Sprint 2'de eğitilecek |
| Enhanced Greedy algoritması | ❌ Yapılmadı | Sprint 2'de geliştirilecek |
| Backend AI entegrasyonu | ❌ Yapılmadı | Sprint 2'de yapılacak |

---

## 2. AI Pipeline Genel Akışı

```
Kullanıcı fotoğraf paylaşır
        ↓
[1] YOLOv8m → Hasar tespiti (7 sınıf)
        ↓
    Çoklu teyit yöntemi
    (3+ fotoğraf → ortalama skor)
        ↓
[2] XGBoost → Talep önceliklendirme (0-100 skor)
    Girdiler: aciliyet, bekleme süresi, mesafe,
              ihtiyaç tipi, meteoroloji, kişi sayısı,
              YOLOv8 hasar skoru
        ↓
[3] Enhanced Greedy → Gönüllü-talep eşleştirme
    + OSRM güvenli rota hesaplama
        ↓
    Gönüllü rotaya yönlendirilir
```

---

## 3. YOLOv8m — Hasar Tespit Modeli

### 3.1 Model Bilgileri
- **Model:** YOLOv8m (medium variant)
- **Görev:** 7 sınıflı nesne tespiti (bounding box)
- **Hedef Performans:** mAP@50 ≥ %85
- **Inference Süresi:** ≤ 200ms / görüntü (CPU)

### 3.2 Tespit Sınıfları

| Sınıf | Açıklama |
|-------|----------|
| `intact_road` | Sağlam, geçilebilir yol |
| `minor_damage` | Hafif hasarlı yol |
| `moderate_damage` | Orta hasarlı yol |
| `severe_damage` | Ağır hasarlı yol |
| `collapsed_building` | Çökmüş bina |
| `blocked_road` | Engellenmiş yol |
| `debris` | Enkaz |

### 3.3 Çoklu Teyit Yöntemi

Tek fotoğrafa güvenmek yerine bir bölgeden 3+ fotoğraf toplanarak güven skoru hesaplanır:

```
final_score = (score1 + score2 + score3) / n
confidence  = 1 - std_deviation(scores)

confidence > 0.7  → Otomatik onay
0.4 < conf < 0.7  → Manuel kontrol
confidence < 0.4  → Red
```

### 3.4 Sprint 1'de Yapılacaklar

**AI-001 — YOLOv8 FastAPI Endpoint'i**
- `POST /ai/detect` endpoint'i yazılacak
- Girdi: görüntü (base64 veya multipart)
- Çıktı: tespit edilen sınıflar, bounding box koordinatları, güven skoru
- Hata yönetimi: desteklenmeyen format, boş görüntü

**AI-002 — MongoDB'ye Sonuç Kaydetme**
- Her inference sonrası şu döküman MongoDB'ye yazılacak:

```json
{
  "image_s3_url": "s3://bucket/photo.jpg",
  "location": { "lat": 41.01, "lng": 28.97 },
  "detections": [
    { "class": "severe_damage", "confidence": 0.89, "bbox": [...] }
  ],
  "damage_score": 78,
  "timestamp": "2026-05-01T10:00:00Z",
  "multi_confirm_count": 1
}
```

---

## 4. XGBoost — Talep Önceliklendirme Modeli

### 4.1 Model Bilgileri
- **Model:** XGBoost Regressor
- **Görev:** Talep öncelik skoru tahmini (0-100)
- **Hedef Performans:** R² ≥ 0.85, MAE < 10
- **Doğrulama:** 5-katlı çapraz doğrulama

### 4.2 Giriş Özellikleri (7 Feature)

| # | Özellik | Kaynak | Aralık | Ağırlık (tahmini) |
|---|---------|--------|--------|-------------------|
| 1 | `urgency_level` | Kullanıcı bildirimi | 1–5 | %25 |
| 2 | `waiting_time` | Sistem (dakika) | 0–∞ | %20 |
| 3 | `distance` | En yakın gönüllü (km) | 0–20 | %10 |
| 4 | `need_type_weight` | Feature engineering | 0–1 | %18 |
| 5 | `weather_score` | MGM API | 0–100 | %5 |
| 6 | `population` | Kullanıcı bildirimi | 1–20 | %7 |
| 7 | `damage_score` | YOLOv8 çıktısı | 0–100 | %15 |

**need_type_weight mapping:**
```
rescue  → 1.0
medical → 0.9
shelter → 0.6
food    → 0.4
other   → 0.3
```

**weather_score hesaplama:**
```
score = 0
yağmur/kar       → +30
rüzgar > 50km/h  → +20
sıcaklık < 5°C   → +10
sıcaklık > 35°C  → +10
```

### 4.3 Veri Seti Stratejisi

**Kaynak 1 — Sentetik Veri:**
- Uzman görüşmelerine dayalı gerçekçi senaryolar
- En az 500 satır üretilecek
- Çeşitli aciliyet/ihtiyaç kombinasyonları

**Kaynak 2 — 6 Şubat 2023 Verisi:**
- Kamuya açık talep verileri retrospektif etiketlenecek
- Gerçek dünya dengesi sağlanacak

**Veri bölünmesi:**
```
Train: %70
Test:  %30
```

### 4.4 Sklearn Pipeline

```python
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('encoder', OneHotEncoder()),   # need_type için
    ('model', XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8
    ))
])
```

**Grid Search parametreleri:**
```
n_estimators:  [100, 200, 300]
max_depth:     [4, 6, 8]
learning_rate: [0.01, 0.1, 0.2]
subsample:     [0.7, 0.8, 1.0]
```

### 4.5 Sprint 1'de Yapılacaklar

**AI-003 — Sentetik Veri Seti Oluştur**
- En az 500 satırlık etiketlenmiş CSV hazırla
- Sınıf dengesi kontrol edilecek
- Train/test bölünmesi yapılacak

**AI-004 — XGBoost Pipeline Tanımla**
- Feature engineering adımları kodlanacak
- Sklearn pipeline kurulacak
- Dummy veriyle uçtan uca test edilecek

---

## 5. Enhanced Greedy — Eşleştirme Algoritması

### 5.1 Genel Bilgi
- **Tür:** Greedy with Multi-Factor Scoring
- **Karmaşıklık:** O(n log n + n×m)
- **Performans:** %95-98 optimal (Hungarian = %100 ama O(n³))
- **Kapasite:** 1000 talep × 200 gönüllü = ~2 saniye

### 5.2 Algoritma Akışı

```
INPUT:
  requests  → XGBoost skorlu, sıralanmış talepler
  volunteers → Müsait gönüllüler listesi

ADIM 1: Talepleri öncelik skoruna göre sırala (azalan)
         → O(n log n)

ADIM 2: Her talep için en uygun gönüllüyü bul
  FOR her talep in sıralı liste:
      en_iyi = find_best_volunteer(talep, müsait_gönüllüler)
      IF en_iyi bulundu:
          eşleştir(talep, en_iyi)
          müsait_gönüllüler.remove(en_iyi)

ADIM 3: Local optimization (opsiyonel)
  Son 10 eşleştirmede swap dene
  Toplam skor artarsa uygula

OUTPUT: eşleştirmeler listesi
```

### 5.3 Gönüllü Uygunluk Kontrolü (Hard Constraints)

```
1. Maksimum yük: current_load < 3 görev/gün
2. Çalışma saatleri: 06:00 – 23:00
3. Beceri uyumu: gönüllü becerileri ⊇ talep gereksinimleri
```

### 5.4 Çok Faktörlü Skor Hesaplama

```
match_score = (
    w1 × priority_score    +   # XGBoost çıktısı
    w2 × (1 - distance)    +   # OSRM mesafesi (normalize)
    w3 × skill_match       +   # Beceri uyumu (0-1)
    w4 × safety_score          # OSRM güvenlik skoru
)

Ağırlıklar (simülasyonla optimize edilecek):
w1 = 0.40  (öncelik)
w2 = 0.25  (mesafe)
w3 = 0.20  (beceri)
w4 = 0.15  (güvenlik)
```

### 5.5 OSRM Entegrasyonu

Enhanced Greedy, OSRM ile çift yönlü çalışır:

```
YOLOv8 hasar tespiti
        ↓
Hasarlı yol segmentleri OSRM'e aktarılır
(yüksek ağırlık → rota hesaplamada elenir)
        ↓
Enhanced Greedy → OSRM'den güvenli mesafe alır
        ↓
Gönüllüye güvenli rota döndürülür
```

### 5.6 Sprint 2'de Yapılacaklar

- Algoritma Python olarak implement edilecek
- OSRM mesafe sorgusu entegre edilecek
- `POST /ai/match` endpoint'i yazılacak
- Edge case testleri: müsait gönüllü yok, tüm talepler aynı öncelik
- Benchmark: Hungarian vs Enhanced Greedy karşılaştırması

---

## 6. Backend AI Entegrasyonu (Sprint 2)

Backend ekibiyle koordineli yürütülecek görevler:

| Görev | AI Tarafı | Backend Tarafı |
|-------|-----------|----------------|
| YOLOv8 endpoint bağlantısı | Endpoint hazır tut | `damage_service.py`'ye çağrı yaz |
| XGBoost endpoint bağlantısı | `POST /ai/prioritize` yaz | `priority_service.py`'ye çağrı yaz |
| Enhanced Greedy tetikleme | Algoritma hazır tut | `matching_service.py`'ye entegre et |
| MongoDB sonuç okuma | Döküman formatı sabitle | Query servisi yaz |

---

## 7. Performans Hedefleri

| Model | Metrik | Hedef |
|-------|--------|-------|
| YOLOv8m | mAP@50 | ≥ %85 |
| YOLOv8m | Inference süresi | ≤ 200ms/görüntü |
| XGBoost | R² Score | ≥ 0.85 |
| XGBoost | MAE | < 10 |
| Enhanced Greedy | 1000 talep × 200 gönüllü | ≤ 2 saniye |
| Enhanced Greedy | Optimale yakınlık | %95-98 |

---

## 8. Sprint Bazlı Görev Özeti

### Sprint 1 (1 – 8 Mayıs)
- [ ] **AI-001** YOLOv8 FastAPI endpoint'i
- [ ] **AI-002** MongoDB'ye sonuç kaydetme
- [ ] **AI-003** XGBoost sentetik veri seti (500+ satır)
- [ ] **AI-004** XGBoost sklearn pipeline tanımı

### Sprint 2 (9 – 15 Mayıs)
- [ ] XGBoost modelini eğit (Grid Search + 5-fold CV)
- [ ] XGBoost `POST /ai/prioritize` endpoint'i
- [ ] Enhanced Greedy algoritmasını implement et
- [ ] OSRM ile güvenli mesafe entegrasyonu
- [ ] `POST /ai/match` endpoint'i
- [ ] Backend ekibiyle AI servislerini entegre et
- [ ] Model metrik raporu (confusion matrix, R², MAE)
