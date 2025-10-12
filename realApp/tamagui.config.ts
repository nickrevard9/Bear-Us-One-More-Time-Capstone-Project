import { config as defaultTamaguiConfig } from '@tamagui/config'
import { createTamagui } from 'tamagui'

export const tamaguiConfig = createTamagui(defaultTamaguiConfig)

export type Conf = typeof tamaguiConfig
export default tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
