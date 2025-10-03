// custom Chakra theme extension
import { extendTheme } from '@chakra-ui/react';

const fonts = {
  heading: `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
  body: `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
};

const colors = {
  brand: {
    50: '#e3f9ff',
    100: '#c8ecff',
    200: '#89d8ff',
    300: '#54c3ff',
    400: '#1ea8ff',
    500: '#008fe6',
    600: '#0071b4',
    700: '#005180',
    800: '#003550',
    900: '#001e2b'
  },
  risk: {
    0: '#CBD5E0', // gray.300
    1: '#38A169', // green.500
    2: '#68D391', // green.300
    3: '#D69E2E', // yellow.600
    4: '#DD6B20', // orange.500
    5: '#E53E3E'  // red.500
  },
  market: {
    up: '#16a34a',
    down: '#dc2626'
  },
  role: {
    GK: '#3182ce',
    DEF: '#38a169',
    MID: '#d69e2e',
    FWD: '#e53e3e'
  },
  pitch: {
    fieldTop: '#276749',
    fieldBottom: '#22543d',
    line: 'rgba(255,255,255,0.35)'
  }
};

const semanticTokens = {
  colors: {
    'bg.surface': { default: 'white', _dark: 'gray.800' },
    'bg.muted': { default: 'gray.50', _dark: 'gray.700' },
    'text.muted': { default: 'gray.600', _dark: 'gray.300' }
  }
};

const components = {
  Button: {
    baseStyle: { borderRadius: 'lg', fontWeight: '600' },
    variants: {
      'pulse': {
        bg: 'brand.500', color: 'white', boxShadow: '0 0 0 0 rgba(0,143,230,0.6)',
        _hover: { bg: 'brand.400' },
        animation: 'pulse 2s infinite'
      }
    }
  },
  Card: {
    baseStyle: { rounded: '2xl', boxShadow: 'sm', bg: 'bg.surface' }
  }
};

const styles = {
  global: {
    'html, body': { bg: 'bg.muted' },
    '::-webkit-scrollbar': { width: '10px' },
    '::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.04)' },
    '::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '8px' },
    '::-webkit-scrollbar-thumb:hover': { background: '#555' },
    '@keyframes pulse': {
      '0%': { boxShadow: '0 0 0 0 rgba(0,143,230,0.6)' },
      '70%': { boxShadow: '0 0 0 16px rgba(0,143,230,0)' },
      '100%': { boxShadow: '0 0 0 0 rgba(0,143,230,0)' }
    }
  }
};

const theme = extendTheme({ fonts, colors, semanticTokens, components, styles });
export default theme;
