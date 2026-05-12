import { Box, Flex, Grid, Text, Stack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'

const MotionBox = motion(Box)
const MotionFlex = motion(Flex)

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// ── Mock veri deposu ─────────────────────────────────────────────
const allRequests: Record<string, {
  id: string; title: string; location: string; severity: string
  status: string; time: string; description: string
  reporter: string; phone: string; assignedTo: string
  updates: { text: string; time: string; author: string }[]
}> = {
  '1042': {
    id:'#1042', title:'Enkaz altında yaralı var', location:'Kadıköy, İstanbul',
    severity:'Yüksek', status:'Açık', time:'12 dk önce',
    description:'Kadıköy Moda Caddesi üzerinde 4 katlı bir binada enkaz altında kalan bireyler için acil kurtarma desteği gerekmektedir. İlk gözlemlere göre 2-3 kişi enkaz altında olabilir.',
    reporter:'Ahmet Kaya', phone:'0532 000 11 22', assignedTo:'AFAD Kadıköy Ekibi',
    updates:[
      { text:'Talep sisteme alındı', time:'12 dk önce', author:'Sistem' },
      { text:'AFAD ekibi yönlendirildi, 8 dk içinde bölgede', time:'10 dk önce', author:'Koordinatör Fatma K.' },
      { text:'Ekip bölgeye ulaştı, enkaz taraması başladı', time:'4 dk önce', author:'AFAD Kadıköy' },
    ],
  },
  '1041': {
    id:'#1041', title:'Bina çökmesi', location:'Bornova, İzmir',
    severity:'Kritik', status:'Devam', time:'34 dk önce',
    description:'Bornova ilçesinde 6 katlı apartman kısmi çöküş yaşadı. Yaklaşık 15-20 kişi tahliye edildi, enkaz altında kişi olduğu tahmin ediliyor.',
    reporter:'Zeynep Arslan', phone:'0533 111 22 33', assignedTo:'AFAD İzmir + UMKE',
    updates:[
      { text:'Kritik talep sisteme alındı', time:'34 dk önce', author:'Sistem' },
      { text:'AFAD İzmir ve UMKE ekipleri bölgeye sevk edildi', time:'30 dk önce', author:'İl Koordinatörü' },
      { text:'Enkaz kurtarma operasyonu devam ediyor, 3 kişi kurtarıldı', time:'15 dk önce', author:'AFAD İzmir' },
      { text:'UMKE sahra hastanesi kurulumu tamamlandı', time:'8 dk önce', author:'UMKE Ekibi' },
    ],
  },
  '1040': {
    id:'#1040', title:'Yol kapanması', location:'Çankaya, Ankara',
    severity:'Orta', status:'Açık', time:'1 sa önce',
    description:'Çankaya Atatürk Bulvarı üzerinde heyelan nedeniyle yol trafiğe kapanmıştır. Araçlar mahsur kaldı.',
    reporter:'Murat Demir', phone:'0534 222 33 44', assignedTo:'Ankara Büyükşehir Belediyesi',
    updates:[
      { text:'Talep sisteme alındı', time:'1 sa önce', author:'Sistem' },
      { text:'Belediye ekipleri bilgilendirildi', time:'55 dk önce', author:'Koordinatör' },
    ],
  },
  '1039': {
    id:'#1039', title:'Tıbbi yardım gerekli', location:'Nilüfer, Bursa',
    severity:'Yüksek', status:'Devam', time:'2 sa önce',
    description:'Nilüfer ilçesinde deprem sonrası yaralı bireylere acil tıbbi müdahale gerekmektedir.',
    reporter:'Selin Kara', phone:'0535 333 44 55', assignedTo:'UMKE Bursa',
    updates:[
      { text:'Talep alındı', time:'2 sa önce', author:'Sistem' },
      { text:'UMKE Bursa ekibi yönlendirildi', time:'1 sa 50 dk önce', author:'Koordinatör' },
      { text:'4 yaralıya müdahale edildi, 2 kişi hastaneye sevk edildi', time:'1 sa önce', author:'UMKE Bursa' },
    ],
  },
  '1038': {
    id:'#1038', title:'Altyapı hasarı', location:'Muratpaşa, Antalya',
    severity:'Düşük', status:'Çözüldü', time:'3 sa önce',
    description:'Muratpaşa ilçesinde su borusu patlaması nedeniyle altyapı hasarı oluştu.',
    reporter:'Can Yıldız', phone:'0536 444 55 66', assignedTo:'Antalya Su İdaresi',
    updates:[
      { text:'Talep alındı', time:'3 sa önce', author:'Sistem' },
      { text:'Teknik ekip gönderildi', time:'2 sa 45 dk önce', author:'Koordinatör' },
      { text:'Boru tamiri tamamlandı, sorun çözüldü', time:'1 sa 30 dk önce', author:'Teknik Ekip' },
    ],
  },
  '1037': {
    id:'#1037', title:'Mahsur kalan vatandaşlar', location:'Gebze, Kocaeli',
    severity:'Kritik', status:'Açık', time:'4 sa önce',
    description:'Gebze\'de sel nedeniyle mahalle sakinleri binalarında mahsur kaldı. Tahliye operasyonu gerekmektedir.',
    reporter:'Elif Şahin', phone:'0537 555 66 77', assignedTo:'AFAD Kocaeli',
    updates:[
      { text:'Kritik talep alındı', time:'4 sa önce', author:'Sistem' },
      { text:'AFAD Kocaeli ekibi sahaya indi', time:'3 sa 40 dk önce', author:'İl Koordinatörü' },
    ],
  },
  '1036': {
    id:'#1036', title:'Su baskını', location:'Menemen, İzmir',
    severity:'Orta', status:'Çözüldü', time:'5 sa önce',
    description:'Menemen ilçesinde dere yatağının taşması sonucu su baskını yaşandı.',
    reporter:'Hakan Doğan', phone:'0538 666 77 88', assignedTo:'İzmir Büyükşehir',
    updates:[
      { text:'Talep alındı', time:'5 sa önce', author:'Sistem' },
      { text:'Belediye tahliye ekibi gönderildi', time:'4 sa 30 dk önce', author:'Koordinatör' },
      { text:'Bölge tahliye edildi, su çekildi', time:'2 sa önce', author:'İzmir Büyükşehir' },
    ],
  },
  '1043': {
    id:'#1043', title:'Enkaz kurtarma operasyonu', location:'Pendik, İstanbul',
    severity:'Kritik', status:'Çözüldü', time:'25 dk önce',
    description:'Pendik\'te çöken binadaki enkaz kurtarma operasyonu başarıyla tamamlandı.',
    reporter:'Tuğba Yılmaz', phone:'0539 777 88 99', assignedTo:'AFAD İstanbul',
    updates:[
      { text:'Talep alındı', time:'2 sa önce', author:'Sistem' },
      { text:'AFAD ekibi sevk edildi', time:'1 sa 45 dk önce', author:'Koordinatör' },
      { text:'Tüm kişiler enkaz altından kurtarıldı', time:'25 dk önce', author:'AFAD İstanbul' },
    ],
  },
  '1045': {
    id:'#1045', title:'Yeni talep — Pendik', location:'Pendik, İstanbul',
    severity:'Yüksek', status:'Açık', time:'Az önce',
    description:'Pendik ilçesinde yapı hasarı bildirildi, acil değerlendirme ekibi gerekmektedir.',
    reporter:'Vatandaş Bildirimi', phone:'-', assignedTo:'Atanmadı',
    updates:[
      { text:'Talep sisteme alındı', time:'Az önce', author:'Sistem' },
    ],
  },
}

const sev: Record<string,{color:string;bg:string}> = {
  'Kritik': { color:'#f87171', bg:'rgba(248,113,113,0.12)' },
  'Yüksek': { color:'#fb923c', bg:'rgba(251,146,60,0.12)'  },
  'Orta':   { color:'#fbbf24', bg:'rgba(251,191,36,0.12)'  },
  'Düşük':  { color:'#4ade80', bg:'rgba(74,222,128,0.12)'  },
}
const sta: Record<string,{color:string;bg:string}> = {
  'Açık':    { color:'#60a5fa', bg:'rgba(96,165,250,0.12)' },
  'Devam':   { color:'#fbbf24', bg:'rgba(251,191,36,0.12)' },
  'Çözüldü': { color:'#4ade80', bg:'rgba(74,222,128,0.12)' },
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const req = id ? allRequests[id] : null

  if (!req) {
    return (
      <Flex h="60vh" align="center" justify="center" direction="column" gap={3}>
        <Text color="rgba(255,255,255,0.4)" fontSize="lg">Talep bulunamadı</Text>
        <MotionBox onClick={() => navigate('/requests')} cursor="pointer"
          px={4} py={2} borderRadius="xl" bg="rgba(96,165,250,0.12)"
          border="1px solid rgba(96,165,250,0.3)" color="#60a5fa"
          whileHover={{ opacity:0.8 } as any} transition={{ duration:0.15 } as any}>
          <Text fontSize="sm" fontWeight="600">← Taleplere Dön</Text>
        </MotionBox>
      </Flex>
    )
  }

  const sevCfg = sev[req.severity] ?? sev['Orta']
  const staCfg = sta[req.status]  ?? sta['Açık']

  return (
    <Box px={6} py={5}>

      {/* Başlık */}
      <MotionFlex align="center" gap={4} mb={6}
        initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.3 } as any}>

        <MotionBox onClick={() => navigate('/requests')}
          cursor="pointer" w={9} h={9} borderRadius="xl"
          bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
          display="flex" alignItems="center" justifyContent="center"
          color="rgba(255,255,255,0.5)"
          whileHover={{ bg:'rgba(255,255,255,0.08)', color:'white' } as any}
          whileTap={{ scale:0.9 } as any} transition={{ duration:0.15 } as any}>
          <BackIcon />
        </MotionBox>

        <Box flex={1}>
          <Flex align="center" gap={3} flexWrap="wrap">
            <Text color="rgba(255,255,255,0.35)" fontSize="sm" fontFamily="mono">{req.id}</Text>
            <Text color="white" fontWeight="800" fontSize="lg">{req.title}</Text>
          </Flex>
          <Flex align="center" gap={2} mt={1}>
            <Box color="rgba(255,255,255,0.3)" display="flex"><MapPinIcon /></Box>
            <Text fontSize="xs" color="rgba(255,255,255,0.4)">{req.location}</Text>
            <Box w="1px" h={3} bg="rgba(255,255,255,0.15)" />
            <Box color="rgba(255,255,255,0.3)" display="flex"><ClockIcon /></Box>
            <Text fontSize="xs" color="rgba(255,255,255,0.4)">{req.time}</Text>
          </Flex>
        </Box>

        {/* Rozet grubu */}
        <Flex gap={2} align="center">
          <Flex px={3} py={1.5} borderRadius="full" bg={sevCfg.bg} border={`1px solid ${sevCfg.color}40`}>
            <Text fontSize="11px" fontWeight="700" color={sevCfg.color}>{req.severity}</Text>
          </Flex>
          <Flex align="center" gap={1.5} px={3} py={1.5} borderRadius="full" bg={staCfg.bg} border={`1px solid ${staCfg.color}40`}>
            {req.status === 'Devam' && (
              <MotionBox w={1.5} h={1.5} borderRadius="full" bg={staCfg.color}
                animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.5, repeat:Infinity } as any}/>
            )}
            {req.status === 'Çözüldü' && <Box color={staCfg.color} display="flex"><CheckIcon /></Box>}
            <Text fontSize="11px" fontWeight="700" color={staCfg.color}>{req.status}</Text>
          </Flex>
        </Flex>
      </MotionFlex>

      {/* İçerik grid */}
      <Grid templateColumns={{ base:'1fr', lg:'1.4fr 1fr' }} gap={5}>

        {/* Sol — Açıklama + Güncelleme akışı */}
        <Stack spacing={4}>

          {/* Açıklama */}
          <MotionBox initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.1, duration:0.3 } as any}
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
            borderRadius="2xl" p={5} backdropFilter="blur(12px)">
            <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
              textTransform="uppercase" letterSpacing="widest" mb={3}>Talep Açıklaması</Text>
            <Text fontSize="sm" color="rgba(255,255,255,0.75)" lineHeight="1.8">{req.description}</Text>
          </MotionBox>

          {/* Güncelleme akışı */}
          <MotionBox initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.18, duration:0.3 } as any}
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
            borderRadius="2xl" p={5} backdropFilter="blur(12px)">
            <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
              textTransform="uppercase" letterSpacing="widest" mb={4}>Durum Güncellemeleri</Text>

            <Stack spacing={0} position="relative">
              {/* Dikey çizgi */}
              <Box position="absolute" left="7px" top="14px"
                bottom="14px" w="1px" bg="rgba(255,255,255,0.08)" />

              {req.updates.map((u, i) => (
                <MotionBox key={i}
                  initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay:0.22 + i*0.06, duration:0.25 } as any}>
                  <Flex gap={4} pb={i < req.updates.length - 1 ? 5 : 0}>
                    {/* Nokta */}
                    <Box w={4} h={4} borderRadius="full" flexShrink={0} mt={0.5}
                      bg={i === req.updates.length - 1 ? staCfg.color : 'rgba(255,255,255,0.15)'}
                      border={`2px solid ${i === req.updates.length - 1 ? staCfg.color : 'rgba(255,255,255,0.1)'}`}
                      position="relative" zIndex={1} />
                    <Box flex={1}>
                      <Text fontSize="sm" color="rgba(255,255,255,0.8)" lineHeight="1.5">{u.text}</Text>
                      <Flex align="center" gap={2} mt={1}>
                        <Text fontSize="10px" color="rgba(255,255,255,0.3)">{u.author}</Text>
                        <Box w="1px" h={2.5} bg="rgba(255,255,255,0.1)" />
                        <Text fontSize="10px" color="rgba(255,255,255,0.25)">{u.time}</Text>
                      </Flex>
                    </Box>
                  </Flex>
                </MotionBox>
              ))}
            </Stack>
          </MotionBox>
        </Stack>

        {/* Sağ — Detay kartları */}
        <Stack spacing={4}>

          {/* Talep bilgileri */}
          <MotionBox initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.14, duration:0.3 } as any}
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
            borderRadius="2xl" p={5} backdropFilter="blur(12px)">
            <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
              textTransform="uppercase" letterSpacing="widest" mb={4}>Talep Bilgileri</Text>
            <Stack spacing={3.5}>
              {[
                { label:'Bildiren', value:req.reporter, icon:<UserIcon /> },
                { label:'Telefon',  value:req.phone,    icon:<ClockIcon /> },
                { label:'Atanan',   value:req.assignedTo, icon:<UserIcon /> },
                { label:'Konum',    value:req.location, icon:<MapPinIcon /> },
              ].map(row => (
                <Flex key={row.label} align="flex-start" gap={3}>
                  <Box color="rgba(255,255,255,0.25)" display="flex" mt={0.5} flexShrink={0}>{row.icon}</Box>
                  <Box flex={1}>
                    <Text fontSize="9px" color="rgba(255,255,255,0.25)" fontWeight="700"
                      textTransform="uppercase" letterSpacing="wider">{row.label}</Text>
                    <Text fontSize="sm" color="rgba(255,255,255,0.75)" fontWeight="500" mt={0.5}>{row.value}</Text>
                  </Box>
                </Flex>
              ))}
            </Stack>
          </MotionBox>

          {/* Hızlı aksiyonlar */}
          <MotionBox initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.22, duration:0.3 } as any}
            bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
            borderRadius="2xl" p={5} backdropFilter="blur(12px)">
            <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
              textTransform="uppercase" letterSpacing="widest" mb={4}>Hızlı İşlemler</Text>
            <Stack spacing={2}>
              {[
                { label:'Ekip Ata',         color:'#818cf8', bg:'rgba(129,140,248,0.1)',  border:'rgba(129,140,248,0.25)' },
                { label:'Durumu Güncelle',   color:'#fbbf24', bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.25)'  },
                { label:'Talebi Çöz',        color:'#4ade80', bg:'rgba(74,222,128,0.1)',  border:'rgba(74,222,128,0.25)'  },
                { label:'Haritada Göster',   color:'#60a5fa', bg:'rgba(96,165,250,0.1)',  border:'rgba(96,165,250,0.25)'  },
              ].map(action => (
                <MotionBox key={action.label}
                  cursor="pointer" px={4} py={2.5} borderRadius="xl"
                  bg={action.bg} border={`1px solid ${action.border}`}
                  whileHover={{ opacity:0.85 } as any}
                  whileTap={{ scale:0.97 } as any}
                  transition={{ duration:0.12 } as any}
                  onClick={() => action.label === 'Haritada Göster' && navigate('/map')}>
                  <Text fontSize="sm" fontWeight="600" color={action.color}>{action.label}</Text>
                </MotionBox>
              ))}
            </Stack>
          </MotionBox>
        </Stack>
      </Grid>
    </Box>
  )
}
