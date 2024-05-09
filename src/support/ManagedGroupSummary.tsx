import ReactJson from '@microlink/react-json-view';
import { ButtonPrimary } from '@terra-ui-packages/components';
import { Fragment, useState } from 'react';
import { TextInput } from 'src/components/input';
import { Ajax } from 'src/libs/ajax';
import { GroupSupportSummary } from 'src/libs/ajax/Groups';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { useOnMount } from 'src/libs/react-utils';
import { ResourceTypeSummaryProps } from 'src/support/SupportResourceType';

export const ManagedGroupSummary = (props: ResourceTypeSummaryProps) => {
  const { query } = Nav.useRoute();

  const [groupSummaryInfo, setGroupSummaryInfo] = useState<GroupSupportSummary>();
  const [groupPolicies, setGroupPolicies] = useState<string[]>();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  async function loadGroupSummary() {
    try {
      const groupSummaryInfo = await Ajax().Groups.group(props.fqResourceId.resourceId).getSupportSummary();
      setGroupSummaryInfo(groupSummaryInfo);
    } catch (e: Response) {
      if (e instanceof Response && e.status === 404) {
        errorMessages.push('Group not found');
      } else if (e instanceof Response && e.status === 403) {
        errorMessages.push('You do not have permission to view summary information or are not on VPN');
      } else {
        await reportError('Error loading group summary', e);
      }
    }
  }

  async function loadResourcePolicies() {
    try {
      const groupPolicies = await Ajax().SamResources.getResourcePolicies(props.fqResourceId);
      setGroupPolicies(groupPolicies);
    } catch (e: Response) {
      if (e instanceof Response && e.status === 404) {
        errorMessages.push('Resource not found');
      } else if (e instanceof Response && e.status === 403) {
        errorMessages.push('You do not have permission to view resource policies or are not on VPN');
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
          style={{ marginRight: '1rem', marginLeft: '1rem' }}
          placeholder="Enter group name"
          onChange={(newFilter) => {
            setGroupSummaryInfo(null);
            setGroupPolicies(null);
            setErrorMessages([]);
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
      {!!errorMessages &&
        errorMessages.map((message) => <div style={{ color: colors.danger(), marginLeft: '1rem' }}>{message}</div>)}
      {!!groupSummaryInfo && (
        <>
          <div
            style={{
              color: colors.dark(),
              fontSize: 18,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              marginLeft: '1rem',
              marginTop: '1rem',
            }}
          >
            Summary
          </div>
          <ReactJson
            src={groupSummaryInfo}
            name={false}
            style={{ marginLeft: '1rem', border: '1px solid black', padding: '1rem' }}
          />
          <div
            style={{
              color: colors.dark(),
              fontSize: 18,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              marginLeft: '1rem',
              marginTop: '1rem',
            }}
          >
            Sam Policies
          </div>
          <ReactJson
            src={groupPolicies}
            name={false}
            style={{ marginLeft: '1rem', border: '1px solid black', padding: '1rem' }}
          />
        </>
      )}
    </>
  );
};
