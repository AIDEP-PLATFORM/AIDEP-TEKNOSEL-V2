import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    brand: {
      50: '#e8f4fd',
      100: '#c5e1f9',
      200: '#9ecdf5',
      300: '#70b7f1',
      400: '#4aa7ee',
      500: '#1a91eb',
      600: '#1480d4',
      700: '#0c6ab8',
      800: '#07549d',
      900: '#023d7a',
    },
    danger: {
      500: '#E53E3E',
      600: '#C53030',
    },
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
      },
    },
  },
})

export default theme
