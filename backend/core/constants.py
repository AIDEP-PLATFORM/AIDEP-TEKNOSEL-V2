from models.user import UserRole

# ─── Web Girişine İzin Verilen Roller ──────────────────────────
# Sadece bu roller web paneline giriş yapabilir.
# NGO_STAFF ve OFFICIAL_STAFF sadece mobil uygulamayı kullanır.

WEB_ALLOWED_ROLES: set[UserRole] = {
    UserRole.NGO_MANAGER,
    UserRole.OFFICIAL_MANAGER,
    UserRole.ADMIN,
}

# ─── Sabit Beceri Listesi (Gönüllü popup) ──────────────────────

PREDEFINED_SKILLS: list[str] = [
    "İlk Yardım",
    "Enkaz Arama ve Kurtarma",
    "Araç Kullanımı",
    "Tıbbi Destek",
    "Psikolojik Destek",
    "Lojistik",
    "İletişim / Haberleşme",
    "Su ve Sanitasyon",
    "Arama Köpeği Yönetimi",
    "Yangın Söndürme",
]

# ─── Sabit Faaliyet Alanları (STK/Resmi kurum) ─────────────────

PREDEFINED_ACTIVITY_AREAS: list[str] = [
    "Arama ve Kurtarma",
    "Sağlık ve Tıbbi Yardım",
    "Lojistik ve İkmal",
    "Psikososyal Destek",
    "Barınma",
    "Su ve Sanitasyon",
    "İletişim ve Koordinasyon",
]
