import { useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { useState } from 'react';
import { TextInput } from 'src/components/input';
import { FormLabel } from 'src/libs/forms';

interface EmailSelectProps {
  label?: string;
  placeholder?: string;
  setEmails: (values: string[]) => void;
  emails: string[];
}

export const EmailSelect: React.FC<EmailSelectProps> = ({
  label = 'User emails',
  placeholder = 'Type user emails separated by commas',
  setEmails,
  emails,
}) => {
  const [searchValue, setSearchValue] = useState<string>('');

  const emailInputId = useUniqueId();
  const emptySearchValue = (searchValue: string) => searchValue === '';

  const addSelectedOptions = (options: string) => {
    const selectedOptions: string[] = options
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email !== '');
    const newEmail: string | undefined = _.find((email: string) => !emails.includes(email), selectedOptions);
    if (newEmail || newEmail === undefined) {
      setEmails(selectedOptions);
    }
    setSearchValue('');
  };

  // const handleOnInputChange = (searchValue: any) => {
  //   !emptySearchValue(searchValue) && setSearchValue(searchValue);
  // };

  const handleOnBlur = (test: any) => {
    !emptySearchValue(test) && addSelectedOptions(searchValue);
  };

  const handleOnChange = (input: string) => {
    !emptySearchValue(input) && setSearchValue(input);
    addSelectedOptions(input);
  };

  return (
    <>
      <FormLabel id={emailInputId} required style={{ marginTop: '0.25rem' }}>
        {label}
      </FormLabel>
      <TextInput
        id={emailInputId}
        placeholder={placeholder}
        aria-label={placeholder}
        onBlur={handleOnBlur}
        onChange={handleOnChange}
        value={searchValue}
        height={200}
      />
    </>
  );
};
