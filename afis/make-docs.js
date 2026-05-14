const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Renk paleti ────────────────────────────────────────────────────────────
const NAVY   = '04101e';
const BLUE   = '0c2a4a';
const CYAN   = '2bd4ff';
const WHITE  = 'FFFFFF';
const LIGHT  = 'e8f4fd';
const MUTED  = '5a7a96';
const AMBER  = 'ff9a3c';
const GRAY   = 'f0f4f8';
const BORDER_CLR = 'c0d8ee';

// ── Yardımcı fonksiyonlar ──────────────────────────────────────────────────
const border = (color = BORDER_CLR) => ({ style: BorderStyle.SINGLE, size: 1, color });
const allBorders = (color = BORDER_CLR) => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });
const noBorders = () => ({
  top: { style: BorderStyle.NONE, size: 0, color: WHITE },
  bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
  left: { style: BorderStyle.NONE, size: 0, color: WHITE },
  right: { style: BorderStyle.NONE, size: 0, color: WHITE },
});

function para(text, opts = {}) {
  return new Paragraph({
    ...opts,
    children: [new TextRun({ text, font: 'Arial', size: opts.size || 22, color: opts.color || '1a2a3a', bold: opts.bold || false, italics: opts.italics || false })],
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: 'Arial', size: 36, bold: true, color: NAVY })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: CYAN, space: 6 } },
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, font: 'Arial', size: 26, bold: true, color: BLUE })],
  });
}

function heading3(text) {
  return new Paragraph({
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, font: 'Arial', size: 22, bold: true, color: MUTED })],
  });
}

function bodyText(text, opts = {}) {
  const runs = [];
  if (typeof text === 'string') {
    runs.push(new TextRun({ text, font: 'Arial', size: 22, color: opts.color || '1a2a3a', bold: opts.bold || false, italics: opts.italics || false }));
  } else {
    runs.push(...text);
  }
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: runs, alignment: opts.align });
}

function spacer(lines = 1) {
  return new Paragraph({ spacing: { before: lines * 80, after: 0 }, children: [] });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: '1a2a3a' })],
  });
}

function cell(text, opts = {}) {
  const bgColor = opts.bg || WHITE;
  const textColor = opts.textColor || '1a2a3a';
  return new TableCell({
    borders: allBorders(BORDER_CLR),
    width: { size: opts.w || 2000, type: WidthType.DXA },
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({ text, font: 'Arial', size: opts.fontSize || 20, bold: opts.bold || false, color: textColor })],
    })],
  });
}

function headerRow(labels, widths) {
  return new TableRow({
    tableHeader: true,
    children: labels.map((lbl, i) => cell(lbl, { w: widths[i], bg: NAVY, textColor: WHITE, bold: true, fontSize: 20 })),
  });
}

function dataRow(values, widths, rowIndex = 0) {
  const bg = rowIndex % 2 === 0 ? WHITE : GRAY;
  return new TableRow({ children: values.map((v, i) => cell(v, { w: widths[i], bg, fontSize: 20 })) });
}

