import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, label } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, Checkbox, Clickable, IdContainer, Select } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import colors, { terraSpecial } from 'src/libs/colors'
import { authStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


const NewAccountModal = ({ onDismiss }) => {
  /*
   * State setup
   */
  const [page, setPage] = useState(0)
  const [account, setAccount] = useState(() => {
    const {
      firstName, lastName, institute, email, contactEmail,
      programLocationCity, programLocationState, programLocationCountry
    } = authStore.get().profile

    return {
      firstName,
      lastName,
      email: contactEmail || email,
      phone: '',

      paymentType: '',

      name: '',
      budget: '',
      alertsOn: true,
      alertPolicy: 30,

      institute,
      billingAddress1: '',
      billingAddress2: '',
      billingCity: programLocationCity,
      billingState: programLocationState,
      billingZip: '',
      billingCountry: programLocationCountry,
      financialContactName: '',
      financialContactEmail: '',
      financialContactPhone: ''
    }
  })
  const updateAccount = (key, value) => setAccount(_.set(key, value))


  /*
   * Sub-component constructors
   */
  const makeStepIndicator = (index, stepLabel) => {
    const isCurrent = page === index
    const isClickable = _.every(_.isEmpty, _.map('errors', _.take(index, pages)))

    const backgroundColor = isCurrent ?
      colors.dark() :
      (!_.isEmpty(pages[index].errors) || index === pages.length - 1) ?
        colors.dark(0.25) :
        terraSpecial()

    return h(Clickable, {
      style: { display: 'flex', flexDirection: 'column', alignItems: 'center', whiteSpace: 'nowrap', width: 50 },
      disabled: !isClickable,
      onClick: () => setPage(index)
    }, [
      div({
        style: {
          color: 'white', backgroundColor,
          fontSize: 22, lineHeight: '36px', textAlign: 'center',
          height: 36, width: 36,
          borderRadius: '100%',
          ...Style.proportionalNumbers
        }
      }, [index + 1]),
      isCurrent && div({ style: { fontSize: 10, lineHeight: '20px', color: colors.dark() } }, [stepLabel])
    ])
  }

  const makePageHeader = title => div({ style: { ...Style.elements.sectionHeader, margin: '1rem 0' } }, [title])

  const makeField = ({ title, key }) => {
    const value = account[key]

    return h(IdContainer, [id => div({ style: { flexGrow: 1 } }, [
      label({ htmlFor: id, style: { fontSize: 14, fontWeight: 500, margin: '1rem 0 0.5rem' } }, [title]),
      h(ValidatedInput, {
        inputProps: {
          id, value,
          onChange: v => updateAccount(key, v)
        },
        error: !!value && !!pages[page].errors && Utils.summarizeErrors(pages[page].errors[key])
      })
    ])])
  }

  const makePaymentCard = ({ label, iconName, time, text, paymentType }) => h(Clickable, {
    style: { borderRadius: 5, border: `1px solid ${colors.dark(0.4)}`, width: 260, height: 275 },
    onClick: () => {
      updateAccount('paymentType', paymentType)
      setPage(1)
    }
  }, [
    div({
      style: {
        borderRadius: '5px 5px 0 0',
        padding: '1rem',
        backgroundColor: paymentType === account.paymentType ? terraSpecial(0.2) : colors.light(0.4),
        borderBottom: `1px solid ${colors.dark(0.4)}`
      }
    }, [
      div({ style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
        div({ style: { ...Style.elements.sectionHeader, fontSize: 18 } }, [label]),
        icon(iconName, { size: 36 })
      ]),
      icon('clock', { size: 18, style: { marginRight: '0.5rem' } }),
      time
    ]),
    div({ style: { padding: '1rem' } }, [
      text
    ])
  ])

  const makeReviewField = (label, text, size = 175) => div({ style: { marginBottom: '0.5rem', display: 'flex' } }, [
    div({ style: { flex: `0 0 ${size}px`, color: colors.dark(0.7) } }, [label]),
    text
  ])


  /*
   * Form page renderers and validation states
   */
  const required = { presence: { allowEmpty: false } }
  const usingPO = account.paymentType === 'PO'
  const usingCC = account.paymentType === 'credit'
  const pages = [{
    errors: validate(account, { paymentType: required }),
    render: () => h(Fragment, [
      makePageHeader('Click to choose a payment method'),
      div({ style: { fontSize: 12, marginTop: '-0.5rem' } }, [
        'Onix is the vendor we work with to help you set up a billing account with your funding source.'
      ]),
      div({ style: { display: 'flex', justifyContent: 'center', marginTop: '2rem' } }, [
        makePaymentCard({
          label: 'Credit Card',
          iconName: 'creditCard',
          time: '24 hours to process',
          text: 'Onix will contact you for your credit card information, then set up a Google Billing Account on your behalf.',
          paymentType: 'credit'
        }),
        div({ style: { width: '1rem' } }),
        makePaymentCard({
          label: 'Purchase Order',
          iconName: 'purchaseOrder',
          time: '5-7 days to process',
          text: 'You will provide more information for a quote. Onix will contact you to complete the process and set up a Google Billing Account.',
          paymentType: 'PO'
        })
      ])
    ])
  }, {
    errors: validate(account, {
      firstName: required,
      lastName: required,
      email: { email: true, ...required },
      ...(usingCC ? { phone: required } : {})
    }),
    render: () => h(Fragment, [
      makePageHeader('Account owner information'),
      div({ style: { display: 'flex' } }, [
        makeField({ title: 'First name', key: 'firstName' }),
        div({ style: { width: '1rem' } }),
        makeField({ title: 'Last name', key: 'lastName' })
      ]),
      makeField({ title: 'Email address', key: 'email' }),
      usingCC && makeField({ title: 'Phone number', key: 'phone' })
    ])
  }, {
    errors: validate(account, {
      name: { length: { maximum: 60 }, ...required },
      budget: required
    }),
    render: () => h(Fragment, [
      makePageHeader('Account information'),
      makeField({ title: 'New billing account name', key: 'name' }),
      label([
        div({ style: { fontSize: 14, fontWeight: 500, margin: '1rem 0 0.5rem' } }, ['Desired maximum budget']),
        div({ style: { display: 'flex', alignItems: 'center' } }, [
          div({ style: { marginRight: '0.5rem' } }, ['$']),
          div({ style: { flexGrow: 1 } }, [
            h(ValidatedInput, {
              inputProps: {
                type: 'number', min: '0', step: '0.01',
                value: account.budget,
                onChange: v => updateAccount('budget', v),
                onBlur: () => updateAccount('budget', parseFloat(account.budget).toFixed(2))
              }
            })
          ])
        ])
      ]),
      div({ style: { marginTop: '1rem' } }, [
        label({
          style: { marginRight: '1rem' },
          onClick: () => updateAccount('alertsOn', !account.alertsOn)
        }, [
          h(Checkbox, { checked: account.alertsOn, style: { marginRight: '0.2rem' } }),
          'Notify me when the amount remaining reaches'
        ]),
        h(Select, {
          onChange: ({ value }) => {
            updateAccount('alertPolicy', value)
            updateAccount('alertsOn', true)
          },
          value: account.alertPolicy,
          options: _.rangeStep(10, 0, 100),
          getOptionLabel: ({ value }) => value + '%',
          isSearchable: false,
          isClearable: false,
          menuPortalTarget: document.getElementById('modal-root'),
          maxMenuHeight: 225,
          styles: { container: base => ({ ...base, width: 80, display: 'inline-block' }) }
        })
      ])
    ])
  }, {
    errors: validate(account, {
      institute: required,
      billingAddress1: required,
      billingCity: required,
      billingState: required,
      billingZip: required,
      billingCountry: required,
      financialContactName: required,
      financialContactEmail: { email: true, ...required },
      financialContactPhone: required
    }),
    render: () => h(Fragment, [
      div({ style: { display: 'flex' } }, [
        div({ style: { marginRight: '3rem', flex: 1 } }, [
          makePageHeader('Your organization\'s billing information'),
          makeField({ title: 'Institution name', key: 'institute' }),
          makeField({ title: 'Billing address', key: 'billingAddress1' }),
          makeField({ title: '', key: 'billingAddress2' }),
          makeField({ title: 'City', key: 'billingCity' }),
          makeField({ title: 'State', key: 'billingState' }),
          makeField({ title: 'Zip', key: 'billingZip' }),
          makeField({ title: 'Country', key: 'billingCountry' })
        ]),
        div({ style: { flex: 1 } }, [
          makePageHeader('Financial Contact'),
          'The person in your organization who will receive the quote and send the purchase order to Onix.',
          makeField({ title: 'Name', key: 'financialContactName' }),
          makeField({ title: 'Email', key: 'financialContactEmail' }),
          makeField({ title: 'Phone Number', key: 'financialContactPhone' })
        ])
      ])
    ])
  }, {
    render: () => h(Fragment, [
      makePageHeader('Account owner information'),
      makeReviewField('Account Owner Name', `${account.firstName} ${account.lastName}`),
      makeReviewField('Email', account.email),
      div({ style: { borderTop: `1px solid ${colors.dark(0.25)}`, marginTop: '1rem' } }),
      makePageHeader('Account information'),
      makeReviewField('Billing Account Name', account.name),
      makeReviewField('Desired Budget', `$${account.budget}`),
      div({ style: { borderTop: `1px solid ${colors.dark(0.25)}`, marginTop: '1rem' } }),
      div({ style: { display: 'flex' } }, [
        div({ style: { flexBasis: '55%', marginRight: '1rem' } }, [
          makePageHeader('Your organization\'s billing information'),
          makeReviewField('Institution Name', account.institute),
          makeReviewField('Billing Address', account.billingAddress1),
          account.billingAddress2 && makeReviewField('', account.billingAddress2),
          makeReviewField('City', account.billingCity),
          makeReviewField('State', account.billingState),
          makeReviewField('Zip Code', account.billingZip),
          makeReviewField('Country', account.billingCountry)
        ]),
        div({ style: { flexShrink: 0 } }, [
          makePageHeader('Financial contact'),
          makeReviewField('Name', account.financialContactName, 80),
          makeReviewField('Email', account.financialContactEmail, 80),
          makeReviewField('Phone', account.financialContactPhone, 80)
        ])
      ])
    ])
  }]


  /*
   * Modal render
   */
  const onFirstPage = page === 0
  const onLastPage = page === pages.length - 1
  const CCdone = usingCC && !onFirstPage

  return h(Modal, {
    title: 'New Billing Account',
    onDismiss,
    shouldCloseOnOverlayClick: false,
    showButtons: false,
    width: 800,
    titleExtras: !!account.paymentType && h(Fragment, [
      onLastPage && div({
        style: { position: 'absolute', top: 60, color: colors.warning(), fontStyle: 'italic', fontWeight: 600 }
      }, ['Please review your order']),
      div({ style: { flexGrow: 1 } }),
      makeStepIndicator(0, 'Payment method'),
      makeStepIndicator(1, 'Account owner'),
      usingPO && h(Fragment, [
        makeStepIndicator(2, 'Account information'),
        makeStepIndicator(3, 'Billing information'),
        makeStepIndicator(4, 'Review')
      ])
    ])
  }, [
    div({ style: { margin: '0 -1.25rem', borderTop: `1px solid ${colors.dark(0.25)}` } }),
    div({ style: { minHeight: 400, overflow: 'auto' } }, [pages[page].render()]),
    div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' } }, [
      h(ButtonSecondary, { onClick: () => onDismiss() }, ['Cancel']),
      div({ style: { flexGrow: 1 } }),
      (!onFirstPage || !!account.paymentType) && h(Fragment, [
        h(ButtonSecondary, { onClick: () => setPage(page - 1), disabled: onFirstPage }, ['Back']),
        h(ButtonPrimary, {
          style: { marginLeft: '2rem' },
          onClick: (onLastPage || CCdone) ? () => /*TODO: add submit action here*/ console.log(account) : () => setPage(page + 1),
          disabled: !_.isEmpty(pages[page].errors),
          tooltip: !_.isEmpty(pages[page].errors) && 'All fields are required'
        }, [(onLastPage || CCdone) ? 'Submit' : 'Next'])
      ])
    ])
  ])
}

export default NewAccountModal
