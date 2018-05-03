import _ from 'lodash'
import { div } from 'react-hyperscript-helpers'
import { textInput } from 'src/components/common'
import { icon } from 'src/components/icons'
import * as Style from 'src/libs/style'
import validate from 'validate.js'


/**
 * @param props.style {object}
 * @param props.inputProps {object}
 * @param props.name {string} - user-facing name for input
 * @param props.validators {object} - see {@link https://validatejs.org/#validators}
 * @param props.fails {string[]}
 * @param props.onChange {function}
 * @param props.onFail {function} - called with the failures on input
 */
export const validatedInput = props => {
  const { style, inputProps, name, validators, fails, onChange, onFail } = props

  return div({ style: _.merge({ position: 'relative' }, style) }, [
      fails ? icon('exclamation-circle', {
        size: 24,
        style: {
          position: 'absolute', color: Style.colors.error,
          right: '.5rem', top: `calc((${Style.elements.input.style.height} / 2) - 12px)` // half of icon height
        }
      }) : null,
      textInput(_.merge({
        style: fails ? {
          paddingRight: '2.25rem', // leave room for error icon
          backgroundColor: Style.colors.errorFaded,
          border: `1px solid ${Style.colors.error}`
        } : undefined,
        onChange: (e) => {
          onFail(validate.single(e.target.value, validators))
          onChange(e)
        }
      }, inputProps)),
      fails ? div({
          style: {
            color: Style.colors.error, textTransform: 'uppercase', fontSize: 10, fontWeight: 500,
            marginLeft: '1rem'
          }
        },
        _.map(fails, (fail) => div({ style: { marginTop: '0.5rem' } }, `${name} ${fail}`))
      ) : null
    ]
  )
}
