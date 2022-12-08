import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'
import { MarkdownViewer, newWindowLinkRenderer } from 'src/components/markdown'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { useOnMount } from 'src/libs/react-utils'


const PrivacyPolicy = () => {
  const [privacyPolicy, setPrivacyPolicy] = useState()

  useOnMount(() => {
    const loadPrivacyPolicyAndUpdateState =
      withErrorReporting('There was an error retrieving our privacy policy.')(async () => {
        setPrivacyPolicy(await Ajax().User.getPrivacyPolicy())
      })
    loadPrivacyPolicyAndUpdateState()
  })

  return div({ style: { width: 800, maxHeight: '100%', padding: '1rem' } }, [
    !privacyPolicy ? centeredSpinner() : h(MarkdownViewer, {
      renderers: {
        link: newWindowLinkRenderer,
        heading: (text, level) => `<h${level} style="margin-bottom: 0">${text}</h${level}>`
      }
    }, [privacyPolicy])
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
