import { useState } from 'react'
import { div, h, label, strong } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link, Switch } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import colors from 'src/libs/colors'
import { isDataBrowserVisible } from 'src/libs/config'
import * as Nav from 'src/libs/nav'
import { useStore } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'
import { catalogPreviewStore } from 'src/pages/library/dataBrowser-utils'
import { DataBrowserFeedbackModal } from 'src/pages/library/DataBrowserFeedbackModal'


export const DataBrowserPreviewToggler = ({ checked }) => {
  const { user: { id } } = useStore(authStore)
  const [feedbackShowing, setFeedbackShowing] = useState(false)
  const [thanksShowing, setThanksShowing] = useState(false)
  catalogPreviewStore.set({ [id]: checked })

  return !isDataBrowserVisible() ? div() : div({
    style: {
      background: colors.dark(0.1),
      padding: '10px 15px',
      margin: 15,
      border: '1px solid', borderColor: colors.accent(), borderRadius: 3,
      display: 'flex', flexDirection: 'row'
    }
  }, [
    div({ style: { display: 'flex', flexDirection: 'column' } }, [
      strong(['Preview the new Data Catalog']),
      label({
        role: 'link',
        style: { fontWeight: 'bold', display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 6 }
      }, [
        h(Switch, {
          checked,
          onLabel: '', offLabel: '',
          width: 55, height: 25,
          onChange: () => {
            catalogPreviewStore.set({ [id]: !checked })
            if (checked) {
              Nav.goToPath('library-datasets')
            } else {
              Nav.goToPath('library-browser')
            }
          }
        }),
        div({ style: { marginLeft: 10 } }, [`BETA Data Catalog ${checked ? 'ON' : 'OFF'}`])
      ])
    ]),
    checked && div({ style: { display: 'flex' } }, [
      icon('talk-bubble', { size: 45, style: { marginLeft: '1.5rem', margin: '0 0.5rem' } }),
      div({ style: { display: 'flex', flexDirection: 'column' } }, [
        strong('Provide feedback'),
        h(Link, {
          onClick: () => setFeedbackShowing(true),
          style: { display: 'block', marginTop: 10 }
        },
        ['What do you think about the new Data Catalog?'])
      ])
    ]),
    feedbackShowing && h(DataBrowserFeedbackModal, {
      title: '',
      onDismiss: () => setFeedbackShowing(false),
      onSuccess: () => {
        setFeedbackShowing(false)
        setThanksShowing(true)
      },
      primaryQuestion: 'Please tell us about your experience with the new Data Catalog',
      sourcePage: 'catalog-list'
    }),
    thanksShowing && h(Modal, {
      onDismiss: () => setThanksShowing(false),
      showCancel: false,
      okButton: h(ButtonPrimary, {
        onClick: () => setThanksShowing(false)
      },
      ['OK'])
    },
    [div({ style: { fontWeight: 600, fontSize: 18 } },
      'Thank you for helping us improve the Data Catalog experience!')]
    )
  ])
}

