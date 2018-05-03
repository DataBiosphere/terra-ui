import { div, h1 } from 'react-hyperscript-helpers'
import * as Nav from 'src/libs/nav'
import { buttonPrimary, textInput, link, search } from 'src/components/common'


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
    ])
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
