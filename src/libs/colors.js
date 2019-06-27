import Color from 'color'
import _ from 'lodash/fp'
import { isAnvil, isDatastage, isFirecloud, isTerra } from 'src/libs/config'
import * as Utils from 'src/libs/utils'


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

const colorPalette = Utils.cond(
  [isFirecloud(), baseColors],
  [isDatastage(), { ...baseColors, primary: '#c02f42', secondary: '#1a568c', accent: '#1a568c', light: '#f4f4f6', dark: '#12385a' }],
  [isAnvil(), { ...baseColors, primary: '#e0dd10', accent: '#035c94', light: '#f6f7f4', dark: '#012840' }],
  { ...baseColors, primary: '#74ae43' }
)

const colors = _.fromPairs(_.map(
  color => [color, (intensity = 1) => Color(colorPalette[color]).mix(Color('white'), 1 - intensity).hex()],
  ALL_COLORS
))

export const terraSpecial = intensity => isTerra() ? colors.primary(intensity) : colors.accent(intensity)

export default colors
