import { useUniqueId } from '@terra-ui-packages/components';
import { ReactElement } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ValidatedInput } from 'src/components/input';
import { FormLabel } from 'src/libs/forms';
import * as Utils from 'src/libs/utils';

interface InputProps<T> {
  title?: string;
  value?: T;
  onChange: Function;
  wrapperProps?: {};
  errors?: any;
  placeholder?: string;
}

interface StringInputProps extends InputProps<string> {
  autoFocus?: boolean;
  required?: boolean;
}

export const StringInput = ({
  title,
  onChange,
  value,
  placeholder,
  autoFocus = false,
  required = false,
  errors,
  wrapperProps = {},
}: StringInputProps): ReactElement => {
  const id = useUniqueId();
  return div(wrapperProps, [
    title && h(FormLabel, { htmlFor: id, required }, [title]),
    h(ValidatedInput, {
      inputProps: {
        id,
        'aria-label': title ? undefined : value,
        autoFocus,
        placeholder,
        value,
        onChange,
      },
      error: Utils.summarizeErrors(errors),
    }),
  ]);
};
