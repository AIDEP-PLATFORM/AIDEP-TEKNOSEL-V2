import { useState, useEffect, useRef } from 'react'
import { Box, Flex, Grid, Text, Stack, Select, Slider, SliderTrack, SliderFilledTrack, SliderThumb } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'

const MotionBox = motion(Box)
const MotionFlex = motion(Flex)

// ── Türkiye illeri ─────────────────────────────────────────────────
const ILLER = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta',
  'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak',
  'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan',
  'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce',
]

// ── Simülasyon fazları ─────────────────────────────────────────────
const PHASES = [
  { id: 'yolo', label: 'Hasar Tespiti', sub: 'YOLOv8 görüntü analizi', color: '#f87171', duration: 2200 },
  { id: 'xgb', label: 'Önceliklendirme', sub: 'XGBoost skor hesaplama', color: '#fbbf24', duration: 1800 },
  { id: 'osrm', label: 'Rota Optimizasyonu', sub: 'OSRM güvenli rota hesabı', color: '#34d399', duration: 2000 },
]

// ── Yardımcı ─────────────────────────────────────────────────────
function rnd(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a }

function buildResults(il: string, mag: number, depth: number, timeOfDay: string) {
  const factor = mag / 7.0
  const nightFactor = timeOfDay === 'gece' ? 1.3 : 1.0
  const depthFactor = depth < 10 ? 1.4 : depth < 20 ? 1.1 : 0.85

  const affected = Math.floor(rnd(8000, 25000) * factor * nightFactor * depthFactor)
  const buildings = Math.floor(rnd(120, 800) * factor * depthFactor)
  const roads = Math.floor(rnd(5, 35) * factor)
  const casualties = Math.floor(rnd(10, 200) * factor * nightFactor * depthFactor)

  const damageItems = [
    { zone: `${il} Merkez`, type: 'Bina Çöküşü', score: Math.floor(rnd(70, 99) * factor + 10), risk: 'Kritik' },
    { zone: `${il} Kuzey`, type: 'Yol Hasarı', score: Math.floor(rnd(50, 80) * factor + 5), risk: 'Yüksek' },
    { zone: `${il} Güney`, type: 'Altyapı', score: Math.floor(rnd(30, 65) * factor), risk: 'Orta' },
    { zone: `${il} Doğu`, type: 'Heyelan', score: Math.floor(rnd(20, 55) * factor), risk: 'Orta' },
  ].sort((a, b) => b.score - a.score)

  const priorities = [
    { id: '#TLP01', loc: `${il} Merkez — Çarşı Mah.`, score: Math.floor(rnd(88, 98) * factor + 2), type: 'Enkaz', resources: rnd(3, 8) },
    { id: '#TLP02', loc: `${il} — Hastane Kavşağı`, score: Math.floor(rnd(75, 92) * factor + 2), type: 'Tıbbi', resources: rnd(2, 5) },
    { id: '#TLP03', loc: `${il} Kuzey — D-400`, score: Math.floor(rnd(60, 82) * factor), type: 'Tahliye', resources: rnd(4, 10) },
    { id: '#TLP04', loc: `${il} Güney — Sanayi`, score: Math.floor(rnd(45, 70) * factor), type: 'Yangın', resources: rnd(2, 6) },
    { id: '#TLP05', loc: `${il} Doğu — Köy Yolu`, score: Math.floor(rnd(30, 60) * factor), type: 'Yol Açma', resources: rnd(1, 4) },
  ].map(p => ({ ...p, score: Math.min(p.score, 99) })).sort((a, b) => b.score - a.score)

  const routes = [
    { from: 'AFAD Merkezi', to: `${il} Merkez`, dist: `${rnd(2, 18)} km`, time: `${rnd(8, 35)} dk`, status: 'Açık', safe: true },
    { from: 'UMKE Hastane', to: `${il} Kuzey`, dist: `${rnd(5, 25)} km`, time: `${rnd(15, 45)} dk`, status: 'Kısıtlı', safe: false },
    { from: 'Kızılay Depo', to: `${il} Güney`, dist: `${rnd(8, 30)} km`, time: `${rnd(20, 55)} dk`, status: 'Açık', safe: true },
    { from: 'AFAD Merkezi', to: `${il} Doğu`, dist: `${rnd(12, 40)} km`, time: `${rnd(30, 70)} dk`, status: 'Kapalı', safe: false },
  ]

  const resources = [
    { type: 'Arama-Kurtarma Ekibi', count: rnd(4, 12), unit: 'ekip', color: '#f87171' },
    { type: 'Ambulans', count: rnd(6, 20), unit: 'araç', color: '#fb923c' },
    { type: 'İş Makinesi', count: rnd(3, 9), unit: 'araç', color: '#fbbf24' },
    { type: 'STK Gönüllüsü', count: rnd(20, 80), unit: 'kişi', color: '#34d399' },
    { type: 'Lojistik Araç', count: rnd(5, 15), unit: 'araç', color: '#60a5fa' },
  ]

  return { affected, buildings, roads, casualties, damageItems, priorities, routes, resources }
}

