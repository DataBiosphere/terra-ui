import { ButtonPrimary, Modal } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { CSSProperties, Fragment, useRef } from 'react';
import { IdContainer } from 'src/components/common';
import { TextInput } from 'src/components/input';
import colors from 'src/libs/colors';
import { FormLabel } from 'src/libs/forms';
import * as Style from 'src/libs/style';

type WorkflowPermissionsModalProps = {
  workflowOrNamespace: 'workflow' | 'namespace';
  name: string;
};

const styles: CSSProperties = {
  margin: '0.5rem -1.25rem 0',
  padding: '1rem 1.25rem',
  maxHeight: 550,
  overflowY: 'auto',
  borderBottom: Style.standardLine,
  borderTop: Style.standardLine,
};

const Collaborator = (aclItem) => {
  // console.log(aclItem[0]);
  return (
    <div
      role='listitem'
      style={{
        display: 'flex',
        alignItems: 'center',
        borderRadius: 5,
        padding: '0.5rem 0.75rem',
        marginBottom: 10,
        border: ` 2px dashed ${colors.success(0.5)}`,
        backgroundColor: colors.success(0.05),
      }}
    >
      <div style={{ flex: 1 }}>{aclItem.email}</div>
    </div>
  );
};

const CurrentUsers = (props) => {
  const list = useRef<HTMLDivElement>(null);
  const aList = [
    {
      email: 'lstrano@broadinstitute.org',
      accessLevel: 'WRITER',
      canCompute: true,
      canShare: false,
      pending: false,
    },
    {
      email: 'cpage@broadinstitute.org',
      accessLevel: 'WRITER',
      canCompute: true,
      canShare: false,
      pending: false,
    },
    {
      email: 'donttestme.koala@gmail.com',
      accessLevel: 'OWNER',
      canCompute: true,
      canShare: true,
      pending: false,
    },
  ];

  return (
    <>
      <div style={{ ...Style.elements.sectionHeader, margin: '1rem 0 0.5rem 0' }}>Current Users</div>
      <div ref={list} role='list' style={styles}>
        {_.flow(_.map((aclItem) => <Collaborator aclItem={aclItem} {...props} />))(aList)}
      </div>
    </>
  );
};

export const PermissionsModal = (props: WorkflowPermissionsModalProps) => {
  const { workflowOrNamespace, name } = props;

  return (
    <Modal
      title={`Permissions for ${workflowOrNamespace} ${name}`}
      onDismiss={undefined}
      okButton={
        /* eslint-disable-next-line no-alert */
        <ButtonPrimary onClick={() => alert('not yet implemented')}>Save</ButtonPrimary>
      }
    >
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <IdContainer>
          {(id) => (
            <div style={{ flexGrow: 1, marginRight: '1rem' }}>
              <FormLabel id={id}>User</FormLabel>
              <TextInput />
            </div>
          )}
        </IdContainer>
        <ButtonPrimary>Add</ButtonPrimary>
      </div>
      <CurrentUsers />
    </Modal>
  );
};
