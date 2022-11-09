import { Fragment, useState } from 'react'
import { div, h, label, strong } from 'react-hyperscript-helpers'
import { IdContainer, Link, Switch } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import { DataBrowserFeedbackModal } from 'src/pages/library/DataBrowserFeedbackModal'


export const DataBrowserPreviewToggler = ({ onChange, catalogShowing }) => {
  const [feedbackShowing, setFeedbackShowing] = useState(false)

  return div({ style: { display: 'flex', margin: 15 } }, [div({
    style: {
      background: colors.dark(0.1),
      padding: '10px 15px',
      border: '1px solid', borderColor: colors.accent(), borderRadius: 3,
      display: 'flex', width: catalogShowing ? 680 : 290
    }
  }, [
    div({ style: { display: 'flex', flexDirection: 'column' } }, [
      strong(['Preview the new Data Catalog']),
      h(IdContainer, [id => h(Fragment, [
        div({
          style: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 6 }
        }, [
          h(Switch, {
            id,
            checked: catalogShowing,
            onLabel: '', offLabel: '',
            width: 55, height: 25,
            onChange
          }),
          label({ htmlFor: id, style: { fontWeight: 'bold', marginLeft: 10 } }, [`New Catalog ${catalogShowing ? 'ON' : 'OFF'}`])
        ])
      ])])

    ]),
    catalogShowing && div({ style: { display: 'flex' } }, [
      icon('talk-bubble', { size: 45, style: { marginLeft: '1.5rem', margin: '0 0.5rem' } }),
      div({ style: { display: 'flex', flexDirection: 'column' } }, [
        'Provide feedback or looking for a dataset not listed?',
        h(Link, {
          onClick: () => setFeedbackShowing(true),
          style: { display: 'block', marginTop: 10 }
        },
        ['Let us know!'])
      ])
    ]),
    feedbackShowing && h(DataBrowserFeedbackModal, {
      onDismiss: () => setFeedbackShowing(false),
      onSuccess: () => {
        setFeedbackShowing(false)
      },
      primaryQuestion: 'Please tell us about your experience with the new Data Catalog',
      sourcePage: 'Catalog List'
    })
  ]), !catalogShowing ? div({
    style: {
      padding: '15px 15px', wordWrap: 'break-word', width: 300, lineHeight: 1.5
    }
  }, ['Note: Not all datasets are represented in the new Data Catalog yet.']) : div()])
}

