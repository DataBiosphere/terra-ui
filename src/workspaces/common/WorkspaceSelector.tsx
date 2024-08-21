import _ from 'lodash/fp';
import React from 'react';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { SelectProps, VirtualizedSelect } from 'src/components/common';
import { getCloudProviderFromWorkspace, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

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

const formatOptionLabel = (opt: WorkspaceSelectorOption) => {
  const { label, workspace } = opt;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <CloudProviderIcon
        // Convert workspace cloudPlatform (Azure, Gcp) to CloudProvider (AZURE, GCP).
        cloudProvider={getCloudProviderFromWorkspace(workspace)}
        style={{ marginRight: '0.5rem', flexShrink: 0 }}
      />
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
    </div>
  );
};

export const WorkspaceSelector = (props: WorkspaceSelectorProps) => {
  const { workspaces, value, onChange, id, 'aria-label': ariaLabel, ...otherProps } = props;
  const options = _.flow(
    _.sortBy((ws: Workspace) => ws.workspace.name.toLowerCase()),
    _.map(({ workspace: { workspaceId, name, cloudPlatform, bucketName } }) => ({
      value: workspaceId,
      label: name,
      workspace: { workspace: { cloudPlatform, bucketName } },
    }))
  )(workspaces);

  return (
    <VirtualizedSelect
      id={id}
      aria-label={ariaLabel || 'Select a workspace'}
      placeholder='Select a workspace'
      disabled={!workspaces}
      value={value}
      onChange={({ value }) => onChange(value)}
      options={options}
      formatOptionLabel={formatOptionLabel}
      {...otherProps}
    />
  );
};
