// Yeni tasarım — sismik dalga + kırık çember (şimdilik rezerve)
interface AidepLogoProps {
  size?: number
  showText?: boolean
  variant?: 'sidebar' | 'auth' | 'icon-only'
}

export function SeismicIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="v2-wave" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#f97316" />
          <stop offset="50%"  stopColor="#ea580c" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        <linearGradient id="v2-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f97316" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Kırık çember */}
      <path
        d="M 57,69 A 34,34 0 1 1 23,69"
        stroke="url(#v2-ring)" strokeWidth="3" strokeLinecap="round"
      />
      <line x1="57" y1="69" x2="63" y2="76" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="60" y1="71" x2="65" y2="76" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55" />
      <line x1="23" y1="69" x2="17" y2="76" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="71" x2="15" y2="76" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55" />

      {/* Epicenter halkaları */}
      <path d="M 18,21 A 8,8 0 0 0 34,21" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.55" fill="none" />
      <path d="M 12,21 A 14,14 0 0 0 40,21" stroke="#f97316" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.30" fill="none" />

      {/* Sismik dalga */}
      <polyline
        points="12,40 20,40 26,21 30,52 34,31 38,40 68,40"
        stroke="url(#v2-wave)" strokeWidth="4.5"
        strokeLinecap="round" strokeLinejoin="round"
        fill="none"
      />

      {/* Epicenter noktası */}
      <circle cx="26" cy="21" r="4" fill="#f97316" />
      <circle cx="26" cy="21" r="2" fill="white" fillOpacity="0.85" />
    </svg>
  )
}

export default function AidepLogoV2({
  size = 40,
  showText = true,
  variant = 'sidebar',
}: AidepLogoProps) {
  if (variant === 'icon-only') return <SeismicIcon size={size} />

  if (variant === 'auth') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: size, height: size, borderRadius: '20px',
          background: 'rgba(8,9,26,0.97)',
          border: '1px solid rgba(234,88,12,0.22)',
          boxShadow: '0 0 32px rgba(220,38,38,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SeismicIcon size={size * 0.82} />
        </div>
        {showText && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: `${size * 0.18}px`, fontWeight: '800', color: 'white', letterSpacing: '0.22em' }}>AIDEP</div>
            <div style={{ marginTop: '5px', fontSize: `${size * 0.07}px`, color: 'rgba(249,115,22,0.5)', letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: '600' }}>Platform</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: size, height: size, borderRadius: '10px',
        background: 'rgba(8,9,26,0.9)',
        border: '1px solid rgba(234,88,12,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <SeismicIcon size={size * 0.82} />
      </div>
      {showText && (
        <div>
          <div style={{ color: 'white', fontWeight: '800', fontSize: `${size * 0.36}px`, letterSpacing: '0.16em' }}>AIDEP</div>
          <div style={{ color: 'rgba(249,115,22,0.45)', fontSize: `${size * 0.20}px`, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: '600', marginTop: '1px' }}>Yönetim Paneli</div>
        </div>
      )}
    </div>
  )
}
