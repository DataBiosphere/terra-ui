import { h } from 'react-hyperscript-helpers'
// @ts-expect-error
import { ReactComponent as CloudAzureLogo } from 'src/images/cloud_azure_icon.svg'
// @ts-expect-error
import { ReactComponent as CloudGcpLogo } from 'src/images/cloud_google_icon.svg'
import { cloudProviderLabels, CloudProviderType } from 'src/libs/workspace-utils'


type CloudProviderIconProps = {
  cloudProvider: CloudProviderType
} & JSX.IntrinsicElements['svg']

export const CloudProviderIcon = ({ cloudProvider, ...props }: CloudProviderIconProps) => {
  const icon = {
    AZURE: CloudAzureLogo,
    GCP: CloudGcpLogo,
  }[cloudProvider]

  return h(icon, {
    role: 'img',
    title: cloudProviderLabels[cloudProvider],
    ...props,
  })
}
