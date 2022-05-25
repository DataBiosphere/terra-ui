import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useEffect, useRef, useState } from 'react'
import { div, h, h2, p, span } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { ButtonOutline, ButtonPrimary, Clickable, IdContainer, Link, Select, spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon, spinner } from 'src/components/icons'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { InfoBox, MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import TopBar from 'src/components/TopBar'
import { Ajax } from 'src/libs/ajax'
import * as Auth from 'src/libs/auth'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { reportError, reportErrorAndRethrow } from 'src/libs/error'
import Events from 'src/libs/events'
import { formHint, FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import DeleteBillingProjectModal from 'src/pages/billing/DeleteBillingProjectModal'
import ProjectDetail from 'src/pages/billing/Project'
import validate from 'validate.js'


export const billingRoles = {
  owner: 'Owner',
  user: 'User'
}

const styles = {
  projectListItem: selected => {
    return {
      ...Style.navList.itemContainer(selected),
      ...Style.navList.item(selected),
      ...(selected ? { backgroundColor: colors.dark(0.1) } : {}),
      paddingLeft: '3rem'
    }
  }
}

const BillingProjectActions = ({ project: { projectName }, loadProjects }) => {
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return h(Fragment, [
    h(MenuTrigger, {
      closeOnClick: true,
      side: 'right',
      style: { marginRight: '0.5rem' },
      content: h(Fragment, [
        h(MenuButton, {
          onClick: () => setShowDeleteProjectModal(true)
        }, ['Delete Billing Project'])
      ])
    }, [
      h(Link, { 'aria-label': 'Billing project menu', style: { display: 'flex', alignItems: 'center' } }, [
        icon('cardMenuIcon', { size: 16, 'aria-haspopup': 'menu' })
      ])
    ]),
    showDeleteProjectModal && h(DeleteBillingProjectModal, {
      projectName, deleting,
      onDismiss: () => setShowDeleteProjectModal(false),
      onConfirm: async () => {
        setDeleting(true)
        try {
          await Ajax().Billing.deleteProject(projectName)
          setShowDeleteProjectModal(false)
          loadProjects()
        } catch (err) {
          reportError('Error deleting billing project.', err)
          setShowDeleteProjectModal(false)
        }
        setDeleting(false)
      }
    })
  ])
}

const ProjectListItem = ({ project, project: { roles, status }, loadProjects, isActive }) => {
  const selectableProject = ({ projectName }, isActive) => h(Clickable, {
    style: { ...styles.projectListItem(isActive), color: isActive ? colors.accent(1.1) : colors.accent() },
    href: `${Nav.getLink('billing')}?${qs.stringify({ selectedName: projectName, type: 'project' })}`,
    onClick: () => Ajax().Metrics.captureEvent(Events.billingProjectOpenFromList, {
      billingProjectName: projectName
    }),
    hover: Style.navList.itemHover(isActive),
    'aria-current': isActive ? 'location' : false
  }, [projectName])

  const unselectableProject = ({ projectName, status, message }, isActive) => {
    const iconAndTooltip =
      status === 'Creating' ? spinner({ size: 16, style: { color: colors.accent(), margin: '0 1rem 0 0.5rem' } }) :
        status === 'Error' ? h(Fragment, [
          h(InfoBox, { style: { color: colors.danger(), margin: '0 0.5rem 0 0.5rem' }, side: 'right' }, [
            div({ style: { wordWrap: 'break-word', whiteSpace: 'pre-wrap' } }, [
              message || 'Error during project creation.'
            ])
          ]),
          //Currently, only billing projects that failed to create can have actions performed on them.
          //If that changes in the future, this should be moved elsewhere
          h(BillingProjectActions, { project, loadProjects })
        ]) : undefined

    return div({ style: { ...styles.projectListItem(isActive), color: colors.dark() } }, [
      projectName, iconAndTooltip
    ])
  }

  const viewerRoles = _.intersection(roles, _.values(billingRoles))

  return div({ role: 'listitem' }, [
    !_.isEmpty(viewerRoles) && status === 'Ready' ?
      selectableProject(project, isActive) :
      unselectableProject(project, isActive)
  ])
}

const billingProjectNameValidator = existing => ({
  presence: { allowEmpty: false },
  length: { minimum: 6, maximum: 30 },
  format: {
    pattern: /(\w|-)+/,
    message: 'can only contain letters, numbers, underscores and hyphens.'
  },
  exclusion: {
    within: existing,
    message: 'already exists'
  }
})

const noBillingMessage = onClick => div({ style: { fontSize: 20, margin: '2rem' } }, [
  div([
    'To get started, ',
    h(Link, { onClick }, ['click here to create a Billing Project'])
  ]),
  div({ style: { marginTop: '1rem', fontSize: 16 } }, [
    h(Link, {
      ...Utils.newTabLinkProps,
      href: `https://support.terra.bio/hc/en-us/articles/360026182251`
    }, [`What is a billing project?`])
  ])
])

const BillingProjectSubheader = ({ title, children }) => h(Collapse, {
  title,
  initialOpenState: true,
  titleFirst: true,
  buttonStyle: { padding: '1rem 1rem 1rem 2rem', color: colors.dark(), fontWeight: 'bold' }
}, [children])

const NewBillingProjectModal = ({ onSuccess, onDismiss, billingAccounts, loadAccounts }) => {
  const [billingProjectName, setBillingProjectName] = useState('')
  const [billingProjectNameTouched, setBillingProjectNameTouched] = useState(false)
  const [existing, setExisting] = useState([])
  const [isBusy, setIsBusy] = useState(false)
  const [chosenBillingAccount, setChosenBillingAccount] = useState('')

  const submit = _.flow(
    reportErrorAndRethrow('Error creating billing project'),
    Utils.withBusyState(setIsBusy)
  )(async () => {
    try {
      await Ajax().Billing.createProject(billingProjectName, chosenBillingAccount.accountName)
      onSuccess()
    } catch (error) {
      if (error.status === 409) {
        setExisting(_.concat(billingProjectName, existing))
      } else {
        throw error
      }
    }
  })

  const errors = validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator(existing) })
  const billingLoadedAndEmpty = billingAccounts && _.isEmpty(billingAccounts)
  const billingPresent = !_.isEmpty(billingAccounts)

  return h(Modal, {
    onDismiss,
    shouldCloseOnOverlayClick: false,
    title: 'Create Billing Project',
    showCancel: !billingLoadedAndEmpty,
    showButtons: !!billingAccounts,
    okButton: billingPresent ?
      h(ButtonPrimary, {
        disabled: errors || !chosenBillingAccount || !chosenBillingAccount.firecloudHasAccess,
        onClick: submit
      }, ['Create Billing Project']) :
      h(ButtonPrimary, {
        onClick: onDismiss
      }, ['Ok'])
  }, [
    billingLoadedAndEmpty && h(Fragment, [
      `You don't have access to any billing accounts.  `,
      h(Link, {
        href: `https://support.terra.bio/hc/en-us/articles/360026182251`,
        ...Utils.newTabLinkProps
      }, ['Learn how to create a billing account.', icon('pop-out', { size: 12, style: { marginLeft: '0.5rem' } })])
    ]),
    billingPresent && h(Fragment, [
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Enter name']),
        h(ValidatedInput, {
          inputProps: {
            id,
            autoFocus: true,
            value: billingProjectName,
            onChange: v => {
              setBillingProjectName(v)
              setBillingProjectNameTouched(true)
            }
          },
          error: billingProjectNameTouched && Utils.summarizeErrors(errors?.billingProjectName)
        })
      ])]),
      !(billingProjectNameTouched && errors) && formHint('Name must be unique and cannot be changed.'),
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Select billing account']),
        div({ style: { fontSize: 14 } }, [
          h(Select, {
            id,
            isMulti: false,
            placeholder: 'Select billing account',
            value: chosenBillingAccount,
            onChange: ({ value }) => setChosenBillingAccount(value),
            options: _.map(account => {
              return {
                value: account,
                label: account.displayName
              }
            }, billingAccounts)
          })
        ])
      ])]),
      !!chosenBillingAccount && !chosenBillingAccount.firecloudHasAccess && div({ style: { fontWeight: 500, fontSize: 13 } }, [
        div({ style: { margin: '0.25rem 0 0.25rem 0', color: colors.danger() } },
          'Terra does not have access to this account. '),
        div({ style: { marginBottom: '0.25rem' } }, ['To grant access, add ', span({ style: { fontWeight: 'bold' } }, 'terra-billing@terra.bio'),
          ' as a ', span({ style: { fontWeight: 'bold' } }, 'Billing Account User'), ' on the ',
          h(Link, {
            href: `https://console.cloud.google.com/billing/${chosenBillingAccount.accountName.split('/')[1]}?authuser=${Auth.getUser().email}`,
            ...Utils.newTabLinkProps
          }, ['Google Cloud Console', icon('pop-out', { style: { marginLeft: '0.25rem' }, size: 12 })])]),
        div({ style: { marginBottom: '0.25rem' } }, ['Then, ',
          h(Link, { onClick: loadAccounts }, ['click here']), ' to refresh your billing accounts.']),
        div({ style: { marginTop: '0.5rem' } }, [
          h(Link, {
            href: `https://support.terra.bio/hc/en-us/articles/360026182251`,
            ...Utils.newTabLinkProps
          }, ['Need help?', icon('pop-out', { style: { marginLeft: '0.25rem' }, size: 12 })])
        ])
      ])
    ]),
    (isBusy || !billingAccounts) && spinnerOverlay
  ])
}

