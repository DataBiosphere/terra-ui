import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, h1, img } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, ButtonSecondary } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import { MarkdownViewer, newWindowLinkRenderer } from 'src/components/markdown'
import scienceBackground from 'src/images/science-background.jpg'
import { Ajax } from 'src/libs/ajax'
import { signOut } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { useOnMount } from 'src/libs/react-utils'
import { authStore, userStatus } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const TermsOfServicePage = () => {
  const [busy, setBusy] = useState()
  const { isSignedIn, termsOfService } = authStore.get() // can't change while viewing this without causing it to unmount, so doesn't need to subscribe
  const needToAccept = isSignedIn && termsOfService.showTosPopup
  const userHasAcceptedPreviousTos = !_.isUndefined(termsOfService.userAcceptedVersion)
  const canUserContinueUnderGracePeriod = isSignedIn && termsOfService.isGracePeriodEnabled && userHasAcceptedPreviousTos
  const [tosText, setTosText] = useState()
  authStore.update(state => ({
    ...state, termsOfService: {
      ...termsOfService,
      userContinuedUnderGracePeriod: false
    }
  }))

  useOnMount(() => {
    const loadTosAndUpdateState = _.flow(
      Utils.withBusyState(setBusy),
      withErrorReporting('There was an error retrieving our terms of service.')
    )(async () => {
      setTosText(await Ajax().User.getTos())
    })
    loadTosAndUpdateState()
  })

  const accept = async () => {
    try {
      setBusy(true)
      const { enabled } = await Ajax().User.acceptTos()

      if (enabled) {
        const newTermsOfService = {
          ...termsOfService,
          userCanUseTerra: true,
          showTosPopup: false,
          userAcceptedVersion: termsOfService.currentVersion
        }

        const registrationStatus = userStatus.registeredWithTos
        authStore.update(state => ({ ...state, registrationStatus, termsOfService: newTermsOfService }))
        Nav.goToPath('root')
      } else {
        reportError('Error accepting TOS, unexpected backend error occurred.')
      }
    } catch (error) {
      reportError('Error accepting TOS', error)
      setBusy(false)
    }
  }

  const continueButton = () => {
    try {
      setBusy(true)
      const newTermsOfService = {
        ...termsOfService,
        userContinuedUnderGracePeriod: true
      }
      authStore.update(state => ({ ...state, termsOfService: newTermsOfService }))
      Nav.goToPath('root')
    } catch (error) {
      reportError('Error continuing under TOS grace period', error)
      setBusy(false)
    }
  }

  return div({ role: 'main', style: { padding: '1rem', minHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' } }, [
    img({
      src: scienceBackground,
      alt: '',
      style: { position: 'fixed', top: 0, left: 0, zIndex: -1 }
    }),
    div({ style: { backgroundColor: 'white', borderRadius: 5, width: 800, maxHeight: '100%', padding: '2rem', boxShadow: Style.standardShadow } }, [
      h1({ style: { color: colors.dark(), fontSize: 38, fontWeight: 400 } }, ['Terra Terms of Service']),
      needToAccept && div({ style: { fontSize: 18, fontWeight: 600 } }, ['Please accept the Terms of Service to continue.']),
      div({ style: { height: '50vh', overflowY: 'auto', lineHeight: 1.5, marginTop: '1rem', paddingRight: '1rem' } }, [
        !tosText ? centeredSpinner() : h(MarkdownViewer, {
          renderers: {
            link: newWindowLinkRenderer,
            heading: (text, level) => `<h${level} style="margin-bottom: 0">${text}</h${level}>`
          }
        }, [tosText])
      ]),
      needToAccept && !canUserContinueUnderGracePeriod && !!tosText &&
      div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' } }, [
        h(ButtonSecondary, { style: { marginRight: '1rem' }, onClick: signOut }, 'Decline and Sign Out'),
        h(ButtonPrimary, { onClick: accept, disabled: busy }, ['Accept'])
      ]),
      needToAccept && canUserContinueUnderGracePeriod && !!tosText &&
      div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' } }, [
        h(ButtonSecondary, { style: { marginRight: '1rem' }, onClick: signOut }, 'Decline and Sign Out'),
        h(ButtonOutline, { style: { marginRight: '1rem' }, onClick: continueButton, disabled: busy }, ['Continue under grace period']),
        h(ButtonPrimary, { onClick: accept, disabled: busy }, ['Accept'])
      ])
    ])
  ])
}

export default TermsOfServicePage

export const navPaths = [
  {
    name: 'terms-of-service',
    path: '/terms-of-service',
    component: TermsOfServicePage,
    public: true,
    title: 'Terms of Service'
  }
]