// ── Risk rengi ─────────────────────────────────────────────────────
const riskColor: Record<string, string> = {
  'Kritik': '#f87171', 'Yüksek': '#fb923c', 'Orta': '#fbbf24', 'Düşük': '#4ade80'
}
const typeColor: Record<string, string> = {
  'Enkaz': '#f87171', 'Tıbbi': '#fb923c', 'Tahliye': '#fbbf24', 'Yangın': '#f97316', 'Yol Açma': '#60a5fa'
}

// ── Faz göstergesi ────────────────────────────────────────────────
function PhaseIndicator({ phase, active, done }: { phase: typeof PHASES[0]; active: boolean; done: boolean }) {
  return (
    <Flex align="center" gap={3} px={4} py={3} borderRadius="xl"
      bg={done ? `${phase.color}10` : active ? `${phase.color}18` : 'rgba(255,255,255,0.02)'}
      border={`1px solid ${done || active ? phase.color + '35' : 'rgba(255,255,255,0.06)'}`}
      transition="all 0.3s">
      <Box w={8} h={8} borderRadius="full" flexShrink={0}
        bg={done ? `${phase.color}25` : active ? `${phase.color}20` : 'rgba(255,255,255,0.05)'}
        border={`2px solid ${done || active ? phase.color : 'rgba(255,255,255,0.1)'}`}
        display="flex" alignItems="center" justifyContent="center">
        {done ? (
          <Text fontSize="12px">✓</Text>
        ) : active ? (
          <MotionBox w={2.5} h={2.5} borderRadius="full" bg={phase.color}
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.8, repeat: Infinity } as any} />
        ) : (
          <Box w={2} h={2} borderRadius="full" bg="rgba(255,255,255,0.2)" />
        )}
      </Box>
      <Box>
        <Text fontSize="sm" fontWeight={active || done ? '600' : '400'}
          color={active || done ? 'white' : 'rgba(255,255,255,0.35)'}>{phase.label}</Text>
        <Text fontSize="10px" color={active ? phase.color : 'rgba(255,255,255,0.25)'}>{phase.sub}</Text>
      </Box>
      {done && (
        <Flex ml="auto" px={2} py={0.5} borderRadius="full"
          bg={`${phase.color}20`} border={`1px solid ${phase.color}30`}>
          <Text fontSize="9px" fontWeight="700" color={phase.color}>TAMAM</Text>
        </Flex>
      )}
    </Flex>
  )
}

// ── Ana bileşen ────────────────────────────────────────────────────
type SimState = 'idle' | 'running' | 'done'
type Results = ReturnType<typeof buildResults>

