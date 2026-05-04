import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body:    `'Inter', sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg:    '#08091a',
        color: 'white',
      },
      '*': { boxSizing: 'border-box' },
    },
  },
})

export default theme
