import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

export const mainStyles = {
  padding: '1rem',
  minHeight: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};
export const docContainerStyles = {
  backgroundColor: 'white',
  borderRadius: 5,
  width: '80%',
  maxHeight: '100%',
  padding: '2rem',
  boxShadow: Style.standardShadow,
};
export const headerStyles = { color: colors.dark(), fontSize: 38, fontWeight: 400 };
