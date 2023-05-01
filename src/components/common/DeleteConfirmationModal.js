import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { b, div, h, label, span } from 'react-hyperscript-helpers';
import { icon } from 'src/components/icons';
import { TextInput } from 'src/components/input';
import Modal from 'src/components/Modal';
import colors from 'src/libs/colors';

import { ButtonPrimary } from './buttons';
import { IdContainer } from './IdContainer';

export const DeleteConfirmationModal = ({
  objectType,
  objectName,
  onConfirm,
  onDismiss,
  children = undefined,
  confirmationPrompt = undefined,
  title = `Delete ${objectType}`,
  buttonText = `Delete ${objectType}`,
}) => {
  const [confirmation, setConfirmation] = useState('');
  const isConfirmed = !confirmationPrompt || _.toLower(confirmation) === _.toLower(confirmationPrompt);

  return h(
    Modal,
    {
      title: span({ style: { display: 'flex', alignItems: 'center' } }, [
        icon('warning-standard', { size: 24, color: colors.warning() }),
        span({ style: { marginLeft: '1ch' } }, [title]),
      ]),
      onDismiss,
      okButton: h(
        ButtonPrimary,
        {
          'data-testid': 'confirm-delete',
          onClick: onConfirm,
          disabled: !isConfirmed,
          tooltip: isConfirmed ? undefined : 'You must type the confirmation message',
        },
        buttonText
      ),
      styles: { modal: { backgroundColor: colors.warning(0.1) } },
    },
    [
      children ||
        h(Fragment, [
          div([`Are you sure you want to delete the ${objectType} `, b({ style: { wordBreak: 'break-word' } }, [objectName]), '?']),
          b({ style: { display: 'block', marginTop: '1rem' } }, 'This cannot be undone.'),
        ]),
      confirmationPrompt &&
        div({ style: { display: 'flex', flexDirection: 'column', marginTop: '1rem' } }, [
          h(IdContainer, [
            (id) =>
              h(Fragment, [
                label({ htmlFor: id, style: { marginBottom: '0.25rem' } }, [`Type "${confirmationPrompt}" to continue:`]),
                h(TextInput, {
                  autoFocus: true,
                  id,
                  placeholder: confirmationPrompt,
                  value: confirmation,
                  onChange: setConfirmation,
                }),
              ]),
          ]),
        ]),
    ]
  );
};
