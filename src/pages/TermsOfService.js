import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, h1, img } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import { MarkdownViewer, newWindowLinkRenderer } from 'src/components/markdown'
import scienceBackground from 'src/images/science-background.jpg'
import { Ajax } from 'src/libs/ajax'
import { signOut } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import { useOnMount } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const TermsOfServicePage = () => {
  const [busy, setBusy] = useState()
  const { isSignedIn, acceptedTos } = authStore.get() // can't change while viewing this without causing it to unmount, so doesn't need to subscribe
  const needToAccept = isSignedIn && !acceptedTos
  const [termsOfService, setTermsOfService] = useState()

  useOnMount(() => {
    const loadTosAndUpdateState = _.flow(
      Utils.withBusyState(setBusy),
      withErrorReporting('There was an error retrieving our terms of service.')
    )(async () => {
      setTermsOfService(await Ajax().User.getTos())
    })
    loadTosAndUpdateState()
  })

  const accept = async () => {
    try {
      setBusy(true)
      await Ajax().User.acceptTos()
      authStore.update(state => ({ ...state, acceptedTos: true }))
    } catch (error) {
      reportError('Error accepting TOS', error)
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
        !termsOfService ? centeredSpinner() : h(MarkdownViewer, {
          renderers: {
            link: newWindowLinkRenderer,
            heading: (text, level) => `<h${level} style="margin-bottom: 0">${text}</h${level}>`
          }
        }, [termsOfService])
      ]),
      needToAccept && !!termsOfService && div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' } }, [
        h(ButtonSecondary, { style: { marginRight: '1rem' }, onClick: signOut }, 'Decline and Sign Out'),
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
