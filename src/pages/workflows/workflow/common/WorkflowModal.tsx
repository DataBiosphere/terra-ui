import { ButtonPrimary, Clickable, Modal } from '@terra-ui-packages/components';
import { readFileAsText } from '@terra-ui-packages/core-utils';
import React, { useState } from 'react';
import Dropzone from 'src/components/Dropzone';
import { TextArea, TextInput, ValidatedInput } from 'src/components/input';
import { reportError } from 'src/libs/error';
import { FormLabel } from 'src/libs/forms';
import * as Utils from 'src/libs/utils';
import { WDLEditor } from 'src/pages/workflows/common/WDLEditor';
import validate from 'validate.js';

interface WorkflowModalProps {
  setCreateWorkflowModalOpen: (x: boolean) => void;
  title: string;
  namespace: string;
  name: string;
  synopsis: string;
  buttonActionName: string; // name of the primary button i.e. 'save' or 'upload'
  buttonAction: () => void;
  setWorkflowNamespace: (value: string) => void;
  setWorkflowName: (value: string) => void;
  setWorkflowSynopsis: (value: string) => void;
  setWorkflowDocumentation: (value: string) => void;
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

type WdlBoxSectionProps = {
  wdlPayload: string;
  setWdlPayload: (value: string) => void;
};

type WorkflowDocumentationProps = {
  setWorkflowDocumentation: (value: string) => void;
};

const constraints = {
  namespace: {
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

const uploadWdl = async (wdlFile, setWdlPayload) => {
  const rawWdl = await readFileAsText(wdlFile);
  setWdlPayload(rawWdl);
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

const WdlBoxSection = (props: WdlBoxSectionProps) => {
  const { wdlPayload, setWdlPayload } = props;
  return (
    <>
      {/* <div style={{ display: 'flex', alignItems: 'center' }}> */}
      <FormLabel>WDL</FormLabel>
      <Dropzone
        accept='.wdl'
        multiple={false}
        onDropRejected={() =>
          reportError(
            'Not a valid wdl file',
            'The selected file is not a wdl file. To import a wdl, upload a file with the .wdl extension'
          )
        }
        onDropAccepted={(wdlFile) => uploadWdl(wdlFile[0], setWdlPayload)}
      >
        {({ openUploader }) => <Clickable onClick={() => openUploader()}>Load wdl file</Clickable>}
      </Dropzone>

      <WDLEditor wdl={wdlPayload} onChange={(v: string) => setWdlPayload(v)} />
    </>
  );
};

const DocumentationSection = (props: WorkflowDocumentationProps) => {
  const { setWorkflowDocumentation } = props;
  return (
    <div style={{ paddingTop: '1.5rem' }}>
      <FormLabel>Documentation</FormLabel>
      <TextArea onChange={(v) => setWorkflowDocumentation(v)} />
    </div>
  );
};

export const WorkflowModal = (props: WorkflowModalProps) => {
  const [wdlPayload, setWdlPayload] = useState<string>('');
  const {
    setCreateWorkflowModalOpen,
    title,
    namespace,
    name,
    buttonActionName,
    synopsis,
    buttonAction,
    setWorkflowNamespace,
    setWorkflowName,
    setWorkflowSynopsis,
    setWorkflowDocumentation,
  } = props;

  const errors = validate({ namespace, name, synopsis }, constraints, {
    prettify: (v) => ({ namespace: 'Namespace', name: 'Name', synopsis: 'Synopsis' }[v] || validate.prettify(v)),
  });

  return (
    <Modal
      onDismiss={() => {
        setCreateWorkflowModalOpen(false);
        setWorkflowNamespace('');
        setWorkflowName('');
        setWdlPayload('');
        setWorkflowDocumentation('');
      }}
      title={title}
      width='75rem'
      okButton={
        /* eslint-disable-next-line no-alert */
        <ButtonPrimary disabled={errors} onClick={() => buttonAction()}>
          {buttonActionName}
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
        <div style={{ paddingTop: '1.5rem' }}>
          <WdlBoxSection wdlPayload={wdlPayload} setWdlPayload={setWdlPayload} />
        </div>
        <DocumentationSection setWorkflowDocumentation={setWorkflowDocumentation} />
        <SynopsisSnapshotSection synopsis={synopsis} setWorkflowSynopsis={setWorkflowSynopsis} errors={errors} />
        {(namespace + name).length > 250 && (
          <div style={{ color: 'red', paddingTop: '1.5rem' }}>
            The namespace/name configuration must be 250 characters or less.
          </div>
        )}
      </div>
    </Modal>
  );
};
