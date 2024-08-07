import { ButtonPrimary, Icon, Modal, useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode, useState } from 'react';
import { TextInput } from 'src/components/input';
import colors from 'src/libs/colors';

interface DeleteConfirmationModalProps {
  objectType: string;
  objectName: string;
  onConfirm: () => void;
  onDismiss: () => void;
  children?: ReactNode;
  confirmationPrompt?: string;
  title?: string;
  buttonText?: string;
}

export const DeleteConfirmationModal = (props: DeleteConfirmationModalProps): ReactNode => {
  const {
    objectType,
    objectName,
    onConfirm,
    onDismiss,
    children = undefined,
    confirmationPrompt = undefined,
    title = `Delete ${objectType}`,
    buttonText = `Delete ${objectType}`,
  } = props;
  const [confirmation, setConfirmation] = useState('');
  const isConfirmed = !confirmationPrompt || _.toLower(confirmation) === _.toLower(confirmationPrompt);
  const inputId = useUniqueId('input');

  return (
    <Modal
      title={
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <Icon size={24} color={colors.warning()} icon='warning-standard' />
          <span style={{ marginLeft: '1ch' }}>{title}</span>
        </span>
      }
      onDismiss={onDismiss}
      okButton={
        <ButtonPrimary
          data-testid='confirm-delete'
          onClick={onConfirm}
          disabled={!isConfirmed}
          tooltip={isConfirmed ? undefined : 'You must type the confirmation message'}
        >
          {buttonText}
        </ButtonPrimary>
      }
      styles={{ modal: { backgroundColor: colors.warning(0.1) } }}
    >
      {children || (
        <>
          <div>
            Are you sure you want to delete the {objectType} <b style={{ wordBreak: 'break-word' }}>{objectName}</b>?
          </div>
          <b style={{ display: 'block', marginTop: '1rem' }}>This cannot be undone.</b>
        </>
      )}
      {confirmationPrompt && (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
          <label htmlFor={inputId} style={{ marginBottom: '0.25rem' }}>
            {`Type "${confirmationPrompt}" to continue:`}
          </label>
          <TextInput
            autoFocus
            id={inputId}
            placeholder={confirmationPrompt}
            value={confirmation}
            onChange={setConfirmation}
          />
        </div>
      )}
    </Modal>
  );
};
