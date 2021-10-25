import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, Link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { TextArea, ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { InfoBox } from 'src/components/PopupTrigger'
import { allRegions, getRegionInfo, locationTypes } from 'src/components/region-common'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { defaultLocation } from 'src/libs/runtime-utils'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


const warningStyle = {
  border: `1px solid ${colors.warning(0.8)}`,
  borderRadius: '5px',
  backgroundColor: colors.warning(0.15),
  display: 'flex',
  lineHeight: '18px',
  padding: '1rem 1rem', margin: '0.5rem 0 1rem',
  fontWeight: 'normal', fontSize: 14
}

const constraints = {
  name: {
    presence: { allowEmpty: false },
    length: { maximum: 254 },
    format: {
      pattern: /[\w- ]*/,
      message: 'can only contain letters, numbers, dashes, underscores, and spaces'
    }
  },
  namespace: {
    presence: true
  }
}

const NewWorkspaceModal = Utils.withDisplayName('NewWorkspaceModal', ({
  cloneWorkspace, onSuccess, onDismiss, customMessage, requiredAuthDomain, title, buttonText
}) => {
  // State
  const [billingProjects, setBillingProjects] = useState()
  const [allGroups, setAllGroups] = useState()
  const [name, setName] = useState(cloneWorkspace ? `${cloneWorkspace.workspace.name} copy` : '')
  const [namespace, setNamespace] = useState(cloneWorkspace ? cloneWorkspace.workspace.namespace : undefined)
  const [description, setDescription] = useState(cloneWorkspace ? cloneWorkspace.workspace.attributes.description : '')
  const [groups, setGroups] = useState([])
  const [nameModified, setNameModified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState()
  const [bucketLocation, setBucketLocation] = useState(defaultLocation)
  const [sourceWorkspaceLocation, setSourceWorkspaceLocation] = useState(defaultLocation)
  const signal = Utils.useCancellation()


  // Helpers
  const getRequiredGroups = () => _.uniq([
    ...(cloneWorkspace ? _.map('membersGroupName', cloneWorkspace.workspace.authorizationDomain) : []),
    ...(requiredAuthDomain ? [requiredAuthDomain] : [])
  ])

  const create = async () => {
    try {
      setCreateError(undefined)
      setCreating(true)

      const body = {
        namespace,
        name,
        authorizationDomain: _.map(v => ({ membersGroupName: v }), [...getRequiredGroups(), ...groups]),
        attributes: { description },
        copyFilesWithPrefix: 'notebooks/',
        ...(!!bucketLocation && { bucketLocation })
      }
      onSuccess(await Utils.cond(
        [cloneWorkspace, async () => {
          const workspace = await Ajax().Workspaces.workspace(cloneWorkspace.workspace.namespace, cloneWorkspace.workspace.name).clone(body)
          const featuredList = await Ajax().Buckets.getFeaturedWorkspaces()
          Ajax().Metrics.captureEvent(Events.workspaceClone, {
            public: cloneWorkspace.public,
            featured: _.some({ namespace: cloneWorkspace.workspace.namespace, name: cloneWorkspace.workspace.name }, featuredList),
            fromWorkspaceName: cloneWorkspace.workspace.name, fromWorkspaceNamespace: cloneWorkspace.workspace.namespace,
            toWorkspaceName: workspace.name, toWorkspaceNamespace: workspace.namespace
          })
          return workspace
        }],
        async () => {
          const workspace = await Ajax().Workspaces.create(body)
          Ajax().Metrics.captureEvent(Events.workspaceCreate, { workspaceName: workspace.name, workspaceNamespace: workspace.namespace })
          return workspace
        }))
    } catch (error) {
      const { message } = await error.json()
      setCreating(false)
      setCreateError(message)
    }
  }

  const loadData = _.flow(
    withErrorReporting('Error loading data'),
    Utils.withBusyState(setLoading)
  )(() => Promise.all([
    Ajax(signal).Billing.listProjects()
      .then(_.filter({ status: 'Ready' }))
      .then(projects => {
        setBillingProjects(projects)
        setNamespace(_.some({ projectName: namespace }, projects) ? namespace : undefined)
      }),
    Ajax(signal).Groups.list().then(setAllGroups),
    !!cloneWorkspace && Ajax(signal).Workspaces.workspace(namespace, cloneWorkspace.workspace.name).checkBucketLocation(cloneWorkspace.workspace.googleProject, cloneWorkspace.workspace.bucketName)
      .then(locationResponse => {
        setBucketLocation(locationResponse.location)
        setSourceWorkspaceLocation(locationResponse.location)
      })
  ]))

  const shouldShowDifferentRegionWarning = () => {
    return !!cloneWorkspace && bucketLocation !== sourceWorkspaceLocation
  }

  // Lifecycle
  Utils.useOnMount(() => {
    loadData()
  })


  // Render
  const existingGroups = getRequiredGroups()
  const hasBillingProjects = !!billingProjects && !!billingProjects.length
  const errors = validate({ namespace, name }, constraints, {
    prettify: v => ({ namespace: 'Billing project', name: 'Name' }[v] || validate.prettify(v))
  })

  const sourceLocationType = sourceWorkspaceLocation === defaultLocation ? locationTypes.default : locationTypes.region
  const destLocationType = bucketLocation === defaultLocation ? locationTypes.default : locationTypes.region

  return Utils.cond(
    [loading, () => spinnerOverlay],
    [hasBillingProjects, () => h(Modal, {
      title: Utils.cond(
        [title, () => title],
        [cloneWorkspace, () => 'Clone this workspace'],
        () => 'Create a New Workspace'
      ),
      onDismiss,
      okButton: h(ButtonPrimary, {
        disabled: errors,
        tooltip: Utils.summarizeErrors(errors),
        onClick: create
      }, Utils.cond(
        [buttonText, () => buttonText],
        [cloneWorkspace, () => 'Clone Workspace'],
        () => 'Create Workspace'
      ))
    }, [
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Workspace name']),
        h(ValidatedInput, {
          inputProps: {
            id,
            autoFocus: true,
            placeholder: 'Enter a name',
            value: name,
            onChange: v => {
              setName(v)
              setNameModified(true)
            }
          },
          error: Utils.summarizeErrors(nameModified && errors?.name)
        })
      ])]),
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Billing project']),
        h(Select, {
          id,
          isClearable: false,
          placeholder: 'Select a billing project',
          value: namespace,
          onChange: ({ value }) => setNamespace(value),
          styles: { option: provided => ({ ...provided, padding: 0 }) },
          options: _.map(({ projectName, invalidBillingAccount }) => ({
            label: h(TooltipTrigger, {
              content: invalidBillingAccount && 'Workspaces may only be created in billing projects that have a Google billing account accessible in Terra',
              side: 'left'
            }, [div({ style: { padding: 10 } }, [projectName])]
            ),
            value: projectName,
            isDisabled: invalidBillingAccount
          }), _.sortBy('projectName', _.uniq(billingProjects)))
        })
      ])]),
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id }, [
          'Bucket location',
          h(InfoBox, { style: { marginLeft: '0.25rem' } }, [
            'A bucket location can only be set when creating a workspace. ',
            'Once set, it cannot be changed. ',
            'A cloned workspace will automatically inherit the bucket location from the original workspace but this may be changed at clone time.',
            p([
              'By default, workflow and Cloud Environments will run in the same region as the workspace bucket. ',
              'Changing bucket or Cloud Environment locations from the defaults can lead to network egress charges.'
            ]),
            h(Link, {
              href: 'https://support.terra.bio/hc/en-us/articles/360058964552',
              ...Utils.newTabLinkProps
            }, ['Read more about bucket locations'])
          ])
        ]),
        h(Select, {
          id,
          value: bucketLocation,
          onChange: ({ value }) => setBucketLocation(value),
          options: _.sortBy('label', allRegions)
        })
      ])]),
      shouldShowDifferentRegionWarning() && div({ style: { ...warningStyle } }, [
        icon('warning-standard', { size: 24, style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem' } }),
        div({ style: { flex: 1 } }, [
          `Copying data from `,
          span({ style: { fontWeight: 600 } }, [`${getRegionInfo(sourceWorkspaceLocation, sourceLocationType).regionDescription} `]),
          `to `,
          span({ style: { fontWeight: 600 } }, [`${getRegionInfo(bucketLocation, destLocationType).regionDescription} `]),
          `may incur network egress charges. `,
          `To prevent charges, the new bucket location needs to stay in the same region as the original one.`
        ])
      ]),
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id }, ['Description']),
        h(TextArea, {
          id,
          style: { height: 100 },
          placeholder: 'Enter a description',
          value: description,
          onChange: setDescription
        })
      ])]),
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id }, [
          'Authorization domain',
          h(InfoBox, { style: { marginLeft: '0.25rem' } }, [
            'An authorization domain can only be set when creating a workspace. ',
            'Once set, it cannot be changed. ',
            'Any cloned workspace will automatically inherit the authorization domain(s) from the original workspace and cannot be removed. ',
            h(Link, {
              href: 'https://support.terra.bio/hc/en-us/articles/360026775691',
              ...Utils.newTabLinkProps
            }, ['Read more about authorization domains'])
          ])
        ]),
        !!existingGroups.length && div({ style: { marginBottom: '0.5rem', fontSize: 12 } }, [
          div({ style: { marginBottom: '0.2rem' } }, ['Inherited groups:']),
          ...existingGroups.join(', ')
        ]),
        h(Select, {
          id,
          isClearable: false,
          isMulti: true,
          placeholder: 'Select groups',
          disabled: !allGroups || !billingProjects,
          value: groups,
          onChange: data => setGroups(_.map('value', data)),
          options: _.difference(_.uniq(_.map('groupName', allGroups)), existingGroups).sort()
        })
      ])]),
      customMessage && div({ style: { marginTop: '1rem', lineHeight: '1.5rem' } }, [customMessage]),
      createError && div({
        style: { marginTop: '1rem', color: colors.danger() }
      }, [createError]),
      creating && spinnerOverlay
    ])],
    () => h(Modal, {
      title: 'Set up Billing',
      onDismiss,
      showCancel: false,
      okButton: h(ButtonPrimary, {
        onClick: () => Nav.goToPath('billing')
      }, 'Go to Billing')
    }, [
      div({ style: { color: colors.warning() } }, [
        icon('error-standard', { size: 16, style: { marginRight: '0.5rem' } }),
        'You need a billing project to ', cloneWorkspace ? 'clone a' : 'create a new', ' workspace.'
      ])
    ])
  )
})

export default NewWorkspaceModal
