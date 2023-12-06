import { InfoBox } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import pluralize from 'pluralize';
import { CSSProperties, ReactNode } from 'react';
import { div, h, li, ul } from 'react-hyperscript-helpers';
import * as Style from 'src/libs/style';
import {
  getPolicyDescriptions,
  protectedDataLabel,
  protectedDataMessage,
  WorkspaceWrapper,
} from 'src/libs/workspace-utils';
import { AzureBillingProject, BillingProject } from 'src/pages/billing/models/BillingProject';

type WorkspacePoliciesProps = {
  policySource: WorkspaceWrapper | BillingProject;
  title?: string;
  policiesLabel?: string;
  style?: CSSProperties;
};

export const WorkspacePolicies = (props: WorkspacePoliciesProps): ReactNode => {
  const isWorkspaceWrapper = (workspace: WorkspaceWrapper | BillingProject): workspace is WorkspaceWrapper =>
    _.has('workspace', workspace);
  const isProtectedAzureBillingProject = (project: WorkspaceWrapper | BillingProject) => {
    const isBillingProject = (project?: WorkspaceWrapper | BillingProject): project is BillingProject =>
      _.has('projectName', project);
    const isAzureBillingProject = (project: BillingProject): project is AzureBillingProject =>
      project.cloudPlatform === 'AZURE';
    return isBillingProject(project) && isAzureBillingProject(project) && project.protectedData;
  };
  const policySource = props.policySource;

  const billingProjectPolicyDescriptions = isProtectedAzureBillingProject(policySource)
    ? [{ shortDescription: protectedDataLabel, longDescription: protectedDataMessage }]
    : [];
  const policyDescriptions = isWorkspaceWrapper(policySource)
    ? getPolicyDescriptions(policySource)
    : billingProjectPolicyDescriptions;
  const description = props.policiesLabel
    ? props.policiesLabel
    : `This workspace has the following ${pluralize('policy', policyDescriptions.length)}:`;

  if (policyDescriptions.length > 0) {
    return div({ style: props.style }, [
      !!props.title && div({ style: { ...Style.elements.sectionHeader, margin: '1rem 0 0.5rem 0' } }, [props.title]),
      div({}, [description]),
      ul(
        { style: { marginBlockStart: '0.5rem', marginBlockEnd: '0.5rem' } },
        _.map((policyDescription) => {
          return li({}, [
            policyDescription.shortDescription,
            h(InfoBox, { style: { marginLeft: '0.50rem' }, side: 'bottom' }, [policyDescription.longDescription]),
          ]);
        }, policyDescriptions)
      ),
    ]);
  }
};
