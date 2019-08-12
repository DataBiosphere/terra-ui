import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, forwardRef, Fragment, useState } from 'react'
import Autosuggest from 'react-autosuggest'
import { div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { ButtonPrimary } from 'src/components/common'
import { icon } from 'src/components/icons'
import { PopupPortal, useDynamicPosition } from 'src/components/popup-utils'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


const styles = {
  input: {
    height: '2.25rem',
    border: `1px solid ${colors.light()}`, borderRadius: 4
  },
  suggestionsContainer: {
    position: 'fixed', top: 0, left: 0,
    maxHeight: 36 * 8 + 2, overflowY: 'auto',
    backgroundColor: 'white',
    border: `1px solid ${colors.light()}`
  },
  suggestion: {
    display: 'block', lineHeight: '2.25rem',
    paddingLeft: '1rem', paddingRight: '1rem',
    cursor: 'pointer'
  },
  textarea: {
    width: '100%', resize: 'none',
    border: `1px solid ${colors.light()}`, borderRadius: 4,
    fontSize: 14, fontWeight: 400,
    padding: '0.5rem 1rem',
    cursor: 'text'
  },
  validationError: {
    color: colors.danger(),
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
    marginLeft: '1rem', marginTop: '0.5rem'
  }
}

export const withDebouncedChange = WrappedComponent => {
  const Wrapper = ({ onChange, value, ...props }) => {
    const [internalValue, setInternalValue] = useState()
    const getInternalValue = Utils.useGetter(internalValue)
    const updateParent = Utils.useInstance(() => _.debounce(250, () => {
      onChange(getInternalValue())
      setInternalValue(undefined)
    }))
    return h(WrappedComponent, {
      value: internalValue !== undefined ? internalValue : value,
      onChange: v => {
        setInternalValue(v)
        updateParent()
      },
      ...props
    })
  }
  return Wrapper
}

export const TextInput = forwardRef(({ onChange, nativeOnChange = false, ...props }, ref) => h(Interactive,
  _.merge({
    refDOMNode: ref,
    as: 'input',
    className: 'focus-style',
    onChange: onChange ? e => onChange(nativeOnChange ? e : e.target.value) : undefined,
    style: {
      ...styles.input,
      width: '100%',
      paddingLeft: '1rem', paddingRight: '1rem',
      fontWeight: 400, fontSize: 14,
      backgroundColor: props.disabled ? colors.light() : undefined
    }
  },
  props)
))

export const ConfirmedSearchInput = ({ defaultValue = '', onChange = _.noop, ...props }) => {
  const [internalValue, setInternalValue] = useState(defaultValue)
  return div({ style: { display: 'inline-flex', width: '100%' } }, [
    h(TextInput, _.merge({
      type: 'search',
      refDOMNode: el => {
        el.addEventListener('search', e => {
          setInternalValue(e.target.value)
          onChange(e.target.value)
        })
      },
      spellCheck: false,
      style: { WebkitAppearance: 'none', borderColor: colors.dark(0.55), borderRadius: '4px 0 0 4px' },
      value: internalValue,
      onChange: setInternalValue,
      onKeyDown: e => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onChange(internalValue)
        } else if (e.key === 'Escape' && internalValue !== '') {
          e.preventDefault()
          e.stopPropagation()
          setInternalValue('')
          onChange('')
        }
      }
    }, props)),
    h(ButtonPrimary, {
      'aria-label': 'Search',
      style: { borderRadius: '0 4px 4px 0', borderLeft: 'none' },
      onClick: () => onChange(internalValue)
    }, [icon('search', { size: 18 })])
  ])
}

export const SearchInput = ({ value, onChange, ...props }) => {
  return h(TextInput, _.merge({
    type: 'search',
    spellCheck: false,
    style: { WebkitAppearance: 'none', borderColor: colors.dark(0.55) },
    value, onChange,
    onKeyDown: e => {
      if (e.key === 'Escape' && value !== '') {
        e.stopPropagation()
        onChange('')
      }
    }
  }, props))
}

export const DelayedSearchInput = withDebouncedChange(SearchInput)

export const NumberInput = ({ onChange, ...props }) => {
  return h(Interactive, _.merge({
    as: 'input',
    type: 'number',
    className: 'focus-style',
    onChange: onChange ? (e => onChange(e.target.value)) : undefined,
    style: {
      ...styles.input,
      width: '100%',
      paddingLeft: '1rem',
      paddingRight: '0.25rem',
      fontWeight: 400,
      fontSize: 14
    }
  }, props))
}


export class IntegerInput extends Component {
  static propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    onChange: PropTypes.func.isRequired
  }

  static defaultProps = {
    min: -Infinity,
    max: Infinity
  }

  constructor(props) {
    super(props)
    this.state = { textValue: undefined, lastValueProp: undefined } // eslint-disable-line react/no-unused-state
  }

  static getDerivedStateFromProps({ value }, { lastValueProp }) {
    if (value !== lastValueProp) {
      return { textValue: value.toString(), lastValueProp: value }
    }
    return null
  }

  render() {
    const { textValue } = this.state
    const { onChange, min, max, ...props } = this.props
    return h(NumberInput, {
      ...props, min, max, value: textValue,
      onChange: v => this.setState({ textValue: v }),
      onBlur: () => {
        const newValue = _.clamp(min, max, _.floor(textValue * 1))
        this.setState({ lastValueProp: undefined }) // eslint-disable-line react/no-unused-state
        onChange(newValue)
      }
    })
  }
}


