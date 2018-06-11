import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import Autosuggest from 'react-autosuggest'
import { div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { icon } from 'src/components/icons'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


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

export class AutocompleteTextInput extends Component {
  constructor(props) {
    super(props)
    this.state = { show: false }
  }

  render() {
    const { value, onChange, suggestions, ...props } = this.props
    const { show } = this.state
    return h(Autosuggest, {
      inputProps: { value, onChange: e => onChange(e.target.value) },
      suggestions: show ? _.take(10, _.filter(Utils.textMatch(value), suggestions)) : [],
      onSuggestionsFetchRequested: ({ reason }) => {
        this.setState({ show: reason !== 'input-focused' })
      },
      onSuggestionsClearRequested: () => this.setState({ show: false }),
      onSuggestionSelected: (e, { suggestionValue }) => onChange(suggestionValue),
      getSuggestionValue: _.identity,
      renderSuggestion: v => v,
      renderInputComponent: inputProps => {
        return textInput({ value, onChange, ...props, ...inputProps })
      },
      theme: {
        container: {
          position: 'relative',
          width: '100%'
        },
        suggestionsContainer: {
          position: 'absolute', left: 0, right: 0, zIndex: 1,
          backgroundColor: 'white'
        },
        suggestionsList: {
          margin: 0, padding: 0,
          border: `1px solid ${Style.colors.border}`
        },
        suggestion: {
          display: 'block', lineHeight: '2.25rem',
          paddingLeft: '1rem', paddingRight: '1rem'
        },
        suggestionHighlighted: {
          backgroundColor: Style.colors.highlightFaded
        }
      }
    })
  }
}
