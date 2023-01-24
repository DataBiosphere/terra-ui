import { Fragment, useCallback, useEffect, useState } from 'react'
import { div, form, h, h1, input, p } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ValidatedInput } from 'src/components/input'
import planet from 'src/images/register-planet.svg'
import { ReactComponent as TerraOnAzureLogo } from 'src/images/terra-ms-logo.svg'
import { Ajax } from 'src/libs/ajax'
import { signOut } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import { useStore } from 'src/libs/react-utils'
import { authStore, azurePreviewStore, getUser } from 'src/libs/state'


const styles = {
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 1.5,
    maxWidth: 570,
  },
  header: {
    display: 'flex',
    marginTop: '3rem',
    marginBotton: '2rem',
    color: colors.dark(0.8),
    fontSize: '1.8rem',
    fontWeight: 500,
  },
  button: {
    textTransform: 'none',
  },
}

const AzurePreviewForPreviewUser = () => {
  const dismiss = () => {
    azurePreviewStore.set(true)
  }

  return h(Fragment, [
    p({ style: styles.paragraph }, [
      'This is a preview version of the Terra platform on Microsoft Azure.'
    ]),

    div({ style: { marginTop: '1.5rem' } }, [
      h(ButtonPrimary, { onClick: dismiss, style: styles.button }, ['Proceed to Terra on Microsoft Azure Preview']),
    ]),
    div({ style: { marginTop: '1rem' } }, [
      h(ButtonOutline, { onClick: signOut, style: styles.button }, ['Sign Out']),
    ])
  ])
}

export const submittedPreviewFormPrefKey = 'submitted-azure-preview-form'

const AzurePreviewUserForm = ({ value: formValue, onChange, onSubmit }) => {
  const [fieldsTouched, setFieldsTouched] = useState({})

  const fields = [
    {
      key: 'firstName',
      label: 'First name',
    },
    {
      key: 'lastName',
      label: 'Last name',
    },
    {
      key: 'title',
      label: 'Title/Role',
    },
    {
      key: 'organization',
      label: 'Organization name',
    },
    {
      key: 'contactEmail',
      label: 'Contact email address',
    },
  ]

  return form({
    name: 'azure-preview-interest',
    style: {
      display: 'flex',
      flexFlow: 'row wrap',
      justifyContent: 'space-between',
      width: 570,
    },
    onSubmit: e => {
      e.preventDefault()
      onSubmit()
    }
  }, [
    fields.map(({ key, label }) => {
      const inputId = `azure-preview-interest-${key}`
      return div({ key, style: { width: 250 } }, [
        h(FormLabel, { htmlFor: inputId, required: true }, [label]),
        h(ValidatedInput, {
          inputProps: {
            id: inputId,
            value: formValue[key],
            onChange: value => {
              setFieldsTouched(v => ({ ...v, [key]: true }))
              onChange({ ...formValue, [key]: value })
            },
          },
          error: fieldsTouched[key] && !formValue[key] ? `${label} is required` : undefined,
        }),
      ])
    }),

    // Submit input allows submitting form by pressing the enter key.
    input({ type: 'submit', value: 'submit', style: { display: 'none' } })
  ])
}

const formId = '1FAIpQLSegf8c7LxlVOS8BLNUrpqkiB7l8L7c135ntdgaBSV2kdrqSAQ'

const formInputMap = {
  firstName: 'entry.1708226507',
  lastName: 'entry.677313431',
  title: 'entry.1500649388',
  organization: 'entry.1020670185',
  contactEmail: 'entry.1125156163',
  terraEmail: 'entry.1938956483',
}

const AzurePreviewForNonPreviewUser = () => {
  const [hasSubmittedForm, setHasSubmittedForm] = useState(() => getLocalPref(submittedPreviewFormPrefKey) || false)
  useEffect(() => {
    setLocalPref(submittedPreviewFormPrefKey, hasSubmittedForm)
  }, [hasSubmittedForm])

  const [busy, setBusy] = useState(false)

  const [userInfo, setUserInfo] = useState(() => {
    const user = getUser()

    // If the user's name contains only one space, guess that it contains
    // their first and last name and auto populate those inputs.
    // Otherwise, leave them blank.
    const nameParts = (user.name || '').trim().split(/\s/)
    const [firstName, lastName] = nameParts.length === 2 ? nameParts : ['', '']

    return {
      firstName,
      lastName,
      title: '',
      organization: '',
      contactEmail: user.email,
      terraEmail: user.email,
    }
  })

  const submitEnabled = Object.values(userInfo).every(Boolean) && !busy

  const submitForm = useCallback(async () => {
    setBusy(true)
    try {
      const formInput = Object.entries(formInputMap)
        .reduce((acc, [userInfoKey, formFieldId]) => ({ ...acc, [formFieldId]: userInfo[userInfoKey] }), {})

      await Ajax().Surveys.submitForm(formId, formInput)
      setHasSubmittedForm(true)
    } catch (error) {
      reportError('Error submitting information', error)
    } finally {
      setBusy(false)
    }
  }, [userInfo])

  if (hasSubmittedForm) {
    return h(Fragment, [
      p({ style: styles.paragraph }, [
        'Thank you for your interest in using Terra on Microsoft Azure. We will be in touch with your access information soon.'
      ]),
      div({ style: { marginTop: '1.5rem' } }, [
        h(ButtonPrimary, { onClick: signOut, style: styles.button }, ['Sign Out']),
      ])
    ])
  } else {
    return div([
      p({ style: styles.paragraph }, [
        'Terra on Microsoft Azure is currently in preview. Please complete the following form if you are interested in accessing the platform and exploring the capabilities of Terra on Microsoft Azure.'
      ]),

      h(AzurePreviewUserForm, { value: userInfo, onChange: setUserInfo, onSubmit: submitEnabled ? submitForm : () => {} }),

      div({
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: '1.5rem',
        }
      }, [
        h(ButtonPrimary, { disabled: !submitEnabled, onClick: submitForm, style: styles.button }, [
          'Submit',
          busy && icon('loadingSpinner', { size: 12, style: { marginLeft: '1ch' } }),
        ]),
        h(ButtonOutline, { onClick: signOut, style: styles.button }, ['Sign Out']),
      ])
    ])
  }
}

const AzurePreview = () => {
  const { isAzurePreviewUser } = useStore(authStore)

  return div({
    role: 'main',
    style: {
      ...styles.centered,
      flexGrow: 1,
      padding: '5rem',
      backgroundImage: `url(${planet})`,
      backgroundRepeat: 'no-repeat', backgroundSize: '750px', backgroundPosition: 'right 0px bottom -600px'
    }
  }, [
    div([
      h(TerraOnAzureLogo, { title: 'Terra on Microsoft Azure - Preview', role: 'img' }),
      h1({ style: styles.header }, ['Terra on Microsoft Azure - Preview']),

      !!isAzurePreviewUser ? h(AzurePreviewForPreviewUser) : h(AzurePreviewForNonPreviewUser),
    ]),
  ])
}

export default AzurePreview

export const navPaths = [
  {
    name: 'azure-preview',
    path: '/azure-preview',
    component: AzurePreview,
    public: true,
    title: 'Terra on Microsoft Azure Preview'
  }
]
