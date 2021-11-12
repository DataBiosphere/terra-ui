import { useState } from 'react'
import { div, h, h1 } from 'react-hyperscript-helpers'
import { backgroundLogo, ButtonPrimary, ButtonSecondary } from 'src/components/common'
import { MarkdownViewer, newWindowLinkRenderer } from 'src/components/markdown'
import { Ajax } from 'src/libs/ajax'
import { signOut } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { authStore } from 'src/libs/state'
import * as Style from 'src/libs/style'


/*
 * When updating the TOS, make sure you:
 *   1. update the TOS version number in the Ajax call
 *   2. update the dev and prod datastores to have a TOS of that version number
 *
 * Updating the text here:
 *   1. If in a google doc, save as .docx
 *   2. `brew install pandoc`
 *   3. `pandoc -w markdown -o <out file>.md <in file>.docx`
 *   4. A bit of replace-all-ing to fix formatting and unescape things will probably be needed
 *   5. Look out for links that need to be added, emails will become clickable on their own
 */
let termsOfService = ''

Ajax().User.getTos().then(text => termsOfService = text)


const TermsOfServicePage = () => {
  const [busy, setBusy] = useState()
  const { isSignedIn, acceptedTos } = authStore.get() // can't change while viewing this without causing it to unmount, so doesn't need to subscribe
  const needToAccept = isSignedIn && !acceptedTos

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
    backgroundLogo,
    div({ style: { backgroundColor: 'white', borderRadius: 5, width: 800, maxHeight: '100%', padding: '2rem', boxShadow: Style.standardShadow } }, [
      h1({ style: { color: colors.dark(), fontSize: 38, fontWeight: 400 } }, ['Terra Terms of Service']),
      needToAccept && div({ style: { fontSize: 18, fontWeight: 600 } }, ['Please accept the Terms of Service to continue.']),
      div({ style: { height: '50vh', overflowY: 'auto', lineHeight: 1.5, marginTop: '1rem', paddingRight: '1rem' } }, [
        h(MarkdownViewer, {
          renderers: {
            link: newWindowLinkRenderer,
            heading: (text, level) => `<h${level} style="margin-bottom: 0">${text}</h${level}>`
          }
        }, [termsOfService])
      ]),
      needToAccept && div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' } }, [
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
