"""
YOLO modelinin açıklama (description) metninden bağımsız çalıştığını kanıtlayan test.

Çalıştır:
    cd ai-service
    python tests/test_yolo_description_independence.py
"""
import ast
import inspect
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_ROOT = os.path.normpath(os.path.join(ROOT, "..", "backend"))


def _read(rel_path: str) -> str:
    with open(os.path.join(ROOT, rel_path), encoding="utf-8") as f:
        return f.read()


def _read_backend(rel_path: str) -> str:
    with open(os.path.join(BACKEND_ROOT, rel_path), encoding="utf-8") as f:
        return f.read()


def _get_function_source(source: str, func_name: str) -> str | None:
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == func_name:
            return ast.unparse(node)
    return None


# ── Test 1: predict_sync imzası description parametresi almıyor ───────────────

def test_predict_sync_signature():
    """predict_sync fonksiyon imzasında yalnızca 'image_bytes' olmalı."""
    source = _read("models/yolo_model.py")
    tree = ast.parse(source)

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == "predict_sync":
            params = [arg.arg for arg in node.args.args]
            assert "description" not in params, (
                f"predict_sync 'description' parametresi içeriyor: {params}"
            )
            assert params == ["image_bytes"], (
                f"predict_sync yalnızca ['image_bytes'] almalı, bulundu: {params}"
            )
            print(f"✓ predict_sync({', '.join(params)}) — açıklama parametresi YOK")
            return

    raise AssertionError("predict_sync fonksiyonu models/yolo_model.py içinde bulunamadı")


# ── Test 2: analyze_photo description parametresi almıyor ────────────────────

def test_analyze_photo_signature():
    """analyze_photo fonksiyonu description parametresi içermemeli."""
    source = _read("services/damage_detection.py")
    tree = ast.parse(source)

    for node in ast.walk(tree):
        if isinstance(node, ast.AsyncFunctionDef) and node.name == "analyze_photo":
            params = [arg.arg for arg in node.args.args]
            assert "description" not in params, (
                f"analyze_photo 'description' parametresi içeriyor: {params}"
            )
            print(f"✓ analyze_photo({', '.join(params)}) — açıklama parametresi YOK")
            return

    raise AssertionError("analyze_photo fonksiyonu services/damage_detection.py içinde bulunamadı")


# ── Test 3: AI service endpoint şemasında description yok ────────────────────

def test_damage_detection_request_schema():
    """DamageDetectionRequest şemasında description alanı bulunmamalı."""
    source = _read("schemas/damage.py")
    tree = ast.parse(source)

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == "DamageDetectionRequest":
            field_names = []
            for item in node.body:
                if isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
                    field_names.append(item.target.id)
            assert "description" not in field_names, (
                f"DamageDetectionRequest 'description' alanı içeriyor: {field_names}"
            )
            print(f"✓ DamageDetectionRequest alanları: {field_names} — description YOK")
            return

    raise AssertionError("DamageDetectionRequest sınıfı schemas/damage.py içinde bulunamadı")


# ── Test 4: Backend proxy description iletmiyor ───────────────────────────────

def test_backend_proxy_no_description():
    """backend/routers/ai.py analyze_damage fonksiyonu description kabul etmemeli ve iletmemeli."""
    source = _read_backend("routers/ai.py")
    func_src = _get_function_source(source, "analyze_damage")

    assert func_src is not None, "analyze_damage fonksiyonu backend/routers/ai.py içinde bulunamadı"

    # Parametre listesini kontrol et
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if isinstance(node, ast.AsyncFunctionDef) and node.name == "analyze_damage":
            params = [arg.arg for arg in node.args.args]
            assert "description" not in params, (
                f"backend analyze_damage 'description' parametresi içeriyor: {params}"
            )
            print(f"✓ backend analyze_damage({', '.join(params)}) — description parametresi YOK")

    # form_data veya data dict'inde "description" key'i var mı?
    assert '"description"' not in func_src and "'description'" not in func_src, (
        "backend analyze_damage AI servisine 'description' gönderiyor!\n"
        f"Fonksiyon:\n{func_src[:600]}"
    )
    print("✓ backend analyze_damage AI servisine description iletmiyor")


