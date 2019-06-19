import Color from 'color'
import _ from 'lodash/fp'
import { isTerra } from 'src/libs/config'
import { getAppName } from 'src/libs/logos'


const ALL_COLORS = ['primary', 'secondary', 'accent', 'success', 'warning', 'danger', 'light', 'dark']

const baseColors = {
  primary: '#4d72aa',
  secondary: '#6d6e70',
  accent: '#4d72aa',
  success: '#74ae43',
  warning: '#f7981c',
  danger: '#db3214',
  light: '#e9ecef',
  dark: '#333f52'
}

const colorPalettes = {
  Terra: {
    ...baseColors,
    primary: '#74ae43'
  },
  FireCloud: baseColors,
  DataStage: {
    ...baseColors,
    primary: '#c02f42'
  },
  Anvil: {
    ...baseColors,
    primary: '#e0dd10',
    accent: '#035c94',
    light: '#f6f7f4',
    dark: '#012840'
  }
}

const colors = _.fromPairs(_.map(
  color => [color, (intensity = 1) => Color(_.get([getAppName(), color], colorPalettes)).mix(Color('white'), 1 - intensity).hex()],
  ALL_COLORS
))

export const terraSpecial = intensity => isTerra() ? colors.primary(intensity) : colors.accent(intensity)

export default colors
