import { useState } from 'react'
import { div, h, h1, p } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, Link } from 'src/components/common'
import { ReactComponent as AzureLogo } from 'src/images/ms-azure.svg'
import planet from 'src/images/register-planet.svg'
import { Ajax } from 'src/libs/ajax'
import { signOut } from 'src/libs/auth'
import { brands } from 'src/libs/brands'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { withErrorIgnoring } from 'src/libs/error'
import { terraLogoMaker } from 'src/libs/logos'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
import { azurePreviewStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const AzurePreview = () => {
  // State
  const [isAlphaAzureUser, setIsAlphaAzureUser] = useState(false)
  const signal = useCancellation()

  // Helpers
  const styles = {
    centered: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    paragraph: {
      textAlign: 'center',
      fontSize: 16,
      lineHeight: 1.5,
      maxWidth: 500
    },
    header: {
      display: 'flex',
      marginTop: '3rem',
      justifyContent: 'center',
      alignItems: 'center',
      color: colors.dark(0.8),
      fontSize: '1.8rem',
      fontWeight: 500
    },
    button: {
      textTransform: 'none'
    }
  }

  const supportEmail = 'support@terra.bio'

  const dismiss = () => {
    azurePreviewStore.set(true)
  }

  // Use a Sam group to determine if a user is an Azure Preview user.
  // This is problematic when the user needs to register/accept ToS, since that's a prerequisite
  // for checking Sam group membership. TOAZ-301 is open to change this to a B2C check instead of Sam.
  const loadAlphaAzureMember = withErrorIgnoring(async () => {
    setIsAlphaAzureUser(await Ajax(signal).Groups.group(getConfig().alphaAzureGroup).isMember())
  })

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
    div({ style: styles.centered }, [
      terraLogoMaker(brands.terra.logos.color, { height: 100, marginRight: 25 }),
      h(AzureLogo, { title: 'Microsoft Azure', role: 'img', style: { height: 90, borderLeft: `1px solid ${colors.dark()}` } })
    ]),
    h1({ style: styles.header }, 'Terra on Azure Preview Environment'),
    div({ style: styles.centered }, [
      p({ style: styles.paragraph },
        'This is an invite-only version of the Terra on Azure platform. The public offering of Terra on Azure is expected in early 2023.')
    ]),

    isAlphaAzureUser ? undefined : [
      div({ style: styles.centered }, [
        p({ style: styles.paragraph }, [
          'You are not currently part of the Terra on Azure Preview Program. If you are interested in joining the program, please contact ',
          h(Link, { href: `mailto:${supportEmail}`, ...Utils.newTabLinkProps }, supportEmail),
          '.'
        ])
      ])
    ],
    div({ style: { ...styles.centered, marginTop: '1.5rem' } }, [
      isAlphaAzureUser ?
        h(ButtonPrimary, { onClick: dismiss, style: styles.button }, 'Proceed to Terra on Azure Preview') :
        h(ButtonPrimary, { onClick: signOut, style: styles.button }, 'Log Out')
    ]),
    isAlphaAzureUser ? div({ style: { ...styles.centered, marginTop: '1rem' } }, [
      h(ButtonOutline, { onClick: signOut, style: styles.button }, 'Log Out')
    ]) : undefined
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