# ── Test 5: Mobile AI service description gönderiyor mu? ─────────────────────

def test_mobile_ai_service_no_description():
    """mobile/services/ai.service.ts analyzeDamage fonksiyonu description göndermemeli."""
    mobile_path = os.path.normpath(
        os.path.join(ROOT, "..", "mobile", "services", "ai.service.ts")
    )
    assert os.path.exists(mobile_path), f"mobile/services/ai.service.ts bulunamadı: {mobile_path}"

    with open(mobile_path, encoding="utf-8") as f:
        source = f.read()

    # analyzeDamage fonksiyonunu bul
    start = source.find("analyzeDamage")
    assert start != -1, "analyzeDamage fonksiyonu bulunamadı"
    end = source.find("\n  },", start)
    func_src = source[start:end]

    assert "description" not in func_src, (
        "mobile analyzeDamage fonksiyonu 'description' içeriyor!\n"
        f"Fonksiyon:\n{func_src}"
    )
    print("✓ mobile analyzeDamage — formData'ya description eklemiyor")

    # formData.append çağrılarını listele
    appends = [line.strip() for line in func_src.splitlines() if "formData.append" in line]
    print(f"  FormData'ya gönderilen alanlar:")
    for a in appends:
        print(f"    {a}")


# ── Test 6: photo_service.py description gönderiyor mu? ──────────────────────

def test_photo_service_no_description():
    """backend/services/photo_service.py AI servis çağrısında description göndermemeli."""
    source = _read_backend("services/photo_service.py")
    func_src = _get_function_source(source, "upload_damage_photo")

    assert func_src is not None, "upload_damage_photo fonksiyonu bulunamadı"

    # form_data dict'inde description var mı?
    lines = [l.strip() for l in func_src.splitlines() if "form_data" in l and "description" in l]
    assert len(lines) == 0, (
        f"photo_service form_data'ya description ekliyor:\n" + "\n".join(lines)
    )
    print("✓ photo_service form_data — description içermiyor")

    # form_data'nın gerçekte ne içerdiğini göster
    form_lines = [l.strip() for l in func_src.splitlines() if "form_data" in l and ("=" in l or '"' in l)]
    print(f"  photo_service AI'a gönderdiği alanlar:")
    for l in form_lines[:6]:
        print(f"    {l}")


# ── Çalıştırıcı ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 62)
    print("  YOLO Açıklama Bağımsızlık Testi  ")
    print("  Açıklama metni YOLO sonucunu etkiler mi?")
    print("=" * 62)

    tests = [
        ("1. yolo_model.predict_sync imzası",        test_predict_sync_signature),
        ("2. damage_detection.analyze_photo imzası", test_analyze_photo_signature),
        ("3. AI şema: DamageDetectionRequest",       test_damage_detection_request_schema),
        ("4. Backend proxy: description iletmiyor",  test_backend_proxy_no_description),
        ("5. Mobile: analyzeDamage description yok", test_mobile_ai_service_no_description),
        ("6. photo_service: form_data temiz",        test_photo_service_no_description),
    ]

    passed = failed = 0
    for name, fn in tests:
        print(f"\n── {name}")
        try:
            fn()
            passed += 1
        except AssertionError as e:
            print(f"  ✗ BAŞARISIZ: {e}")
            failed += 1
        except Exception as e:
            print(f"  ✗ HATA: {type(e).__name__}: {e}")
            failed += 1

    print()
    print("=" * 62)
    if failed == 0:
        print(f"✓ Tüm {passed} test geçti")
        print()
        print("  SONUÇ: Açıklama metni YOLO pipeline'ına hiçbir")
        print("  noktada girmiyor. Görüntü → AI akışı tamamen")
        print("  görsel — metin etkisi SIFIR.")
    else:
        print(f"✗ {failed} test başarısız, {passed} geçti")
    print("=" * 62)

    sys.exit(0 if failed == 0 else 1)
