import { Box, Heading, Text, Stack } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

interface Props {
  title: string
  icon: string
}

function PlaceholderPage({ title, icon }: Props) {
  return (
    <MotionBox
      p={10}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 } as any}
    >
      <Stack spacing={3}>
        <Text fontSize="4xl">{icon}</Text>
        <Heading size="lg" color="white">{title}</Heading>
        <Text color="whiteAlpha.500" fontSize="sm">
          Bu sayfa geliştirme aşamasındadır.
        </Text>
      </Stack>
    </MotionBox>
  )
}

export default PlaceholderPage
