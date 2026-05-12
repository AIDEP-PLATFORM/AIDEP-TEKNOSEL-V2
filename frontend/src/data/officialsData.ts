export type OfficialMemberStatus = 'Müsait' | 'Görevde' | 'Pasif'
export type OrgStatus = 'Aktif' | 'Pasif'
export type OrgKey = 'AFAD' | 'UMKE' | 'Kızılay'

export interface OfficialMember {
  id: string
  name: string
  role: string
  phone: string
  joined: string
  il: string
  ilce: string
  status: OfficialMemberStatus
}

export interface OfficialOrg {
  id: string
  org: OrgKey
  description: string
  status: OrgStatus
  members: OfficialMember[]
}

export const OFFICIALS: OfficialOrg[] = [
  {
    id: 'afad',
    org: 'AFAD',
    description: 'Afet ve Acil Durum Yönetimi',
    status: 'Aktif',
    members: [
      { id:'a01', name:'Mehmet Yıldız',   role:'Kurtarma Uzmanı',    phone:'0532 111 11 11', joined:'2021-03', il:'İstanbul', ilce:'Kadıköy',   status:'Görevde' },
      { id:'a02', name:'Fatma Kara',      role:'Koordinatör',         phone:'0533 222 22 22', joined:'2021-07', il:'İstanbul', ilce:'Kadıköy',   status:'Müsait'  },
      { id:'a03', name:'Ali Çetin',       role:'Operasyon Uzmanı',    phone:'0534 333 33 33', joined:'2022-01', il:'İstanbul', ilce:'Kadıköy',   status:'Müsait'  },
      { id:'a04', name:'Leyla Özdemir',   role:'Afet Yöneticisi',     phone:'0535 444 44 44', joined:'2020-11', il:'İstanbul', ilce:'Beşiktaş',  status:'Müsait'  },
      { id:'a05', name:'Emre Polat',      role:'Saha Koordinatörü',   phone:'0536 555 55 55', joined:'2022-04', il:'İstanbul', ilce:'Beşiktaş',  status:'Görevde' },
      { id:'a06', name:'Ayşe Karaoğlu',   role:'Lojistik Uzmanı',     phone:'0537 666 66 66', joined:'2023-01', il:'İstanbul', ilce:'Beşiktaş',  status:'Müsait'  },
      { id:'a07', name:'Ayşe Kara',       role:'Koordinatör',         phone:'0538 777 77 77', joined:'2021-09', il:'İzmir',    ilce:'Bornova',   status:'Müsait'  },
      { id:'a08', name:'Serkan Doğan',    role:'Lojistik Uzmanı',     phone:'0539 888 88 88', joined:'2022-06', il:'İzmir',    ilce:'Bornova',   status:'Müsait'  },
      { id:'a09', name:'Burak Yılmaz',    role:'Saha Uzmanı',         phone:'0540 999 99 99', joined:'2023-03', il:'İzmir',    ilce:'Bornova',   status:'Pasif'   },
      { id:'a10', name:'Selin Arslan',    role:'İdari Uzman',         phone:'0541 100 00 01', joined:'2022-08', il:'Ankara',   ilce:'Çankaya',   status:'Müsait'  },
      { id:'a11', name:'Okan Demir',      role:'Operasyon Şefi',      phone:'0542 200 00 02', joined:'2020-05', il:'Ankara',   ilce:'Çankaya',   status:'Görevde' },
      { id:'a12', name:'Tuğba Şahin',     role:'Afet Uzmanı',         phone:'0543 300 00 03', joined:'2023-05', il:'Bursa',    ilce:'Nilüfer',   status:'Müsait'  },
    ],
  },
  {
    id: 'umke',
    org: 'UMKE',
    description: 'Ulusal Medikal Kurtarma',
    status: 'Aktif',
    members: [
      { id:'u01', name:'Hasan Güler',     role:'Acil Tıp Doktoru',    phone:'0532 101 01 01', joined:'2020-08', il:'Ankara',   ilce:'Çankaya',   status:'Müsait'  },
      { id:'u02', name:'Neslihan Aydın',  role:'Hemşire',             phone:'0533 202 02 02', joined:'2021-02', il:'Ankara',   ilce:'Çankaya',   status:'Görevde' },
      { id:'u03', name:'Yusuf Kaplan',    role:'Paramedik',           phone:'0534 303 03 03', joined:'2022-01', il:'Ankara',   ilce:'Çankaya',   status:'Müsait'  },
      { id:'u04', name:'Merve Aktaş',     role:'Acil Tıp Teknisyeni', phone:'0535 404 04 04', joined:'2022-06', il:'Ankara',   ilce:'Keçiören',  status:'Müsait'  },
      { id:'u05', name:'Kemal Yıldız',    role:'Doktor',              phone:'0536 505 05 05', joined:'2021-11', il:'Ankara',   ilce:'Keçiören',  status:'Pasif'   },
      { id:'u06', name:'Seda Öztürk',     role:'Hemşire',             phone:'0537 606 06 06', joined:'2021-05', il:'İzmir',    ilce:'Konak',     status:'Görevde' },
      { id:'u07', name:'Burak Arslan',    role:'Acil Tıp Teknisyeni', phone:'0538 707 07 07', joined:'2022-09', il:'İzmir',    ilce:'Konak',     status:'Müsait'  },
      { id:'u08', name:'Canan Korkmaz',   role:'Paramedik',           phone:'0539 808 08 08', joined:'2023-02', il:'İzmir',    ilce:'Konak',     status:'Müsait'  },
      { id:'u09', name:'Duygu Yılmaz',    role:'Paramedik',           phone:'0540 909 09 09', joined:'2022-03', il:'Bursa',    ilce:'Nilüfer',   status:'Pasif'   },
      { id:'u10', name:'Ercan Polat',     role:'Sağlık Teknisyeni',   phone:'0541 010 10 10', joined:'2023-07', il:'Bursa',    ilce:'Nilüfer',   status:'Müsait'  },
    ],
  },
  {
    id: 'kizilay',
    org: 'Kızılay',
    description: 'Türk Kızılay Yardım',
    status: 'Aktif',
    members: [
      { id:'k01', name:'Emre Şahin',      role:'Yardım Koordinatörü', phone:'0532 110 11 11', joined:'2020-04', il:'İstanbul', ilce:'Üsküdar',   status:'Müsait'  },
      { id:'k02', name:'Cansu Demir',     role:'Sosyal Hizmet Uzm.',  phone:'0533 220 22 22', joined:'2021-01', il:'İstanbul', ilce:'Üsküdar',   status:'Görevde' },
      { id:'k03', name:'Fatih Arslan',    role:'Lojistik Görevlisi',  phone:'0534 330 33 33', joined:'2022-05', il:'İstanbul', ilce:'Üsküdar',   status:'Müsait'  },
      { id:'k04', name:'Zeynep Arslan',   role:'Sağlık Görevlisi',    phone:'0535 440 44 44', joined:'2019-08', il:'Ankara',   ilce:'Altındağ',  status:'Pasif'   },
      { id:'k05', name:'Mert Çakar',      role:'Kan Bağışı Sor.',     phone:'0536 550 55 55', joined:'2021-10', il:'Ankara',   ilce:'Altındağ',  status:'Müsait'  },
      { id:'k06', name:'Dilan Yıldız',    role:'Koordinatör',         phone:'0537 660 66 66', joined:'2022-02', il:'Ankara',   ilce:'Altındağ',  status:'Müsait'  },
      { id:'k07', name:'İrem Koçak',      role:'Yardım Dağıtım Sor.', phone:'0538 770 77 77', joined:'2021-07', il:'Antalya',  ilce:'Muratpaşa', status:'Müsait'  },
      { id:'k08', name:'Serhat Güneş',    role:'Saha Görevlisi',      phone:'0539 880 88 88', joined:'2022-11', il:'Antalya',  ilce:'Muratpaşa', status:'Görevde' },
      { id:'k09', name:'Aslı Kocaer',     role:'İdari Personel',      phone:'0540 990 99 99', joined:'2023-04', il:'Antalya',  ilce:'Kepez',     status:'Müsait'  },
    ],
  },
]

export const orgConfig: Record<OrgKey, { color: string; bg: string; border: string }> = {
  AFAD:    { color:'#60a5fa', bg:'rgba(96,165,250,0.1)',   border:'rgba(96,165,250,0.25)'  },
  UMKE:    { color:'#fbbf24', bg:'rgba(251,191,36,0.1)',   border:'rgba(251,191,36,0.25)'  },
  Kızılay: { color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.25)' },
}

export const memberStatusCfg: Record<OfficialMemberStatus, { color: string; bg: string }> = {
  'Müsait':  { color:'#4ade80', bg:'rgba(74,222,128,0.12)'  },
  'Görevde': { color:'#60a5fa', bg:'rgba(96,165,250,0.12)'  },
  'Pasif':   { color:'#9ca3af', bg:'rgba(156,163,175,0.12)' },
}
