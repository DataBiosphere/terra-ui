import _ from 'lodash/fp'
import { Fragment, useImperativeHandle, useState } from 'react'
import { div, h, i, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { ButtonPrimary, ButtonSecondary, ClipboardButton, Link, spinnerOverlay } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { MarkdownEditor, MarkdownViewer } from 'src/components/markdown'
import { InfoBox } from 'src/components/PopupTrigger'
import { regionInfo } from 'src/components/region-common'
import { SimpleTable, TooltipCell } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { WorkspaceTagSelect } from 'src/components/workspace-utils'
import { displayConsentCodes, displayLibraryAttributes } from 'src/data/workspace-attributes'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import { getAppName } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  authDomain: {
    padding: '0.5rem 0.25rem', marginBottom: '0.25rem',
    backgroundColor: colors.dark(0.15),
    ...Style.noWrapEllipsis
  },
  tag: {
    padding: '0.25rem', margin: '0.15rem',
    backgroundColor: colors.dark(0.15), borderRadius: 10,
    overflow: 'hidden', wordWrap: 'break-word'
  }
}

const roleString = {
  READER: 'Reader',
  WRITER: 'Writer',
  OWNER: 'Owner',
  PROJECT_OWNER: 'Proj. Owner'
}

const InfoTile = ({ title, children }) => {
  return div({ style: Style.dashboard.infoTile }, [
    div({ style: Style.dashboard.tinyCaps }, [title]),
    div({ style: { fontSize: 12 } }, [children])
  ])
}

const displayAttributeValue = v => {
  return Utils.cond(
    [_.isArray(v), () => v.join(', ')],
    [v && v.items, () => v.items.join(', ')],
    [v === true, () => 'Yes'],
    [v === false, () => 'No'],
    () => v
  )
}

const DataUseLimitations = ({ attributes }) => {
  return _.map(({ key, title }) => {
    return div({ key, style: { display: 'inline-block', marginRight: '0.75rem' } }, [
      h(TooltipTrigger, { content: title }, [
        span({ style: { textDecoration: 'underline dotted' } }, [key.slice(8)])
      ]),
      ': ',
      displayAttributeValue(attributes[key])
    ])
  }, _.filter(({ key }) => _.has(key, attributes), displayConsentCodes))
}