/**
 * @param {object} props.inputProps
 * @param {object} [props.error] - error message content
 */
export const ValidatedInput = props => {
  const { inputProps, error } = props

  return h(Fragment, [
    div({
      style: { position: 'relative', display: 'flex', alignItems: 'center' }
    }, [
      h(TextInput, _.merge({
        style: error ? {
          paddingRight: '2.25rem', // leave room for error icon
          border: `1px solid ${colors.danger()}`
        } : undefined
      }, inputProps)),
      error && icon('error-standard', {
        size: 24,
        style: {
          position: 'absolute', color: colors.danger(),
          right: '.5rem'
        }
      })
    ]),
    error && div({ style: styles.validationError }, [error])
  ])
}

const AutocompleteSuggestions = ({ target: targetId, containerProps = {}, children }) => {
  const [target] = useDynamicPosition([{ id: targetId }])
  return h(PopupPortal, [
    div({
      ...containerProps,
      style: {
        transform: `translate(${target.left}px, ${target.bottom}px)`, width: target.width,
        visibility: !target.width ? 'hidden' : undefined,
        ...styles.suggestionsContainer
      }
    }, [children])
  ])
}

/**
 * See {@link https://github.com/moroshko/react-autosuggest#props}
 */
export class AutocompleteTextInput extends Component {
  static propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    suggestions: PropTypes.arrayOf(PropTypes.string)
  }

  static defaultProps = {
    suggestions: []
  }

  constructor(props) {
    super(props)
    this.state = { show: false }
    this.id = _.uniqueId('AutocompleteTextInput_')
  }

  render() {
    const { value, onChange, suggestions, style, id = this.id, ...props } = this.props
    const { show } = this.state
    return h(Autosuggest, {
      id,
      inputProps: { id, value, onChange: onChange ? (e => onChange(e.target.value)) : undefined },
      suggestions: show ? (value ? _.filter(Utils.textMatch(value), suggestions) : suggestions) : [],
      onSuggestionsFetchRequested: () => this.setState({ show: true }),
      onSuggestionsClearRequested: () => this.setState({ show: false }),
      onSuggestionSelected: (e, { suggestionValue }) => onChange(suggestionValue),
      getSuggestionValue: _.identity,
      shouldRenderSuggestions: () => true,
      focusInputOnSuggestionClick: false,
      renderSuggestionsContainer: ({ containerProps, children }) => {
        return children && h(AutocompleteSuggestions, { containerProps, children, target: id })
      },
      renderSuggestion: v => v,
      renderInputComponent: inputProps => h(TextInput, { ...props, ...inputProps, style, type: 'search', nativeOnChange: true }),
      theme: {
        container: { width: '100%' },
        suggestionsList: { margin: 0, padding: 0 },
        suggestion: styles.suggestion,
        suggestionHighlighted: { backgroundColor: colors.light(0.4) }
      }
    })
  }
}

export class AutocompleteSearch extends Component {
  static propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onSuggestionSelected: PropTypes.func.isRequired,
    suggestions: PropTypes.array,
    renderSuggestion: PropTypes.func,
    theme: PropTypes.object
  }

  static defaultProps = {
    suggestions: [],
    renderSuggestion: _.identity
  }

  constructor(props) {
    super(props)
    this.state = { show: false }
    this.id = props.id || _.uniqueId('AutocompleteSearch_')
  }

  render() {
    const { value, onChange, onSuggestionSelected, suggestions, renderSuggestion, theme, ...props } = this.props
    const { show } = this.state
    return h(Autosuggest, {
      id: this.id,
      inputProps: { id: this.id, value, onChange: onChange ? (e => onChange(e.target.value)) : undefined, ...props },
      suggestions: show ? (value ? [value, ..._.filter(Utils.textMatch(value), suggestions)] : suggestions) : [],
      onSuggestionsFetchRequested: () => this.setState({ show: true }),
      onSuggestionsClearRequested: () => this.setState({ show: false }),
      onSuggestionSelected: (e, { suggestionValue }) => onSuggestionSelected(suggestionValue),
      getSuggestionValue: _.identity,
      shouldRenderSuggestions: value => value.trim().length > 0,
      renderSuggestionsContainer: ({ containerProps, children }) => {
        return children && h(AutocompleteSuggestions, { containerProps, children, target: this.id })
      },
      renderSuggestion,
      renderInputComponent: inputProps => h(TextInput, { nativeOnChange: true, ...inputProps }),
      theme: _.merge({
        container: { width: '100%' },
        suggestionsList: { margin: 0, padding: 0 },
        suggestion: styles.suggestion,
        suggestionHighlighted: { backgroundColor: colors.light(0.4) }
      }, theme)
    })
  }
}

export const DelayedAutocompleteTextInput = withDebouncedChange(AutocompleteTextInput)

export const TextArea = ({ onChange, ...props }) => {
  return h(Interactive, _.merge({
    as: 'textarea',
    className: 'focus-style',
    style: styles.textarea,
    onChange: onChange ? (e => onChange(e.target.value)) : undefined
  }, props))
}
