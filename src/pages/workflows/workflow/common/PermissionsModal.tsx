import { ButtonPrimary, Modal, Select } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { CSSProperties, useRef, useState } from 'react';
import { IdContainer } from 'src/components/common';
import { AutocompleteTextInput } from 'src/components/input';
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

const UserInput = (props) => {
  return (
    <div style={{ display: 'flex', marginTop: '0.25rem' }}>
      <div style={{ width: 200 }}>
        <Select value='OWNER' options={['OWNER']} />
      </div>
    </div>
  );
};

const Collaborator = (/* aclItem */) => {
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
      <div style={{ flex: 1 }}>email</div>
      <UserInput />
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
  const [searchValue, setSearchValue] = useState<string>('');

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
              <AutocompleteTextInput
                labelId={id}
                openOnFocus
                // placeholderText={
                //   _.includes(searchValue, aclEmails)
                //     ? 'This email has already been added to the list'
                //     : 'Type an email address and press "Enter" or "Return"'
                // }
                /* eslint-disable-next-line no-console */
                onPick={() => console.log('add user helper')}
                placeholder='Add user'
                value={searchValue}
                //     onFocus: () => {
                //   setSearchHasFocus(true);
                // },
                //   onBlur: () => {
                //   setSearchHasFocus(false);
                // },
                onChange={setSearchValue}
                //   suggestions: cond(
                // [searchValueValid && !_.includes(searchValue, aclEmails), () => [searchValue]],
                // [remainingSuggestions.length > 0, () => remainingSuggestions],
                // () => []
                // ),
                style={{ fontSize: 16 }}
              />
            </div>
          )}
        </IdContainer>
        <ButtonPrimary
          // disable={!searchValueValid}
          // tooltip={!searchValueValid && 'Enter an email address to add a collaborator'}
          /* eslint-disable-next-line no-console */
          onClick={() => console.log('addCollaborator(searchValue)')}
        >
          Add
        </ButtonPrimary>
      </div>
      <CurrentUsers />
    </Modal>
  );
};
