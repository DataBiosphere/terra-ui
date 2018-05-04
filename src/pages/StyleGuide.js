import { div, h, h1 } from 'react-hyperscript-helpers'
import * as Nav from 'src/libs/nav'
import { buttonPrimary, textInput, link, search, Checkbox } from 'src/components/common'
import { icon } from 'src/components/icons'


const styles = {
  container: {
    marginTop: '1rem',
    marginBottom: '1rem'
  }
}

const StyleGuide = () => {
  return div({ style: { paddingLeft: '1rem', paddingRight: '1rem' } }, [
    h1('Style guide'),
    div({ style: styles.container }, [
      buttonPrimary({}, 'Primary button')
    ]),
    div({ style: styles.container }, [
      buttonPrimary({ disabled: true }, 'Disabled button')
    ]),
    div({ style: styles.container }, [
      link({}, 'Link')
    ]),
    div({ style: styles.container }, [
      search({ inputProps: { placeholder: 'Search' } })
    ]),
    div({ style: styles.container }, [
      textInput({ placeholder: 'Text box' })
    ]),
    div({ style: styles.container }, [
      icon('pencil'),
    ]),
    div({ style: styles.container }, [
      h(Checkbox, { checked: false }),
      h(Checkbox, { checked: true }),
      h(Checkbox, { checked: false, disabled: true }),
    ]),
  ])
}

export default StyleGuide

export const addNavPaths = () => {
  Nav.defPath(
    'styles',
    {
      component: StyleGuide,
      regex: /styles$/,
      makeProps: () => ({}),
      makePath: () => 'styles'
    }
  )
}
