import 'rc-slider/assets/index.css';

import Slider from 'rc-slider';
import { h } from 'react-hyperscript-helpers';
import colors from 'src/libs/colors';

const handleStyle = {
  borderColor: colors.accent(),
  backgroundColor: colors.accent(),
  opacity: 1,
  boxShadow: 'none',
  height: 18,
  width: 18,
  zIndex: 0,
};
const trackHeight = 8;
const trackStyle = { backgroundColor: colors.accent(0.5), height: trackHeight };
const railStyle = { backgroundColor: colors.accent(0.4), height: trackHeight };

const TerraSlider = (props) =>
  h(Slider, {
    handleStyle,
    trackStyle,
    railStyle,
    ...props,
  });

export default TerraSlider;
