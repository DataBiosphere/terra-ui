import { h } from 'react-hyperscript-helpers'
// @ts-expect-error
import { ReactComponent as CloudAzureLogo } from 'src/images/cloud_azure_icon.svg'
// @ts-expect-error
import { ReactComponent as CloudGcpLogo } from 'src/images/cloud_google_icon.svg'
import { cloudPlatformLabels, CloudPlatformType } from 'src/libs/workspace-utils'


type CloudPlatformIconProps = {
  cloudPlatform: CloudPlatformType
} & JSX.IntrinsicElements['svg']

export const CloudPlatformIcon = ({ cloudPlatform, ...props }: CloudPlatformIconProps) => {
  const icon = {
    AZURE: CloudAzureLogo,
    GCP: CloudGcpLogo,
  }[cloudPlatform]

  return h(icon, {
    role: 'img',
    title: cloudPlatformLabels[cloudPlatform],
    ...props,
  })
}
