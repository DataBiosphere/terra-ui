import { addDays, parseJSON } from 'date-fns/fp'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useState } from 'react'
import { div, h, h2, h3, label, span } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import {
  ButtonPrimary, ClipboardButton, FrameworkServiceLink, IdContainer, LabeledCheckbox, Link, RadioButton, ShibbolethLink, spinnerOverlay,
  UnlinkFenceAccount
} from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, icon, profilePic, spinner } from 'src/components/icons'
import { TextInput, ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { InfoBox } from 'src/components/PopupTrigger'
import { SimpleTabBar } from 'src/components/tabBars'
import TopBar from 'src/components/TopBar'
import { Ajax } from 'src/libs/ajax'
import { getUser, refreshTerraProfile } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import allProviders from 'src/libs/providers'
import { useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


const styles = {
  page: {
    margin: '0 2rem 2rem',
    width: 1050
  },
  sectionTitle: {
    margin: '2rem 0 1rem',
    color: colors.dark(), fontSize: 16, fontWeight: 600, textTransform: 'uppercase'
  },
  header: {
    line: {
      margin: '0 2rem',
      display: 'flex', alignItems: 'center'
    },

    nameLine: {
      marginLeft: '1rem',
      color: colors.dark(),
      fontSize: '150%'
    }
  },
  form: {
    line: {
      display: 'flex', justifyContent: 'normal',
      margin: '2rem 0'
    },
    container: {
      width: 320, margin: '0.5rem'
    },
    title: {
      whiteSpace: 'nowrap', fontSize: 16,
      marginBottom: '0.3rem'
    },
    checkboxLine: {
      display: 'flex', margin: '1rem'
    },
    checkboxLabel: {
      marginLeft: '0.5rem'
    }
  },
  idLink: {
    container: {
      display: 'grid', marginBottom: '0.6rem', border: `1px solid ${colors.dark(0.55)}`, borderRadius: 4
    },
    linkContentTop: hasBottom => ({
      display: 'grid', rowGap: '0.6rem',
      backgroundColor: colors.light(0.2), padding: '1.2rem',
      borderRadius: hasBottom ? '4px 4px 0 0' : 4
    }),
    linkContentBottom: {
      padding: '1.2rem'
    },
    linkName: {
      fontSize: 18, fontWeight: 700, marginBottom: '0.6rem', display: 'inline'
    },
    linkDetailLabel: {
      fontWeight: 700, marginBottom: '0.6rem', marginRight: '1.2rem'
    }
  }
}

const SpacedSpinner = ({ children }) => {
  return div({ style: { display: 'flex', alignItems: 'center' } }, [
    spinner({ style: { marginRight: '1rem' } }), children
  ])
}


const NihLink = ({ nihToken }) => {
  // State
  const { nihStatus } = useStore(authStore)
  const [isLinking, setIsLinking] = useState(false)
  const [isConfirmUnlinkModalOpen, setIsConfirmUnlinkModalOpen] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)

  // Lifecycle
  useOnMount(() => {
    const linkNihAccount = _.flow(
      withErrorReporting('Error linking NIH account'),
      Utils.withBusyState(setIsLinking)
    )(async () => {
      const nihStatus = await Ajax().User.linkNihAccount(nihToken)
      authStore.update(_.set(['nihStatus'], nihStatus))
    })

    if (nihToken) {
      // Clear the query string, but use replace so the back button doesn't take the user back to the token
      Nav.history.replace({ search: '' })
      linkNihAccount()
    }
  })


  // Render
  const { linkedNihUsername, linkExpireTime, datasetPermissions } = nihStatus || {}

  const [authorizedDatasets, unauthorizedDatasets] = _.flow(
    _.sortBy('name'),
    _.partition('authorized')
  )(datasetPermissions)

  const isLinked = !!linkedNihUsername && !isLinking

  return div({ style: styles.idLink.container }, [
    div({ style: styles.idLink.linkContentTop(isLinked) }, [
      div({ style: { ...styles.form.title, marginBottom: 0 } }, [
        h3({ style: { marginRight: '0.5rem', ...styles.idLink.linkName } }, ['NIH Account']),
        h(InfoBox, [
          'Linking with eRA Commons will allow Terra to automatically determine if you can access controlled datasets hosted in Terra (ex. TCGA) ',
          'based on your valid dbGaP applications.'
        ])
      ]),
      Utils.cond(
        [!nihStatus, () => h(SpacedSpinner, ['Loading NIH account status...'])],
        [isLinking, () => h(SpacedSpinner, ['Linking NIH account...'])],
        [!linkedNihUsername, () => div([h(ShibbolethLink, { button: true }, ['Log in to NIH'])])],
        () => h(Fragment, [
          div([
            span({ style: styles.idLink.linkDetailLabel }, ['Username:']),
            linkedNihUsername
          ]),
          div([
            span({ style: styles.idLink.linkDetailLabel }, ['Link Expiration:']),
            span([Utils.makeCompleteDate(linkExpireTime * 1000)])
          ]),
          div([
            h(ShibbolethLink, ['Renew']),
            span({ style: { margin: '0 .25rem 0' } }, [' | ']),
            h(Link, {
              'aria-label': 'Unlink NIH account',
              onClick: () => setIsConfirmUnlinkModalOpen(true)
            }, ['Unlink'])
          ])
        ])
      )
    ]),
    isLinked && div({ style: styles.idLink.linkContentBottom }, [
      h3({ style: { fontWeight: 500, margin: 0 } }, ['Resources']),
      !_.isEmpty(authorizedDatasets) && h(Collapse, {
        style: { marginTop: '1rem' },
        title: 'Authorized to access', titleFirst: true
      }, [
        div({ style: { marginTop: '0.5rem' } }, [
          _.map(({ name }) => div({ key: name, style: { lineHeight: '24px' } }, [name]), authorizedDatasets)
        ])
      ]),
      !_.isEmpty(unauthorizedDatasets) && h(Collapse, {
        style: { marginTop: '1rem' },
        title: 'Not authorized', titleFirst: true,
        afterTitle: h(InfoBox, [
          'Your account was linked, but you are not authorized to view these controlled datasets. ',
          'If you think you should have access, please ',
          h(Link, {
            href: 'https://dbgap.ncbi.nlm.nih.gov/aa/wga.cgi?page=login',
            ...Utils.newTabLinkProps
          }, [
            'verify your credentials here',
            icon('pop-out', { size: 12, style: { marginLeft: '0.2rem', verticalAlign: 'baseline' } })
          ]),
          '.'
        ])
      }, [
        div({ style: { marginTop: '0.5rem' } }, [
          _.map(({ name }) => div({ key: name, style: { lineHeight: '24px' } }, [name]), unauthorizedDatasets)
        ])
      ])
    ]),
    isConfirmUnlinkModalOpen && h(Modal, {
      title: 'Confirm unlink account',
      onDismiss: () => setIsConfirmUnlinkModalOpen(false),
      okButton: h(ButtonPrimary, {
        onClick: _.flow(
          withErrorReporting('Error unlinking account'),
          Utils.withBusyState(setIsUnlinking)
        )(async () => {
          await Ajax().User.unlinkNihAccount()
          authStore.update(_.set('nihStatus', {}))
          setIsConfirmUnlinkModalOpen(false)
          notify('success', 'Successfully unlinked account', {
            message: 'Successfully unlinked your account from NIH.',
            timeout: 30000
          })
        })
      }, 'OK')
    }, [
      div(['Are you sure you want to unlink from NIH?']),
      div({ style: { marginTop: '1rem' } }, ['You will lose access to any underlying datasets. You can always re-link your account later.']),
      isUnlinking && spinnerOverlay
    ])
  ])
}


const FenceLink = ({ provider: { key, name, expiresAfter, short } }) => {
  // State
  const { fenceStatus: { [key]: { username, issued_at: issuedAt } = {} } } = useStore(authStore)
  const [isLinking, setIsLinking] = useState(false)


  // Helpers
  const redirectUrl = `${window.location.origin}/${Nav.getLink('fence-callback')}`


  // Lifecycle
  useOnMount(() => {
    const { state, code } = qs.parse(window.location.search, { ignoreQueryPrefix: true })
    const extractedProvider = state ? JSON.parse(atob(state)).provider : ''
    const token = key === extractedProvider ? code : undefined

    const linkFenceAccount = _.flow(
      withErrorReporting('Error linking NIH account'),
      Utils.withBusyState(setIsLinking)
    )(async () => {
      const status = await Ajax().User.linkFenceAccount(key, token, redirectUrl)
      authStore.update(_.set(['fenceStatus', key], status))
    })

    if (token) {
      const profileLink = `/${Nav.getLink('profile')}`
      window.history.replaceState({}, '', profileLink)
      linkFenceAccount()
    }
  })


  // Render
  return div({ style: styles.idLink.container }, [
    div({ style: styles.idLink.linkContentTop(false) }, [
      h3({ style: { marginTop: 0, ...styles.idLink.linkName } }, [name]),
      Utils.cond(
        [isLinking, () => h(SpacedSpinner, ['Loading account status...'])],
        [!username, () => div([h(FrameworkServiceLink, { button: true, linkText: `Log in to ${short} `, provider: key, redirectUrl })])],
        () => h(Fragment, [
          div([
            span({ style: styles.idLink.linkDetailLabel }, ['Username:']),
            username
          ]),
          div([
            span({ style: styles.idLink.linkDetailLabel }, ['Link Expiration:']),
            span([Utils.makeCompleteDate(addDays(expiresAfter, parseJSON(issuedAt)))])
          ]),
          div([
            h(FrameworkServiceLink, { linkText: 'Renew', 'aria-label': `Renew your ${short} link`, provider: key, redirectUrl }),
            span({ style: { margin: '0 .25rem 0' } }, [' | ']),
            h(UnlinkFenceAccount, { linkText: `Unlink`, 'aria-label': `Unlink from ${short}`, provider: { key, name } })
          ])
        ])
      )
    ])
  ])
}


const PassportLinker = ({ queryParams: { state, code } = {}, provider, prettyName }) => {
  const signal = useCancellation()
  const [accountInfo, setAccountInfo] = useState()
  const [passport, setPassport] = useState()
  const [authUrl, setAuthUrl] = useState()

  useOnMount(() => {
    const loadAuthUrl = withErrorReporting(`Error loading ${prettyName} account link URL`, async () => {
      setAuthUrl(await Ajax(signal).User.externalAccount(provider).getAuthUrl())
    })
    const loadAccount = withErrorReporting(`Error loading ${prettyName} account`, async () => {
      setAccountInfo(await Ajax(signal).User.externalAccount(provider).get())
    })
    const loadPassport = withErrorReporting(`Error loading ${prettyName} passport`, async () => {
      setPassport(await Ajax(signal).User.externalAccount(provider).getPassport())
    })
    const linkAccount = withErrorReporting(`Error linking ${prettyName} account`, async (code, state) => {
      setAccountInfo(await Ajax().User.externalAccount(provider).linkAccount(code, state))
      loadPassport()
    })

    loadAuthUrl()

    if (Nav.getCurrentRoute().name === 'ecm-callback' && JSON.parse(atob(state)).provider === provider) {
      window.history.replaceState({}, '', `/${Nav.getLink('profile')}`)
      linkAccount(code, state)
    } else {
      loadAccount()
      loadPassport()
    }
  })

  const unlinkAccount = withErrorReporting(`Error unlinking ${prettyName} account`, async () => {
    setAccountInfo(undefined)
    await Ajax().User.externalAccount(provider).unlink()
    setAccountInfo(null)
  })

  return div({ style: styles.idLink.container }, [
    div({ style: styles.idLink.linkContentTop(false) }, [
      h3({ style: { marginTop: 0, ...styles.idLink.linkName } }, [prettyName]),
      Utils.cond(
        [accountInfo === undefined, () => h(SpacedSpinner, ['Loading account status...'])],
        [accountInfo === null, () => {
          return div([h(ButtonPrimary, { href: authUrl, ...Utils.newTabLinkProps }, [`Link your ${prettyName} account`])])
        }],
        () => {
          const { externalUserId, expirationTimestamp } = accountInfo

          return h(Fragment, [
            div([
              span({ style: styles.idLink.linkDetailLabel }, ['Username:']),
              externalUserId
            ]),
            div([
              span({ style: styles.idLink.linkDetailLabel }, ['Link Expiration:']),
              span([Utils.makeCompleteDate(expirationTimestamp)])
            ]),
            div([
              h(Link, { 'aria-label': `Renew your ${prettyName} link`, href: authUrl }, ['Renew']),
              span({ style: { margin: '0 0.25rem 0' } }, [' | ']),
              h(Link, { 'aria-label': `Unlink from ${prettyName}`, onClick: unlinkAccount }, ['Unlink'])
            ]),
            !!passport && div([h(ClipboardButton, { text: passport }, ['Copy passport to clipboard'])])
          ])
        }
      )
    ])
  ])
}

const ExternalIdentitiesTab = queryParams => {
  return div({ style: { margin: '0 2rem', width: 500 } }, [
    sectionTitle('External Identities'),
    h(NihLink, { nihToken: queryParams?.['nih-username-token'] }),
    _.map(provider => h(FenceLink, { key: provider.key, provider }), allProviders),
    !!getConfig().externalCredsUrlRoot && h(PassportLinker, { queryParams, provider: 'ras', prettyName: 'RAS' })
  ])
}

const PersonalInfoTab = () => {
  const [profileInfo, setProfileInfo] = useState(() => _.mapValues(v => v === 'N/A' ? '' : v, authStore.get().profile))
  const [proxyGroup, setProxyGroup] = useState()
  const [saving, setSaving] = useState()
  const [tab, setTab] = useState('personalInfo')
  const [areasOfResearch, setAreasOfResearch] = useState([])

  const signal = useCancellation()

  console.log(areasOfResearch)

  // Helpers
  const assignValue = _.curry((key, value) => {
    setProfileInfo(_.set(key, value))
  })
  const line = children => div({ style: styles.form.line }, children)
  const checkboxLine = children => div({ style: styles.form.container }, children)
  const textField = (key, title, { placeholder, required } = {}) => h(IdContainer, [id => div({ style: styles.form.container }, [
    label({ htmlFor: id, style: styles.form.title }, [title]),
    required ?
      h(ValidatedInput, {
        inputProps: {
          id,
          value: profileInfo[key],
          onChange: assignValue(key),
          placeholder: placeholder || 'Required'
        },
        error: Utils.summarizeErrors(errors && errors[key])
      }) :
      h(TextInput, {
        id,
        value: profileInfo[key],
        onChange: assignValue(key),
        placeholder
      })
  ])])
  const radioButton = (key, value) => h(RadioButton, {
    text: value, name: key, checked: profileInfo[key] === value,
    labelStyle: { margin: '0 2rem 0 0.25rem' },
    onChange: () => assignValue(key, value)
  })
  const checkbox = title => div([
    h(LabeledCheckbox, {
      checked: _.includes(title, areasOfResearch),
      onChange: v => {
        console.log(v)
        v ? setAreasOfResearch(_.concat(areasOfResearch, [title])) :
          setAreasOfResearch(_.without([title], areasOfResearch))
      }
    }, [span({ style: styles.form.checkboxLabel }, [title])])
  ])
  // Lifecycle
  useOnMount(() => {
    const loadProxyGroup = async () => {
      setProxyGroup(await Ajax(signal).User.getProxyGroup(authStore.get().profile.email))
    }
    loadProxyGroup()
  })
  // Render
  const { firstName, lastName } = profileInfo
  const required = { presence: { allowEmpty: false } }
  const errors = validate({ firstName, lastName }, { firstName: required, lastName: required })

  return div({ style: { paddingTop: '1rem'} }, [
    div({ style: styles.header.line }, [
      div({ style: { position: 'relative' } }, [
        profilePic({ size: 48 }),
        h(InfoBox, { style: { alignSelf: 'flex-end' } }, [
          'To change your profile image, visit your ',
          h(Link, {
            href: `https://myaccount.google.com?authuser=${getUser().email}`,
            ...Utils.newTabLinkProps
          }, ['Google account page.'])
        ])
      ]),
      div({ style: styles.header.nameLine }, [
        `Hello again, ${firstName}`
      ])
    ]),
    div({ style: { display: 'flex' } }, [
      div({ style: styles.page }, [
        line([
          textField('firstName', 'First Name', { required: true }),
          textField('lastName', 'Last Name', { required: true })
        ]),
        line([
          textField('title', 'Title'),
          textField('researchArea', 'Research Area'),
          textField('institute', 'Organization or Company'), //keep this key as 'institute' to be backwards compatible with existing Thurloe KVs
        ]),
        line([
          textField('programLocationCity', 'City'),
          textField('programLocationState', 'State'),
          textField('programLocationCountry', 'Country')
        ]),
        line([
          div({ style: styles.form.container }, [
            div({ style: styles.form.title }, ['Email']),
            div({ style: { margin: '0.5rem', width: 320 } }, [profileInfo.email])
          ]),
          textField('contactEmail', 'Contact Email for Notifications (if different)', { placeholder: profileInfo.email })
        ]),

        line([
          div({ style: styles.form.container }, [
            div({ style: styles.form.title }, [
              span({ style: { marginRight: '0.5rem' } }, ['Proxy Group']),
              h(InfoBox, [
                'For more information about proxy groups, see the ',
                h(Link, {
                  href: 'https://support.terra.bio/hc/en-us/articles/360031023592',
                  ...Utils.newTabLinkProps
                }, ['user guide.'])
              ])
            ]),
            div({ style: { margin: '1rem' } }, proxyGroup ? proxyGroup : 'Loading...')
          ])
        ]),

        sectionTitle('What is your area of research? (multi-select)'),

        line([
          checkboxLine([
            checkbox('Cancer'),
            checkbox('Cardiovascular disease'),
            checkbox('Epidemiology'),
            checkbox('Epigenetics')
          ]),
          checkboxLine([
            checkbox('Immunology'),
            checkbox('Infectious disease and microbiome'),
            checkbox('Medical and Population Genetics'),
            checkbox('Psychiatric disease')
          ]),
          checkboxLine([
            checkbox('Rare Disease'),
            checkbox('Single Cell Genomics'),
            checkbox('Agricultural'),
            checkbox('Other (please specify)')
          ])
        ]),

        h(ButtonPrimary, {
          style: { marginTop: '3rem' },
          onClick: _.flow(
            Utils.withBusyState(setSaving),
            withErrorReporting('Error saving profile')
          )(async () => {
            const [prefsData, profileData] = _.over([_.pickBy, _.omitBy])((_v, k) => _.startsWith('notifications/', k), profileInfo)
            await Promise.all([
              Ajax().User.profile.set(_.pickBy(_.identity, profileData)),
              Ajax().User.profile.setPreferences(prefsData)
            ])
            await refreshTerraProfile()
          }),
          disabled: !!errors,
          tooltip: !!errors && 'Please fill out all required fields'
        }, ['Save Profile'])
      ])
    ])
  ])
}


const sectionTitle = text => h2({ style: styles.sectionTitle }, [text])

const Profile = ({ queryParams }) => {
  // State
  const [profileInfo, setProfileInfo] = useState(() => _.mapValues(v => v === 'N/A' ? '' : v, authStore.get().profile))
  const [proxyGroup, setProxyGroup] = useState()
  const [saving, setSaving] = useState()
  const [tab, setTab] = useState('personalInfo')

  const signal = useCancellation()

  console.log(queryParams)
  // Helpers
  const assignValue = _.curry((key, value) => {
    setProfileInfo(_.set(key, value))
  })

  const line = children => div({ style: styles.form.line }, children)

  const textField = (key, title, { placeholder, required } = {}) => h(IdContainer, [id => div({ style: styles.form.container }, [
    label({ htmlFor: id, style: styles.form.title }, [title]),
    required ?
      h(ValidatedInput, {
        inputProps: {
          id,
          value: profileInfo[key],
          onChange: assignValue(key),
          placeholder: placeholder || 'Required'
        },
        error: Utils.summarizeErrors(errors && errors[key])
      }) :
      h(TextInput, {
        id,
        value: profileInfo[key],
        onChange: assignValue(key),
        placeholder
      })
  ])])

  const radioButton = (key, value) => h(RadioButton, {
    text: value, name: key, checked: profileInfo[key] === value,
    labelStyle: { margin: '0 2rem 0 0.25rem' },
    onChange: () => assignValue(key, value)
  })

  const checkbox = (key, title) => div({ style: styles.form.checkboxLine }, [
    h(LabeledCheckbox, {
      checked: profileInfo[key] === 'true',
      onChange: v => assignValue(key, v.toString())
    }, [span({ style: styles.form.checkboxLabel }, [title])])
  ])


  // Lifecycle
  useOnMount(() => {
    const loadProxyGroup = async () => {
      setProxyGroup(await Ajax(signal).User.getProxyGroup(authStore.get().profile.email))
    }

    loadProxyGroup()
  })


  // Render
  const { firstName, lastName } = profileInfo
  const required = { presence: { allowEmpty: false } }
  const errors = validate({ firstName, lastName }, { firstName: required, lastName: required })

  return h(FooterWrapper, [
    saving && spinnerOverlay,
    h(TopBar, { title: 'User Profile' }),
    div({ style: { padding: '1.5rem 0 0', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { color: colors.dark(), fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', marginLeft: '1rem' } }, 'Profile'),
      h(SimpleTabBar, {
        'aria-label': 'Profile tabs',
        value: tab,
        onChange: setTab,
        tabs: [
          { key: 'personalInfo', title: 'Personal Information' },
          { key: 'externalIdentities', title: 'External Identities' },
          { key: 'notifications', title: 'Notification Settings' }
        ],
        style: { marginTop: '1rem' }
      }, [
        Utils.switchCase(tab,
          ['personalInfo', () => h(PersonalInfoTab)],
          ['externalIdentities', () => ExternalIdentitiesTab(queryParams)],
          ['notifications', () => div('notifications!')],
          [Utils.DEFAULT, () => null]
        )
      ])
    ])
  ])
}

export const navPaths = [
  {
    name: 'profile',
    path: '/profile',
    component: Profile,
    title: 'Profile'
  },
  {
    name: 'fence-callback',
    path: '/fence-callback',
    component: Profile,
    title: 'Profile'
  },
  {
    name: 'ecm-callback',
    path: '/ecm-callback',
    component: Profile,
    title: 'Profile'
  }
]
