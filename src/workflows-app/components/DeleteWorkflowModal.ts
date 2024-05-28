import { useThemeFromContext } from '@terra-ui-packages/components';
import { Modal } from '@terra-ui-packages/components';
import { div, h, span } from 'react-hyperscript-helpers';
import { ButtonPrimary } from 'src/components/common';
import { icon } from 'src/components/icons';
import { icon } from 'src/components/icons';

type DeleteWorkflowModalProps = {
  methodName: string;
  onDismiss: () => void;
  onDelete: () => void;
};

export const DeleteWorkflowModal = ({ methodName, onDismiss, onDelete }: DeleteWorkflowModalProps) => {
  const { colors } = useThemeFromContext();
  return h(
    Modal,
    {
      title: span({ style: { display: 'flex', alignItems: 'center' } }, [
        icon('warning-standard', { size: 24, color: colors.warning() }),
        span({ style: { marginLeft: '1ch' } }, ['Delete workflow']),
      ]),
      width: 700,
      onDismiss,
      showCancel: true,
      okButton: h(
        ButtonPrimary,
        {
          onClick: () => {
            onDelete();
            onDismiss();
          },
        },
        ['Delete workflow']
      ),
      styles: { modal: { background: colors.warning(0.1) } },
    },
    [
      div({ style: { paddingBottom: '1.5rem', display: 'flex', flex: 'none' } }, [
        div([`Are you sure you want to delete workflow "${methodName}"?`]),
      ]),
    ]
  );
};
