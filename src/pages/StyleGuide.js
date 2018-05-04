import { div, h1 } from 'react-hyperscript-helpers'
import { buttonPrimary, link, search } from 'src/components/common'
import { textInput, validatedInput } from 'src/components/input'
import * as Nav from 'src/libs/nav'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const styles = {
  container: {
    marginTop: '1rem',
    marginBottom: '1rem',
    backgroundColor: 'white',
    padding: '1rem'
  }
}

class StyleGuide extends Component {
  render() {
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
        validatedInput({
          name: 'input',
          inputProps: {
            placeholder: 'ValidatedInput wants an email',
            value: this.state.validatedInputValue,
            onChange: e => this.setState({ validatedInputValue: e.target.value, validatedInputTouched: true })
          },
          fails: this.state.validatedInputTouched ?
            validate.single(this.state.validatedInputValue, { email: true }) :
            null
        })
      ])
    ])
  }
}

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
