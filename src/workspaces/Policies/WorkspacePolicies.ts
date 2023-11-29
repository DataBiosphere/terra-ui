import { InfoBox } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import pluralize from 'pluralize';
import { CSSProperties, ReactNode } from 'react';
import { div, h, li, p, ul } from 'react-hyperscript-helpers';
import * as Style from 'src/libs/style';
import { getPolicyLongDescription, getPolicyShortDescription, WorkspacePolicy } from 'src/libs/workspace-utils';

type WorkspacePoliciesProps = {
  policies: WorkspacePolicy[];
  style?: CSSProperties;
};

export const WorkspacePolicies = (props: WorkspacePoliciesProps): ReactNode => {
  const { policies } = props;

  if (policies.length > 0) {
    return div({ style: props.style }, [
      div({ style: { ...Style.elements.sectionHeader, margin: '1rem 0 0.5rem 0' } }, ['Policies']),
      p({}, [`This workspace has the following ${pluralize('policy', policies.length)}:`]),
      ul(
        {},
        _.map((policy) => {
          const tooltipText = getPolicyLongDescription(policy);

          return li({}, [
            getPolicyShortDescription(policy),
            !!tooltipText && h(InfoBox, { style: { marginLeft: '0.50rem' }, side: 'bottom' }, [tooltipText]),
          ]);
        }, policies)
      ),
    ]);
  }
};
