import _ from 'lodash'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { icon } from 'src/components/icons'
import * as Style from 'src/libs/style'


export const textInput = function(props) {
  return h(Interactive, _.merge({
      as: 'input',
      style: {
        width: '100%',
        paddingLeft: '1rem', paddingRight: '1rem',
        fontWeight: 300, fontSize: 14,
        backgroundColor: props.disabled ? '#f3f3f3' : undefined
      }
    },
    Style.elements.input,
    props)
  )
}


/**
 * @param props.inputProps {object}
 * @param props.name {string} - user-facing name for input
 * @param props.errors {string[]}
 */
export const validatedInput = props => {
  const { inputProps, name, errors } = props

  return h(Fragment, [
    div({
        style: { position: 'relative', display: 'flex', alignItems: 'center' }
      }, [
        textInput(_.merge({
          style: errors ? {
            paddingRight: '2.25rem', // leave room for error icon
            backgroundColor: Style.colors.errorFaded,
            border: `1px solid ${Style.colors.error}`
          } : undefined
        }, inputProps)),
        errors ? icon('exclamation-circle', {
          size: 24,
          style: {
            position: 'absolute', color: Style.colors.error,
            right: '.5rem'
          }
        }) : null
      ]
    ),
    errors ? div({
        style: {
          color: Style.colors.error, textTransform: 'uppercase', fontSize: 10, fontWeight: 500,
          marginLeft: '1rem'
        }
      },
      _.map(errors, (fail) => div({ style: { marginTop: '0.5rem' } }, `${name} ${fail}`))
    ) : null
  ])
}
