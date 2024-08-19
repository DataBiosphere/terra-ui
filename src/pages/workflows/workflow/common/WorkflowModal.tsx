import { ButtonPrimary, Modal } from '@terra-ui-packages/components';
import React from 'react';
import { TextInput } from 'src/components/input';

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
      <div style={{ flex: '1 0 auto', marginRight: '1em' }}>
        <div style={{ marginBottom: '0.1667em' }}>Namespace</div>
        <div>
          <TextInput
            style={{ width: '100%' }}
            value={namespace}
            onChange={(value: string) => setWorkflowNamespace(value)}
          />
        </div>
        <div style={{ fontStyle: 'italic' }}>{namingMessage}</div>
      </div>
      <div style={{ flex: '1 0 auto' }}>
        <div style={{ marginBottom: '0.1667em' }}>Name</div>
        <TextInput style={{ width: '100%' }} value={name} onChange={(value: string) => setWorkflowName(value)} />
        <div style={{ fontStyle: 'italic' }}>{namingMessage}</div>
      </div>
      ;
    </>
  );
};

const SynopsisSnapshotSection = (props: SynopsisSnapshotSectionProps) => {
  const { synopsis, setWorkflowSynopsis } = props;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ paddingTop: '1.5rem' }}>
        <div style={{ marginBottom: '0.1667em' }}>Synopsis (optional, 80 characters max)</div>
        <TextInput value={synopsis} onChange={(value) => setWorkflowSynopsis(value)} />
      </div>
      <div style={{ paddingTop: '1.5rem' }}>
        <div style={{ marginBottom: '0.1667em' }}>Snapshot Comment (optional)</div>
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
      width='70%'
      /* eslint-disable-next-line no-alert */
      okButton={<ButtonPrimary onClick={() => alert('not yet implemented')}>{buttonAction}</ButtonPrimary>}
    >
      <div style={{ padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
