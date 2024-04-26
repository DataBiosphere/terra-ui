import { icon, useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import pluralize from 'pluralize';
import React from 'react';
import { ReactNode, useState } from 'react';
import { BillingProject } from 'src/billing-core/models';
import { Checkbox, LabeledCheckbox } from 'src/components/common';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';
import { getPolicyDescriptions, phiTrackingLabel, WorkspaceWrapper } from 'src/workspaces/utils';

export type WorkspacePoliciesProps = {
  workspace?: WorkspaceWrapper;
  billingProject?: BillingProject;
  title?: string;
  policiesLabel?: string;
  policiesLink?: ReactNode;
  endingNotice?: ReactNode;
  noCheckboxes?: boolean;
  togglePhiTracking?: (selected: boolean) => void;
  togglePhiTrackingChecked?: boolean;
};

export const WorkspacePolicies = (props: WorkspacePoliciesProps): ReactNode => {
  const policyDescriptions = getPolicyDescriptions(props.workspace, props.billingProject);
  const [phiTracking, setPhiTracking] = useState(!!props.togglePhiTrackingChecked);

  const description = props.policiesLabel
    ? props.policiesLabel
    : `This workspace has the following ${pluralize('policy', policyDescriptions.length)}:`;
  const phiTrackingCallback = (selected: boolean) => {
    setPhiTracking(selected);
    if (props.togglePhiTracking) {
      props.togglePhiTracking(selected);
    }
  };
  const id = useUniqueId();
  if (policyDescriptions.length > 0) {
    return (
      <div style={{ ...Style.elements.noticeContainer }}>
        {!!props.title && <div style={{ ...Style.elements.sectionHeader, paddingBottom: '1.0rem' }}>{props.title}</div>}
        <div style={{ fontWeight: 600, display: 'grid', gridTemplateColumns: 'min-content auto' }}>
          {icon('shieldCheck', { size: 18, style: { marginRight: '0.5rem', verticalAlign: 'text-bottom' } })}
          <div style={{}}>
            {description}
            {!!props.policiesLink && props.policiesLink}
          </div>
        </div>
        <div role="list" style={{ marginBlockStart: '0.5rem', marginBlockEnd: '0.5rem' }}>
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
          {!!props.togglePhiTracking && (
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
