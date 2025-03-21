import { ExternalLink, Switch } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode } from 'react';
import { IdContainer, Select } from 'src/components/common';
import { FormLabel } from 'src/libs/forms';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

export const NewWorkspaceSecurityTab = ({
  requireEnhancedBucketLogging,
  enhancedBucketLogging,
  setEnhancedBucketLogging,
  groups,
  setGroups,
  cloningGcpProtectedWorkspace,
  existingGroups,
  allGroups,
  billingProjects,
  renderNotice,
  selectedBillingProject,
}): ReactNode => {
  const endingNotice = renderNotice ? renderNotice({ selectedBillingProject }) : undefined;

  const renderPolicyAndWorkspaceInfo = () => {
    // If we display the Azure policy/workspace section, we render the optional notice within that block
    return endingNotice ? <div style={{ ...Style.elements.noticeContainer }}>{endingNotice}</div> : undefined;
  };

  return (
    <div style={{ margin: '1rem 0.25rem 0.25rem 0' }}>
      <IdContainer>
        {(id) => (
          <>
            <FormLabel htmlFor={id}>Additional Security Options</FormLabel>
            <p style={{ marginTop: '.25rem', marginLeft: '0.25rem' }}>
              In order to ensure that only authorized Terra Users get access to a User’s Workspace you must select these
              options:
            </p>
          </>
        )}
      </IdContainer>
      <IdContainer>
        {(id) => (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              outline: 'solid',
              borderRadius: '5px',
              columnGap: '5%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '80%',
                justifyContent: 'space-between',
                padding: '1rem',
              }}
            >
              <FormLabel htmlFor={id}>Enable Secure Monitoring</FormLabel>
              <p style={{ padding: '0.1rem' }}>
                Enhanced logging and monitoring are enabled to support the use of controlled-access data in this
                workspace.
              </p>
            </div>
            <div style={{ marginTop: '0.5rem', alignSelf: 'right', display: 'flex', alignItems: 'center' }}>
              <Switch
                onLabel=''
                offLabel=''
                onChange={() => {
                  setEnhancedBucketLogging(!enhancedBucketLogging);
                }}
                checked={enhancedBucketLogging || groups.length > 0}
                width={40}
                height={20}
                disabled={!!requireEnhancedBucketLogging || groups.length > 0 || cloningGcpProtectedWorkspace}
                aria-describedby='Enable additional security monitoring'
              />
            </div>
          </div>
        )}
      </IdContainer>
      <IdContainer>
        {(id) => (
          <>
            <FormLabel htmlFor={id}>Authorization Domain (optional)</FormLabel>
            <div style={{ marginLeft: '0.25rem' }}>
              Authorization Domains restrict data access to only specified individuals in a group and are intended to
              fulfill requirements you may have for data governed by a compliance standard, such as federal
              controlled-access data or HIPAA protected data. They follow all workspace copies and cannot be removed.
              <p>
                For more details, see{' '}
                <ExternalLink
                  href='https://support.terra.bio/hc/en-us/articles/360026775691'
                  {...Utils.newTabLinkProps}
                >
                  When to use an Authorization Domain
                </ExternalLink>
                .
              </p>
            </div>
            {!!existingGroups.length && (
              <div style={{ marginBottom: '0.5rem', fontSize: 12 }}>
                <div style={{ marginBottom: '0.2rem' }}>Inherited groups:</div>
                {existingGroups.join(', ')}
              </div>
            )}
            <Select<string, true>
              id={id}
              isClearable={false}
              isMulti
              placeholder='Select groups'
              isDisabled={!allGroups || !billingProjects}
              value={groups}
              onChange={(data) => {
                setGroups(_.map('value', data));
                setEnhancedBucketLogging(!!requireEnhancedBucketLogging || data.length > 0);
              }}
              options={_.difference(_.uniq(_.map('groupName', allGroups)), existingGroups).sort()}
            />
          </>
        )}
      </IdContainer>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>{renderPolicyAndWorkspaceInfo()}</div>
    </div>
  );
};
