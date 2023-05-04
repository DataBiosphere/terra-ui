import Downshift from 'downshift';
import _ from 'lodash/fp';
import { Fragment, useRef, useState } from 'react';
import { div, h, input, textarea } from 'react-hyperscript-helpers';
import TextAreaAutosize from 'react-textarea-autosize';
import { ButtonPrimary } from 'src/components/common';
import { icon } from 'src/components/icons';
import { PopupPortal, useDynamicPosition, useWindowDimensions } from 'src/components/popup-utils';
import TooltipTrigger from 'src/components/TooltipTrigger';
import colors from 'src/libs/colors';
import { combineRefs, forwardRefWithName, useGetter, useInstance, useLabelAssert, useOnMount } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';

const styles = {
  input: {
    height: '2.25rem',
    border: `1px solid ${colors.dark(0.55)}`,
    borderRadius: 4,
  },
  suggestionsContainer: {
    position: 'fixed',
    left: 0,
    maxHeight: 36 * 8 + 2,
    overflowY: 'auto',
    backgroundColor: 'white',
    border: `1px solid ${colors.light()}`,
    margin: '0.5rem 0',
    borderRadius: 4,
    boxShadow: '0 0 1px 0 rgba(0,0,0,0.12), 0 8px 8px 0 rgba(0,0,0,0.24)',
  },
  suggestion: (isSelected) => ({
    display: 'block',
    lineHeight: '2.25rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    cursor: 'pointer',
    backgroundColor: isSelected ? colors.light(0.4) : undefined,
  }),
  textarea: {
    width: '100%',
    resize: 'none',
    border: `1px solid ${colors.dark(0.55)}`,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 400,
    padding: '0.5rem 1rem',
    cursor: 'text',
  },
  validationError: {
    color: colors.danger(),
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    marginLeft: '1rem',
    marginTop: '0.5rem',
  },
};

export const withDebouncedChange = (WrappedComponent) => {
  const Wrapper = ({ onChange, value, debounceMs = 250, ...props }) => {
    const [internalValue, setInternalValue] = useState();
    const getInternalValue = useGetter(internalValue);
    const getOnChange = useGetter(onChange);
    const updateParent = useInstance(() =>
      _.debounce(debounceMs, () => {
        getOnChange()(getInternalValue());
        setInternalValue(undefined);
      })
    );
    return h(WrappedComponent, {
      value: internalValue !== undefined ? internalValue : value,
      onChange: (v) => {
        setInternalValue(v);
        updateParent();
      },
      ...props,
    });
  };
  return Wrapper;
};

export const TextInput = forwardRefWithName('TextInput', ({ onChange, nativeOnChange = false, ...props }, ref) => {
  useLabelAssert('TextInput', { ...props, allowId: true });

  return input({
    ..._.merge(
      {
        className: 'focus-style',
        onChange: onChange ? (e) => onChange(nativeOnChange ? e : e.target.value) : undefined,
        style: {
          ...styles.input,
          width: '100%',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          fontWeight: 400,
          fontSize: 14,
          backgroundColor: props.disabled ? colors.light() : undefined,
        },
      },
      props
    ),
    // the ref does not get added to the props correctly when inside of _.merge
    ref,
  });
});

export const ConfirmedSearchInput = ({ defaultValue = '', onChange = _.noop, ...props }) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const inputEl = useRef();

  useOnMount(() => {
    inputEl.current.addEventListener('search', (e) => {
      setInternalValue(e.target.value);
      onChange(e.target.value);
    });
  });

  return div({ style: { display: 'inline-flex', width: '100%' } }, [
    h(TextInput, {
      ..._.merge(
        {
          type: 'search',
          spellCheck: false,
          style: { WebkitAppearance: 'none', borderColor: colors.dark(0.55), borderRadius: '4px 0 0 4px' },
          value: internalValue,
          onChange: setInternalValue,
          onKeyDown: (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onChange(internalValue);
            } else if (e.key === 'Escape' && internalValue !== '') {
              e.preventDefault();
              e.stopPropagation();
              setInternalValue('');
              onChange('');
            }
          },
        },
        props
      ),
      // the ref does not get added to the props correctly when inside of _.merge
      ref: inputEl,
    }),
    h(
      ButtonPrimary,
      {
        'aria-label': 'Search',
        style: { borderRadius: '0 4px 4px 0', borderLeft: 'none' },
        onClick: () => onChange(internalValue),
      },
      [icon('search', { size: 18 })]
    ),
  ]);
};

export const SearchInput = ({ value, onChange, ...props }) => {
  return h(
    TextInput,
    _.merge(
      {
        type: 'search',
        spellCheck: false,
        style: { WebkitAppearance: 'none', borderColor: colors.dark(0.55) },
        value,
        onChange,
        onKeyDown: (e) => {
          if (e.key === 'Escape' && value !== '') {
            e.stopPropagation();
            onChange('');
          }
        },
      },
      props
    )
  );
};

export const DelayedSearchInput = withDebouncedChange(SearchInput);