export default function SimulationPage() {
  const [il, setIl] = useState('')
  const [mag, setMag] = useState(6.5)
  const [depth, setDepth] = useState(10)
  const [timeOfDay, setTime] = useState('gündüz')
  const [simState, setSimState] = useState<SimState>('idle')
  const [currentPhase, setCurrentPhase] = useState(-1)
  const [donePhases, setDonePhases] = useState<number[]>([])
  const [results, setResults] = useState<Results | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const cancelRef = useRef(false)

  const magnitudeLabel = mag < 5 ? 'Hafif' : mag < 6 ? 'Orta' : mag < 7 ? 'Güçlü' : mag < 8 ? 'Büyük' : 'Şiddetli'
  const magnitudeColor = mag < 5 ? '#4ade80' : mag < 6 ? '#fbbf24' : mag < 7 ? '#fb923c' : '#f87171'

  const startSim = async () => {
    if (!il) return
    cancelRef.current = false
    setSimState('running')
    setDonePhases([])
    setCurrentPhase(0)
    setResults(null)

    for (let i = 0; i < PHASES.length; i++) {
      if (cancelRef.current) return
      setCurrentPhase(i)
      await new Promise(r => setTimeout(r, PHASES[i].duration))
      if (cancelRef.current) return
      setDonePhases(p => [...p, i])
    }

    setResults(buildResults(il, mag, depth, timeOfDay))
    setSimState('done')
    setCurrentPhase(-1)
    setActiveTab(0)
  }

  const resetSim = () => {
    cancelRef.current = true
    setSimState('idle')
    setCurrentPhase(-1)
    setDonePhases([])
    setResults(null)
  }

  // Tab başlıkları
  const TABS = ['Hasar Tespiti', 'Öncelik Sırası', 'Rota Planı', 'Kaynak Dağılımı']

  return (
    <Box px={6} py={5}>

      {/* Başlık */}
      <MotionFlex align="center" gap={3} mb={6}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 } as any}>
        <Flex w={10} h={10} borderRadius="xl"
          bg="rgba(99,102,241,0.15)" border="1px solid rgba(99,102,241,0.35)"
          align="center" justify="center">
          <Text fontSize="lg">🧪</Text>
        </Flex>
        <Box>
          <Text color="white" fontWeight="800" fontSize="lg" lineHeight={1.2}>Afet Simülasyonu</Text>
          <Text color="rgba(255,255,255,0.35)" fontSize="12px">Deprem senaryosu oluştur ve müdahale planını test et</Text>
        </Box>
        {simState === 'done' && (
          <MotionBox ml="auto"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 } as any}
            onClick={resetSim} cursor="pointer"
            px={4} py={2} borderRadius="xl"
            bg="rgba(248,113,113,0.12)" border="1px solid rgba(248,113,113,0.3)" color="#f87171"
            whileHover={{ bg: 'rgba(248,113,113,0.2)' } as any}
            whileTap={{ scale: 0.95 } as any}>
            <Text fontSize="sm" fontWeight="600">↺ Yeni Simülasyon</Text>
          </MotionBox>
        )}
      </MotionFlex>

      <Grid templateColumns={simState === 'idle' ? '1fr' : '340px 1fr'} gap={5}>

        {/* SOL — Senaryo paneli */}
        <Box>
          <MotionBox
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.35 } as any}
            bg="rgba(255,255,255,0.025)" border="1px solid rgba(255,255,255,0.07)"
            borderRadius="2xl" p={5}>

            <Text fontSize="10px" fontWeight="700" color="rgba(255,255,255,0.3)"
              letterSpacing="widest" textTransform="uppercase" mb={4}>Senaryo Parametreleri</Text>

            <Stack spacing={5}>
              {/* İl seçimi */}
              <Box>
                <Text fontSize="xs" color="rgba(255,255,255,0.5)" fontWeight="600" mb={2}>
                  📍 Deprem Merkezi (İl)
                </Text>
                <Select
                  value={il} onChange={e => setIl(e.target.value)}
                  isDisabled={simState !== 'idle'}
                  placeholder="İl seçin..."
                  bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)"
                  color={il ? 'white' : 'rgba(255,255,255,0.35)'} borderRadius="xl" h={8} fontSize="sm"
                  _focus={{ borderColor: 'rgba(99,102,241,0.5)' }}
                  sx={{ option: { background: '#0d0e20', color: 'white' } }}>
                  {ILLER.map(i => <option key={i} value={i}>{i}</option>)}
                </Select>
              </Box>

              {/* Büyüklük */}
              <Box>
                <Flex justify="space-between" mb={2}>
                  <Text fontSize="xs" color="rgba(255,255,255,0.5)" fontWeight="600">
                    ⚡ Deprem Büyüklüğü (Mw)
                  </Text>
                  <Flex align="center" gap={2}>
                    <Text fontSize="lg" fontWeight="800" color={magnitudeColor}>{mag.toFixed(1)}</Text>
                    <Flex px={2} py={0.5} borderRadius="full"
                      bg={`${magnitudeColor}15`} border={`1px solid ${magnitudeColor}30`}>
                      <Text fontSize="9px" fontWeight="700" color={magnitudeColor}>{magnitudeLabel}</Text>
                    </Flex>
                  </Flex>
                </Flex>
                <Slider value={mag} min={4.0} max={9.0} step={0.1}
                  onChange={v => setMag(v)} isDisabled={simState !== 'idle'}>
                  <SliderTrack bg="rgba(255,255,255,0.08)" h={2} borderRadius="full">
                    <SliderFilledTrack bg={magnitudeColor} />
                  </SliderTrack>
                  <SliderThumb w={4} h={4} bg={magnitudeColor} border="2px solid white"
                    boxShadow={`0 0 8px ${magnitudeColor}`} />
                </Slider>
                <Flex justify="space-between" mt={1}>
                  <Text fontSize="9px" color="rgba(255,255,255,0.2)">4.0</Text>
                  <Text fontSize="9px" color="rgba(255,255,255,0.2)">9.0</Text>
                </Flex>
              </Box>

              {/* Derinlik */}
              <Box>
                <Flex justify="space-between" mb={2}>
                  <Text fontSize="xs" color="rgba(255,255,255,0.5)" fontWeight="600">
                    🔽 Odak Derinliği (km)
                  </Text>
                  <Text fontSize="lg" fontWeight="800" color="#818cf8">{depth} km</Text>
                </Flex>
                <Slider value={depth} min={1} max={70} step={1}
                  onChange={v => setDepth(v)} isDisabled={simState !== 'idle'}>
                  <SliderTrack bg="rgba(255,255,255,0.08)" h={2} borderRadius="full">
                    <SliderFilledTrack bg="#818cf8" />
                  </SliderTrack>
                  <SliderThumb w={4} h={4} bg="#818cf8" border="2px solid white"
                    boxShadow="0 0 8px #818cf8" />
                </Slider>
                <Flex justify="space-between" mt={1}>
                  <Text fontSize="9px" color="rgba(255,255,255,0.2)">Sığ (1 km)</Text>
                  <Text fontSize="9px" color="rgba(255,255,255,0.2)">Derin (70 km)</Text>
                </Flex>
              </Box>

              {/* Gündüz / Gece */}
              <Box>
                <Text fontSize="xs" color="rgba(255,255,255,0.5)" fontWeight="600" mb={2}>
                  🕐 Oluşma Zamanı
                </Text>
                <Flex gap={2}>
                  {[{ v: 'gündüz', e: '☀️' }, { v: 'gece', e: '🌙' }].map(t => (
                    <MotionBox key={t.v}
                      onClick={() => simState === 'idle' && setTime(t.v)}
                      cursor={simState === 'idle' ? 'pointer' : 'default'}
                      flex={1} py={2.5} borderRadius="xl" textAlign="center"
                      bg={timeOfDay === t.v ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)'}
                      border={`1px solid ${timeOfDay === t.v ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`}
                      whileHover={simState === 'idle' ? { bg: 'rgba(99,102,241,0.1)' } as any : {}}
                      whileTap={simState === 'idle' ? { scale: 0.97 } as any : {}}
                      transition={{ duration: 0.15 } as any}>
                      <Text fontSize="sm">{t.e} {t.v.charAt(0).toUpperCase() + t.v.slice(1)}</Text>
                    </MotionBox>
                  ))}
                </Flex>
              </Box>

              {/* Özet */}
              {il && simState === 'idle' && (
                <MotionBox
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 } as any}
                  p={3} borderRadius="xl"
                  bg="rgba(99,102,241,0.08)" border="1px solid rgba(99,102,241,0.2)">
                  <Text fontSize="10px" color="rgba(255,255,255,0.4)" fontWeight="600"
                    textTransform="uppercase" letterSpacing="wider" mb={1.5}>Senaryo Özeti</Text>
                  <Text fontSize="xs" color="rgba(255,255,255,0.65)" lineHeight={1.7}>
                    <b style={{ color: 'white' }}>{il}</b> merkezli,{' '}
                    <b style={{ color: magnitudeColor }}>Mw {mag.toFixed(1)}</b> büyüklüğünde,{' '}
                    <b style={{ color: '#818cf8' }}>{depth} km</b> derinliğinde,{' '}
                    {timeOfDay === 'gece' ? '🌙 gece' : '☀️ gündüz'} saatlerinde meydana gelen deprem.
                  </Text>
                </MotionBox>
              )}
            </Stack>

            {/* Çalıştır butonu */}
            <MotionBox mt={5}
              onClick={simState === 'idle' && il ? startSim : undefined}
              cursor={simState === 'idle' && il ? 'pointer' : 'default'}
              opacity={!il ? 0.4 : 1}
              py={3.5} borderRadius="xl" textAlign="center"
              bg={simState === 'idle' ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(99,102,241,0.1)'}
              border="1px solid rgba(99,102,241,0.4)"
              boxShadow={simState === 'idle' && il ? '0 4px 20px rgba(99,102,241,0.35)' : 'none'}
              whileHover={simState === 'idle' && il ? { y: -2, boxShadow: '0 8px 30px rgba(99,102,241,0.45)' } as any : {}}
              whileTap={simState === 'idle' && il ? { scale: 0.98 } as any : {}}
              transition={{ duration: 0.2 } as any}>
              {simState === 'running' ? (
                <Flex justify="center" align="center" gap={2}>
                  <MotionBox w={2} h={2} borderRadius="full" bg="#818cf8"
                    animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.8, repeat: Infinity } as any} />
                  <Text fontSize="sm" fontWeight="700" color="rgba(255,255,255,0.6)">Simülasyon Çalışıyor...</Text>
                </Flex>
              ) : (
                <Text fontSize="sm" fontWeight="700" color="white">▶ Simülasyonu Başlat</Text>
              )}
            </MotionBox>
          </MotionBox>

          {/* Faz göstergesi */}
          {simState !== 'idle' && (
            <MotionBox mt={4}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.3 } as any}>
              <Stack spacing={2}>
                {PHASES.map((p, i) => (
                  <PhaseIndicator key={p.id} phase={p}
                    active={currentPhase === i}
                    done={donePhases.includes(i)} />
                ))}
              </Stack>
            </MotionBox>
          )}
        </Box>

        {/* SAĞ — Sonuçlar */}
        {simState !== 'idle' && (
          <MotionBox
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.35 } as any}>

            {simState === 'running' && !results && (
              <Flex h="400px" align="center" justify="center" direction="column" gap={5}
                bg="rgba(255,255,255,0.02)" borderRadius="2xl" border="1px solid rgba(255,255,255,0.06)">
                {/* Animasyonlu loader */}
                <Box position="relative" w={20} h={20}>
                  {[0, 1, 2].map(i => (
                    <MotionBox key={i} position="absolute" inset={0} borderRadius="full"
                      border="2px solid"
                      borderColor={PHASES[Math.min(currentPhase, 2)]?.color ?? '#818cf8'}
                      opacity={0.3}
                      animate={{ scale: [1, 1.5 + i * 0.3, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 } as any} />
                  ))}
                  <Flex w={20} h={20} align="center" justify="center">
                    <Text fontSize="2xl">⚡</Text>
                  </Flex>
                </Box>
                <Box textAlign="center">
                  <Text color="white" fontWeight="700" fontSize="md">
                    {currentPhase >= 0 ? PHASES[currentPhase].label : 'Hazırlanıyor'}
                  </Text>
                  <Text color="rgba(255,255,255,0.35)" fontSize="sm" mt={1}>
                    {currentPhase >= 0 ? PHASES[currentPhase].sub : ''}
                  </Text>
                </Box>
              </Flex>
            )}

            {results && (
              <AnimatePresence mode="wait">
                <MotionBox
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 } as any}>

                  {/* Özet KPI'lar */}
                  <Grid templateColumns="repeat(4,1fr)" gap={3} mb={5}>
                    {[
                      { label: 'Etkilenen Nüfus', value: results.affected.toLocaleString('tr'), color: '#f87171', icon: '👥' },
                      { label: 'Hasarlı Bina', value: results.buildings, color: '#fb923c', icon: '🏚️' },
                      { label: 'Kapanan Yol', value: `${results.roads} hat`, color: '#fbbf24', icon: '🚧' },
                      { label: 'Acil Vaka', value: results.casualties, color: '#f97316', icon: '🚨' },
                    ].map((k, i) => (
                      <MotionBox key={k.label}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.25 } as any}
                        bg="rgba(255,255,255,0.03)" border={`1px solid ${k.color}28`}
                        borderRadius="xl" p={4}>
                        <Flex justify="space-between" align="flex-start">
                          <Box>
                            <Text fontSize="9px" color="rgba(255,255,255,0.3)" fontWeight="700"
                              textTransform="uppercase" letterSpacing="wider" mb={1}>{k.label}</Text>
                            <Text fontSize="xl" fontWeight="800" color={k.color}>{k.value}</Text>
                          </Box>
                          <Text fontSize="xl" opacity={0.7}>{k.icon}</Text>
                        </Flex>
                      </MotionBox>
                    ))}
                  </Grid>

                  {/* Tab navigasyon */}
                  <Flex gap={1} mb={4} p={1} borderRadius="xl"
                    bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)" w="fit-content">
                    {TABS.map((t, i) => (
                      <MotionBox key={t}
                        onClick={() => setActiveTab(i)} cursor="pointer"
                        px={4} py={2} borderRadius="lg"
                        bg={activeTab === i ? 'rgba(99,102,241,0.18)' : 'transparent'}
                        border={activeTab === i ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent'}
                        whileHover={activeTab !== i ? { bg: 'rgba(255,255,255,0.05)' } as any : {}}
                        whileTap={{ scale: 0.97 } as any}
                        transition={{ duration: 0.15 } as any}>
                        <Text fontSize="sm" fontWeight={activeTab === i ? '600' : '400'}
                          color={activeTab === i ? 'white' : 'rgba(255,255,255,0.4)'}>{t}</Text>
                      </MotionBox>
                    ))}
                  </Flex>

                  {/* Tab içeriği */}
                  <AnimatePresence mode="wait">
                    <MotionBox key={activeTab}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 } as any}
                      bg="rgba(255,255,255,0.025)" border="1px solid rgba(255,255,255,0.07)"
                      borderRadius="2xl" overflow="hidden">

                      {/* ── Hasar Tespiti ── */}
                      {activeTab === 0 && (
                        <Box>
                          <Flex px={5} py={3} borderBottom="1px solid rgba(255,255,255,0.06)"
                            bg="rgba(255,255,255,0.02)" align="center" justify="space-between">
                            <Text fontSize="9px" fontWeight="700" color="rgba(255,255,255,0.28)"
                              letterSpacing="widest" textTransform="uppercase">YOLOv8 Hasar Analizi</Text>
                            <Flex px={2.5} py={1} borderRadius="full"
                              bg="rgba(248,113,113,0.12)" border="1px solid rgba(248,113,113,0.3)">
                              <Text fontSize="9px" fontWeight="700" color="#f87171">
                                {results.damageItems.length} BÖLGE TESPİT EDİLDİ
                              </Text>
                            </Flex>
                          </Flex>
                          <Stack spacing={0}>
                            {results.damageItems.map((d, i) => (
                              <MotionBox key={i}
                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.2 } as any}
                                px={5} py={4}
                                borderBottom={i < results.damageItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                                _hover={{ bg: 'rgba(255,255,255,0.03)' }}
                                style={{ transition: 'background 0.15s' }}>
                                <Flex align="center" gap={4}>
                                  <Box flex={1}>
                                    <Flex align="center" gap={2} mb={1}>
                                      <Text fontSize="sm" color="white" fontWeight="600">{d.zone}</Text>
                                      <Flex px={2} py={0.5} borderRadius="full"
                                        bg={`${riskColor[d.risk]}15`} border={`1px solid ${riskColor[d.risk]}30`}>
                                        <Text fontSize="9px" fontWeight="700" color={riskColor[d.risk]}>{d.risk}</Text>
                                      </Flex>
                                    </Flex>
                                    <Text fontSize="xs" color="rgba(255,255,255,0.4)">{d.type}</Text>
                                  </Box>
                                  {/* Skor bar */}
                                  <Flex align="center" gap={3} w="180px">
                                    <Box flex={1} h="6px" borderRadius="full" bg="rgba(255,255,255,0.06)">
                                      <MotionBox h="6px" borderRadius="full" bg={riskColor[d.risk]}
                                        initial={{ width: 0 }} animate={{ width: `${d.score}%` }}
                                        transition={{ delay: 0.3 + i * 0.1, duration: 0.6 } as any} />
                                    </Box>
                                    <Text fontSize="sm" fontWeight="800" color={riskColor[d.risk]}
                                      w={8} textAlign="right">{d.score}</Text>
                                  </Flex>
                                </Flex>
                              </MotionBox>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* ── Öncelik Sırası ── */}
                      {activeTab === 1 && (
                        <Box>
                          <Flex px={5} py={3} borderBottom="1px solid rgba(255,255,255,0.06)"
                            bg="rgba(255,255,255,0.02)" align="center" justify="space-between">
                            <Text fontSize="9px" fontWeight="700" color="rgba(255,255,255,0.28)"
                              letterSpacing="widest" textTransform="uppercase">XGBoost Önceliklendirme</Text>
                            <Text fontSize="9px" color="rgba(255,255,255,0.3)">Skor 0–100</Text>
                          </Flex>
                          <Stack spacing={0}>
                            {results.priorities.map((p, i) => (
                              <MotionBox key={i}
                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.2 } as any}
                                px={5} py={4}
                                borderBottom={i < results.priorities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                                _hover={{ bg: 'rgba(255,255,255,0.03)' }}
                                style={{ transition: 'background 0.15s' }}>
                                <Flex align="center" gap={4}>
                                  {/* Sıra numarası */}
                                  <Flex w={7} h={7} borderRadius="lg" flexShrink={0}
                                    bg={i === 0 ? 'rgba(248,113,113,0.2)' : i === 1 ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.06)'}
                                    border={`1px solid ${i === 0 ? 'rgba(248,113,113,0.4)' : i === 1 ? 'rgba(251,146,60,0.4)' : 'rgba(255,255,255,0.1)'}`}
                                    align="center" justify="center">
                                    <Text fontSize="11px" fontWeight="800"
                                      color={i === 0 ? '#f87171' : i === 1 ? '#fb923c' : 'rgba(255,255,255,0.4)'}>{i + 1}</Text>
                                  </Flex>
                                  <Box flex={1} overflow="hidden">
                                    <Flex align="center" gap={2}>
                                      <Text fontSize="xs" color="rgba(255,255,255,0.3)" fontFamily="mono">{p.id}</Text>
                                      <Flex px={2} py={0.5} borderRadius="full"
                                        bg={`${typeColor[p.type] || '#9ca3af'}18`}
                                        border={`1px solid ${typeColor[p.type] || '#9ca3af'}30`}>
                                        <Text fontSize="9px" fontWeight="700" color={typeColor[p.type] || '#9ca3af'}>{p.type}</Text>
                                      </Flex>
                                    </Flex>
                                    <Text fontSize="sm" color="rgba(255,255,255,0.65)" isTruncated mt={0.5}>{p.loc}</Text>
                                    <Text fontSize="10px" color="rgba(255,255,255,0.3)" mt={0.5}>
                                      Gerekli kaynak: {p.resources} ekip/araç
                                    </Text>
                                  </Box>
                                  {/* Skor */}
                                  <Box textAlign="right" flexShrink={0}>
                                    <Text fontSize="xl" fontWeight="800"
                                      color={p.score >= 80 ? '#f87171' : p.score >= 60 ? '#fb923c' : '#fbbf24'}>{p.score}</Text>
                                    <Text fontSize="9px" color="rgba(255,255,255,0.25)">öncelik skoru</Text>
                                  </Box>
                                </Flex>
                              </MotionBox>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* ── Rota Planı ── */}
                      {activeTab === 2 && (
                        <Box>
                          <Flex px={5} py={3} borderBottom="1px solid rgba(255,255,255,0.06)"
                            bg="rgba(255,255,255,0.02)" align="center" justify="space-between">
                            <Text fontSize="9px" fontWeight="700" color="rgba(255,255,255,0.28)"
                              letterSpacing="widest" textTransform="uppercase">OSRM Güvenli Rotalar</Text>
                            <Flex gap={3}>
                              <Flex align="center" gap={1.5}>
                                <Box w={2} h={2} borderRadius="full" bg="#4ade80" />
                                <Text fontSize="9px" color="rgba(255,255,255,0.4)">Açık</Text>
                              </Flex>
                              <Flex align="center" gap={1.5}>
                                <Box w={2} h={2} borderRadius="full" bg="#fbbf24" />
                                <Text fontSize="9px" color="rgba(255,255,255,0.4)">Kısıtlı</Text>
                              </Flex>
                              <Flex align="center" gap={1.5}>
                                <Box w={2} h={2} borderRadius="full" bg="#f87171" />
                                <Text fontSize="9px" color="rgba(255,255,255,0.4)">Kapalı</Text>
                              </Flex>
                            </Flex>
                          </Flex>
                          <Stack spacing={0}>
                            {results.routes.map((r, i) => {
                              const rc = r.status === 'Açık' ? '#4ade80' : r.status === 'Kısıtlı' ? '#fbbf24' : '#f87171'
                              return (
                                <MotionBox key={i}
                                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.08, duration: 0.2 } as any}
                                  px={5} py={4}
                                  borderBottom={i < results.routes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'}
                                  _hover={{ bg: 'rgba(255,255,255,0.03)' }}
                                  style={{ transition: 'background 0.15s' }}>
                                  <Flex align="center" gap={4}>
                                    <Box flex={1}>
                                      <Flex align="center" gap={2} mb={1}>
                                        <Text fontSize="xs" color="rgba(255,255,255,0.5)">{r.from}</Text>
                                        <Text fontSize="xs" color="rgba(255,255,255,0.2)">→</Text>
                                        <Text fontSize="sm" color="white" fontWeight="600">{r.to}</Text>
                                      </Flex>
                                      <Flex align="center" gap={3}>
                                        <Text fontSize="xs" color="rgba(255,255,255,0.35)">📏 {r.dist}</Text>
                                        <Text fontSize="xs" color="rgba(255,255,255,0.35)">⏱ {r.time}</Text>
                                      </Flex>
                                    </Box>
                                    <Flex px={3} py={1.5} borderRadius="full"
                                      bg={`${rc}15`} border={`1px solid ${rc}30`} align="center" gap={1.5}>
                                      <Box w={1.5} h={1.5} borderRadius="full" bg={rc} />
                                      <Text fontSize="10px" fontWeight="700" color={rc}>{r.status}</Text>
                                    </Flex>
                                  </Flex>
                                </MotionBox>
                              )
                            })}
                          </Stack>
                        </Box>
                      )}

                      {/* ── Kaynak Dağılımı ── */}
                      {activeTab === 3 && (
                        <Box>
                          <Flex px={5} py={3} borderBottom="1px solid rgba(255,255,255,0.06)"
                            bg="rgba(255,255,255,0.02)" align="center" justify="space-between">
                            <Text fontSize="9px" fontWeight="700" color="rgba(255,255,255,0.28)"
                              letterSpacing="widest" textTransform="uppercase">Önerilen Kaynak Tahsisi</Text>
                            <Text fontSize="9px" color="rgba(255,255,255,0.3)">
                              Toplam: {results.resources.reduce((a, r) => a + r.count, 0)} birim
                            </Text>
                          </Flex>
                          <Stack spacing={0} px={5} py={4}>
                            {results.resources.map((r, i) => (
                              <MotionBox key={i}
                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.2 } as any}
                                py={3.5}
                                borderBottom={i < results.resources.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}>
                                <Flex align="center" gap={4} mb={2}>
                                  <Text fontSize="sm" color="white" fontWeight="600" flex={1}>{r.type}</Text>
                                  <Text fontSize="lg" fontWeight="800" color={r.color}>
                                    {r.count} <Text as="span" fontSize="xs" fontWeight="500" color="rgba(255,255,255,0.4)">{r.unit}</Text>
                                  </Text>
                                </Flex>
                                <Box h="6px" borderRadius="full" bg="rgba(255,255,255,0.06)">
                                  <MotionBox h="6px" borderRadius="full" bg={r.color} opacity={0.8}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(r.count / Math.max(...results.resources.map(x => x.count))) * 100}%` }}
                                    transition={{ delay: 0.3 + i * 0.1, duration: 0.6 } as any} />
                                </Box>
                              </MotionBox>
                            ))}
                          </Stack>
                        </Box>
                      )}

                    </MotionBox>
                  </AnimatePresence>
                </MotionBox>
              </AnimatePresence>
            )}
          </MotionBox>
        )}
      </Grid>
    </Box>
  )
}
