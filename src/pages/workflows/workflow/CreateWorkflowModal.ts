import { Modal } from '@terra-ui-packages/components';
import { ReactNode } from 'react';
import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { TextArea, TextInput } from 'src/components/input';
import { Ajax } from 'src/libs/ajax';
import { useCancellation } from 'src/libs/react-utils';

export interface CreateWorkflowModalProps {
  onDismiss: () => void;
}

export const CreateWorkflowModal = (props: CreateWorkflowModalProps): ReactNode => {
  const { onDismiss } = props;
  const signal = useCancellation();

  const [workflowNamespace, setWorkflowNamespace] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [workflowContent, setWorkflowContent] = useState('');
  const [documentation, setDocumentation] = useState('');
  const [comment, setComment] = useState('');

  return h(
    Modal,
    {
      title: 'Create workflow',
      onDismiss,
      okButton: async () => {
        await Ajax(signal).Methods.createWorkflow(
          workflowNamespace,
          workflowName,
          synopsis,
          comment,
          documentation,
          workflowContent
        );
      },
    },
    [
      div({ style: { lineHeight: 1.5 } }, [
        div(['Create a new workflow by providing a name, description, and content.']),
        div({ style: { display: 'flex', flexDirection: 'column', gap: '1rem' } }, [
          div({ style: { display: 'flex', flexDirection: 'row', gap: '1rem' } }, [
            'Workflow Namespace / Name',
            h(TextInput, { label: 'Namespace', value: workflowNamespace, onChange: setWorkflowNamespace }),
            h(TextInput, { label: 'Name', value: workflowName, onChange: setWorkflowName }),
          ]),
          div({ style: { display: 'flex', flexDirection: 'row', gap: '1rem' } }, [
            'Synopsis',
            h(TextInput, { label: 'Synopsis', value: synopsis, onChange: setSynopsis }),
          ]),
          div({ style: { display: 'flex', flexDirection: 'column', gap: '1rem' } }, [
            'Workflow Content',
            h(TextArea, {
              style: { height: 100 },
              label: 'Workflow Content',
              value: workflowContent,
              onChange: setWorkflowContent,
            }),
          ]),
          div({ style: { display: 'flex', flexDirection: 'row', gap: '1rem' } }, [
            'Documentation',
            h(TextInput, {
              label: 'Documentation',
              value: documentation,
              onChange: setDocumentation,
            }),
          ]),
          div({ style: { display: 'flex', flexDirection: 'row', gap: '1rem' } }, [
            'Snapshot Comment',
            h(TextInput, { label: 'Snapshot comment', value: comment, onChange: setComment }),
          ]),
        ]),
      ]),
    ]
  );
};