export const NumberInput = forwardRefWithName(
  'NumberInput',
  ({ onChange, onBlur, min = -Infinity, max = Infinity, onlyInteger = false, isClearable = true, tooltip, value, ...props }, ref) => {
    // If the user provided a tooltip but no other label, use the tooltip as the label for the input
    useLabelAssert('NumberInput', { tooltip, ...props, allowId: true, allowTooltip: true });

    const [internalValue, setInternalValue] = useState();

    const numberInputChild = div([
      input({
        ..._.merge(
          {
            type: 'number',
            'aria-label': Utils.getAriaLabelOrTooltip({ tooltip, ...props }),
            className: 'focus-style',
            min,
            max,
            value: internalValue !== undefined ? internalValue : _.toString(value), // eslint-disable-line lodash-fp/preferred-alias
            onChange: ({ target: { value: newValue } }) => {
              setInternalValue(newValue);
              // note: floor and clamp implicitly convert the value to a number
              onChange(newValue === '' && isClearable ? null : _.clamp(min, max, onlyInteger ? _.floor(newValue) : newValue));
            },
            onBlur: (...args) => {
              onBlur && onBlur(...args);
              setInternalValue(undefined);
            },
            style: {
              ...styles.input,
              width: '100%',
              paddingLeft: '1rem',
              paddingRight: '0.25rem',
              fontWeight: 400,
              fontSize: 14,
              backgroundColor: props.disabled ? colors.dark(0.25) : undefined,
            },
          },
          props
        ),
        // _.merge merges recursively, and thus does not set ref correctly.
        ref,
      }),
    ]);

    if (tooltip) {
      return h(TooltipTrigger, { content: tooltip, side: 'right' }, [numberInputChild]);
    }
    return numberInputChild;
  }
);

/**
 * @param {object} props.inputProps
 * @param {object} [props.error] - error message content
 */
export const ValidatedInput = ({ inputProps, width, error }) => {
  return createValidatedInput({ inputProps, width, error }, null);
};

export const ValidatedInputWithRef = forwardRefWithName('ValidatedInput', ({ inputProps, width, error }, ref) => {
  return createValidatedInput({ inputProps, width, error }, ref);
});

const createValidatedInput = ({ inputProps, width, error }, ref) => {
  const props = _.merge(
    {
      style: error
        ? {
            paddingRight: '2.25rem', // leave room for error icon
            border: `1px solid ${colors.danger()}`,
          }
        : undefined,
    },
    inputProps
  );
  return h(Fragment, [
    div(
      {
        style: { position: 'relative', display: 'flex', alignItems: 'center', width },
      },
      [
        h(TextInput, { ...props, ref }),
        error &&
          icon('error-standard', {
            size: 24,
            style: {
              position: 'absolute',
              color: colors.danger(),
              right: '.5rem',
            },
          }),
      ]
    ),
    error &&
      div(
        {
          style: styles.validationError,
          'aria-live': 'assertive',
          'aria-relevant': 'all',
        },
        [error]
      ),
  ]);
};

const AutocompleteSuggestions = ({ target: targetId, containerProps, children }) => {
  const [target] = useDynamicPosition([{ id: targetId }]);
  const windowDimensions = useWindowDimensions();

  const anchorToBottom = windowDimensions.height - target.bottom >= styles.suggestionsContainer.maxHeight;
  const style = anchorToBottom
    ? {
        top: 0,
        transform: `translate(${target.left}px, ${target.bottom}px)`,
      }
    : {
        bottom: 0,
        transform: `translate(${target.left}px, -${windowDimensions.height - target.top}px)`,
      };

  return h(PopupPortal, [
    div(
      {
        ...containerProps,
        style: {
          ...styles.suggestionsContainer,
          ...style,
          visibility: !target.width ? 'hidden' : undefined,
          width: target.width,
        },
      },
      [children]
    ),
  ]);
};

