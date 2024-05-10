import { ButtonPrimary } from '@terra-ui-packages/components';
import React, { Fragment, useState } from 'react';
import { TextInput } from 'src/components/input';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { ResourcePolicies } from 'src/support/ResourcePolicies';
import { ResourceTypeSummaryProps } from 'src/support/SupportResourceType';
import { SupportSummary } from 'src/support/SupportSummary';

export const LookupSummaryAndPolicies = (props: ResourceTypeSummaryProps) => {
  const { query } = Nav.useRoute();
  const [resourceId, setResourceId] = useState<string>(props.fqResourceId.resourceId);

  function submit() {
    Nav.updateSearch({ ...query, resourceName: resourceId || undefined });
  }

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
          key={`${props.fqResourceId.resourceTypeName}-input`}
          placeholder={`Enter ${props.displayName} ID`}
          onChange={(newResourceId) => {
            setResourceId(newResourceId);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              submit();
            }
          }}
          defaultValue={props.fqResourceId.resourceId || ''}
        />
        <ButtonPrimary onClick={() => submit()}>Load</ButtonPrimary>
      </div>
      {!!props.loadSupportSummaryFn && (
        <SupportSummary {...props} key={`${props.fqResourceId.resourceTypeName}-summary`} />
      )}
      <ResourcePolicies {...props} key={`${props.fqResourceId.resourceTypeName}-policy`} />
    </>
  );
};
