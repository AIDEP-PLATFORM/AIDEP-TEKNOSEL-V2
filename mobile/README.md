# AIDEP Mobile

AIDEP afet yönetim platformunun React Native mobil uygulaması.

## Teknolojiler

- React Native 0.81 + Expo 54
- Expo Router 6 (dosya tabanlı yönlendirme)
- TypeScript
- Zustand (state yönetimi)
- MMKV (hızlı yerel depolama)

## Kurulum

```bash
npm install
npx expo start
```

## Klasör Yapısı

```
mobile/
├── app/                        # Expo Router — dosya tabanlı routing
│   ├── _layout.tsx             # Root layout
│   ├── index.tsx               # Giriş noktası (auth'a yönlendirir)
│   ├── (auth)/                 # Giriş yapılmamış kullanıcılar
│   │   ├── _layout.tsx
│   │   ├── login.tsx           # Giriş ekranı
│   │   └── register.tsx        # Kayıt ekranı
│   └── (app)/                  # Giriş yapılmış kullanıcılar
│       ├── _layout.tsx         # Auth + rol kontrolü
│       └── (tabs)/
│           ├── _layout.tsx     # Rol bazlı tab navigasyonu
│           ├── home.tsx        # Ana sayfa
│           ├── map.tsx         # Harita / hasar görünümü
│           ├── report.tsx      # Hasar bildir
│           └── profile.tsx     # Profil
│
├── components/
│   ├── common/                 # Button, Input, LoadingScreen
│   ├── auth/                   # Giriş/kayıt bileşenleri
│   ├── map/                    # Harita bileşenleri
│   └── damage/                 # Hasar bildirimi bileşenleri
│
├── services/                   # API katmanı
│   ├── api.client.ts           # Temel fetch istemcisi
│   ├── auth.service.ts         # Auth endpointleri
│   ├── damage.service.ts       # Hasar raporu endpointleri
│   └── route.service.ts        # Rota endpointleri
│
├── store/                      # Zustand store'ları
│   ├── auth.store.ts           # Kullanıcı / token state
│   └── damage.store.ts         # Hasar raporu state
│
├── types/                      # TypeScript tipleri
│   ├── auth.types.ts
│   ├── damage.types.ts
│   └── route.types.ts
│
├── hooks/                      # Custom hook'lar
│   ├── use-auth.ts             # Giriş/çıkış işlemleri
│   ├── use-location.ts         # GPS konum
│   └── use-websocket.ts        # Gerçek zamanlı bağlantı
│
├── utils/
│   ├── storage.ts              # MMKV wrapper
│   └── validators.ts           # Form doğrulama
│
└── constants/
    ├── theme.ts                # Renkler, spacing, typography
    └── config.ts               # API URL'leri, storage key'leri
```

## Kullanıcı Rolleri

| Rol | Açıklama |
|-----|----------|
| `citizen` | Vatandaş — fotoğraf paylaşır |
| `rescue` | Kurtarma ekibi — rota görür |
| `volunteer` | Gönüllü |
| `afad` | AFAD/UMKE görevlisi |
