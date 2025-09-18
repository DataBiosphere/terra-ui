import { TooltipTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode, useState } from 'react';
import { BillingProject } from 'src/billing-core/models';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { IdContainer, Link, Select, VirtualizedSelect } from 'src/components/common';
import { InfoBox } from 'src/components/InfoBox';
import { TextArea, ValidatedInput } from 'src/components/input';
import { availableBucketRegions } from 'src/components/region-common';
import { FormLabel } from 'src/libs/forms';
import * as Utils from 'src/libs/utils';
import { cloudProviderLabels } from 'src/workspaces/utils';

export const NewWorkspaceBasicTab = ({
  setName,
  name,
  errors,
  description,
  setDescription,
  namespace,
  billingProjects,
  setNamespace,
  bucketLocation,
  setBucketLocation,
}): ReactNode => {
  const [nameModified, setNameModified] = useState(false);

  const onFocusAria = ({ focused, isDisabled }) => {
    return `${isDisabled ? 'Disabled option ' : 'Option '}${focused['aria-label']}, focused.`;
  };

  const onChangeAria = ({ value }) => {
    return !value ? '' : `Option ${value['aria-label']} selected.`;
  };

  const invalidBillingAccountMsg =
    'Workspaces may only be created in billing projects that have a Google billing account accessible in Terra';

  const ariaInvalidBillingAccountMsg = (invalidBillingAccount: boolean): string => {
    return invalidBillingAccount ? ` with warning "${invalidBillingAccountMsg}"` : '';
  };

  return (
    <>
      <IdContainer>
        {(id) => (
          <>
            <FormLabel htmlFor={id} required>
              Workspace name
            </FormLabel>
            <ValidatedInput
              inputProps={{
                id,
                autoFocus: true,
                placeholder: 'Enter a name',
                value: name,
                onChange: (v) => {
                  setName(v);
                  setNameModified(true);
                },
              }}
              error={Utils.summarizeErrors(nameModified && errors?.name)}
            />
          </>
        )}
      </IdContainer>
      <IdContainer>
        {(id) => (
          <>
            <FormLabel htmlFor={id}>Description</FormLabel>
            <TextArea
              id={id}
              style={{ height: 100 }}
              placeholder='Enter a description'
              value={description}
              onChange={setDescription}
            />
          </>
        )}
      </IdContainer>
      <IdContainer>
        {(id) => (
          <>
            <FormLabel htmlFor={id} required>
              Billing project
            </FormLabel>
            <VirtualizedSelect
              id={id}
              isClearable={false}
              placeholder='Select a billing project'
              value={namespace || null}
              ariaLiveMessages={{ onFocus: onFocusAria, onChange: onChangeAria }}
              onChange={(opt) => setNamespace(opt!.value)}
              styles={{ option: (provided) => ({ ...provided, padding: 10 }) }}
              options={_.map((project: BillingProject) => {
                const { projectName, invalidBillingAccount, cloudPlatform } = project;
                return {
                  'aria-label': `${cloudProviderLabels[cloudPlatform]} ${projectName}${ariaInvalidBillingAccountMsg(
                    invalidBillingAccount
                  )}`,
                  label: (
                    <TooltipTrigger content={invalidBillingAccount && invalidBillingAccountMsg} side='left'>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {cloudPlatform === 'GCP' && (
                          <CloudProviderIcon
                            key={projectName}
                            cloudProvider={cloudPlatform}
                            style={{ marginRight: '0.5rem' }}
                          />
                        )}
                        {projectName}
                      </div>
                    </TooltipTrigger>
                  ),
                  value: projectName,
                  isDisabled: invalidBillingAccount,
                };
              }, _.sortBy('projectName', _.filter({ cloudPlatform: 'GCP' }, billingProjects)))}
            />
          </>
        )}
      </IdContainer>
      <IdContainer>
        {(id) => (
          <>
            <FormLabel htmlFor={id}>
              Bucket location
              <InfoBox style={{ marginLeft: '0.25rem' }}>
                <p style={{ marginTop: '0.2rem' }}>
                  By default, workflow and Cloud Environments will run in the same region as the workspace bucket.
                  Changing bucket or Cloud Environment locations from the defaults can lead to network egress charges.
                </p>
                <Link href='https://support.terra.bio/hc/en-us/articles/360058964552' {...Utils.newTabLinkProps}>
                  Read more about bucket locations
                </Link>
              </InfoBox>
            </FormLabel>
            <Select<string>
              isDisabled
              id={id}
              value={bucketLocation}
              onChange={(opt) => setBucketLocation(opt!.value)}
              options={availableBucketRegions}
            />
          </>
        )}
      </IdContainer>
    </>
  );
};
