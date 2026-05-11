from fastapi import APIRouter

from core.constants import PREDEFINED_SKILLS

router = APIRouter(prefix="/volunteers", tags=["Volunteers"])


@router.get("/skills", response_model=list[str])
async def get_predefined_skills():
    """Gönüllü beceri popup'ı için sabit beceri listesi.
    Frontend bu listeyi checkbox olarak gösterir.
    Kullanıcı 'Diğer' seçeneğiyle serbest metin de ekleyebilir.
    """
    return PREDEFINED_SKILLS
