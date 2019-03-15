import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, label } from 'react-hyperscript-helpers'
import { validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { authStore } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { formLabel } from 'src/libs/forms'
import * as style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


export default ({ onDismiss }) => {
  const [page, setPage] = useState(0)
  const [accountInfo, setAccountInfo] = useState(() => {
    const { firstName, lastName, title, institute } = authStore.get().profile

    return {
      name: `${firstName} ${lastName}`,
      title,
      institute,
      billingAddress: '',
      accountName: '',
      adminEmail: '',
      accountValue: '',
      alertPolicy: '',
      financialContactName: '',
      financialContactEmail: '',
      financialContactPhone: ''
    }
  })
  const updateAccountInfo = key => ({ target: { value } }) => setAccountInfo({ ...accountInfo, [key]: value })

  const errors = validate(accountInfo, {
    adminEmail: { email: true },
    financialContactEmail: { email: true }
  })

  const makeField = (title, key, ...props) => label([
    formLabel(title),
    validatedInput(_.merge({
      inputProps: {
        value: accountInfo[key],
        onChange: updateAccountInfo(key)
      },
      error: !!accountInfo[key] && Utils.summarizeErrors(errors[key])
    }, props))
  ])

  const makeStepIndicator = (number, stepLabel) => {
    const isCurrent = page === number - 1

    return div({
      style: { display: 'flex', flexDirection: 'column', alignItems: 'center', whiteSpace: 'nowrap', width: 50 }
    }, [
      div({
        style: {
          color: 'white', backgroundColor: colors.gray[isCurrent ? 0 : 5],
          fontSize: 22, lineHeight: '36px', textAlign: 'center',
          height: 36, width: 36,
          borderRadius: '100%',
          ...style.proportionalNumbers
        }
      }, [number]),
      isCurrent && div({ style: { fontSize: 10, lineHeight: '20px', color: colors.gray[0] } }, [stepLabel])
    ])
  }
  const pages = [
    [
      makeField('Your name', 'name'),
      makeField('Your title', 'title'),
      makeField('Institution name', 'institute'),
      makeField('Billing address', 'billingAddress'),
      makeField('New account name', 'accountName'),
      makeField('Account admin email', 'adminEmail'),
      makeField('Account value', 'accountValue'),
      makeField('Budget alert policy', 'alertPolicy'),
      makeField('Financial contact name', 'financialContactName'),
      makeField('Financial contact email', 'financialContactEmail'),
      makeField('Financial contact phone', 'financialContactPhone')
    ]
  ]

  return h(Modal, {
    title: 'New Billing Account',
    onDismiss,
    showButtons: false,
    showX: true,
    width: 800,
    titleExtras: h(Fragment, [
      div({ style: { flexGrow: 1 } }),
      makeStepIndicator(1, 'Account owner'),
      makeStepIndicator(2, 'Payment method'),
      makeStepIndicator(3, 'Account information'),
      makeStepIndicator(4, 'Billing info'),
      makeStepIndicator(5, 'Review')
    ])
  }, [
    div({ style: { margin: '0 -1.25rem', borderTop: `1px solid ${colors.gray[0]}` } }),
    ...pages[page]
  ])
}
