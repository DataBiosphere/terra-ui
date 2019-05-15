import Color from 'color'
import _ from 'lodash/fp'
import { getAppName } from 'src/libs/logos'


const ALL_COLORS = ['primary', 'secondary', 'accent', 'warning', 'danger', 'light', 'dark']

const colorPalettes = {
  Terra: {
    primary: '#74ae43',
    secondary: '#6d6e70',
    accent: '#0086c1',
    warning: '#f7981c',
    danger: '#db3214',
    light: '#e9ecef',
    dark: '#333f52'
  }
}

export default _.fromPairs(_.map(
  color => [color, (intensity = 1) => Color(_.get([getAppName(), color], colorPalettes)).mix(Color('white'), 1 - intensity)],
  ALL_COLORS
))
