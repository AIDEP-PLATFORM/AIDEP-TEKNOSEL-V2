interface AidepLogoProps {
  size?: number
  showText?: boolean
  variant?: 'sidebar' | 'auth' | 'icon-only'
}

let _uid = 0
function uid() { return `al${++_uid}` }

export function AidepLogoIcon({ size = 40 }: { size?: number }) {
  const id = uid()
  const h = size * 1.15

  return (
    <svg width={size} height={h} viewBox="0 0 200 230" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Pin gradient: cyan → deep blue */}
        <linearGradient id={`${id}pg`} x1="100" y1="12" x2="100" y2="208" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#00dff8"/>
          <stop offset="38%"  stopColor="#00aee8"/>
          <stop offset="100%" stopColor="#1230a8"/>
        </linearGradient>

        {/* Glossy highlight */}
        <radialGradient id={`${id}gl`} cx="36%" cy="26%" r="52%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.45"/>
          <stop offset="60%"  stopColor="white" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>

        {/* Dark inner circle bg */}
        <radialGradient id={`${id}db`} cx="50%" cy="42%" r="56%">
          <stop offset="0%"   stopColor="#182444"/>
          <stop offset="100%" stopColor="#070c1c"/>
        </radialGradient>

        {/* Pin drop shadow */}
        <filter id={`${id}ps`} x="-25%" y="-15%" width="150%" height="145%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000820" floodOpacity="0.45"/>
        </filter>

        {/* Wave soft glow */}
        <filter id={`${id}wg`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="1.8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Red dot glow */}
        <filter id={`${id}dg`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Inner ring subtle glow */}
        <filter id={`${id}rg`} x="-8%" y="-8%" width="116%" height="116%">
          <feGaussianBlur stdDeviation="1" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Outer ripple rings ──────────────────────────────── */}
      <circle cx="100" cy="86" r="95" stroke="rgba(100,170,255,0.10)" strokeWidth="1.5" fill="none"/>
      <circle cx="100" cy="86" r="76" stroke="rgba(100,170,255,0.16)" strokeWidth="1.5" fill="none"/>

      {/* ── Pin body ────────────────────────────────────────── */}
      {/* Classic map-pin teardrop: round head, smooth pointed tip */}
      <path
        d="M100,13
           C57,13 20,48 20,86
           C20,125 100,208 100,208
           C100,208 180,125 180,86
           C180,48 143,13 100,13 Z"
        fill={`url(#${id}pg)`}
        filter={`url(#${id}ps)`}
      />

      {/* ── Gloss overlay ───────────────────────────────────── */}
      <path
        d="M100,13
           C57,13 20,48 20,86
           C20,125 100,208 100,208
           C100,208 180,125 180,86
           C180,48 143,13 100,13 Z"
        fill={`url(#${id}gl)`}
      />

      {/* ── Dark inner circle ───────────────────────────────── */}
      <circle cx="100" cy="80" r="50" fill={`url(#${id}db)`}/>
      <circle cx="100" cy="80" r="50"
        stroke="rgba(0,210,255,0.18)" strokeWidth="1.5"
        fill="none" filter={`url(#${id}rg)`}/>

      {/* ── Seismic / EKG waveform ──────────────────────────── */}
      {/*  flat → rise → SPIKE up (with red dot) → dip → flat  */}
      <polyline
        points="
          52,80
          63,80
          70,72
          78,90
          86,62
          93,92
          100,64
          107,92
          114,62
          122,90
          130,72
          137,80
          148,80
        "
        stroke="#5de8f8"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${id}wg)`}
      />

      {/* ── Red dot at waveform peak ────────────────────────── */}
      <circle cx="100" cy="64" r="5.5" fill="#e81c1c" filter={`url(#${id}dg)`}/>
      <circle cx="100" cy="64" r="3"   fill="#ff5555"/>
      <circle cx="99"  cy="63" r="1.2" fill="white" opacity="0.7"/>

      {/* ── Tip reflection / ground glow ───────────────────── */}
      <defs>
        <radialGradient id={`${id}sg`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#a8d8f8" stopOpacity="0.55"/>
          <stop offset="45%"  stopColor="#7ab8e8" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#5090d0" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* outer soft glow */}
      <ellipse cx="100" cy="220" rx="38" ry="9" fill={`url(#${id}sg)`}/>
      {/* inner darker core */}
      <ellipse cx="100" cy="220" rx="16" ry="4" fill="rgba(0,20,60,0.22)"/>
    </svg>
  )
}

export function EpicenterIcon({ size = 40 }: { size?: number }) {
  return <AidepLogoIcon size={size} />
}

export default function AidepLogo({ size = 40, showText = true, variant = 'sidebar' }: AidepLogoProps) {

  if (variant === 'icon-only') {
    return <AidepLogoIcon size={size} />
  }

  if (variant === 'auth') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <AidepLogoIcon size={size} />
        {showText && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '30px', fontWeight: '900', color: 'white',
              letterSpacing: '2px', lineHeight: 1,
            }}>AIDEP</div>
            <div style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.35)',
              letterSpacing: '4px', textTransform: 'uppercase', marginTop: '5px',
            }}>Deprem Yönetim Platformu</div>
          </div>
        )}
      </div>
    )
  }

  /* sidebar variant */
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flexShrink: 0 }}>
        <AidepLogoIcon size={size} />
      </div>
      {showText && (
        <div>
          <div style={{ color: 'white', fontWeight: '800', fontSize: '14px', letterSpacing: '2px' }}>AIDEP</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Yönetim Paneli
          </div>
        </div>
      )}
    </div>
  )
}