export const BillingList = ({ queryParams: { selectedName } }) => {
  // State
  const [billingProjects, setBillingProjects] = useState(StateHistory.get().billingProjects || [])
  const [creatingBillingProject, setCreatingBillingProject] = useState(false)
  const [billingAccounts, setBillingAccounts] = useState({ })
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [isAlphaSpendReportUser, setIsAlphaSpendReportUser] = useState(false)

  const signal = useCancellation()
  const interval = useRef()

  // Helpers
  const loadProjects = _.flow(
    reportErrorAndRethrow('Error loading billing projects list'),
    Utils.withBusyState(setIsLoadingProjects)
  )(async () => setBillingProjects(_.sortBy('projectName', await Ajax(signal).Billing.listProjects())))

  const loadAlphaSpendReportMember = reportErrorAndRethrow('Error loading spend report group membership')(async () => {
    setIsAlphaSpendReportUser(await Ajax(signal).Groups.group(getConfig().alphaSpendReportGroup).isMember())
  })

  const reloadBillingProject = _.flow(
    reportErrorAndRethrow('Error loading billing project'),
    Utils.withBusyState(setIsLoadingProjects)
  )(async ({ projectName }) => {
    // evaluate first to error if project doesn't exist/user can't access
    const project = await Ajax(signal).Billing.getProject(selectedName)
    const index = _.findIndex({ projectName }, billingProjects)
    setBillingProjects(_.set([index], project))
  })

  const authorizeAccounts = _.flow(
    reportErrorAndRethrow('Error setting up authorization'),
    Utils.withBusyState(setIsAuthorizing)
  )(Auth.ensureBillingScope)

  const loadAccounts = _.flow(
    reportErrorAndRethrow('Error loading billing accounts'),
    Utils.withBusyState(setIsLoadingAccounts)
  )(() => {
    if (Auth.hasBillingScope()) {
      return Ajax(signal).Billing.listAccounts()
        .then(_.keyBy('accountName'))
        .then(setBillingAccounts)
    }
  })

  const showCreateProjectModal = async () => {
    if (Auth.hasBillingScope()) {
      setCreatingBillingProject(true)
    } else {
      await authorizeAccounts()
      await loadAccounts()
      Auth.hasBillingScope() && setCreatingBillingProject(true)
    }
  }

  // Lifecycle
  useOnMount(() => {
    loadProjects()
    loadAccounts()
    loadAlphaSpendReportMember()
  })

  useEffect(() => {
    const anyProjectsCreating = _.some({ creationStatus: 'Creating' }, billingProjects)

    if (anyProjectsCreating && !interval.current) {
      interval.current = setInterval(loadProjects, 10000)
    } else if (!anyProjectsCreating && interval.current) {
      clearInterval(interval.current)
      interval.current = undefined
    }

    StateHistory.update({ billingProjects })

    return () => {
      clearInterval(interval.current)
      interval.current = undefined
    }
  })

  // Render
  const breadcrumbs = `Billing > Billing Project`
  const billingProjectListWidth = 330
  const [projectsOwned, projectsShared] = _.partition(
    ({ roles }) => _.includes(billingRoles.owner, roles),
    billingProjects
  )

  return h(FooterWrapper, { fixedHeight: true }, [
    h(TopBar, { title: 'Billing' }, [
      !!selectedName && div({ style: Style.breadcrumb.breadcrumb }, [
        div({ style: Style.noWrapEllipsis }, breadcrumbs),
        div({ style: Style.breadcrumb.textUnderBreadcrumb }, [selectedName])
      ])
    ]),
    div({ role: 'main', style: { display: 'flex', flex: 1, height: `calc(100% - ${Style.topBarHeight}px)` } }, [
      div({
        style: {
          minWidth: billingProjectListWidth, maxWidth: billingProjectListWidth,
          boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)', overflowY: 'auto'
        }
      }, [
        div({
          role: 'navigation',
          style: {
            fontSize: 16, fontWeight: 600, padding: '2rem 1rem 1rem', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', textTransform: 'uppercase', color: colors.dark()
          }
        }, [
          h2({ style: { fontSize: 16 } }, 'Billing Projects'),
          h(ButtonOutline, {
            'aria-label': 'Create new billing project',
            onClick: showCreateProjectModal
          }, [
            icon('plus', { size: 14, style: { color: colors.accent() } }),
            div({ style: { marginLeft: '0.5rem' } }, ['Create'])
          ])
        ]),
        h(BillingProjectSubheader, { title: 'Owned by You' }, [
          div({ role: 'list' }, [
            _.map(project => h(ProjectListItem, {
              project, key: project.projectName, loadProjects,
              isActive: !!selectedName && project.projectName === selectedName
            }), projectsOwned)
          ])
        ]),
        h(BillingProjectSubheader, { title: 'Shared with You' }, [
          div({ role: 'list' }, [
            _.map(project => h(ProjectListItem, {
              project, key: project.projectName, loadProjects,
              isActive: !!selectedName && project.projectName === selectedName
            }), projectsShared)
          ])
        ])
      ]),
      creatingBillingProject && h(NewBillingProjectModal, {
        billingAccounts,
        loadAccounts,
        onDismiss: () => setCreatingBillingProject(false),
        onSuccess: () => {
          setCreatingBillingProject(false)
          loadProjects()
        }
      }),
      div({
        style: {
          overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column'
        }
      }, [Utils.cond(
        [selectedName && !_.some({ projectName: selectedName }, billingProjects),
          () => div({
            style: {
              margin: '1rem auto 0 auto'
            }
          }, [
            div([
              h2(['Error loading selected billing project.']),
              p(['It may not exist, or you may not have access to it.'])
            ])
          ])],
        [selectedName && _.some({ projectName: selectedName }, billingProjects), () => {
          const billingProject = _.find({ projectName: selectedName }, billingProjects)
          return h(ProjectDetail, {
            key: selectedName,
            billingProject,
            billingAccounts,
            authorizeAndLoadAccounts: authorizeAccounts,
            reloadBillingProject: () => reloadBillingProject(billingProject).catch(loadProjects),
            isAlphaSpendReportUser,
            isOwner: _.find({ projectName: selectedName }, projectsOwned)
          })
        }],
        [!_.isEmpty(projectsOwned) && !selectedName, () => {
          return div({ style: { margin: '1rem auto 0 auto' } }, [
            'Select a Billing Project'
          ])
        }],
        [_.isEmpty(billingProjects), () => noBillingMessage(showCreateProjectModal)]
      )]),
      (isLoadingProjects || isAuthorizing || isLoadingAccounts) && spinnerOverlay
    ])
  ])
}


export const navPaths = [
  {
    name: 'billing',
    path: '/billing',
    component: BillingList,
    title: 'Billing'
  }
]
