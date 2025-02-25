import { useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React from 'react';
import { TextInput } from 'src/components/input';
import { FormLabel } from 'src/libs/forms';

interface EmailSelectProps {
  label?: string;
  placeholder?: string;
  setEmails: (values: string[]) => void;
}

export const EmailSelect: React.FC<EmailSelectProps> = ({
  label = 'User emails',
  placeholder = 'Type user emails separated by commas',
  setEmails,
}) => {
  const emailInputId = useUniqueId();
  const addSelectedOptions = (emails: string) => {
    const selectedOptions: string[] = emails
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email !== '');
    const newEmail: string | undefined = _.find((email: string) => !emails.includes(email), selectedOptions);
    if (newEmail || newEmail === undefined) {
      setEmails(selectedOptions);
    }
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
        onChange={addSelectedOptions}
        height={200}
      />
    </>
  );
};
