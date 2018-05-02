import _ from 'lodash'
import { div } from 'react-hyperscript-helpers'
import { textInput } from 'src/components/common'
import { icon } from 'src/components/icons'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


/**
 * @param name {string} - user-facing name for input
 * @param validators {object} - see {@link https://validatejs.org/#validators}
 * @param onChange {function}
 * @param onFail {function} - called with the failures on input
 */
export class ValidatedInput extends Component {
  render() {
    const { name, validators, onFail } = this.props
    const { fails } = this.state

    return div({ style: { marginBottom: '1rem', position: 'relative' } }, [
        fails ? icon('exclamation-circle', {
          size: 24,
          style: { position: 'absolute', color: Style.colors.error,
            right: '.5rem', top: `calc((2.25rem / 2) - (12px - 0.5rem))`} // half of input height minus half of icon height minus input top margin
        }) : null,
        textInput(_.merge({
          style: fails ? {
            backgroundColor: Style.colors.errorFaded,
            border: `1px solid ${Style.colors.error}`
          } : undefined,
          onChange: (e) => {
            const fails = validate.single(e.target.value, validators)
            this.setState({ fails })
            onFail(fails)
            this.props.onChange(e)
          }
        }, _.omit(this.props, ['name', 'validators', 'onChange', 'onFail'])))
      ].concat(_.map(fails, (fail) => div({
        style: {
          color: Style.colors.error, textTransform: 'uppercase', fontSize: '0.8em',
          margin: '0.5rem 0 0 1rem'
        }
      },
      `${name} ${fail}`)))
    )
  }
}
