# Model Ağırlıkları

Bu klasör model dosyalarını içerir. Dosyalar boyutu nedeniyle `.gitignore`'da tutulur, repoya commit edilmez.

## Beklenen Dosyalar

| Dosya | Boyut (tahmini) | Açıklama |
|---|---|---|
| `yolov8m_damage.pt` | ~22 MB | YOLOv8s hasar tespit modeli (11 sınıf: bina/yol hasar kategorileri) |
| `xgboost_priority.json` | ~1 MB | XGBoost önceliklendirme modeli (7 özellik → 0–100 skor) |

## Dosyalar Olmadan Ne Olur?

Her iki model da **mock fallback** ile çalışır — dosyalar olmasa bile servis ayağa kalkar ve deterministik sonuçlar üretir. Teknosel demo için bu yeterlidir.

## Eğitilmiş Model Nereden Alınır?

Model dosyaları eğitildikten sonra şu yöntemlerden biriyle servis edilebilir:

**1. MinIO'dan otomatik çek (önerilen — docker-compose başlatınca otomatik yapılır)**

`ai-models` bucket'ındaki dosyalar startup'ta `/tmp/weights/` klasörüne indirilir.
Yerel `weights/` klasöründe dosya varsa ilk başlatmada MinIO'ya otomatik yüklenir.

**2. Docker build sırasında kopyala**
```dockerfile
COPY weights/yolov8m_damage.pt /app/weights/
COPY weights/xgboost_priority.json /app/weights/
```

**3. Geliştirme için manuel kopyala**
```bash
# Takım arkadaşından aldığın dosyaları bu klasöre koy:
# ai-service/weights/yolov8m_damage.pt
# ai-service/weights/xgboost_priority.json
```

## Model Eğitimi

- **YOLOv8m:** `ultralytics` kütüphanesi ile hasar fotoğrafı veri setiyle fine-tune edilir
- **XGBoost:** geçmiş yardım talebi verileriyle (7 özellik) eğitilir, çıktı kaydedilirken `model.save_model("xgboost_priority.json")` kullanılır
