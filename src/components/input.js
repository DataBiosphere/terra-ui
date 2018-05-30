import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { icon } from 'src/components/icons'
import * as Style from 'src/libs/style'


export const textInput = function(props) {
  return h(Interactive, _.mergeAll([
    {
      as: 'input',
      style: {
        width: '100%',
        paddingLeft: '1rem', paddingRight: '1rem',
        fontWeight: 300, fontSize: 14,
        backgroundColor: props.disabled ? '#f3f3f3' : undefined
      }
    },
    Style.elements.input,
    props
  ]))
}


export const numberInput = props => {
  return h(Interactive, _.mergeAll([{
    as: 'input',
    type: 'number',
    style: {
      width: '100%',
      paddingLeft: '1rem',
      paddingRight: '0.25rem',
      fontWeight: 300,
      fontSize: 14
    }
  }, Style.elements.input, props]))
}


export class IntegerInput extends Component {
  constructor(props) {
    super(props)
    this.state = { textValue: undefined, lastValue: undefined }
  }

  static getDerivedStateFromProps({ value }, { lastValue }) {
    if (value !== lastValue) {
      return { textValue: value.toString(), lastValue: value }
    }
    return null
  }

  render() {
    const { textValue } = this.state
    const { onChange, min = -Infinity, max = Infinity, ...props } = this.props
    return numberInput({
      ...props, min, max, value: textValue,
      onChange: e => this.setState({ textValue: e.target.value }),
      onBlur: () => {
        const newValue = _.clamp(min, max, _.floor(textValue * 1))
        this.setState({ lastValue: undefined })
        onChange(newValue)
      }
    })
  }
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
      errors && icon('exclamation-circle', {
        size: 24,
        style: {
          position: 'absolute', color: Style.colors.error,
          right: '.5rem'
        }
      })
    ]),
    errors && div({
      style: {
        color: Style.colors.error, textTransform: 'uppercase', fontSize: 10, fontWeight: 500,
        marginLeft: '1rem'
      }
    },
    _.map(fail => div({ style: { marginTop: '0.5rem' } }, `${name} ${fail}`), errors)
    )
  ])
}
