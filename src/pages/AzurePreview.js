import { useState } from 'react'
import { div, h, h1, p } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, Link } from 'src/components/common'
import planet from 'src/images/register-planet.svg'
import { ReactComponent as TerraOnAzureLogo } from 'src/images/terra-ms-logo.svg'
import { Ajax } from 'src/libs/ajax'
import { signOut } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { withErrorIgnoring } from 'src/libs/error'
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
      maxWidth: 570
    },
    header: {
      display: 'flex',
      marginTop: '3rem',
      marginBotton: '2rem',
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

  const supportEmail = 'preview@terra.bio'
  const supportSubject = 'Terra on Microsoft Azure Preview Environment'

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
      h(TerraOnAzureLogo, { title: 'Terra on Microsoft Azure - Preview', role: 'img' })
    ]),
    h1({ style: styles.header }, 'Terra on Microsoft Azure - Preview'),
    div({ style: styles.centered }, [
      p({ style: styles.paragraph },
        'This is a preview version of the Terra platform on Microsoft Azure. The public offering of Terra on Microsoft Azure is expected in early 2023.')
    ]),

    isAlphaAzureUser ? undefined : [
      div({ style: styles.centered }, [
        p({ style: styles.paragraph }, [
          'You are not currently part of the Terra on Microsoft Azure Preview Program. If you are interested in joining the program, please contact ',
          h(Link, { href: `mailto:${supportEmail}?subject=${encodeURIComponent(supportSubject)}`, ...Utils.newTabLinkProps, style: { textDecoration: 'underline' } }, supportEmail),
          '.'
        ])
      ])
    ],
    div({ style: { ...styles.centered, marginTop: '1.5rem' } }, [
      isAlphaAzureUser ?
        h(ButtonPrimary, { onClick: dismiss, style: styles.button }, 'Proceed to Terra on Microsoft Azure Preview') :
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
    title: 'Terra on Microsoft Azure Preview'
  }
]
