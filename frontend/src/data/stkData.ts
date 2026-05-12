export type StkStatus = 'Aktif' | 'Pasif' | 'Beklemede'

export interface Member {
  id: string
  name: string
  role: string
  phone: string
  joined: string
  il: string
  ilce: string
  status: 'Aktif' | 'Pasif' | 'İzinli'
}

export interface Stk {
  id: string
  org: string
  activity: string
  status: StkStatus
  members: Member[]
}

export const STKS: Stk[] = [
  {
    id: 'S01', org: 'AKUT Arama Kurtarma', activity: 'Arama Kurtarma', status: 'Aktif',
    members: [
      { id:'m01', name:'Ayşe Kaya',       role:'Ekip Lideri',       phone:'0532 111 22 33', joined:'2023-04', il:'İstanbul', ilce:'Kadıköy',   status:'Aktif'  },
      { id:'m02', name:'Berk Öztürk',     role:'Kurtarma Uzmanı',   phone:'0541 222 33 44', joined:'2023-06', il:'İstanbul', ilce:'Kadıköy',   status:'Aktif'  },
      { id:'m03', name:'Ceren Aktaş',     role:'İlk Yardım',         phone:'0555 333 44 55', joined:'2024-01', il:'İstanbul', ilce:'Üsküdar',   status:'İzinli' },
      { id:'m04', name:'Doruk Şahin',     role:'Kurtarma Uzmanı',   phone:'0506 444 55 66', joined:'2024-03', il:'İstanbul', ilce:'Beşiktaş',  status:'Aktif'  },
      { id:'m05', name:'Emel Yıldız',     role:'Lojistik',           phone:'0533 555 66 77', joined:'2023-09', il:'İzmir',    ilce:'Bornova',   status:'Aktif'  },
      { id:'m06', name:'Fikret Arslan',   role:'Kurtarma Uzmanı',   phone:'0542 666 77 88', joined:'2023-11', il:'İzmir',    ilce:'Bornova',   status:'Pasif'  },
      { id:'m07', name:'Gülnaz Çelik',    role:'İlk Yardım',         phone:'0536 777 88 99', joined:'2024-02', il:'Ankara',   ilce:'Çankaya',   status:'Aktif'  },
    ]
  },
  {
    id: 'S02', org: 'İHH İnsani Yardım', activity: 'İnsani Yardım', status: 'Aktif',
    members: [
      { id:'m08', name:'Mehmet Demir',    role:'Koordinatör',        phone:'0533 888 99 00', joined:'2022-11', il:'Ankara',   ilce:'Çankaya',   status:'Aktif'  },
      { id:'m09', name:'Elif Çelik',      role:'Lojistik',           phone:'0542 999 00 11', joined:'2023-02', il:'Ankara',   ilce:'Çankaya',   status:'Aktif'  },
      { id:'m10', name:'Furkan Yıldız',   role:'Saha Görevlisi',    phone:'0536 101 11 22', joined:'2023-09', il:'Ankara',   ilce:'Keçiören',  status:'İzinli' },
      { id:'m11', name:'Hatice Korkmaz',  role:'Saha Görevlisi',    phone:'0507 202 22 33', joined:'2024-01', il:'İstanbul', ilce:'Bağcılar',  status:'Aktif'  },
      { id:'m12', name:'İbrahim Yılmaz',  role:'Muhasebe',           phone:'0531 303 33 44', joined:'2023-05', il:'İstanbul', ilce:'Bağcılar',  status:'Aktif'  },
    ]
  },
  {
    id: 'S03', org: 'TEGV', activity: 'Eğitim & Gençlik', status: 'Aktif',
    members: [
      { id:'m13', name:'Fatma Şahin',     role:'Program Yöneticisi', phone:'0507 404 44 55', joined:'2023-01', il:'İzmir',    ilce:'Konak',     status:'Aktif'  },
      { id:'m14', name:'Gökhan Arslan',   role:'Eğitmen',            phone:'0531 505 55 66', joined:'2023-05', il:'İzmir',    ilce:'Konak',     status:'Aktif'  },
      { id:'m15', name:'Hande Kocaer',    role:'Eğitmen',            phone:'0544 606 66 77', joined:'2023-08', il:'İzmir',    ilce:'Buca',      status:'Pasif'  },
      { id:'m16', name:'İpek Doğan',      role:'Saha Koordinatör',  phone:'0538 707 77 88', joined:'2024-02', il:'Bursa',    ilce:'Osmangazi', status:'Aktif'  },
    ]
  },
  {
    id: 'S04', org: 'Hayata Destek Derneği', activity: 'Psikososyal Destek', status: 'Aktif',
    members: [
      { id:'m17', name:'Ali Yıldız',      role:'Psikolog',           phone:'0544 808 88 99', joined:'2022-08', il:'Bursa',    ilce:'Osmangazi', status:'Aktif'  },
      { id:'m18', name:'Jale Güneş',      role:'Sosyal Hizmet',      phone:'0538 909 99 00', joined:'2023-03', il:'Bursa',    ilce:'Osmangazi', status:'Aktif'  },
      { id:'m19', name:'Kemal Doğan',     role:'Saha Koordinatör',  phone:'0553 010 00 11', joined:'2023-11', il:'Bursa',    ilce:'Nilüfer',   status:'İzinli' },
      { id:'m20', name:'Lale Demirtaş',   role:'Psikolog',           phone:'0528 121 11 22', joined:'2024-01', il:'İstanbul', ilce:'Maltepe',   status:'Aktif'  },
      { id:'m21', name:'Mert Kaplan',     role:'Saha Görevlisi',    phone:'0516 232 22 33', joined:'2024-02', il:'İstanbul', ilce:'Maltepe',   status:'Aktif'  },
    ]
  },
  {
    id: 'S05', org: 'UKAM', activity: 'Afet Yönetimi', status: 'Pasif',
    members: [
      { id:'m22', name:'Zeynep Arslan',   role:'Afet Uzmanı',       phone:'0505 343 33 44', joined:'2022-05', il:'İstanbul', ilce:'Beşiktaş',  status:'Pasif'  },
      { id:'m23', name:'Neşet Güler',     role:'Lojistik',           phone:'0539 454 44 55', joined:'2022-09', il:'İstanbul', ilce:'Beşiktaş',  status:'Pasif'  },
    ]
  },
  {
    id: 'S06', org: 'Toplum Gönüllüleri Vakfı', activity: 'Eğitim & Gençlik', status: 'Aktif',
    members: [
      { id:'m24', name:'Kerem Polat',     role:'Proje Sorumlusu',   phone:'0543 565 55 66', joined:'2023-07', il:'Antalya',  ilce:'Muratpaşa', status:'Aktif'  },
      { id:'m25', name:'Özge Sarıkaya',   role:'Eğitmen',            phone:'0528 676 66 77', joined:'2024-01', il:'Antalya',  ilce:'Muratpaşa', status:'Aktif'  },
      { id:'m26', name:'Pınar Koç',       role:'Saha Görevlisi',    phone:'0516 787 77 88', joined:'2024-02', il:'Antalya',  ilce:'Kepez',     status:'İzinli' },
    ]
  },
  {
    id: 'S07', org: 'Doğa Derneği', activity: 'Çevre & Ekoloji', status: 'Beklemede',
    members: [
      { id:'m27', name:'Neslihan Kurt',   role:'Çevre Uzmanı',      phone:'0522 898 88 99', joined:'2024-04', il:'Ankara',   ilce:'Keçiören',  status:'Aktif'  },
    ]
  },
  {
    id: 'S08', org: 'Genç Hayat Vakfı', activity: 'Sosyal Yardım', status: 'Aktif',
    members: [
      { id:'m28', name:'Burak Aktaş',     role:'Vakıf Temsilcisi',  phone:'0546 909 99 00', joined:'2023-06', il:'İzmir',    ilce:'Konak',     status:'Aktif'  },
      { id:'m29', name:'Rüya Şen',        role:'Saha Görevlisi',    phone:'0537 010 00 11', joined:'2023-10', il:'İzmir',    ilce:'Konak',     status:'Aktif'  },
      { id:'m30', name:'Serkan Aydın',    role:'Lojistik',           phone:'0548 121 11 22', joined:'2024-01', il:'İzmir',    ilce:'Bornova',   status:'İzinli' },
    ]
  },
  {
    id: 'S09', org: 'İNSMER', activity: 'Arama Kurtarma', status: 'Beklemede',
    members: [
      { id:'m31', name:'Tarık Bozkurt',   role:'Kurtarma Uzmanı',   phone:'0548 232 22 33', joined:'2024-04', il:'Trabzon',  ilce:'Ortahisar', status:'Aktif'  },
      { id:'m32', name:'Ural Güler',      role:'İlk Yardım',         phone:'0529 343 33 44', joined:'2024-04', il:'Trabzon',  ilce:'Ortahisar', status:'Aktif'  },
    ]
  },
  {
    id: 'S10', org: 'Çukurova STK Platformu', activity: 'Lojistik', status: 'Pasif',
    members: [
      { id:'m33', name:'Cansu Erdoğan',   role:'Koordinatör',        phone:'0554 454 44 55', joined:'2023-01', il:'Adana',    ilce:'Seyhan',    status:'Pasif'  },
    ]
  },
]

export const activityColor: Record<string, string> = {
  'Arama Kurtarma':     '#f87171',
  'İnsani Yardım':      '#fb923c',
  'Eğitim & Gençlik':   '#fbbf24',
  'Psikososyal Destek': '#a78bfa',
  'Afet Yönetimi':      '#60a5fa',
  'Çevre & Ekoloji':    '#34d399',
  'Sosyal Yardım':      '#22d3ee',
  'Lojistik':           '#94a3b8',
}

export const stkStatusCfg: Record<StkStatus, { color: string; bg: string }> = {
  'Aktif':     { color:'#4ade80', bg:'rgba(74,222,128,0.12)'   },
  'Pasif':     { color:'#9ca3af', bg:'rgba(156,163,175,0.12)' },
  'Beklemede': { color:'#fbbf24', bg:'rgba(251,191,36,0.12)'  },
}

export const memberStatusCfg: Record<string, { color: string; bg: string }> = {
  'Aktif':   { color:'#4ade80', bg:'rgba(74,222,128,0.12)'   },
  'Pasif':   { color:'#9ca3af', bg:'rgba(156,163,175,0.12)' },
  'İzinli':  { color:'#fbbf24', bg:'rgba(251,191,36,0.12)'  },
}
