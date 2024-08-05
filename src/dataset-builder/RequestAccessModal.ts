import { ButtonPrimary, Modal } from '@terra-ui-packages/components';
import { div, h, h3, span } from 'react-hyperscript-helpers';
import { ClipboardButton, ClipboardButtonProps } from 'src/components/ClipboardButton';
import colors from 'src/libs/colors';

const clipboardButtonProps = (copyableText, labelDescriptor): ClipboardButtonProps => ({
  className: 'cell-hover-only',
  style: {
    fontWeight: 600,
    marginTop: 20,
    display: 'block',
  },
  iconSize: 14,
  tooltipSide: 'left',
  'aria-label': `Copy ${labelDescriptor} to clipboard`,
  text: copyableText,
  tooltip: `Copy ${labelDescriptor} to clipboard`,
});

interface RequestAccessModalProps {
  onDismiss: () => void;
  snapshotId: string;
  summary: string;
}

export const RequestAccessModal = (props: RequestAccessModalProps) => {
  const { onDismiss, snapshotId, summary } = props;

  return h(
    Modal,
    {
      title: 'Access request created in Terra',
      showX: false,
      onDismiss,
      width: 500,
      cancelText: 'Return to AxIN Overview',
      okButton: h(
        ButtonPrimary,
        {
          href: '',
          target: '_blank',
        },
        ['Continue to Form']
      ),
    },
    [
      div({ style: { lineHeight: 1.5 } }, [
        'A request has been generated and may take up to 72 hours for approval. Check your email for a copy of this request. You’ll also be notified via email on approval of the request.',
      ]),
      div(
        {
          style: {
            backgroundColor: colors.accent(0.15),
            color: colors.dark(),
            border: `1px solid ${colors.accent(1.25)}`,
            borderRadius: 10,
            padding: '1rem',
            marginTop: '1.5rem',
            marginBottom: '2rem',
          },
        },
        [
          div([
            h3({
              style: { marginTop: 5, fontWeight: 600 },
              children: ['Important!'],
            }),
            div(
              {
                style: { display: 'pre-wrap', marginTop: -10, lineHeight: 1.5 },
              },
              [
                span(['Before proceeding to the AnalytiXIN form, please copy and paste the ']),
                span({ style: { fontWeight: 600 } }, ['Request ID']),
                span([' and the ']),
                span({ style: { fontWeight: 600 } }, ['Request Summary']),
                span([' into any text editing tool.']),
              ]
            ),
            div({ style: { marginTop: 20 } }, [
              h(ClipboardButton, { ...clipboardButtonProps(snapshotId, 'Request ID') }, ['Request ID']),
              h(ClipboardButton, { ...clipboardButtonProps(summary, 'Request Summary') }, ['Request Summary']),
            ]),
          ]),
        ]
      ),
    ]
  );
};
