import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, label } from 'react-hyperscript-helpers'
import { buttonPrimary, buttonSecondary, Checkbox, Clickable, Select } from 'src/components/common'
import { validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { authStore } from 'src/libs/auth'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


export default ({ onDismiss }) => {
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
      institute,
      billingAddress1: '',
      billingAddress2: '',
      billingCity: programLocationCity,
      billingState: programLocationState,
      billingZip: '',
      billingCountry: programLocationCountry,
      name: '',
      budget: '',
      alertsOn: false,
      alertPolicy: 30,
      financialContactName: '',
      financialContactEmail: '',
      financialContactPhone: ''
    }
  })
  const updateAccount = _.curry((key, value) => setAccount(_.set(key, value)))


  /*
   * Sub-component constructors
   */
  const makePageHeader = title => div({ style: { ...Style.elements.sectionHeader, margin: '1rem 0' } }, [title])

  const makeField = ({ title, key }) => {
    const value = account[key]

    return label({ style: { flexGrow: 1 } }, [
      div({ style: { fontSize: 14, fontWeight: 500, margin: '1rem 0 0.5rem' } }, [title]),
      validatedInput({
        inputProps: {
          value,
          onChange: ({ target: { value } }) => updateAccount(key, value)
        },
        error: !!value && !!pages[page].errors && Utils.summarizeErrors(pages[page].errors[key])
      })
    ])
  }

  const makeStepIndicator = (number, stepLabel) => {
    const isCurrent = page === number - 1
    const isClickable = (_.isEmpty(pages[number - 1].errors) || _.isEmpty(pages[number - 2].errors))

    return h(Clickable, {
      style: { display: 'flex', flexDirection: 'column', alignItems: 'center', whiteSpace: 'nowrap', width: 50 },
      onClick: isClickable ? () => setPage(number - 1) : undefined
    }, [
      div({
        style: {
          color: 'white', backgroundColor: colors.gray[isCurrent ? 0 : 5],
          fontSize: 22, lineHeight: '36px', textAlign: 'center',
          height: 36, width: 36,
          borderRadius: '100%',
          ...Style.proportionalNumbers
        }
      }, [number]),
      isCurrent && div({ style: { fontSize: 10, lineHeight: '20px', color: colors.gray[0] } }, [stepLabel])
    ])
  }

  const makeReviewField = (label, text, size = 175) => div({ style: { marginBottom: '0.5rem', display: 'flex' } }, [
    div({ style: { flex: `0 0 ${size}px`, color: colors.gray[2] } }, [label]),
    text
  ])


  /*
   * Form page renderers and validation states
   */
  const required = { presence: { allowEmpty: false } }
  const pages = [{
    errors: validate(account, {
      firstName: required,
      lastName: required,
      email: { email: true, ...required }
    }),
    render: () => h(Fragment, [
      makePageHeader('Account owner information'),
      div({ style: { display: 'flex' } }, [
        makeField({ title: 'First name', key: 'firstName' }),
        div({ style: { width: '1rem' } }),
        makeField({ title: 'Last name', key: 'lastName' })
      ]),
      makeField({ title: 'Email address', key: 'email' })
    ])
  }, {
    errors: {},
    render: () => h(Fragment, [
      'Credit or PO goes here'
    ])
  }, {
    errors: validate(account, {
      name: required,
      budget: required
    }),
    render: () => h(Fragment, [
      makePageHeader('Account information'),
      makeField({ title: 'New billing account name', key: 'name' }),
      label([
        div({ style: { fontSize: 14, fontWeight: 500, margin: '1rem 0 0.5rem' } }, ['Account maximum budget']),
        div({ style: { display: 'flex', alignItems: 'center' } }, [
          div({ style: { marginRight: '0.5rem' } }, ['$']),
          div({ style: { flexGrow: 1 } }, [
            validatedInput({
              inputProps: {
                type: 'number', min: '0', step: '0.01',
                value: account.budget,
                onChange: ({ target: { value } }) => updateAccount('budget', value),
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
    errors: {},
    render: () => h(Fragment, [
      makePageHeader('Account owner information'),
      makeReviewField('Account Owner Name', `${account.firstName} ${account.lastName}`),
      makeReviewField('Email', account.email),
      div({ style: { borderTop: `1px solid ${colors.gray[0]}`, marginTop: '1rem' } }),
      makePageHeader('Account information'),
      makeReviewField('Billing Account Name', account.name),
      makeReviewField('Amount Requested', `$${account.budget}`),
      div({ style: { borderTop: `1px solid ${colors.gray[0]}`, marginTop: '1rem' } }),
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

  return h(Modal, {
    title: 'New Billing Account',
    onDismiss,
    shouldCloseOnOverlayClick: false,
    showButtons: false,
    showX: true,
    width: 800,
    titleExtras: h(Fragment, [
      onLastPage && div({
        style: { position: 'absolute', top: 60, color: colors.orange[0], fontStyle: 'italic', fontWeight: 600 }
      }, ['Please review your order']),
      div({ style: { flexGrow: 1 } }),
      makeStepIndicator(1, 'Account owner'),
      makeStepIndicator(2, 'Payment method'),
      makeStepIndicator(3, 'Account information'),
      makeStepIndicator(4, 'Billing information'),
      makeStepIndicator(5, 'Review')
    ])
  }, [
    div({ style: { margin: '0 -1.25rem', borderTop: `1px solid ${colors.gray[0]}` } }),
    div({ style: { minHeight: 400, overflow: 'auto' } }, [pages[page].render()]),
    div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' } }, [
      h(buttonSecondary, { onClick: !onFirstPage ? () => setPage(page - 1) : () => onDismiss() }, [
        Utils.cond(
          [onFirstPage, () => 'Cancel'],
          [onLastPage, () => 'Make Changes'],
          () => 'Back'
        )
      ]),
      h(buttonPrimary, {
        style: { marginLeft: '2rem' },
        onClick: onLastPage ? () => console.log(account) : () => setPage(page + 1),
        disabled: !_.isEmpty(pages[page].errors),
        tooltip: !_.isEmpty(pages[page].errors) && 'All fields are required'
      }, [onLastPage ? 'Submit' : 'Next'])
    ])
  ])
}
