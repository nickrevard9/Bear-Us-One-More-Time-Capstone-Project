import { createTamagui, createFont } from 'tamagui';
import { tokens as defaultTokens, themes as defaultThemes } from '@tamagui/themes';

const earthyLight = {
  ...defaultThemes.light,
  background: '#f4efe6',       // sand
  backgroundStrong: '#e9e1d3', // beige
  color: '#3e3b32',            // text
  borderColor: '#a17f60',      // brown
  accentBackground: '#8fa47a', // mossy green
  accentColor: '#3e3b32',
  warning: '#d4b15c',           // mustard
  secondary: '#d08c79',         // terracotta
  primary: '#8fa47a',
}

const earthyDark = {
  ...defaultThemes.dark,
  background: '#2b2a23',
  backgroundStrong: '#3a372e',
  color: '#e4e0d5',
  borderColor: '#bfa58c',
  accentBackground: '#7f8f67',
  accentColor: '#e4e0d5',
  warning: '#c7a84f',
  secondary: '#b5735f',
  primary: '#7f8f67',
}

const bodyFont = createFont({
  family: 'System',
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
    7: 32,
    8: 40,
    9: 48,
    10: 64,
    true: 16,
  },
  lineHeight: {
    1: 18,   
    2: 20,  
    3: 22,  
    4: 24,  
    5: 28,   
    6: 36,  
    7: 44,
    8: 52,  
    9: 64,  
    10: 80, 
    true: 18,
  },
  weight: {
    1: '300',
    2: '400',
    3: '500',
    4: '600',
    5: '700',
  },
})

export const tamaguiConfig = createTamagui({
  tokens: defaultTokens,  // keep all default sizes, spacings, radii
  themes: {
    light: earthyLight,
    dark: earthyDark,
  },
  fonts: {
    body: bodyFont,
    heading: bodyFont,
  },
  shorthands: {
    p: 'padding',
    m: 'margin',
    bg: 'backgroundColor',
  },
  defaultTheme: 'light',
})


export type Conf = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
