import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { div, li, p, ul } from 'react-hyperscript-helpers';
import { WorkspacePolicy } from 'src/libs/workspace-utils';

type WorkspacePoliciesProps = {
  policies: WorkspacePolicy[];
};

export const WorkspacePolicies = (props: WorkspacePoliciesProps): ReactNode => {
  const { policies } = props;

  if (policies.length > 0) {
    return div({ style: {} }, [
      p({ style: { fontSize: 14, lineHeight: '1.5', marginRight: '1rem' } }, [
        'This workspace has the following policies:',
      ]),
      ul(
        {},
        _.map((policy) => {
          return li({}, [policy.name]);
        }, policies)
      ),
    ]);
  }
};
