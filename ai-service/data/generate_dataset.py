"""
AI-003 — XGBoost için sentetik veri seti üretici

Çalıştır:
    python data/generate_dataset.py

Çıktı:
    data/priority_dataset.csv  (2500 satır)

Özellikler (7 adet, PriorityRequest şemasıyla birebir uyumlu):
    urgency_level      int   1-5
    wait_time_minutes  int   0-480
    distance_km        float 0-20
    need_type          int   0=RESCUE,1=MEDICAL,2=SHELTER,3=FOOD,4=OTHER
    meteorology_score  float 0-1
    person_count       int   1-50
    area_damage_score  float 0-1   (YOLOv8 çıktısı)

Hedef değişken:
    priority_score     float 0-100
"""

import random
import csv
from pathlib import Path

random.seed(42)

OUTPUT_PATH = Path(__file__).parent / "priority_dataset.csv"

NEED_TYPE_WEIGHTS = {
    0: 1.0,  # RESCUE
    1: 0.9,  # MEDICAL
    2: 0.6,  # SHELTER
    3: 0.4,  # FOOD
    4: 0.3,  # OTHER
}


def _compute_priority(
    urgency: int,
    wait: int,
    dist: float,
    need_type: int,
    meteo: float,
    persons: int,
    damage: float,
    noise_std: float = 4.0,
) -> float:
    score = (
        (urgency / 5.0)              * 25.0 +
        min(wait / 480.0, 1.0)       * 20.0 +
        max(0.0, 1.0 - dist / 20.0)  * 10.0 +
        NEED_TYPE_WEIGHTS[need_type]  * 18.0 +
        meteo                         *  5.0 +
        min(persons / 50.0, 1.0)      *  7.0 +
        damage                        * 15.0
    )
    noise = random.gauss(0, noise_std)
    return round(min(max(score + noise, 0.0), 100.0), 2)


# ── Senaryo üreticiler ─────────────────────────────────────────────────────────

def _scenario_critical() -> dict:
    """Deprem anı: enkaz altında insan, hava kötü, uzak gönüllü."""
    return dict(
        urgency   = random.choice([4, 5]),
        wait      = random.randint(0, 60),
        dist      = round(random.uniform(5.0, 20.0), 2),
        need_type = random.choice([0, 1]),       # kurtarma veya tıbbi
        meteo     = round(random.uniform(0.5, 1.0), 3),
        persons   = random.randint(3, 50),
        damage    = round(random.uniform(0.7, 1.0), 3),
        noise_std = 3.0,
    )


def _scenario_shelter() -> dict:
    """Barınma ihtiyacı: acil değil ama kalıcı."""
    return dict(
        urgency   = random.choice([2, 3]),
        wait      = random.randint(60, 480),
        dist      = round(random.uniform(1.0, 15.0), 2),
        need_type = 2,                           # barınak
        meteo     = round(random.uniform(0.2, 0.8), 3),
        persons   = random.randint(5, 30),
        damage    = round(random.uniform(0.3, 0.7), 3),
        noise_std = 4.0,
    )


def _scenario_food_water() -> dict:
    """Gıda/su: düşük aciliyet, uzun bekleme."""
    return dict(
        urgency   = random.choice([1, 2, 3]),
        wait      = random.randint(30, 480),
        dist      = round(random.uniform(0.5, 10.0), 2),
        need_type = random.choice([3, 4]),       # gıda veya diğer
        meteo     = round(random.uniform(0.0, 0.5), 3),
        persons   = random.randint(1, 20),
        damage    = round(random.uniform(0.0, 0.5), 3),
        noise_std = 5.0,
    )


def _scenario_nearby_volunteer() -> dict:
    """Yakın gönüllü: mesafe skoru yüksek."""
    return dict(
        urgency   = random.choice([3, 4, 5]),
        wait      = random.randint(0, 120),
        dist      = round(random.uniform(0.1, 3.0), 2),
        need_type = random.choice([0, 1, 2]),
        meteo     = round(random.uniform(0.0, 1.0), 3),
        persons   = random.randint(1, 15),
        damage    = round(random.uniform(0.2, 0.9), 3),
        noise_std = 3.5,
    )


def _scenario_bad_weather() -> dict:
    """Kötü hava koşulları: fırtına/kar, müdahale güçlüğü."""
    return dict(
        urgency   = random.choice([3, 4, 5]),
        wait      = random.randint(10, 200),
        dist      = round(random.uniform(2.0, 18.0), 2),
        need_type = random.choice([0, 1, 2, 3, 4]),
        meteo     = round(random.uniform(0.7, 1.0), 3),
        persons   = random.randint(1, 40),
        damage    = round(random.uniform(0.3, 1.0), 3),
        noise_std = 4.0,
    )


