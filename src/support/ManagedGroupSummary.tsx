import { ButtonPrimary } from '@terra-ui-packages/components';
import { Fragment, useState } from 'react';
import { TextArea, TextInput } from 'src/components/input';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { useOnMount } from 'src/libs/react-utils';
import { ResourceTypeSummaryProps } from 'src/support/SupportResourceType';

export const ManagedGroupSummary = (props: ResourceTypeSummaryProps) => {
  const { query } = Nav.useRoute();
  // const [groupName, setGroupName] = useState(props.fqResourceId.resourceId || '');
  const [groupSummaryInfo, setGroupSummaryInfo] = useState('');
  const [groupPolicies, setGroupPolicies] = useState('');

  async function loadGroupSummary() {
    try {
      const groupSummaryInfo = await Ajax().Groups.group(props.fqResourceId.resourceId).getSupportSummary();
      setGroupSummaryInfo(JSON.stringify(groupSummaryInfo, null, 2));
    } catch (e: Response) {
      if (e instanceof Response && e.status === 404) {
        setGroupSummaryInfo('Group not found');
      } else if (e instanceof Response && e.status === 403) {
        setGroupSummaryInfo('You do not have permission to view summary information or are not on VPN');
      } else {
        await reportError('Error loading group summary', e);
      }
    }
  }

  async function loadResourcePolicies() {
    try {
      const groupPolicies = await Ajax().SamResources.getResourcePolicies(props.fqResourceId);
      setGroupPolicies(JSON.stringify(groupPolicies, null, 2));
    } catch (e: Response) {
      if (e instanceof Response && e.status === 404) {
        setGroupPolicies('Resource not found');
      } else if (e instanceof Response && e.status === 403) {
        setGroupPolicies('You do not have permission to view resource policies or are not on VPN');
      } else {
        await reportError('Error loading resource policies', e);
      }
    }
  }

  const submit = async (): Promise<void> => {
    await loadGroupSummary();
    await loadResourcePolicies();
  };

  useOnMount(() => {
    !!props.fqResourceId.resourceId && submit();
  });

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div
          style={{
            color: colors.dark(),
            fontSize: 18,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            marginLeft: '1rem',
          }}
        >
          {props.displayName}
        </div>
        <TextInput
          placeholder="Enter group name"
          onChange={(newFilter) => {
            setGroupSummaryInfo('');
            setGroupPolicies('');
            Nav.updateSearch({ ...query, resourceName: newFilter || undefined });
          }}
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              await submit();
            }
          }}
          value={props.fqResourceId.resourceId || ''}
        />
        <ButtonPrimary onClick={() => submit()}>Load</ButtonPrimary>
      </div>
      <div
        style={{
          color: colors.dark(),
          fontSize: 18,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          marginLeft: '1rem',
        }}
      >
        Summary
      </div>
      <TextArea value={groupSummaryInfo} readOnly autosize />
      <div
        style={{
          color: colors.dark(),
          fontSize: 18,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          marginLeft: '1rem',
        }}
      >
        Sam Policies
      </div>
      <TextArea value={groupPolicies} readOnly autosize />
    </>
  );
};
