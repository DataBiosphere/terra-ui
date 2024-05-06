import { icon, useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React from 'react';
import { ReactNode, useState } from 'react';
import { BillingProject } from 'src/billing-core/models';
import { Checkbox, LabeledCheckbox } from 'src/components/common';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';
import { getPolicyDescriptions, isAzureWorkspace, phiTrackingLabel, WorkspaceWrapper } from 'src/workspaces/utils';
import { LinkWithPopout } from 'src/workspaces/WorkspacePolicies/LinkWithPopout';

export type WorkspacePoliciesProps = {
  workspace?: WorkspaceWrapper;
  billingProject?: BillingProject;
  endingNotice?: ReactNode;
  noCheckboxes?: boolean;
  onTogglePhiTracking?: (selected: boolean) => void;
  togglePhiTrackingChecked?: boolean;
};

export const WorkspacePolicies = (props: WorkspacePoliciesProps): ReactNode => {
  const policyDescriptions = getPolicyDescriptions(props.workspace, props.billingProject);
  const policyHref =
    (!!props.workspace && isAzureWorkspace(props.workspace)) || props.billingProject?.cloudPlatform === 'AZURE'
      ? 'https://support.terra.bio/hc/en-us/articles/21329019108635-Host-FISMA-data-on-FedRAMP-moderate-Terra-Azure'
      : 'https://support.terra.bio/hc/en-us/articles/360026775691-Overview-Managing-access-to-controlled-data-with-Authorization-Domains';
  const [phiTracking, setPhiTracking] = useState(!!props.togglePhiTrackingChecked);

  const listTitle = 'Security and controls on this workspace:';
  const phiTrackingCallback = (selected: boolean) => {
    setPhiTracking(selected);
    if (props.onTogglePhiTracking) {
      props.onTogglePhiTracking(selected);
    }
  };
  const id = useUniqueId();
  if (policyDescriptions.length > 0) {
    return (
      <div style={{ ...Style.elements.noticeContainer }}>
        <div style={{ fontWeight: 600, display: 'grid', gridTemplateColumns: 'min-content auto' }}>
          {icon('shieldCheck', { size: 18, style: { marginRight: '0.5rem', verticalAlign: 'text-bottom' } })}
          <div style={{}}>
            <div style={{}} id={`list-title-${id}`}>
              {listTitle}
            </div>
            <LinkWithPopout href={policyHref}>Learn more about Terra security</LinkWithPopout>
          </div>
        </div>
        <div
          role="list"
          style={{ marginBlockStart: '0.5rem', marginBlockEnd: '0.5rem' }}
          aria-describedby={`list-title-${id}`}
        >
          {_.map((policyDescription) => {
            if (props.noCheckboxes) {
              return (
                <div role="listitem" style={{ marginLeft: '1.25rem' }} key={policyDescription.shortDescription}>
                  {icon('check', { size: 12, style: { marginRight: '0.25rem', color: colors.accent() } })}
                  {policyDescription.shortDescription}
                </div>
              );
            }

            const labelId = `${policyDescription.shortDescription.replaceAll(' ', '-')}-${id}`;
            return (
              <div
                role="listitem"
                style={{ marginLeft: '1.25rem', marginBottom: '0.5rem' }}
                key={policyDescription.shortDescription}
              >
                <Checkbox checked disabled aria-labelledby={labelId} onChange={() => {}} />
                <span style={{ marginLeft: '0.25rem' }} id={labelId}>
                  {policyDescription.shortDescription}
                </span>
              </div>
            );
          }, policyDescriptions)}
          {!!props.onTogglePhiTracking && (
            <div role="listitem" style={{ marginLeft: '1.25rem' }} key={phiTrackingLabel}>
              <LabeledCheckbox checked={phiTracking} aria-label={phiTrackingLabel} onChange={phiTrackingCallback}>
                <span style={{ marginLeft: '0.25rem' }}>{phiTrackingLabel}</span>
              </LabeledCheckbox>
            </div>
          )}
        </div>
        {props.endingNotice && <div style={{ marginTop: '1.0rem' }}>{props.endingNotice}</div>}
      </div>
    );
  }
  if (props.endingNotice) {
    return <div style={{ ...Style.elements.noticeContainer }}>{props.endingNotice}</div>;
  }
};