def _scenario_low_priority() -> dict:
    """Düşük öncelikli: sakin durum, gönüllü yakın, hava iyi."""
    return dict(
        urgency   = random.choice([1, 2]),
        wait      = random.randint(0, 60),
        dist      = round(random.uniform(0.1, 5.0), 2),
        need_type = random.choice([3, 4]),
        meteo     = round(random.uniform(0.0, 0.3), 3),
        persons   = random.randint(1, 5),
        damage    = round(random.uniform(0.0, 0.3), 3),
        noise_std = 3.0,
    )


def _scenario_long_wait() -> dict:
    """Uzun bekleme: düşük aciliyet başladı ama bekleyince skoru arttı."""
    return dict(
        urgency   = random.choice([2, 3]),
        wait      = random.randint(240, 480),
        dist      = round(random.uniform(1.0, 12.0), 2),
        need_type = random.choice([1, 2, 3]),
        meteo     = round(random.uniform(0.0, 0.6), 3),
        persons   = random.randint(2, 25),
        damage    = round(random.uniform(0.1, 0.6), 3),
        noise_std = 4.5,
    )


def _scenario_random() -> dict:
    """Tamamen rastgele — model genelleme kapasitesini artırır."""
    return dict(
        urgency   = random.randint(1, 5),
        wait      = random.randint(0, 480),
        dist      = round(random.uniform(0.1, 20.0), 2),
        need_type = random.randint(0, 4),
        meteo     = round(random.uniform(0.0, 1.0), 3),
        persons   = random.randint(1, 50),
        damage    = round(random.uniform(0.0, 1.0), 3),
        noise_std = 5.0,
    )


# ── Senaryo dağılımı (gerçek afet istatistiklerine yakın) ─────────────────────

SCENARIOS = [
    (_scenario_critical,        0.20),  # %20 — kritik
    (_scenario_shelter,         0.15),  # %15 — barınak
    (_scenario_food_water,      0.15),  # %15 — gıda/su
    (_scenario_nearby_volunteer,0.10),  # %10 — yakın gönüllü
    (_scenario_bad_weather,     0.10),  # %10 — kötü hava
    (_scenario_low_priority,    0.10),  # %10 — düşük öncelik
    (_scenario_long_wait,       0.10),  # %10 — uzun bekleme
    (_scenario_random,          0.10),  # %10 — rastgele
]

_scenario_fns   = [s[0] for s in SCENARIOS]
_scenario_probs = [s[1] for s in SCENARIOS]


def _pick_scenario() -> dict:
    fn = random.choices(_scenario_fns, weights=_scenario_probs, k=1)[0]
    return fn()


# ── Üretim ────────────────────────────────────────────────────────────────────

N_ROWS = 2500

HEADER = [
    "urgency_level", "wait_time_minutes", "distance_km",
    "need_type", "meteorology_score", "person_count",
    "area_damage_score", "priority_score",
]


def generate(n_rows: int = N_ROWS) -> None:
    rows = []
    for _ in range(n_rows):
        s = _pick_scenario()
        priority = _compute_priority(
            s["urgency"], s["wait"], s["dist"], s["need_type"],
            s["meteo"], s["persons"], s["damage"], s["noise_std"],
        )
        rows.append([
            s["urgency"], s["wait"], s["dist"], s["need_type"],
            s["meteo"], s["persons"], s["damage"], priority,
        ])

    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(HEADER)
        writer.writerows(rows)

    scores = [r[-1] for r in rows]
    need_counts: dict[int, int] = {}
    for r in rows:
        n = int(r[3])
        need_counts[n] = need_counts.get(n, 0) + 1

    print(f"\n{'='*50}")
    print(f"Veri seti olusturuldu: {OUTPUT_PATH}")
    print(f"{'='*50}")
    print(f"Toplam satir  : {len(rows)}")
    print(f"priority_score: min={min(scores):.1f}  max={max(scores):.1f}  "
          f"ort={sum(scores)/len(scores):.1f}")
    print(f"\nNeed type dagilimi:")
    labels = {0: "RESCUE", 1: "MEDICAL", 2: "SHELTER", 3: "FOOD", 4: "OTHER"}
    for k, v in sorted(need_counts.items()):
        print(f"  {labels[k]:8s}: {v:4d} ({v/n_rows*100:.1f}%)")


if __name__ == "__main__":
    generate()
