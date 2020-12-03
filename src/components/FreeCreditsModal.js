import _ from 'lodash/fp'
import { useState } from 'react'
import { a, div, h, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, LabeledCheckbox, spinnerOverlay } from 'src/components/common'
import FreeTrialEulas from 'src/components/FreeTrialEulas'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { refreshTerraProfile } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import { freeCreditsActive } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const FreeCreditsModal = () => {
  const isActive = Utils.useStore(freeCreditsActive)
  const [pageTwo, setPageTwo] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [cloudTermsAgreed, setCloudTermsAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const acceptCredits = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error starting trial')
  )(async () => {
    await Ajax().User.acceptEula()
    await Ajax().User.startTrial()
    await refreshTerraProfile()
    freeCreditsActive.set(false)
  })

  return isActive && h(Modal, {
    onDismiss: () => {
      setPageTwo(false)
      freeCreditsActive.set(false)
    },
    title: 'Welcome to the Terra Free Credit Program!',
    width: '65%',
    okButton: pageTwo ? h(ButtonPrimary, {
      onClick: () => {
        acceptCredits()
      },
      disabled: (termsAgreed === false) || (cloudTermsAgreed === false),
      tooltip: ((termsAgreed === false) || (cloudTermsAgreed === false)) && 'You must check the boxes to accept.'
    }, ['Accept']) : h(ButtonPrimary, {
      onClick: () => setPageTwo(true)
    }, ['Review Terms of Service'])
  }, [
    h(FreeTrialEulas, { pageTwo }),
    pageTwo && div({
      style: {
        marginTop: '0.5rem',
        padding: '1rem',
        border: `1px solid ${colors.dark(0.5)}`,
        borderRadius: '0.25rem',
        backgroundColor: colors.dark(0.05)
      }
    }, [
      h(LabeledCheckbox, {
        checked: termsAgreed === true,
        onChange: setTermsAgreed
      }, [span({ style: { marginLeft: '0.5rem' } }, ['I agree to the terms of this Agreement.'])]),
      div({
        style: {
          flexGrow: 1,
          marginBottom: '0.5rem'
        }
      }),
      h(LabeledCheckbox, {
        checked: cloudTermsAgreed === true,
        onChange: setCloudTermsAgreed
      }, [
        span({ style: { marginLeft: '0.5rem' } }, [
          'I agree to the Google Cloud Terms of Service.', div({ style: { marginLeft: '1.5rem' } }, [
            'Google Cloud Terms of Service:',
            a({
              style: {
                textDecoration: 'underline',
                marginLeft: '0.25rem'
              },
              href: 'https://cloud.google.com/terms/',
              ...Utils.newTabLinkProps
            }, ['https://cloud.google.com/terms/', icon('pop-out', { style: { marginLeft: '0.25rem' } })])
          ])
        ])
      ])
    ]),
    loading && spinnerOverlay
  ])
}

export default FreeCreditsModal
