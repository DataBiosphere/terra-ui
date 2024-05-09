import React, { ReactNode } from 'react';
import { ReactComponent as CloudAzureLogo } from 'src/images/cloud_azure_icon.svg';
import { ReactComponent as CloudGcpLogo } from 'src/images/cloud_google_icon.svg';
import { CloudProvider, cloudProviderLabels } from 'src/workspaces/utils';

type CloudProviderIconProps = {
  cloudProvider: CloudProvider;
} & JSX.IntrinsicElements['svg'];

export const CloudProviderIcon = (props: CloudProviderIconProps): ReactNode => {
  const { cloudProvider, ...rest } = props;
  const Icon = {
    AZURE: CloudAzureLogo,
    GCP: CloudGcpLogo,
  }[cloudProvider];

  return <Icon role='img' title={cloudProviderLabels[cloudProvider]} {...rest} />;
};
