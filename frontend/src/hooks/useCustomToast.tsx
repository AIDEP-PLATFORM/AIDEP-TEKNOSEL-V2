import { useToast } from '@chakra-ui/react'
import { Box, Flex, Text } from '@chakra-ui/react'

// ── İkonlar ────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const WarnIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

// ── Tema ────────────────────────────────────────────────────────────
const themes = {
  success: {
    icon:       <CheckIcon />,
    iconColor:  '#4ade80',
    iconBg:     'rgba(74,222,128,0.15)',
    border:     'rgba(74,222,128,0.25)',
    titleColor: '#f0fdf4',
    descColor:  'rgba(240,253,244,0.6)',
    glow:       'rgba(74,222,128,0.08)',
  },
  error: {
    icon:       <ErrorIcon />,
    iconColor:  '#f87171',
    iconBg:     'rgba(248,113,113,0.15)',
    border:     'rgba(248,113,113,0.25)',
    titleColor: '#fff1f2',
    descColor:  'rgba(255,241,242,0.6)',
    glow:       'rgba(248,113,113,0.08)',
  },
  warning: {
    icon:       <WarnIcon />,
    iconColor:  '#fbbf24',
    iconBg:     'rgba(251,191,36,0.15)',
    border:     'rgba(251,191,36,0.25)',
    titleColor: '#fffbeb',
    descColor:  'rgba(255,251,235,0.6)',
    glow:       'rgba(251,191,36,0.08)',
  },
}

type ToastType = keyof typeof themes

interface CustomToastOptions {
  title: string
  description?: string
  type?: ToastType
  duration?: number
}

// ── Hook ────────────────────────────────────────────────────────────
export function useCustomToast() {
  const toast = useToast()

  return ({ title, description, type = 'success', duration = 3500 }: CustomToastOptions) => {
    const t = themes[type]

    toast({
      position: 'top-right',
      duration,
      isClosable: true,
      render: ({ onClose }) => (
        <Box
          display="flex" alignItems="flex-start" gap={3}
          px={4} py={3.5}
          bg="rgba(10,9,25,0.92)"
          border={`1px solid ${t.border}`}
          borderRadius="xl"
          backdropFilter="blur(20px)"
          boxShadow={`0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${t.glow}`}
          maxW="320px"
          position="relative"
        >
          {/* Sol renkli çizgi */}
          <Box
            position="absolute" left={0} top="15%" bottom="15%"
            w="3px" borderRadius="full"
            bg={t.iconColor}
          />

          {/* İkon */}
          <Flex
            w={8} h={8} borderRadius="lg" flexShrink={0}
            bg={t.iconBg} align="center" justify="center"
            color={t.iconColor}
          >
            {t.icon}
          </Flex>

          {/* Metin */}
          <Box flex={1} pt={0.5}>
            <Text fontSize="sm" fontWeight="700" color={t.titleColor} lineHeight="1.3">
              {title}
            </Text>
            {description && (
              <Text fontSize="xs" color={t.descColor} mt={0.5} lineHeight="1.4">
                {description}
              </Text>
            )}
          </Box>

          {/* Kapat butonu */}
          <Box
            as="button" onClick={onClose}
            color="rgba(255,255,255,0.25)" fontSize="lg" lineHeight={1}
            _hover={{ color: 'rgba(255,255,255,0.6)' }}
            transition="color 0.15s"
            pt={0.5} flexShrink={0}
          >
            ×
          </Box>
        </Box>
      ),
    })
  }
}
