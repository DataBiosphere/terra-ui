import { ButtonPrimary, Modal } from '@terra-ui-packages/components';
import React from 'react';
import { TextInput } from 'src/components/input';
import { FormLabel } from 'src/libs/forms';

interface WorkflowModalProps {
  setCreateWorkflowModalOpen: (x: boolean) => void;
  title: string;
  namespace: string;
  name: string;
  synopsis: string;
  buttonAction: string; // name of the primary button i.e. 'save' or 'upload'
  setWorkflowNamespace: (value: string) => void;
  setWorkflowName: (value: string) => void;
  setWorkflowSynopsis: (value: string) => void;
}

interface NamespaceNameSectionProps {
  namespace: string | undefined;
  name: string | undefined;
  setWorkflowNamespace: (value: string) => void;
  setWorkflowName: (value: string) => void;
}

interface SynopsisSnapshotSectionProps {
  synopsis: string;
  setWorkflowSynopsis: (value: string) => void;
}

const NamespaceNameSection = (props: NamespaceNameSectionProps) => {
  const namingMessage = 'Only letters, numbers, underscores, dashes, and periods allowed';
  const { namespace, name, setWorkflowNamespace, setWorkflowName } = props;

  return (
    <>
      <div style={{ flexWrap: 'wrap', flexGrow: 1, flexBasis: '400px' }}>
        <div style={{ marginBottom: '0.1667em' }}>
          <FormLabel>Namespace</FormLabel>
        </div>
        <div>
          <TextInput value={namespace} onChange={(value: string) => setWorkflowNamespace(value)} />
        </div>
        <div style={{ fontStyle: 'italic' }}>{namingMessage}</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', flexGrow: 1, flexBasis: '400px' }}>
        <div style={{ marginBottom: '0.1667em' }}>
          <FormLabel>Name</FormLabel>
        </div>
        <TextInput value={name} onChange={(value: string) => setWorkflowName(value)} />
        <div style={{ fontStyle: 'italic' }}>{namingMessage}</div>
      </div>
    </>
  );
};

const SynopsisSnapshotSection = (props: SynopsisSnapshotSectionProps) => {
  const { synopsis, setWorkflowSynopsis } = props;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ paddingTop: '1.5rem' }}>
        <div style={{ marginBottom: '0.1667em' }}>
          <FormLabel>Synopsis (optional, 80 characters max)</FormLabel>
        </div>
        <TextInput value={synopsis} onChange={(value) => setWorkflowSynopsis(value)} />
      </div>
      <div style={{ paddingTop: '1.5rem' }}>
        <div style={{ marginBottom: '0.1667em' }}>
          <FormLabel>Snapshot Comment (optional)</FormLabel>
        </div>
        <TextInput />
      </div>
    </div>
  );
};

export const WorkflowModal = (props: WorkflowModalProps) => {
  const {
    setCreateWorkflowModalOpen,
    title,
    namespace,
    name,
    buttonAction,
    synopsis,
    setWorkflowNamespace,
    setWorkflowName,
    setWorkflowSynopsis,
  } = props;

  return (
    <Modal
      onDismiss={() => setCreateWorkflowModalOpen(false)}
      title={title}
      width='65rem'
      /* eslint-disable-next-line no-alert */
      okButton={<ButtonPrimary onClick={() => alert('not yet implemented')}>{buttonAction}</ButtonPrimary>}
    >
      <div style={{ padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <NamespaceNameSection
            namespace={namespace}
            name={name}
            setWorkflowNamespace={setWorkflowNamespace}
            setWorkflowName={setWorkflowName}
          />
        </div>
        <SynopsisSnapshotSection synopsis={synopsis} setWorkflowSynopsis={setWorkflowSynopsis} />
      </div>
    </Modal>
  );
};
