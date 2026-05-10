# Model Ağırlıkları

Bu klasör model dosyalarını içerir. Dosyalar boyutu nedeniyle `.gitignore`'da tutulur, repoya commit edilmez.

## Beklenen Dosyalar

| Dosya | Boyut (tahmini) | Açıklama |
|---|---|---|
| `yolov8m_damage.pt` | ~52 MB | YOLOv8m hasar tespit modeli (7 sınıf) |
| `xgboost_priority.json` | ~1 MB | XGBoost önceliklendirme modeli (7 özellik → 0–100 skor) |

## Dosyalar Olmadan Ne Olur?

Her iki model da **mock fallback** ile çalışır — dosyalar olmasa bile servis ayağa kalkar ve deterministik sonuçlar üretir. Teknosel demo için bu yeterlidir.

## Eğitilmiş Model Nereden Alınır?

Model dosyaları eğitildikten sonra şu yöntemlerden biriyle servis edilebilir:

**1. S3 / MinIO'dan çek (önerilen CI/CD yöntemi)**
```bash
aws s3 cp s3://aidep-models/yolov8m_damage.pt ai-service/weights/
aws s3 cp s3://aidep-models/xgboost_priority.json ai-service/weights/
```

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
