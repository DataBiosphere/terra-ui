import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, Link } from 'src/components/common'
import { ReactComponent as AzureLogo } from 'src/images/azure-new.svg'
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
  const loadAlphaAzureMember = withErrorIgnoring(async () => {
    setIsAlphaAzureUser(await Ajax(signal).Groups.group(getConfig().alphaAzureGroup).isMember())
  })

  const dismiss = () => {
    azurePreviewStore.set(true)
  }

  const styles = {
    centered: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    paragraph: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: 16,
      lineHeight: 1.5
    },
    header: {
      display: 'flex',
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
    div({ style: styles.header }, [
      terraLogoMaker(brands.terra.logos.color, { height: 100, marginRight: 25 }),
      h(AzureLogo, { title: 'Microsoft Azure', role: 'img', style: { height: 100, borderLeft: `1px solid ${colors.dark()}` } }),
      'Azure'
    ]),
    div({ style: { ...styles.header, marginTop: '3rem' } },
      'Preview Environment'),
    div({ style: { ...styles.paragraph, marginTop: '1rem' } },
      'This is an invite-only limited version of the Terra on Azure platform.'),
    div({ style: { ...styles.paragraph } },
      'The public offering of Terra on Azure is expected in early 2023.'),

    isAlphaAzureUser ? undefined : [
      div({ style: { ...styles.paragraph, marginTop: '1rem' } },
        'If you are not in the Terra on Azure Preview Program'),
      div({ style: { ...styles.paragraph } }, [
        'and would like to join, contact ',
        h(Link, { style: { marginLeft: '0.3rem' }, href: `mailto:${supportEmail}`, ...Utils.newTabLinkProps }, supportEmail),
        '.'
      ])
    ],
    div({ style: { ...styles.centered, marginTop: '2rem' } }, [
      isAlphaAzureUser ?
        h(ButtonPrimary, { onClick: dismiss, style: styles.button }, 'Proceed to Terra on Azure Preview') :
        h(ButtonPrimary, { onClick: signOut, style: styles.button }, 'Close')
    ]),
    isAlphaAzureUser ? div({ style: { ...styles.centered, marginTop: '1rem' } }, [
      h(ButtonOutline, { onClick: signOut, style: styles.button }, 'Cancel')
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