const WorkspaceDashboard = _.flow(
  Utils.forwardRefWithName('WorkspaceDashboard'),
  wrapWorkspace({
    breadcrumbs: () => breadcrumbs.commonPaths.workspaceList(),
    activeTab: 'dashboard'
  })
)(({
  namespace, name,
  refreshWorkspace,
  workspace, workspace: {
    accessLevel,
    owners,
    workspace: {
      authorizationDomain, createdDate, lastModified, bucketName, googleProject,
      attributes, attributes: { description = '' }
    }
  }
}, ref) => {
  // State
  const [submissionsCount, setSubmissionsCount] = useState(undefined)
  const [storageCostEstimate, setStorageCostEstimate] = useState(undefined)
  const [editDescription, setEditDescription] = useState(undefined)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [consentStatus, setConsentStatus] = useState(undefined)
  const [tagsList, setTagsList] = useState(undefined)
  const [bucketLocation, setBucketLocation] = useState(undefined)
  const [bucketLocationType, setBucketLocationType] = useState(undefined)

  const signal = Utils.useCancellation()

  const refresh = () => {
    loadSubmissionCount()
    loadStorageCost()
    loadConsent()
    loadWsTags()
    loadBucketLocation()
  }

  useImperativeHandle(ref, () => ({ refresh }))


  // Helpers
  const loadSubmissionCount = withErrorReporting('Error loading submission count data', async () => {
    const submissions = await Ajax(signal).Workspaces.workspace(namespace, name).listSubmissions()
    setSubmissionsCount(submissions.length)
  })

  const loadStorageCost = withErrorReporting('Error loading storage cost data', async () => {
    if (Utils.canWrite(accessLevel)) {
      const { estimate } = await Ajax(signal).Workspaces.workspace(namespace, name).storageCostEstimate()
      setStorageCostEstimate(estimate)
    }
  })

  const loadBucketLocation = withErrorReporting('Error loading bucket location data', async () => {
    const { location, locationType } = await Ajax(signal).Workspaces.workspace(namespace, name).checkBucketLocation(bucketName)
    setBucketLocation(location)
    setBucketLocationType(locationType)
  })

  const loadConsent = withErrorReporting('Error loading data', async () => {
    const orspId = attributes['library:orsp']
    if (orspId) {
      try {
        const { translatedUseRestriction } = await Ajax(signal).Duos.getConsent(orspId)
        setConsentStatus(translatedUseRestriction)
      } catch (error) {
        switch (error.status) {
          case 400:
            setConsentStatus(`Structured Data Use Limitations are not approved for ${orspId}`)
            break
          case 404:
            setConsentStatus(`Structured Data Use Limitations are not available for ${orspId}`)
            break
          default:
            throw error
        }
      }
    }
  })

  const loadWsTags = withErrorReporting('Error loading workspace tags', async () => {
    setTagsList(await Ajax(signal).Workspaces.workspace(namespace, name).getTags())
  })

  const addTag = _.flow(
    withErrorReporting('Error adding tag'),
    Utils.withBusyState(setBusy)
  )(async tag => {
    setTagsList(await Ajax().Workspaces.workspace(namespace, name).addTag(tag))
  })

  const deleteTag = _.flow(
    withErrorReporting('Error removing tag'),
    Utils.withBusyState(setBusy)
  )(async tag => {
    setTagsList(await Ajax().Workspaces.workspace(namespace, name).deleteTag(tag))
  })

  const save = Utils.withBusyState(setSaving, async () => {
    try {
      await Ajax().Workspaces.workspace(namespace, name).shallowMergeNewAttributes({ description: editDescription })
      await refreshWorkspace()
    } catch (error) {
      reportError('Error saving workspace', error)
    } finally {
      setEditDescription(undefined)
    }
  })


  // Lifecycle
  Utils.useOnMount(() => {
    refresh()
  })


  // Render
  const isEditing = _.isString(editDescription)
  const { flag, regionDescription } = regionInfo(bucketLocation, bucketLocationType)

  return div({ style: { flex: 1, display: 'flex' } }, [
    div({ style: Style.dashboard.leftBox }, [
      div({ style: Style.dashboard.header }, [
        'About the workspace',
        !isEditing && h(Link, {
          style: { marginLeft: '0.5rem' },
          disabled: !!Utils.editWorkspaceError(workspace),
          tooltip: Utils.editWorkspaceError(workspace),
          onClick: () => setEditDescription(description),
          'aria-label': 'Edit description'
        }, [icon('edit')])
      ]),
      Utils.cond(
        [
          isEditing, () => h(Fragment, [
            h(MarkdownEditor, {
              options: {
                autofocus: true,
                placeholder: 'Enter a description',
                renderingConfig: {
                  singleLineBreaks: false,
                  markedOptions: { sanitize: true, sanitizer: _.escape }
                },
                status: false
              },
              className: 'simplemde-container',
              value: editDescription,
              onChange: setEditDescription
            }),
            div({ style: { display: 'flex', justifyContent: 'flex-end', margin: '1rem' } }, [
              h(ButtonSecondary, { onClick: () => setEditDescription(undefined) }, 'Cancel'),
              h(ButtonPrimary, { style: { marginLeft: '1rem' }, onClick: save }, 'Save')
            ]),
            saving && spinnerOverlay
          ])
        ],
        [!!description, () => h(MarkdownViewer, [description])],
        () => div({ style: { fontStyle: 'italic' } }, ['No description added'])),
      _.some(_.startsWith('library:'), _.keys(attributes)) && h(Fragment, [
        div({ style: Style.dashboard.header }, ['Dataset Attributes']),
        h(SimpleTable, {
          rows: _.flow(
            _.map(({ key, title }) => ({ name: title, value: displayAttributeValue(attributes[key]) })),
            Utils.append({
              name: 'Structured Data Use Limitations',
              value: attributes['library:orsp'] ? consentStatus : h(DataUseLimitations, { attributes })
            }),
            _.filter('value')
          )(displayLibraryAttributes),
          columns: [
            { key: 'name', size: { grow: 1 } },
            { key: 'value', size: { grow: 2 } }
          ]
        })
      ])
    ]),
    div({ style: Style.dashboard.rightBox }, [
      div({ style: Style.dashboard.header }, ['Workspace information']),
      div({ style: { display: 'flex', flexWrap: 'wrap', margin: -4 } }, [
        h(InfoTile, { title: 'Creation date' }, [new Date(createdDate).toLocaleDateString()]),
        h(InfoTile, { title: 'Last updated' }, [new Date(lastModified).toLocaleDateString()]),
        h(InfoTile, { title: 'Submissions' }, [submissionsCount]),
        h(InfoTile, { title: 'Access level' }, [roleString[accessLevel]]),
        Utils.canWrite(accessLevel) && h(InfoTile, { title: 'Est. $/month' }, [
          storageCostEstimate || '$ ...'
        ]),
        h(InfoTile, { title: 'Google Project Id' }, [
          div({ style: { display: 'flex' } }, [
            h(TooltipCell, [googleProject]),
            h(ClipboardButton, { text: googleProject, style: { marginLeft: '0.25rem' } })
          ])
        ])
      ]),
      div({ style: Style.dashboard.header }, ['Owners']),
      _.map(email => {
        return div({ key: email, style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, [
          h(Link, { href: `mailto:${email}` }, [email])
        ])
      }, owners),
      div({ style: Style.dashboard.header }, [
        'Tags',
        h(InfoBox, { style: { marginLeft: '0.25rem' } }, [
          `${getAppName()} is not intended to host personally identifiable information. Do not use any patient identifier including name,
          social security number, or medical record number.`
        ]),
        (busy || !tagsList) && spinner({ size: '1rem', style: { marginLeft: '0.5rem' } })
      ]),
      Utils.canWrite(accessLevel) && div({ style: { marginBottom: '0.5rem' } }, [
        h(WorkspaceTagSelect, {
          value: null,
          placeholder: 'Add a tag',
          'aria-label': 'Add a tag',
          onChange: ({ value }) => addTag(value)
        })
      ]),
      div({ style: { display: 'flex', flexWrap: 'wrap', minHeight: '1.5rem' } }, [
        _.map(tag => {
          return span({ key: tag, style: styles.tag }, [
            tag,
            Utils.canWrite(accessLevel) && h(Link, {
              tooltip: 'Remove tag',
              'aria-label': 'Remove tag',
              disabled: busy,
              onClick: () => deleteTag(tag),
              style: { marginLeft: '0.25rem', verticalAlign: 'middle', display: 'inline-block' }
            }, [icon('times', { size: 14 })])
          ])
        }, tagsList),
        !!tagsList && tagsList.length === 0 && i(['No tags yet'])
      ]),
      !_.isEmpty(authorizationDomain) && h(Fragment, [
        div({ style: Style.dashboard.header }, ['Authorization Domain']),
        div({ style: { marginBottom: '0.5rem' } }, [
          'Collaborators must be a member of all of these ',
          h(Link, {
            href: Nav.getLink('groups'),
            ...Utils.newTabLinkProps
          }, 'groups'),
          ' to access this workspace.'
        ]),
        ..._.map(({ membersGroupName }) => div({ style: styles.authDomain }, [membersGroupName]), authorizationDomain)
      ]),
      div({ style: { margin: '1.5rem 0 1rem 0', borderBottom: `1px solid ${colors.dark(0.55)}` } }),
      div({ style: { fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' } }, [
        'Google Bucket'
      ]),
      div({ style: { marginBottom: '0.5rem', display: 'flex' } }, [
        div({ style: { marginRight: '0.5rem', fontWeight: 500 } }, ['Name:']),
        h(TooltipCell, { style: { marginRight: '0.5rem' } }, [bucketName]),
        h(ClipboardButton, { text: bucketName, style: { marginLeft: '0.25rem' } })
      ]),
      div({ style: { marginBottom: '0.5rem', display: 'flex' } }, [
        div({ style: { marginRight: '0.5rem', fontWeight: 500 } }, ['Location:']),
        bucketLocation ? h(Fragment, [
          div({ style: { marginRight: '0.5rem' } }, [flag]),
          regionDescription
        ]) : 'Loading...'
      ]),
      h(Link, {
        ...Utils.newTabLinkProps,
        href: bucketBrowserUrl(bucketName)
      }, ['Open in browser', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })])
    ])
  ])
})

export const navPaths = [
  {
    name: 'workspace-dashboard',
    path: '/workspaces/:namespace/:name',
    component: WorkspaceDashboard,
    title: ({ name }) => `${name} - Dashboard`
  }
]
