import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { SelectProps, VirtualizedSelect } from 'src/components/common';
import {
  cloudProviderLabels,
  getCloudProviderFromWorkspace,
  WorkspaceWrapper as Workspace,
} from 'src/workspaces/utils';

interface WorkspaceSelectorProps
  extends Omit<SelectProps<string, false, { value: string; label: string }>, 'value' | 'options'> {
  workspaces: Workspace[];
  value: string | undefined;
  onChange: (string) => void;
  id?: string | undefined;
  'aria-label'?: string | undefined;
}

interface WorkspaceSelectorOption {
  'aria-label': string;
  value: string;
  label: string;
  workspace: Workspace;
}

export const WorkspaceSelector = (props: WorkspaceSelectorProps) => {
  const { workspaces, value, onChange, id, 'aria-label': ariaLabel, ...otherProps } = props;
  const options = _.flow(
    _.sortBy((ws: Workspace) => ws.workspace.name.toLowerCase()),
    _.map(({ workspace: { workspaceId, name, cloudPlatform, bucketName } }) => ({
      'aria-label': `${cloudProviderLabels[cloudPlatform]} ${name}`,
      value: workspaceId,
      label: name,
      workspace: { workspace: { cloudPlatform, bucketName } },
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
    formatOptionLabel: (opt: WorkspaceSelectorOption) => {
      const { label, workspace } = opt;
      return div({ style: { display: 'flex', alignItems: 'center' } }, [
        h(CloudProviderIcon, {
          // Convert workspace cloudPlatform (Azure, Gcp) to CloudProvider (AZURE, GCP).
          cloudProvider: getCloudProviderFromWorkspace(workspace),
          style: { marginRight: '0.5rem' },
        }),
        label,
      ]);
    },
    ...otherProps,
  });
};
