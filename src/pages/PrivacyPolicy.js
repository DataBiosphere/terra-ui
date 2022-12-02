import { useState } from 'react'
import { div, h, h1 } from 'react-hyperscript-helpers'
import { backgroundLogo } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import { MarkdownViewer, newWindowLinkRenderer } from 'src/components/markdown'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { useOnMount } from 'src/libs/react-utils'
import * as Style from 'src/libs/style'


const PrivacyPolicy = () => {
  const [privacyPolicy, setPrivacyPolicy] = useState()

  useOnMount(() => {
    const loadPrivacyPolicyAndUpdateState = (async () => {
      setPrivacyPolicy(await Ajax().User.getPrivacyPolicy())
    })
    loadPrivacyPolicyAndUpdateState()
  })

  return div({ role: 'main', style: { padding: '1rem', minHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' } }, [
    backgroundLogo,
    div({ style: { backgroundColor: 'white', borderRadius: 5, width: 800, maxHeight: '100%', padding: '2rem', boxShadow: Style.standardShadow } }, [
      h1({ style: { color: colors.dark(), fontSize: 38, fontWeight: 400 } }, ['Terra Privacy Policy']),
      div({ style: { height: '50vh', overflowY: 'auto', lineHeight: 1.5, marginTop: '1rem', paddingRight: '1rem' } }, [
        !privacyPolicy ? centeredSpinner() : h(MarkdownViewer, {
          renderers: {
            link: newWindowLinkRenderer,
            heading: (text, level) => `<h${level} style="margin-bottom: 0">${text}</h${level}>`
          }
        }, [privacyPolicy])
      ])
    ])
  ])
}

export const navPaths = [
  {
    name: 'privacy',
    path: '/privacy',
    component: PrivacyPolicy,
    public: true,
    title: 'Privacy Policy'
  }
]