// ── Sayfa footer ───────────────────────────────────────────────────────────
function makeFooter(docName) {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_CLR, space: 4 } },
      children: [
        new TextRun({ text: `AIDEP — ${docName}  |  OÜ2662  |  AYZEK Disaster  |  Sayfa `, font: 'Arial', size: 18, color: MUTED }),
        new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: MUTED }),
      ],
    })],
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DÖKÜMAN 1: TEKNİK DOKÜMANTASYON
// ═══════════════════════════════════════════════════════════════════════════
function makeTeknikDoc() {
  const COL_W = 9360; // US Letter, 1" margins

  const children = [
    // ── KAPAK ──────────────────────────────────────────────────────────────
    new Paragraph({
      spacing: { before: 1440, after: 0 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'AIDEP', font: 'Arial', size: 96, bold: true, color: NAVY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      children: [new TextRun({ text: 'AI  ·  Disaster  ·  Emergency  ·  Pathfinder', font: 'Arial', size: 28, color: MUTED, italics: true })],
    }),
    spacer(2),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Teknik Proje Dokümantasyonu', font: 'Arial', size: 40, bold: true, color: BLUE })],
    }),
    spacer(3),
    new Table({
      width: { size: 7000, type: WidthType.DXA },
      columnWidths: [2600, 4400],
      alignment: AlignmentType.CENTER,
      rows: [
        new TableRow({ children: [cell('Proje Adı', { w: 2600, bg: LIGHT, bold: true, fontSize: 22 }), cell('AIDEP', { w: 4400, fontSize: 22 })] }),
        new TableRow({ children: [cell('Proje Kodu', { w: 2600, bg: LIGHT, bold: true, fontSize: 22 }), cell('OÜ2662', { w: 4400, fontSize: 22 })] }),
        new TableRow({ children: [cell('Takım', { w: 2600, bg: LIGHT, bold: true, fontSize: 22 }), cell('AYZEK Disaster', { w: 4400, fontSize: 22 })] }),
        new TableRow({ children: [cell('Üyeler', { w: 2600, bg: LIGHT, bold: true, fontSize: 22 }), cell('Süleyman YILDIZ  ·  Enes IŞIK', { w: 4400, fontSize: 22 })] }),
        new TableRow({ children: [cell('Danışman', { w: 2600, bg: LIGHT, bold: true, fontSize: 22 }), cell('Dr. Öğr. Üyesi Sema SERVİ', { w: 4400, fontSize: 22 })] }),
        new TableRow({ children: [cell('Yarışma', { w: 2600, bg: LIGHT, bold: true, fontSize: 22 }), cell('Teknosel — Özel Kategori · Üniversite', { w: 4400, fontSize: 22 })] }),
        new TableRow({ children: [cell('Tema', { w: 2600, bg: LIGHT, bold: true, fontSize: 22 }), cell('Yerel Yönetimlerde Akıllı Şehircilik', { w: 4400, fontSize: 22 })] }),
        new TableRow({ children: [cell('Konu', { w: 2600, bg: LIGHT, bold: true, fontSize: 22 }), cell('Doğal Afetler ve Afet Yönetimi', { w: 4400, fontSize: 22 })] }),
        new TableRow({ children: [cell('Referans Olay', { w: 2600, bg: LIGHT, bold: true, fontSize: 22 }), cell('6 Şubat 2023 Kahramanmaraş Depremi', { w: 4400, fontSize: 22 })] }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),

    // ── 1. YÖNETİCİ ÖZETİ ─────────────────────────────────────────────────
    heading1('1. Yönetici Özeti'),
    bodyText('AIDEP (AI · Disaster · Emergency · Pathfinder), büyük depremlerin kritik 6–72 saatinde yardım ekiplerini güvenli rotaya yönlendiren yapay zekâ destekli bir afet yönetim platformudur.'),
    spacer(),
    bodyText('Platform iki fazlı çalışır:'),
    bullet('Faz 1 — Deprem Öncesi: STK ve kurumlara dijital tatbikat simülasyonları ve senaryo bazlı hazırlık modülleri sunulur.'),
    bullet('Faz 2 — Deprem Sonrası: Dört aşamalı bir yapay zekâ pipeline\'ı aracılığıyla hasar tespiti → coğrafi analiz → risk skorlama → rota optimizasyonu işlemleri gerçek zamanlı yürütülür.'),
    spacer(),
    bodyText('Temel başarı göstergesi: Kahramanmaraş depremi verileriyle gerçekleştirilen simülasyonda AIDEP\'in rota optimizasyonu, riskli yol segmenti oranını %60\'tan %10\'un altına indirmiştir. Bu iyileşme, arama-kurtarma ekiplerinin enkaza ulaşma süresini ve karşılaştığı tehlikeyi somut biçimde azaltmaktadır.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ── 2. PROBLEMİN TANIMI ────────────────────────────────────────────────
    heading1('2. Problemin Tanımı'),
    heading2('2.1 Arka Plan'),
    bodyText('6 Şubat 2023 tarihinde gerçekleşen Kahramanmaraş merkezli depremler (7,7 ve 7,6 büyüklüğünde iki ardışık sarsıntı), Türkiye\'nin afet yönetimi altyapısındaki kritik eksiklikleri gözler önüne sermiştir. 11 ili etkileyen bu afet, 50.000\'i aşkın can kaybına yol açmış; yüzlerce arama-kurtarma ekibi enkaz bölgelerine zamanında ulaşamamıştır.'),
    spacer(),
    bodyText('Temel neden: Hasarlı ya da tamamen kapanmış yollar nedeniyle ekipler hangi güzergahın kullanılabilir olduğunu bilmiyordu. Mevcut sistemler bu bilgiyi gerçek zamanlı sağlayamadı.'),
    spacer(),
    heading2('2.2 Üç Temel Problem'),
    new Table({
      width: { size: COL_W, type: WidthType.DXA },
      columnWidths: [720, 2400, 6240],
      rows: [
        headerRow(['#', 'Problem', 'Açıklama'], [720, 2400, 6240]),
        dataRow(['1', 'Geç müdahale', 'Kapalı ve hasarlı yollar nedeniyle ekipler kritik 6–72 saatte enkaza ulaşamıyor.'], [720, 2400, 6240], 0),
        dataRow(['2', 'Dinamik veri yok', 'Mevcut sistemler yolların anlık durumunu izleyemiyor; ekipler kapalı yolu sahada görüyor.'], [720, 2400, 6240], 1),
        dataRow(['3', 'Bütünleşik sistem yok', 'Görüntü tabanlı hasar tespitiyle dinamik rotayı birleştiren yerli sistem literatürde bulunmuyor.'], [720, 2400, 6240], 0),
      ],
    }),
    spacer(),
    heading2('2.3 Kritik Müdahale Penceresi'),
    bodyText('Deprem sonrası 6–72 saat, hayatta kalma olasılığının hızla düştüğü kritik penceredir. Bu sürede enkaza ulaşan her ekip, potansiyel olarak birden fazla insanın hayatını kurtarabilir. AIDEP, tam da bu pencerede güvenli ve hızlı rota sağlamak için tasarlanmıştır.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ── 3. ÇÖZÜM ──────────────────────────────────────────────────────────
    heading1('3. Çözüm: AIDEP Platformu'),
    heading2('3.1 Genel Mimari'),
    bodyText('AIDEP, vatandaş katılımını profesyonel afet yönetimiyle birleştiren iki fazlı bir platformdur. Tek bir merkezi sistem üzerinden hem hazırlık hem operasyon süreçleri yönetilir.'),
    spacer(),
    heading2('3.2 Faz 1 — Deprem Öncesi (Hazırlık)'),
    bullet('STK\'lar ve kurumlar için dijital tatbikat simülasyonları'),
    bullet('Senaryo bazlı afet planlaması ve kapasite değerlendirmesi'),
    bullet('Ekip ve kaynak yönetimi modülleri'),
    bullet('AFAD ve yerel yönetimlerle entegrasyon altyapısı kurulumu'),
    bullet('Kullanıcı eğitimi ve sistem tanıma oturumları'),
    spacer(),
    heading2('3.3 Faz 2 — Deprem Sonrası (Operasyon): Dört Aşamalı AI Pipeline'),
    new Table({
      width: { size: COL_W, type: WidthType.DXA },
      columnWidths: [720, 2000, 4320, 2320],
      rows: [
        headerRow(['Aşama', 'Başlık', 'Açıklama', 'Teknoloji'], [720, 2000, 4320, 2320]),
        dataRow(['1', 'Veri Toplama', 'Vatandaş fotoğrafları ve coğrafi etiketli görüntüler mobil uygulama üzerinden toplanır.', 'Mobil · WebSocket'], [720, 2000, 4320, 2320], 0),
        dataRow(['2', 'Hasar Tespiti', 'Görüntüler derin öğrenme modeliyle sınıflandırılır ve hasar haritasına dönüştürülür.', 'YOLOv8m'], [720, 2000, 4320, 2320], 1),
        dataRow(['3', 'Risk Skorlama', 'Grid bazlı coğrafi analiz ile her yol segmentine 0–1 arası risk puanı hesaplanır.', 'XGBoost · PostGIS'], [720, 2000, 4320, 2320], 0),
        dataRow(['4', 'Güvenli Rota', 'Ekipler, düşük riskli segmentler üzerinden en hızlı güzergâha gerçek zamanlı yönlendirilir.', 'OSRM · Enhanced Greedy'], [720, 2000, 4320, 2320], 1),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),

    // ── 4. TEKNİK MİMARİ ──────────────────────────────────────────────────
    heading1('4. Teknik Mimari'),
    heading2('4.1 Yapay Zekâ Katmanı'),
    heading3('Hasar Tespiti — YOLOv8m'),
    bullet('Model: YOLOv8m (medium variant) — nesne tespiti ve sınıflandırma mimarisi'),
    bullet('Görev: Bina hasarını 4 kategoride sınıflandırma (hasarsız, hafif hasar, orta hasar, ağır hasar/yıkık)'),
    bullet('Eğitim yöntemi: Transfer learning — önceden eğitilmiş ağırlıklar üzerine domain-specific fine-tuning'),
    bullet('Hedef doğruluk: %83 mAP@50 (Mean Average Precision at IoU threshold 0.50)'),
    bullet('Giriş verisi: Vatandaşların mobil uygulama üzerinden gönderdiği coğrafi etiketli (GPS damgalı) fotoğraflar'),
    bullet('Çıktı: Her görüntü için hasar sınıfı + olasılık skoru + coğrafi koordinat'),
    spacer(),
    heading3('Risk Skorlama — XGBoost + PostGIS'),
    bullet('Model: Gradient Boosted Decision Trees (XGBoost) — yüksek performanslı tablo veri sınıflandırıcı'),
    bullet('Girdi özellikleri: Hasar yoğunluğu, nüfus yoğunluğu, yol tipi (anayol/ara yol/sokak), zemin sınıfı, deprem büyüklüğü, artçı sarsıntı verileri, altyapı yaşı'),
    bullet('Çıktı: Her grid hücresi için 0 (güvenli) – 1 (tehlikeli) arası sürekli risk skoru'),
    bullet('Coğrafi işlem: PostGIS uzantısıyla grid bazlı mekansal sorgulama ve ağırlıklı komşuluk analizi'),
    spacer(),
    heading3('Rota Optimizasyonu — OSRM + Enhanced Greedy'),
    bullet('Temel yönlendirme motoru: OSRM (Open Source Routing Machine) — gerçek yol ağı topolojisi üzerinde en kısa yol'),
    bullet('Risk entegrasyonu: Risk skoru eşiğinin (varsayılan 0.65) üzerindeki segmentler yol ağından geçici olarak çıkarılır'),
    bullet('Hasar kaçınma yarıçapı: 250m (önceki sürümde 500m; daha hassas, yanlış pozitif oranı düşük)'),
    bullet('Ara durak (waypoint) desteği: via=lat,lon parametresiyle çok adımlı rota; OSRM nearest endpoint ile yola yaslama'),
    bullet('Optimizasyon algoritması: Enhanced Greedy — mesafe ve risk ağırlıklarını dengeleyen çok kriterli sezgisel arama'),
    bullet('Gerçek zamanlı güncelleme: Yeni hasar bildirimleri geldikçe risk haritası ve aktif rotalar otomatik yeniden hesaplanır'),
    bullet('Çoklu ekip desteği: Farklı ekipler için bağımsız, çakışmayan rotalar üretilebilir'),
    spacer(),
    heading2('4.2 Backend Mimarisi'),
    new Table({
      width: { size: COL_W, type: WidthType.DXA },
      columnWidths: [2200, 2800, 4360],
      rows: [
        headerRow(['Bileşen', 'Teknoloji', 'Görev'], [2200, 2800, 4360]),
        dataRow(['API Framework', 'FastAPI (Python)', 'REST ve WebSocket endpoint\'leri; asenkron istek işleme'], [2200, 2800, 4360], 0),
        dataRow(['Ana Veritabanı', 'PostgreSQL + PostGIS', 'Yol ağı grafiği, hasar kayıtları, mekansal sorgular'], [2200, 2800, 4360], 1),
        dataRow(['Gerçek Zamanlı DB', 'Firebase Realtime DB', 'Ekip konumları, anlık push bildirimleri'], [2200, 2800, 4360], 0),
        dataRow(['Canlı Veri İletimi', 'WebSocket', 'Vatandaş fotoğrafı akışı, rota güncellemeleri'], [2200, 2800, 4360], 1),
        dataRow(['Dış Veri Entegrasyonu', 'AFAD API · Kandilli', 'Deprem büyüklüğü, artçı sarsıntı verileri, erken uyarı'], [2200, 2800, 4360], 0),
        dataRow(['Yönlendirme Motoru', 'OSRM', 'Gerçek yol ağı üzerinde dinamik rota + ara durak (waypoint) hesaplama'], [2200, 2800, 4360], 1),
        dataRow(['Çevrimdışı Destek', 'Offline mod', 'İnternet kesintisinde yerel harita önbelleği ve temel işlevler'], [2200, 2800, 4360], 0),
      ],
    }),
    spacer(),
    heading3('Temel API Endpoint\'leri'),
    new Table({
      width: { size: COL_W, type: WidthType.DXA },
      columnWidths: [1400, 3200, 4760],
      rows: [
        headerRow(['Metod', 'Endpoint', 'Açıklama'], [1400, 3200, 4760]),
        dataRow(['GET', '/map/route', 'İki nokta arası güvenli rota; via parametresiyle isteğe bağlı ara duraklar'], [1400, 3200, 4760], 0),
        dataRow(['GET', '/map/nearest', 'Verilen GPS koordinatına en yakın yol noktasını döndürür; 50m uzaksa 404'], [1400, 3200, 4760], 1),
        dataRow(['GET', '/map/team-locations', 'Aktif ekiplerin gerçek zamanlı konumları'], [1400, 3200, 4760], 0),
        dataRow(['GET', '/teams/my-team', 'Giriş yapan kullanıcının ekibini ve tüm üyeleri döndürür'], [1400, 3200, 4760], 1),
        dataRow(['GET', '/ai/damage-map', 'Grid bazlı hasar skoru haritası (rota hesaplamasına beslenir)'], [1400, 3200, 4760], 0),
      ],
    }),
    spacer(),
    heading2('4.3 Frontend'),
    new Table({
      width: { size: COL_W, type: WidthType.DXA },
      columnWidths: [2400, 2800, 4160],
      rows: [
        headerRow(['Platform', 'Teknoloji', 'Birincil Kullanıcı'], [2400, 2800, 4160]),
        dataRow(['Mobil Uygulama', 'React Native', 'Vatandaşlar, arama-kurtarma ekipleri, gönüllüler'], [2400, 2800, 4160], 0),
        dataRow(['Yönetim Paneli', 'React (web uygulaması)', 'STK yöneticileri, AFAD koordinatörleri, belediyeler'], [2400, 2800, 4160], 1),
      ],
    }),
    spacer(),
    bodyText('Mobil uygulama dört ana sekme üzerinde organize edilmiştir:'),
    new Table({
      width: { size: COL_W, type: WidthType.DXA },
      columnWidths: [2000, 7360],
      rows: [
        headerRow(['Sekme', 'Temel İşlev'], [2000, 7360]),
        dataRow(['Harita', 'Deprem haritası, hasar grid, güvenli rota navigasyonu, waypoint ekleme'], [2000, 7360], 0),
        dataRow(['Bildir', 'Fotoğraf çekme, GPS damgalama, hasar raporu gönderme'], [2000, 7360], 1),
        dataRow(['Ekibim', 'Ekip bilgisi, üye listesi, aktif görev kartı, haritaya navigasyon'], [2000, 7360], 0),
        dataRow(['Profil', 'Kullanıcı bilgileri, oturum yönetimi, ayarlar'], [2000, 7360], 1),
      ],
    }),
    spacer(),
    heading2('4.4 Mobil Uygulama Modülleri'),
    heading3('Hasar Raporlama Modülü'),
    bullet('Kamera entegrasyonu ile anlık fotoğraf çekme'),
    bullet('Otomatik GPS damgalama ve konum doğrulama'),
    bullet('WebSocket üzerinden sunucuya anlık yükleme'),
    bullet('Düşük bant genişliği için görüntü sıkıştırma'),
    spacer(0),
    heading3('Deprem Haritası Modülü'),
    bullet('Hasar yoğunluğu katmanı — renk skalası eşikleri: ≥0.5 kırmızı (kritik) · ≥0.3 turuncu (riskli) · ≥0.1 sarı (hafif) · <0.1 yeşil (güvenli)'),
    bullet('Aktif arama-kurtarma ekiplerinin gerçek zamanlı konumları'),
    bullet('Toplanma noktaları ve güvenli bölge işaretçileri'),
    bullet('Harita odaklandığında hasar grid\'i otomatik yenilenir (useFocusEffect)'),
    bullet('Android performans optimizasyonu: görünür bölgede en fazla 80 marker'),
    spacer(0),
    heading3('Güvenli Rota Modülü'),
    bullet('Optimize edilmiş güzergah harita üzerinde görsel olarak gösterilir'),
    bullet('Tahmini varış süresi (ETA) ve mesafe bilgisi'),
    bullet('Harita dokunuşuyla ara durak (waypoint) ekleme — OSRM nearest ile yola yaslanır'),
    bullet('Hibrit hasar kontrolü: backend damage_score + yerel raporlar birleştirilir; rota koordinatlarının >%5\'i hasar bölgesindeyse uyarı gösterilir'),
    bullet('Hasar kaçınma yarıçapı: 250m (önceki 500m\'den daha hassas)'),
    bullet('Alternatif rotalar ve dinamik güncelleme bildirimleri'),
    spacer(0),
    heading3('Ekibim Modülü'),
    bullet('Kullanıcının dahil olduğu ekibin adı, açıklaması ve aktif görev sayısı'),
    bullet('Tüm ekip üyeleri: ad, rol ve konum durumu (konumu var/yok)'),
    bullet('Aktif görev kartı: ihtiyaç türü, aciliyet seviyesi (1–5 Düşük→Kritik), atama durumu (Atandı / Yolda / Tamamlandı)'),
    bullet('Göreve Git butonu: harita tab\'ına geçerek hedef konuma otomatik rota hesaplar (pendingTaskNav store entegrasyonu)'),
    bullet('Pull-to-refresh ile anlık güncelleme'),
    new Paragraph({ children: [new PageBreak()] }),

    // ── 5. PERFORMANS METRİKLERİ ───────────────────────────────────────────
    heading1('5. Performans Metrikleri'),
    new Table({
      width: { size: COL_W, type: WidthType.DXA },
      columnWidths: [3200, 2400, 3760],
      rows: [
        headerRow(['Metrik', 'Değer', 'Açıklama'], [3200, 2400, 3760]),
        dataRow(['Riskli segment azalması', '%60 → %10 altı', 'Kahramanmaraş depremi simülasyonu: AIDEP rotalaması ile riskli yol oranı'], [3200, 2400, 3760], 0),
        dataRow(['Hasar tespiti doğruluğu', '%83 mAP@50', 'YOLOv8m modelinin hedef ortalama hassasiyet değeri'], [3200, 2400, 3760], 1),
        dataRow(['Kritik müdahale penceresi', '6–72 saat', 'Deprem sonrası kurtarma operasyonunun en etkin olduğu zaman dilimi'], [3200, 2400, 3760], 0),
        dataRow(['Platform fazı sayısı', '2 faz', 'Deprem öncesi simülasyon + deprem sonrası operasyon'], [3200, 2400, 3760], 1),
      ],
    }),
    spacer(),
    bodyText('Not: Mevcut metrikler Kahramanmaraş depremi verileri kullanılarak yapılan simülasyon çalışmasına dayanmaktadır. Gerçek deprem ortamında doğrulama çalışmaları devam etmektedir.', { color: MUTED, italics: true }),
    spacer(),

    // ── 6. HEDEF KİTLE ─────────────────────────────────────────────────────
    heading1('6. Hedef Kitle'),
    new Table({
      width: { size: COL_W, type: WidthType.DXA },
      columnWidths: [3600, 5760],
      rows: [
        headerRow(['Kullanıcı Grubu', 'Platformdaki Rolü'], [3600, 5760]),
        dataRow(['Fotoğraf paylaşan vatandaşlar', 'Hasar verisi sağlayıcı — kalabalık kaynaklı (crowdsourced) gerçek zamanlı haritalama'], [3600, 5760], 0),
        dataRow(['Arama-kurtarma ekipleri ve gönüllüler', 'Birincil saha kullanıcısı — güvenli rota takipçisi ve ekip koordinatörü'], [3600, 5760], 1),
        dataRow(['STK\'lar ve kriz yönetim masaları', 'Operasyonel koordinatör — kaynak, ekip ve görev yönetimi'], [3600, 5760], 0),
        dataRow(['AFAD, UMKE ve belediyeler', 'Kurumsal karar alıcı — stratejik yönlendirme ve kaynak tahsisi'], [3600, 5760], 1),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),

    // ── 7. FARKLILAŞTIRICI UNSURLAR ────────────────────────────────────────
    heading1('7. Farklandırıcı Unsurlar'),
    heading2('7.1 Yerli ve Özgün'),
    bodyText('Görüntü tabanlı hasar tespiti ile dinamik rota optimizasyonunu tek bir bütünleşik platform olarak sunan yerli bir sistem akademik literatürde bulunmamaktadır. AIDEP bu boşluğu doldurmayı hedeflemektedir.'),
    spacer(),
    heading2('7.2 Kalabalık Kaynaklı (Crowdsourced) Veri'),
    bodyText('Vatandaşlar yalnızca pasif bildirim alıcısı değil, aktif veri sağlayıcısıdır. Gönüllü olarak paylaşılan fotoğraflar, resmi veri kanallarının henüz ulaşamadığı bölgelere sistem görünürlüğünü taşır. Bu yaklaşım veri kapsamını ve sistem hassasiyetini önemli ölçüde artırır.'),
    spacer(),
    heading2('7.3 İki Fazlı Bütünleşik Yaklaşım'),
    bodyText('Pek çok mevcut çözüm ya hazırlık ya da müdahale aşamasına odaklanır. AIDEP, dijital tatbikat simülasyonlarını (hazırlık fazı) ve gerçek zamanlı operasyonel koordinasyonu (müdahale fazı) tek bir platform üzerinden sunar.'),
    spacer(),
    heading2('7.4 Gerçek Zamanlı Adaptasyon'),
    bodyText('Sistem statik bir hasar haritasıyla değil, sürekli güncellenen veriyle çalışır. Yeni hasar bildirimleri geldikçe risk skorları ve aktif rotalar otomatik olarak yeniden hesaplanır; saha ekipleri anlık rota değişikliği bildirimi alır.'),
    spacer(),
    heading2('7.5 Çevrimdışı Çalışma Desteği'),
    bodyText('Büyük depremlerin ardından internet altyapısı sıklıkla çökmektedir. AIDEP\'in offline modu, temel harita verilerini ve son rota bilgisini yerel olarak önbellekler; bağlantı kesintisinde dahi ekipler son güvenli rotayla hareket edebilir.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ── 8. KISITLAR VE GELECEK ─────────────────────────────────────────────
    heading1('8. Kısıtlar ve Gelecekteki Çalışmalar'),
    heading2('8.1 Mevcut Kısıtlar'),
    bullet('YOLOv8m modelinin %83 mAP@50 doğruluk hedefi simülasyon verisi üzerinden elde edilmiştir; gerçek afet görüntüleriyle doğrulama çalışmaları sürmektedir.'),
    bullet('Platform henüz gerçek bir deprem senaryosunda canlı ortamda test edilmemiştir.'),
    bullet('Büyük ölçekli (10.000+ eş zamanlı kullanıcı) yük testleri tamamlanmamıştır.'),
    bullet('AFAD ve 112 sistemleriyle resmi API entegrasyonu hâlâ geliştirme aşamasındadır.'),
    spacer(),
    heading2('8.2 Kısa Vadeli Yol Haritası (6–12 Ay)'),
    bullet('Gerçek deprem fotoğraf veri setleriyle model ince ayarı ve yeniden eğitimi'),
    bullet('AFAD ve 112 Acil Çağrı Merkezi sistemleriyle resmi API entegrasyonu'),
    bullet('Pilot tatbikat: Selçuklu Belediyesi ve InnoPark iş birliğiyle saha testi'),
    bullet('Yük testi ve ölçeklenebilirlik optimizasyonu'),
    spacer(),
    heading2('8.3 Uzun Vadeli Vizyon'),
    bullet('Uydu görüntüsü entegrasyonu (Sentinel-2, PlanetScope) — harita kapsamını genişletmek'),
    bullet('Drone görüntüsü işleme modülü — erişilemeyen bölgeler için hava görüntüsü analizi'),
    bullet('Çok ajanlı rota optimizasyonu — aynı anda onlarca ekibi koordine edecek algoritma geliştirme'),
    bullet('Ulusal afet yönetim platformuna entegrasyon — Türkiye\'nin tüm deprem bölgelerini kapsayan genişleme'),
    bullet('Model geliştirme: %90+ mAP@50 hedefi'),
    new Paragraph({ children: [new PageBreak()] }),

    // ── 9. TAKIM VE DESTEKÇILER ────────────────────────────────────────────
    heading1('9. Takım ve Destekçiler'),
    heading2('9.1 Takım: AYZEK Disaster'),
    new Table({
      width: { size: 7000, type: WidthType.DXA },
      columnWidths: [2600, 4400],
      rows: [
        headerRow(['Rol', 'İsim'], [2600, 4400]),
        dataRow(['Takım Üyesi', 'Süleyman YILDIZ'], [2600, 4400], 0),
        dataRow(['Takım Üyesi', 'Enes IŞIK'], [2600, 4400], 1),
        dataRow(['Danışman', 'Dr. Öğr. Üyesi Sema SERVİ'], [2600, 4400], 0),
      ],
    }),
    spacer(),
    heading2('9.2 Destekçi Kurumlar'),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3120, 6240],
      rows: [
        headerRow(['Kurum', 'Katkı Alanı'], [3120, 6240]),
        dataRow(['AYZEK', 'Teknik altyapı ve geliştirme desteği'], [3120, 6240], 0),
        dataRow(['Teknosel', 'Yarışma organizasyonu ve değerlendirme platformu'], [3120, 6240], 1),
        dataRow(['Selçuklu Belediyesi', 'Yerel yönetim iş birliği ve pilot uygulama alanı'], [3120, 6240], 0),
        dataRow(['Selçuk Üniversitesi Teknoloji Fakültesi', 'Akademik danışmanlık ve araştırma altyapısı'], [3120, 6240], 1),
        dataRow(['InnoPark Konya Teknoloji Geliştirme Bölgesi', 'Kuluçka ve girişim ekosistemi desteği'], [3120, 6240], 0),
      ],
    }),
  ];

  return new Document({
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
        },
      ],
    },
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 36, bold: true, font: 'Arial', color: NAVY },
          paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 26, bold: true, font: 'Arial', color: BLUE },
          paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
      ],
    },
    sections: [{
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      footers: { default: makeFooter('Teknik Proje Dokümantasyonu') },
      children,
    }],
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DÖKÜMAN 2: SUNUM YAZISI
// ═══════════════════════════════════════════════════════════════════════════
function makeSunumDoc() {
  const COL_W = 9360;

  function speechPara(text) {
    return new Paragraph({
      spacing: { before: 140, after: 140 },
      children: [new TextRun({ text, font: 'Arial', size: 23, color: '1a2a3a', italics: true })],
    });
  }

  function stagePara(text) {
    return new Paragraph({
      spacing: { before: 80, after: 80 },
      children: [new TextRun({ text: `[${text}]`, font: 'Arial', size: 20, color: MUTED, bold: true })],
    });
  }

  function sectionTitle(bölüm, başlık, süre) {
    return [
      new Paragraph({
        spacing: { before: 320, after: 80 },
        shading: { fill: NAVY, type: ShadingType.CLEAR },
        children: [
          new TextRun({ text: `  ${bölüm}  `, font: 'Arial', size: 28, bold: true, color: WHITE }),
          new TextRun({ text: `  ${başlık}`, font: 'Arial', size: 26, bold: true, color: '7fe3ff' }),
          new TextRun({ text: `  (${süre})`, font: 'Arial', size: 22, color: 'aaccdd', italics: true }),
        ],
      }),
    ];
  }

  function qaItem(soru, cevap) {
    return [
      new Paragraph({
        spacing: { before: 180, after: 60 },
        children: [new TextRun({ text: `S: "${soru}"`, font: 'Arial', size: 22, bold: true, color: AMBER })],
      }),
      new Paragraph({
        spacing: { before: 60, after: 120 },
        children: [new TextRun({ text: `C: ${cevap}`, font: 'Arial', size: 22, color: '1a2a3a' })],
      }),
    ];
  }

  const children = [
    // ── KAPAK ──────────────────────────────────────────────────────────────
    new Paragraph({
      spacing: { before: 1440, after: 80 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'AIDEP', font: 'Arial', size: 96, bold: true, color: NAVY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: 'Teknosel Sunum Yazısı', font: 'Arial', size: 44, bold: true, color: BLUE })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: 'Konuşma Metni ve Sunum Rehberi', font: 'Arial', size: 28, color: MUTED, italics: true })],
    }),
    spacer(2),
    new Table({
      width: { size: 6000, type: WidthType.DXA },
      columnWidths: [2400, 3600],
      alignment: AlignmentType.CENTER,
      rows: [
        new TableRow({ children: [cell('Proje', { w: 2400, bg: LIGHT, bold: true, fontSize: 22 }), cell('AIDEP — OÜ2662', { w: 3600, fontSize: 22 })] }),
        new TableRow({ children: [cell('Takım', { w: 2400, bg: LIGHT, bold: true, fontSize: 22 }), cell('AYZEK Disaster', { w: 3600, fontSize: 22 })] }),
        new TableRow({ children: [cell('Yarışma', { w: 2400, bg: LIGHT, bold: true, fontSize: 22 }), cell('Teknosel', { w: 3600, fontSize: 22 })] }),
        new TableRow({ children: [cell('Toplam Süre', { w: 2400, bg: LIGHT, bold: true, fontSize: 22 }), cell('~7.5 dakika', { w: 3600, fontSize: 22 })] }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),

    // ── SUNUM AKIŞI ────────────────────────────────────────────────────────
    heading1('Sunum Akışı ve Süreler'),
    new Table({
      width: { size: COL_W, type: WidthType.DXA },
      columnWidths: [1000, 3800, 1560, 3000],
      rows: [
        headerRow(['Bölüm', 'Başlık', 'Süre', 'Anahtar Mesaj'], [1000, 3800, 1560, 3000]),
        dataRow(['1', 'Giriş ve dikkat çekici açılış', '1 dk', 'İmpact — Kahramanmaraş trajedisi'], [1000, 3800, 1560, 3000], 0),
        dataRow(['2', 'Problemin tanımı', '1.5 dk', 'Neden bu proje var? Boşluk nerede?'], [1000, 3800, 1560, 3000], 1),
        dataRow(['3', 'Çözüm — AIDEP nedir?', '1.5 dk', 'İki fazlı platform + kalabalık veri modeli'], [1000, 3800, 1560, 3000], 0),
        dataRow(['4', 'Teknik detaylar', '2 dk', 'Dört aşamalı AI pipeline'], [1000, 3800, 1560, 3000], 1),
        dataRow(['5', 'Sonuçlar ve kanıtlar', '1 dk', '%60→%10 simülasyon sonucu'], [1000, 3800, 1560, 3000], 0),
        dataRow(['6', 'Kapanış', '30 sn', 'Vizyon ve çağrı'], [1000, 3800, 1560, 3000], 1),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),

    // ── BÖLÜM 1: GİRİŞ ─────────────────────────────────────────────────────
    ...sectionTitle('BÖLÜM 1', 'Giriş', '1 dakika'),
    stagePara('Yavaş, net bir sesle başla. Sahneye güvenle çık, bir an için dur, jüriye bak.'),
    spacer(),
    speechPara('Sayın jüri üyeleri, değerli konuklar, merhaba.'),
    spacer(),
    speechPara('6 Şubat 2023.'),
    speechPara('Saat 04:17.'),
    spacer(),
    stagePara('Burada bir-iki saniye sessiz kal. Rakamların havada durmasına izin ver.'),
    spacer(),
    speechPara('Kahramanmaraş\'ta 7,7 büyüklüğünde bir deprem oldu. Ardından birkaç saat sonra, 7,6 büyüklüğünde bir ikincisi daha.'),
    spacer(),
    speechPara('11 ilimiz etkilendi. 50.000\'i aşkın can kaybı yaşandı.'),
    spacer(),
    speechPara('Ve o gece, sabahın ilk saatlerinde, yüzlerce arama-kurtarma ekibi yola çıktı... ama birçoğu enkaza ulaşamadı.'),
    spacer(),
    speechPara('Çünkü yollar ya çökmüştü ya da hasar almıştı. Ekipler hangi yolun açık, hangisinin kapalı olduğunu bilmiyordu. Dakikalar, saatler geçiyordu. Ve her geçen dakika, hayat kurtarma ihtimalini azaltıyordu.'),
    spacer(),
    speechPara('Biz bu soruyu sorduk: Yapay zekâ bu trajedide fark yaratabilir miydi?'),
    spacer(),
    stagePara('Dur. Jüriye bak.'),
    spacer(),
    speechPara('AIDEP\'i bunun için geliştirdik.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ── BÖLÜM 2: PROBLEM ───────────────────────────────────────────────────
    ...sectionTitle('BÖLÜM 2', 'Problemin Tanımı', '1.5 dakika'),
    stagePara('Tonu biraz teknikleştir ama duygusal bağı koru.'),
    spacer(),
    speechPara('Şimdi, o geceye daha yakından bakalım.'),
    spacer(),
    speechPara('Arama-kurtarma ekipleri yola çıktığında, karşılarında üç temel engel vardı.'),
    spacer(),
    speechPara('Birincisi: Geç müdahale. Enkaza ulaşmak için saatler, hatta bazı bölgelerde günler gerekti. Neden? Çünkü her yol denendi, bazıları kapalıydı, geri dönüldü, alternatif arandı. Bu, kritik 6–72 saatlik pencerede karşılanabilecek en büyük kayıptı: zaman.'),
    spacer(),
    speechPara('İkincisi: Dinamik veri yokluğu. Mevcut sistemler yolların anlık durumunu izleyemiyordu. Harita üzerinde açık görünen yol, sahada kapanmış olabiliyordu. Ekipler bunu ancak gidip gördüklerinde anlıyorlardı.'),
    spacer(),
    speechPara('Üçüncüsü: Bütünleşik sistem yokluğu. Görüntü tabanlı hasar tespiti yapan sistemler vardı. Rota hesaplayan sistemler vardı. Ama ikisini gerçek zamanlı olarak birleştiren, Türkiye\'nin kendi coğrafyası ve yol ağına özel çalışan yerli bir sistem yoktu.'),
    spacer(),
    speechPara('İşte AIDEP tam bu boşluğu doldurmak için tasarlandı.'),
    spacer(),

    // ── BÖLÜM 3: ÇÖZÜM ─────────────────────────────────────────────────────
    ...sectionTitle('BÖLÜM 3', 'Çözüm — AIDEP Nedir?', '1.5 dakika'),
    stagePara('Enerjini yükselt. Bu bölümde çözümü satıyorsun.'),
    spacer(),
    speechPara('AIDEP, yapay zekâ destekli bir afet yönetim platformudur. Ama sadece bir yazılım değil — iki fazlı bir ekosistem.'),
    spacer(),
    speechPara('Deprem olmadan önce ne yapıyoruz? STK\'lara, belediyelere, arama-kurtarma ekiplerine dijital tatbikat simülasyonları sunuyoruz. Senaryo bazlı planlamalar yapıyoruz. Sistemimizi kurumlar henüz gerçek bir afet görmeden öğreniyor.'),
    spacer(),
    speechPara('Peki deprem olduğunda? İşte o an dört aşamalı yapay zekâ pipeline\'ımız devreye giriyor.'),
    spacer(),
    speechPara('Ve burada kritik bir şeyi söylemem lazım: Sistemimizin ham veri kaynağı vatandaşların kendisi. Bir vatandaş, elindeki telefonla çöken bir binanın ya da hasarlı bir yolun fotoğrafını çekip uygulamamıza gönderiyor. GPS bilgisiyle birlikte. Bu, resmi veri kanallarının henüz ulaşamadığı yerlere bize görünürlük sağlıyor.'),
    spacer(),
    speechPara('Vatandaşlar yalnızca bildirim alıcısı değil — aktif veri sağlayıcısı.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ── BÖLÜM 4: TEKNİK DETAYLAR ───────────────────────────────────────────
    ...sectionTitle('BÖLÜM 4', 'Teknik Detaylar', '2 dakika'),
    stagePara('Teknik ama anlaşılır ol. Jargonu açıkla, merak uyandır.'),
    spacer(),
    speechPara('Dört aşamalı pipeline\'ımızı açıklayayım.'),
    spacer(),
    speechPara('Birinci aşama: Veri Toplama. Vatandaşlar mobil uygulamamız aracılığıyla fotoğraf gönderdiği anda, bu görüntüler coğrafi konum bilgisiyle birlikte WebSocket bağlantısı üzerinden anlık olarak sunucularımıza ulaşıyor.'),
    spacer(),
    speechPara('İkinci aşama: Hasar Tespiti. Bu fotoğrafları YOLOv8m adlı derin öğrenme modelimiz analiz ediyor. Model, binayı fotoğrafına bakarak dört kategoride sınıflandırıyor: hasarsız, hafif hasar, orta hasar, ağır hasar ya da yıkık. Her sınıflandırma bir koordinatla eşleşiyor ve canlı hasar haritamız güncelleniyor.'),
    spacer(),
    speechPara('Üçüncü aşama: Risk Skorlama. Hasar verileri, nüfus yoğunluğu, yol tipi, zemin yapısı ve artçı sarsıntı bilgileriyle birleştirilerek XGBoost modelimize besleniyor. Model, şehri grid hücrelerine bölerek her hücreye sıfırdan bire kadar bir risk skoru atıyor. PostGIS ile mekansal sorgular yapıyoruz.'),
    spacer(),
    speechPara('Dördüncü aşama: Güvenli Rota. Artık elimizde bir risk haritası var. OSRM — açık kaynaklı yönlendirme motorumuz — gerçek yol ağı üzerinde hesaplama yapıyor. Biz Enhanced Greedy algoritmamızla risk skoru yüksek olan segmentleri engelliyoruz ve ekibi en güvenli, en hızlı rotaya yönlendiriyoruz. Bu hesaplama saniyeler içinde gerçekleşiyor ve yeni hasar bildirimleri geldikçe rota otomatik güncelleniyor.'),
    spacer(),
    speechPara('Bunların tamamı FastAPI üzerinde çalışıyor. Veriler PostgreSQL ve PostGIS\'te tutuluyor. Gerçek zamanlı ekip konumları Firebase\'de. Ve internet kesilirse? Offline modumuz temel harita ve rota verilerini yerel önbellekte saklıyor.'),
    spacer(),

    // ── BÖLÜM 5: SONUÇLAR ──────────────────────────────────────────────────
    ...sectionTitle('BÖLÜM 5', 'Sonuçlar ve Kanıtlar', '1 dakika'),
    stagePara('Rakamları yavaş söyle. Bırak işlesinler.'),
    spacer(),
    speechPara('Peki bu sistem gerçekten işe yarıyor mu?'),
    spacer(),
    speechPara('Kahramanmaraş depremi verilerini kullanarak bir simülasyon yaptık.'),
    spacer(),
    speechPara('Mevcut sistemlerde, arama-kurtarma ekiplerinin kullandığı yol ağının yüzde altmışı riskli segment içeriyordu. Yani on yoldan altısı, ekibi tehlikeye atacak düzeyde hasarlıydı.'),
    spacer(),
    speechPara('AIDEP\'in rota optimizasyonu uygulandığında, bu oran yüzde ona düştü.'),
    spacer(),
    stagePara('Dur. Bırak bu rakam oturuklanmaya zaman ver.'),
    spacer(),
    speechPara('Yüzde altmıştan yüzde onun altına. Bu, ekiplerin karşılaştığı tehlikenin dramatik biçimde azaldığı anlamına geliyor. Ve daha az tehlike, daha hızlı ulaşım, daha fazla kurtarılan hayat demek.'),
    spacer(),
    speechPara('Hasar tespiti modelimiz YOLOv8m\'de hedeflediğimiz doğruluk oranı yüzde seksen üç mAP@50. Bu, deprem görüntüleme ve sınıflandırma alanında oldukça rekabetçi bir hedef.'),
    spacer(),

    // ── BÖLÜM 6: KAPANIS ───────────────────────────────────────────────────
    ...sectionTitle('BÖLÜM 6', 'Kapanış', '30 saniye'),
    stagePara('En yavaş, en net bölüm. Her kelimeyi hisset.'),
    spacer(),
    speechPara('Türkiye, tarihsel olarak dünyanın en aktif deprem kuşaklarından birinin üzerinde yer alıyor. Bu bir soru değil, bir gerçek.'),
    spacer(),
    speechPara('Soru şu: Bir dahaki sefere hazır olacak mıyız?'),
    spacer(),
    speechPara('AIDEP, bu soruya teknolojinin verebileceği en somut yanıtlardan biri.'),
    spacer(),
    speechPara('Enkaza ulaşan her dakikanın önem taşıdığı o kritik pencerede, yapay zekâ hayat kurtarabilir.'),
    spacer(),
    speechPara('Bizi dinlediğiniz için teşekkür ederiz.'),
    stagePara('Hafifçe eğil. Gülümse. Sorular için hazır ol.'),
    new Paragraph({ children: [new PageBreak()] }),

    // ── SORU-CEVAP REHBERİ ─────────────────────────────────────────────────
    heading1('Soru-Cevap Rehberi'),
    bodyText('Aşağıdaki sorular jüri tarafından yüksek olasılıkla sorulacak sorulardır. Cevapları ezberlemek yerine ana fikri kavra ve kendi cümlelerinle ifade et.'),
    spacer(),
    ...qaItem(
      'YOLOv8m\'i neden seçtiniz?',
      'YOLOv8m, hız ve doğruluk dengesini en iyi kuran nesne tespit modellerinden biri. Afet senaryolarında gerçek zamanlı işleme kritik olduğu için büyük modeller yerine medium variant\'ı tercih ettik. Ayrıca transfer learning için geniş bir önceden eğitilmiş ağırlık ekosistemi mevcut.'
    ),
    ...qaItem(
      'Gerçek depremde test ettiniz mi?',
      'Şu aşamada simülasyon verileri üzerinde çalışıyoruz; Kahramanmaraş depremi verilerini kullandık. Gerçek afet ortamında canlı test, Selçuklu Belediyesi ile planlanan pilot tatbikat kapsamında yapılacak. Bu, akademik gelişmeden saha uygulamasına geçişimizin doğal adımı.'
    ),
    ...qaItem(
      'Mevcut AFAD sistemlerinden farkı nedir?',
      'AFAD\'ın mevcut araçları koordinasyon ve kaynak yönetimine odaklanır; görüntü tabanlı hasar tespitini dinamik rota optimizasyonuyla birleştiren yerli bir sistem literatürde bulunmuyor. AIDEP bu boşluğu dolduruyor ve AFAD sistemleriyle entegre çalışabilecek şekilde tasarlandı.'
    ),
    ...qaItem(
      'Vatandaşlar neden fotoğraf paylaşsın?',
      'Deprem anında sosyal medyada zaten milyonlarca fotoğraf paylaşılıyor. Biz bu davranışı sistematik hale getiriyoruz; uygulamamız GPS damgasını otomatik ekliyor ve kullanıcıdan minimal çaba istiyor. Ayrıca faz 1\'deki tatbikat süreciyle topluluk bilinci oluşturarak gönüllü katılımı artırmayı hedefliyoruz.'
    ),
    ...qaItem(
      'Ölçeklenebilirlik nasıl sağlanacak?',
      'FastAPI asenkron yapısıyla yüksek eş zamanlı bağlantıyı destekliyor. PostgreSQL ve Firebase yatay ölçeklendirmeye uygun. YOLOv8m çıkarım GPU cluster\'larında paralel çalışabilir. Yük testi yol haritamızın kısa vadeli önceliklerinden biri.'
    ),
    ...qaItem(
      'Offline mod nasıl çalışıyor?',
      'Uygulama, son güncellenen harita ve rota verilerini yerel depolamada önbellekliyor. İnternet bağlantısı kesildiğinde ekip, en son güvenli rotayla hareket edebilir. Bağlantı yeniden sağlandığında veriler senkronize ediliyor. Bu özellik deprem sonrası altyapı çöküşlerine karşı kritik bir önlem.'
    ),
    new Paragraph({ children: [new PageBreak()] }),

    // ── SUNUM İPUÇLARI ─────────────────────────────────────────────────────
    heading1('Sunum İpuçları'),
    heading2('Fiziksel Duruş ve Ses'),
    bullet('Kürsüye yaslanma — dik dur, omuzlarını geri çek'),
    bullet('Jüriyle göz teması kur; slaytlara sırtını dönme'),
    bullet('Rakamları söylerken yavaşla: "yüzde... altmış... tan... yüzde ona" gibi'),
    bullet('Elleri doğal kullan; masaya veya kürsüye vurma'),
    spacer(),
    heading2('Zamanlama'),
    bullet('Saati izleme — sunum öncesinde pratik yap ve içini hisset'),
    bullet('Giriş ve kapanışa fazladan süre harca; teknik bölümü biraz kısaltabilirsin'),
    bullet('Soru-cevap bölümü için enerjini sakla; sunum sonunda bitkin görünme'),
    spacer(),
    heading2('Bu Projeye Özel'),
    bullet('Kahramanmaraş bölümünde duygusal ama kontrollü ol — acıyı araçsallaştırma, gerçeği anlat'),
    bullet('%60→%10 rakamını sahneye damgala: yavaş söyle, bir an için ses'),
    bullet('YOLOv8m, XGBoost, OSRM gibi teknik terimleri jüriye doğal açıkla — bilmiyorlarsa anlat, biliyorlarsa saygı duyarlar'),
    bullet('Soru-cevapta "bilmiyoruz / henüz test etmedik" demekten çekinme — dürüstlük güven verir'),
    bullet('Projenin geleceğini anlatırken heyecanın gerçek olsun; vizyon, jüri için en güçlü satış noktasıdır'),
  ];

  return new Document({
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
        },
      ],
    },
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 36, bold: true, font: 'Arial', color: NAVY },
          paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 26, bold: true, font: 'Arial', color: BLUE },
          paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
      ],
    },
    sections: [{
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      footers: { default: makeFooter('Teknosel Sunum Yazısı') },
      children,
    }],
  });
}

// ── ÜRETİM ─────────────────────────────────────────────────────────────────
async function main() {
  const outDir = __dirname;

  const doc1 = makeTeknikDoc();
  const buf1 = await Packer.toBuffer(doc1);
  fs.writeFileSync(path.join(outDir, 'AIDEP-Teknik-Dokumantasyon.docx'), buf1);
  console.log('✔ AIDEP-Teknik-Dokumantasyon.docx');

  const doc2 = makeSunumDoc();
  const buf2 = await Packer.toBuffer(doc2);
  fs.writeFileSync(path.join(outDir, 'AIDEP-Sunum-Yazisi.docx'), buf2);
  console.log('✔ AIDEP-Sunum-Yazisi.docx');
}

main().catch(console.error);