const withAutocomplete = (WrappedComponent) =>
  forwardRefWithName(
    `withAutocomplete(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`,
    (
      {
        itemToString,
        value,
        onChange,
        onPick,
        suggestions: rawSuggestions,
        style,
        id,
        labelId,
        inputIcon,
        iconStyle,
        renderSuggestion = _.identity,
        openOnFocus = true,
        suggestionFilter = Utils.textMatch,
        placeholderText,
        ...props
      },
      ref
    ) => {
      useLabelAssert('withAutocomplete', { id, 'aria-labelledby': labelId, ...props, allowId: true });

      const suggestions = _.filter(suggestionFilter(value), rawSuggestions);
      const controlProps = itemToString ? { itemToString: (v) => (v ? itemToString(v) : value) } : { selectedItem: value };

      const inputEl = useRef();
      const clearSelectionRef = useRef();
      useOnMount(() => {
        inputEl.current?.addEventListener('search', (e) => {
          !e.target.value && clearSelectionRef.current?.();
        });
      });

      const stateReducer = (_unused, action) => {
        return action.type === Downshift.stateChangeTypes.keyDownEscape ? { isOpen: false } : action;
      };

      return h(
        Downshift,
        {
          ...controlProps,
          stateReducer,
          initialInputValue: value,
          onSelect: (v) => !!v && onPick?.(v),
          onInputValueChange: (newValue) => {
            if (newValue !== value) {
              onChange(newValue);
            }
          },
          inputId: id,
          labelId,
        },
        [
          ({ getInputProps, getMenuProps, getItemProps, isOpen, openMenu, toggleMenu, clearSelection, highlightedIndex }) => {
            clearSelectionRef.current = clearSelection;
            return div(
              {
                onFocus: openOnFocus ? openMenu : undefined,
                style: { width: style?.width || '100%', display: 'inline-flex', position: 'relative', outline: 'none' },
              },
              [
                inputIcon &&
                  icon(inputIcon, {
                    style: { transform: 'translateX(1.5rem)', alignSelf: 'center', color: colors.accent(), position: 'absolute', ...iconStyle },
                    size: 18,
                  }),
                h(
                  WrappedComponent,
                  getInputProps({
                    style: inputIcon ? { ...style, paddingLeft: '3rem' } : style,
                    type: 'search',
                    onKeyUp: (e) => {
                      if (e.key === 'Escape') {
                        (value || isOpen) && e.stopPropagation(); // prevent e.g. closing a modal
                        if (!value || isOpen) {
                          // don't clear if blank (prevent e.g. undefined -> '') or if menu is shown
                          e.nativeEvent.preventDownshiftDefault = true;
                          e.preventDefault();
                        }
                      } else if (_.includes(e.key, ['ArrowUp', 'ArrowDown']) && !suggestions.length) {
                        e.nativeEvent.preventDownshiftDefault = true;
                      } else if (e.key === 'Enter') {
                        onPick && onPick(value);
                        toggleMenu();
                      } else if (e.key === 'Backspace' && !value) {
                        clearSelection();
                        openMenu();
                      }
                    },
                    nativeOnChange: true,
                    ...props,
                    ref: combineRefs([inputEl, ref]),
                  })
                ),
                isOpen &&
                  h(
                    AutocompleteSuggestions,
                    {
                      target: getInputProps().id,
                      containerProps: getMenuProps(),
                    },
                    Utils.cond(
                      [
                        _.isEmpty(suggestions) && placeholderText,
                        () => [
                          div(
                            {
                              style: { textAlign: 'center', paddingTop: '0.75rem', height: '2.5rem', color: colors.dark(0.8) },
                            },
                            [placeholderText]
                          ),
                        ],
                      ],
                      [
                        !_.isEmpty(suggestions),
                        () =>
                          _.map(([index, item]) => {
                            return div(
                              getItemProps({
                                item,
                                key: index,
                                style: styles.suggestion(highlightedIndex === index),
                              }),
                              [renderSuggestion(item)]
                            );
                          }, Utils.toIndexPairs(suggestions)),
                      ]
                    )
                  ),
              ]
            );
          },
        ]
      );
    }
  );

/**
 * Note that `labelId` (the id of the label associated with the text input) must be passed in the props to avoid
 * an accessibility bug-- our typical pattern of associating a label with the id does not work because this is
 * a wrapped component with a child component (`Downshift`) that uses `labelId` as the id for `aria-labelledby`.
 *
 * If no visible label is desired, use `className: 'sr-only'` to visually hide the label while still properly
 * associating a label for accessibility support.
 */
export const AutocompleteTextInput = withAutocomplete(TextInput);

export const DelayedAutoCompleteInput = withDebouncedChange(AutocompleteTextInput);

export const TextArea = forwardRefWithName('TextArea', ({ onChange, autosize = false, nativeOnChange = false, ...props }, ref) => {
  useLabelAssert('TextArea', { ...props, allowId: true });

  return h(
    autosize ? TextAreaAutosize : 'textarea',
    _.merge(
      {
        ref,
        className: 'focus-style',
        style: styles.textarea,
        onChange: onChange ? (e) => onChange(nativeOnChange ? e : e.target.value) : undefined,
      },
      props
    )
  );
});

/**
 * A TextArea that provides visual and textual indications when the content is invalid.
 *
 * @param {Object} inputProps input properties for the TextArea
 * @param {String} error the message to display below the TextArea, or undefined if no error
 */
export const ValidatedTextArea = ({ inputProps, error }) => {
  return h(Fragment, [
    h(TextArea, { className: error ? 'error-style' : 'focus-style', ...inputProps }),
    div(
      {
        style: { color: colors.danger(), overflowWrap: 'break-word', marginTop: '0.75rem' },
        'aria-live': 'assertive',
        'aria-relevant': 'all',
      },
      [error]
    ),
  ]);
};

export const DelayedAutocompleteTextArea = withDebouncedChange(withAutocomplete(TextArea));

export const PasteOnlyInput = ({ onPaste, ...props }) => {
  useLabelAssert('PasteOnlyInput', { ...props, allowId: true });

  return textarea(
    _.merge(
      {
        className: 'focus-style',
        style: { ...styles.textarea, resize: 'vertical' },
        onPaste: (e) => {
          onPaste(e.clipboardData.getData('Text'));
        },
      },
      props
    )
  );
};
