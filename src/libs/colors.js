import Color from 'color';
import _ from 'lodash/fp';
import { getEnabledBrand, isTerra } from 'src/libs/brand-utils';

const enabledBrand = getEnabledBrand();

const colors = _.mapValues((color) => {
  return (intensity = 1) => {
    return Color(color)
      .mix(Color('white'), 1 - intensity)
      .hex();
  };
}, enabledBrand.theme.colorPalette);

export const terraSpecial = (intensity) => (isTerra() ? colors.primary(intensity) : colors.accent(intensity));

export default colors;
