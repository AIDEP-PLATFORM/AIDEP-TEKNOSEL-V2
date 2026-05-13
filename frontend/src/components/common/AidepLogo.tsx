interface AidepLogoProps {
  size?: number
  showText?: boolean
  variant?: 'sidebar' | 'auth' | 'icon-only'
}

export function EpicenterIcon({ size = 40 }: { size?: number }) {
  const cx = size / 2
  const r1 = size * 0.10
  const r2 = size * 0.20
  const r3 = size * 0.32
  const r4 = size * 0.44
  const cross = size * 0.48

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#38bdf8" stopOpacity="1"/>
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#38bdf8"/>
          <stop offset="100%" stopColor="#3b82f6"/>
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="strongGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* En dış halka */}
      <circle cx={cx} cy={cx} r={r4}
        stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.2"
        strokeDasharray="3 4"/>

      {/* 3. halka */}
      <circle cx={cx} cy={cx} r={r3}
        stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.35"
        strokeDasharray="2 3"/>

      {/* Crosshair çizgileri */}
      <line x1={cx - cross} y1={cx} x2={cx - r2 - 2} y2={cx}
        stroke="#38bdf8" strokeWidth="0.7" strokeOpacity="0.5"/>
      <line x1={cx + r2 + 2} y1={cx} x2={cx + cross} y2={cx}
        stroke="#38bdf8" strokeWidth="0.7" strokeOpacity="0.5"/>
      <line x1={cx} y1={cx - cross} x2={cx} y2={cx - r2 - 2}
        stroke="#38bdf8" strokeWidth="0.7" strokeOpacity="0.5"/>
      <line x1={cx} y1={cx + r2 + 2} x2={cx} y2={cx + cross}
        stroke="#38bdf8" strokeWidth="0.7" strokeOpacity="0.5"/>

      {/* 2. halka (solid) */}
      <circle cx={cx} cy={cx} r={r2}
        stroke="url(#ringGrad)" strokeWidth="1" strokeOpacity="0.7"
        filter="url(#glow)"/>

      {/* İç nokta glow alanı */}
      <circle cx={cx} cy={cx} r={r1 * 2.5}
        fill="url(#centerGlow)" opacity="0.4"/>

      {/* İç nokta */}
      <circle cx={cx} cy={cx} r={r1}
        fill="#38bdf8" filter="url(#strongGlow)"/>

      {/* En iç beyaz parlama */}
      <circle cx={cx} cy={cx} r={r1 * 0.45}
        fill="white" opacity="0.9"/>
    </svg>
  )
}

export default function AidepLogo({ size = 40, showText = true, variant = 'sidebar' }: AidepLogoProps) {

  if (variant === 'icon-only') {
    return <EpicenterIcon size={size} />
  }

  if (variant === 'auth') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
        <div style={{
          width: size, height: size,
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(14,20,40,0.95), rgba(8,12,28,0.98))',
          border: '1px solid rgba(56,189,248,0.2)',
          boxShadow: '0 0 40px rgba(56,189,248,0.2), inset 0 0 20px rgba(56,189,248,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <EpicenterIcon size={size * 0.72} />
        </div>
        {showText && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '28px', fontWeight: '800', color: 'white',
              letterSpacing: '-0.5px', lineHeight: 1,
            }}>AIDEP</div>
            <div style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.35)',
              letterSpacing: '4px', textTransform: 'uppercase', marginTop: '4px',
            }}>Platform</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
      <div style={{
        width: size, height: size,
        borderRadius: '10px',
        background: 'rgba(14,20,40,0.8)',
        border: '1px solid rgba(56,189,248,0.18)',
        boxShadow: '0 0 12px rgba(56,189,248,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <EpicenterIcon size={size * 0.7} />
      </div>
      {showText && (
        <div>
          <div style={{ color:'white', fontWeight:'800', fontSize:'14px', letterSpacing:'2px' }}>AIDEP</div>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'9px', letterSpacing:'3px', textTransform:'uppercase' }}>
            Yönetim Paneli
          </div>
        </div>
      )}
    </div>
  )
}
