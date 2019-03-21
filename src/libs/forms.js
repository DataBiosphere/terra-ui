import { div } from 'react-hyperscript-helpers'
import * as Style from 'src/libs/style'


const styles = {
  formLabel: {
    ...Style.elements.sectionHeader,
    margin: '1rem 0 0.25rem'
  },
  formHint: {
    fontSize: 'smaller',
    marginTop: '0.25rem'
  }
}


export const FormLabel = ({ style = {}, children, ...props }) => {
  return div({ ...props, style: { ...styles.formLabel, ...style } }, [children])
}


export const RequiredFormLabel = ({ style = {}, children, ...props }) => {
  return div({ ...props, style: { ...styles.formLabel, ...style } }, [children, ' *'])
}


export const formHint = text => {
  return div({ style: styles.formHint }, [text])
}
