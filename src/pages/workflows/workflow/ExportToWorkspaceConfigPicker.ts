import { ButtonPrimary, Modal } from '@terra-ui-packages/components';
import { ReactNode } from 'react';
import { div, h } from 'react-hyperscript-helpers';

export interface ExportToWorkspaceConfigPickerProps {
  namespace: string;
  name: string;
  setModalState: (modalState: string) => void;
  onDismiss: () => void;
}

export const ExportToWorkspaceConfigPicker = (props: ExportToWorkspaceConfigPickerProps): ReactNode => {
  const { onDismiss } = props;

  const { namespace, name, setModalState } = props;

  return h(
    Modal,
    {
      title: `Export ${namespace}/${name} to Workspace`,
      width: '300rem',
      onDismiss,
      okButton: div({}, [
        h(
          ButtonPrimary,
          {
            style: {
              marginRight: '5 rem',
            },
            onClick: () => {
              setModalState('selectWorkspace');
            },
          },
          ['Use blank configuration']
        ),
        h(
          ButtonPrimary,
          {
            disabled: true,
            onClick: () => {
              setModalState('selectWorkspace');
            },
          },
          ['Use selected Configuration']
        ),
      ]),
      showCancel: false,
    },
    ['TODO: Configuration picker']
  );
};
