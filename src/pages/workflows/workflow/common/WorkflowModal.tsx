import { ButtonPrimary, Modal } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import { TextInput, ValidatedInput } from 'src/components/input';
import { FormLabel } from 'src/libs/forms';
import * as Utils from 'src/libs/utils';
import validate from 'validate.js';

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
  errors: any;
}

interface SynopsisSnapshotSectionProps {
  synopsis: string;
  setWorkflowSynopsis: (value: string) => void;
  errors: any;
}

const constraints = {
  namespace: {
    length: { maximum: 254 },
    presence: { allowEmpty: false },
    format: {
      pattern: /[\w- ]*/,
      message: 'can only contain letters, numbers, dashes, underscores, and spaces',
    },
  },
  name: {
    presence: { allowEmpty: false },
    format: {
      pattern: /[\w- ]*/,
      message: 'can only contain letters, numbers, dashes, underscores, and spaces',
    },
  },
  synopsis: {
    length: { maximum: 80 },
  },
};

const NamespaceNameSection = (props: NamespaceNameSectionProps) => {
  const { namespace, name, setWorkflowNamespace, setWorkflowName, errors } = props;
  const [namespaceModified, setNamespaceModified] = useState<boolean>(false);
  const [nameModified, setNameModified] = useState<boolean>(false);

  return (
    <>
      <div style={{ flexWrap: 'wrap', flexGrow: 1, flexBasis: '400px' }}>
        <div style={{ marginBottom: '0.1667em' }}>
          <FormLabel required>Namespace</FormLabel>
          <ValidatedInput
            inputProps={{
              autoFocus: true,
              value: namespace,
              onChange: (v) => {
                setWorkflowNamespace(v);
                setNamespaceModified(true);
              },
            }}
            error={Utils.summarizeErrors(namespaceModified && errors?.namespace)}
          />
        </div>
      </div>
      <div style={{ flexWrap: 'wrap', flexGrow: 1, flexBasis: '400px' }}>
        <div style={{ marginBottom: '0.1667em' }}>
          <FormLabel required>Name</FormLabel>
          <ValidatedInput
            inputProps={{
              autoFocus: true,
              value: name,
              onChange: (v) => {
                setWorkflowName(v);
                setNameModified(true);
              },
            }}
            error={Utils.summarizeErrors(nameModified && errors?.name)}
          />
        </div>
      </div>
    </>
  );
};

const SynopsisSnapshotSection = (props: SynopsisSnapshotSectionProps) => {
  const { synopsis, setWorkflowSynopsis, errors } = props;
  const [synopsisModified, setSynopsisModified] = useState<boolean>(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ paddingTop: '1.5rem' }}>
        <div style={{ marginBottom: '0.1667em' }}>
          <FormLabel>Synopsis (80 characters max)</FormLabel>
          <ValidatedInput
            inputProps={{
              autoFocus: true,
              value: synopsis,
              onChange: (v) => {
                setWorkflowSynopsis(v);
                setSynopsisModified(true);
              },
            }}
            error={Utils.summarizeErrors(synopsisModified && errors?.synopsis)}
          />
        </div>
      </div>
      <div style={{ paddingTop: '1.5rem' }}>
        <div style={{ marginBottom: '0.1667em' }}>
          <FormLabel>Snapshot Comment</FormLabel>
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

  const errors = validate({ namespace, name, synopsis }, constraints, {
    prettify: (v) => ({ namespace: 'Namespace', name: 'Name', synopsis: 'Synopsis' }[v] || validate.prettify(v)),
  });

  return (
    <Modal
      onDismiss={() => setCreateWorkflowModalOpen(false)}
      title={title}
      width='75rem'
      okButton={
        /* eslint-disable-next-line no-alert */
        <ButtonPrimary disabled={errors} onClick={() => alert('not yet implemented')}>
          {buttonAction}
        </ButtonPrimary>
      }
    >
      <div style={{ padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <NamespaceNameSection
            namespace={namespace}
            name={name}
            setWorkflowNamespace={setWorkflowNamespace}
            setWorkflowName={setWorkflowName}
            errors={errors}
          />
        </div>
        <SynopsisSnapshotSection synopsis={synopsis} setWorkflowSynopsis={setWorkflowSynopsis} errors={errors} />
      </div>
    </Modal>
  );
};
