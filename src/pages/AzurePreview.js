import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary } from 'src/components/common'
import { ReactComponent as AzureLogo } from 'src/images/azure.svg'
import planet from 'src/images/register-planet.svg'
import { Ajax } from 'src/libs/ajax'
import { signOut } from 'src/libs/auth'
import { brands } from 'src/libs/brands'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { reportErrorAndRethrow } from 'src/libs/error'
import { terraLogoMaker } from 'src/libs/logos'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'


const AzurePreview = () => {
  // State
  const [isAlphaAzureUser, setIsAlphaAzureUser] = useState(false)
  const signal = useCancellation()

  // Helpers
  const loadAlphaAzureMember = reportErrorAndRethrow('Error loading azure alpha group membership')(async () => {
    setIsAlphaAzureUser(await Ajax(signal).Groups.group(getConfig().alphaAzureGroup).isMember())
  })

  const dismiss = () => {
    authStore.update(state => ({ ...state, seenAzurePreviewScreen: true }))
  }

  // Lifecycle
  useOnMount(() => {
    loadAlphaAzureMember()
  })

  // Render
  return div({
    role: 'main',
    style: {
      flexGrow: 1,
      padding: '5rem',
      backgroundImage: `url(${planet})`,
      backgroundRepeat: 'no-repeat', backgroundSize: '750px', backgroundPosition: 'right 0px bottom -600px'
    }
  }, [
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      terraLogoMaker(brands.terra.logos.color, { height: 100, marginRight: 20 }),
      div({ style: { borderLeft: `1px solid ${colors.dark()}` } }, [
        h(AzureLogo, { title: 'Microsoft Azure', role: 'img', style: { height: 80, marginLeft: '1rem' } })
      ]),
    ]),
    div({
      style: {
        marginTop: '4rem', color: colors.dark(0.9),
        fontSize: '1.5rem', fontWeight: 500
      }
    }, 'Preview Environment'),
    div({ style: { marginTop: '3rem', display: 'flex' } },
      'This is an invite-only limited version of the Terra on Azure platform. The public offering of Terra on Azure is expected in early 2023.'
    ),
    isAlphaAzureUser ? [] : div({ style: { marginTop: '3rem', display: 'flex' } },
      'If you are not in the Terra on Azure Preview Program and would like to join, contact support@terra.bio.',
    ),
    div({ style: { marginTop: '3rem' } },
      isAlphaAzureUser ? [
        h(ButtonPrimary, { onClick: dismiss }, 'Proceed to Terra on Azure Preview'),
        h(ButtonSecondary, { style: { marginLeft: '1rem' }, onClick: signOut }, 'Cancel')
      ] : [
        h(ButtonPrimary, { style: { marginLeft: '1rem' }, onClick: signOut }, 'Close')
      ]
    )
  ])
}
export default AzurePreview

export const navPaths = [
  {
    name: 'azure-preview',
    path: '/azure-preview',
    component: AzurePreview,
    public: true,
    title: 'Terra on Azure Preview'
  }
]
