import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { VirtualizedSelect } from 'src/components/common';
import { cloudProviderLabels } from 'src/workspaces/utils';

export const WorkspaceSelector = ({ workspaces, value, onChange, id, 'aria-label': ariaLabel, ...props }) => {
  const options = _.flow(
    _.sortBy((ws) => ws.workspace.name.toLowerCase()),
    _.map(({ workspace: { workspaceId, name, cloudPlatform, bucketName } }) => ({
      'aria-label': `${cloudProviderLabels[cloudPlatform]} ${name}`,
      value: workspaceId,
      label: name,
      workspace: { cloudPlatform, bucketName },
    }))
  )(workspaces);
  return h(VirtualizedSelect, {
    id,
    'aria-label': ariaLabel || 'Select a workspace',
    placeholder: 'Select a workspace',
    disabled: !workspaces,
    value,
    onChange: ({ value }) => onChange(value),
    options,
    formatOptionLabel: (opt) => {
      const {
        label,
        workspace: { cloudPlatform },
      } = opt;
      return div({ style: { display: 'flex', alignItems: 'center' } }, [
        h(CloudProviderIcon, {
          // Convert workspace cloudPlatform (Azure, Gcp) to CloudProvider (AZURE, GCP).
          cloudProvider: cloudPlatform.toUpperCase(),
          style: { marginRight: '0.5rem' },
        }),
        label,
      ]);
    },
    ...props,
  });
};
