import clipboard from 'clipboard-polyfill'
import 'easymde/dist/easymde.min.css'
import debouncePromise from 'debounce-promise'
import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import SimpleMDE from 'react-simplemde-editor'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, buttonSecondary, link, linkButton, spinnerOverlay } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { Markdown } from 'src/components/Markdown'
import { InfoBox } from 'src/components/PopupTrigger'
import { SimpleTable } from 'src/components/table'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { displayConsentCodes, displayLibraryAttributes } from 'src/data/workspace-attributes'
import { ajaxCaller } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import { getAppName } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'
import AsyncCreatableSelect from 'react-select/lib/AsyncCreatable'


const styles = {
  leftBox: {
    flex: 1, padding: '0 2rem 2rem 2rem'
  },
  rightBox: {
    flex: 'none', width: 350, backgroundColor: colors.light(0.4),
    padding: '0 1rem'
  },
  header: {
    ...Style.elements.sectionHeader, textTransform: 'uppercase',
    margin: '2.5rem 0 1rem 0', display: 'flex'
  },
  infoTile: {
    backgroundColor: colors.dark(0.15), color: 'black',
    width: 125, padding: 7, margin: 4
  },
  tinyCaps: {
    fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', color: colors.dark()
  },
  authDomain: {
    padding: '0.5rem 0.25rem', marginBottom: '0.25rem',
    backgroundColor: colors.dark(0.15),
    ...Style.noWrapEllipsis
  },
  label: {
    ...Style.elements.sectionHeader,
    marginTop: '1rem', marginBottom: '0.25rem'
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
  return div({ style: styles.infoTile }, [
    div({ style: styles.tinyCaps }, [title]),
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

export const WorkspaceDashboard = _.flow(
  wrapWorkspace({
    breadcrumbs: () => breadcrumbs.commonPaths.workspaceList(),
    activeTab: 'dashboard'
  }),
  ajaxCaller
)(class WorkspaceDashboard extends Component {
  constructor(props) {
    super(props)
    this.state = {
      submissionsCount: undefined,
      storageCostEstimate: undefined,
      editDescription: undefined,
      saving: false,
      busy: false
    }
  }

  async componentDidMount() {
    this.loadSubmissionCount()
    this.loadStorageCost()
    this.loadConsent()
    this.loadWsTags()
  }

  loadSubmissionCount = withErrorReporting('Error loading data', async () => {
    const { ajax: { Workspaces }, namespace, name } = this.props
    const submissions = await Workspaces.workspace(namespace, name).listSubmissions()
    this.setState({ submissionsCount: submissions.length })
  })

  loadStorageCost = withErrorReporting('Error loading data', async () => {
    const { ajax: { Workspaces }, namespace, name, workspace: { accessLevel } } = this.props
    if (Utils.canWrite(accessLevel)) {
      const { estimate } = await Workspaces.workspace(namespace, name).storageCostEstimate()
      this.setState({ storageCostEstimate: estimate })
    }
  })

  loadConsent = withErrorReporting('Error loading data', async () => {
    const { ajax: { Duos }, workspace: { workspace: { attributes } } } = this.props
    const orspId = attributes['library:orsp']
    if (orspId) {
      try {
        const { translatedUseRestriction } = await Duos.getConsent(orspId)
        this.setState({ consentStatus: translatedUseRestriction })
      } catch (error) {
        switch (error.status) {
          case 400:
            this.setState({ consentStatus: `Structured Data Use Limitations are not approved for ${orspId}` })
            break
          case 404:
            this.setState({ consentStatus: `Structured Data Use Limitations are not available for ${orspId}` })
            break
          default:
            throw error
        }
      }
    }
  })

  getTagSuggestions = debouncePromise(withErrorReporting('Error loading tags', async text => {
    const { ajax: { Workspaces } } = this.props
    if (text.length > 2) {
      return _.map(({ tag, count }) => {
        return { value: tag, label: `${tag} (${count})` }
      }, _.take(10, await Workspaces.getTags(text)))
    } else {
      return []
    }
  }), 250)

  loadWsTags = withErrorReporting('Error loading workspace tags', async () => {
    const { ajax: { Workspaces }, namespace, name } = this.props
    this.setState({ tagsList: await Workspaces.workspace(namespace, name).getTags() })
  })

  addTag = _.flow(
    withErrorReporting('Error adding tag'),
    Utils.withBusyState(v => this.setState({ busy: v }))
  )(async tag => {
    const { ajax: { Workspaces }, namespace, name } = this.props
    this.setState({ tagsList: await Workspaces.workspace(namespace, name).addTag(tag) })
  })

  deleteTag = _.flow(
    withErrorReporting('Error removing tag'),
    Utils.withBusyState(v => this.setState({ busy: v }))
  )(async tag => {
    const { ajax: { Workspaces }, namespace, name } = this.props
    this.setState({ tagsList: await Workspaces.workspace(namespace, name).deleteTag(tag) })
  })

  async save() {
    const { refreshWorkspace, workspace: { workspace: { namespace, name } }, ajax: { Workspaces } } = this.props
    const { editDescription: description } = this.state
    try {
      this.setState({ saving: true })
      await Workspaces.workspace(namespace, name).shallowMergeNewAttributes({ description })
      await refreshWorkspace()
    } catch (error) {
      reportError('Error saving workspace', error)
    } finally {
      this.setState({ editDescription: undefined, saving: false })
    }
  }

  render() {
    const {
      workspace, workspace: {
        accessLevel,
        hasBucketAccess,
        workspace: {
          authorizationDomain, createdDate, lastModified, bucketName,
          attributes, attributes: { description = '' }
        }
      }
    } = this.props
    const { submissionsCount, storageCostEstimate, editDescription, saving, consentStatus, tagsList, busy, bucketCopied } = this.state
    const isEditing = _.isString(editDescription)

    return div({ style: { flex: 1, display: 'flex' } }, [
      div({ style: styles.leftBox }, [
        div({ style: styles.header }, [
          'About the workspace',
          !isEditing && linkButton({
            style: { marginLeft: '0.5rem' },
            disabled: !!Utils.editWorkspaceError(workspace),
            tooltip: Utils.editWorkspaceError(workspace),
            onClick: () => this.setState({ editDescription: description })
          }, [icon('edit', { className: 'is-solid' })])
        ]),
        Utils.cond(
          [
            isEditing, () => h(Fragment, [
              h(SimpleMDE, {
                options: {
                  autofocus: true,
                  placeholder: 'Enter a description',
                  renderingConfig: {
                    singleLineBreaks: false
                  },
                  status: false
                },
                className: 'simplemde-container',
                value: editDescription,
                onChange: editDescription => this.setState({ editDescription })
              }),
              div({ style: { display: 'flex', justifyContent: 'flex-end', margin: '1rem' } }, [
                buttonSecondary({ onClick: () => this.setState({ editDescription: undefined }) }, 'Cancel'),
                buttonPrimary({ style: { marginLeft: '1rem' }, onClick: () => this.save() }, 'Save')
              ]),
              saving && spinnerOverlay
            ])
          ],
          [!!description, () => h(Markdown, [description])],
          () => div({ style: { fontStyle: 'italic' } }, ['No description added'])),
        _.some(_.startsWith('library:'), _.keys(attributes)) && h(Fragment, [
          div({ style: styles.header }, ['Dataset Attributes']),
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
      div({ style: styles.rightBox }, [
        div({ style: styles.header }, ['Workspace information']),
        div({ style: { display: 'flex', flexWrap: 'wrap', margin: -4 } }, [
          h(InfoTile, { title: 'Creation date' }, [new Date(createdDate).toLocaleDateString()]),
          h(InfoTile, { title: 'Last updated' }, [new Date(lastModified).toLocaleDateString()]),
          h(InfoTile, { title: 'Submissions' }, [submissionsCount]),
          h(InfoTile, { title: 'Access level' }, [roleString[accessLevel]]),
          Utils.canWrite(accessLevel) && h(InfoTile, { title: 'Est. $/month' }, [
            storageCostEstimate
          ])
        ]),
        div({ style: styles.header }, [
          'Tags',
          h(InfoBox, { style: { margin: '-0.1rem 0 0 0.25rem' } }, [
            `${getAppName()} is not intended to host personally identifiable information. Do not use any patient identifier including name,
          social security number, or medical record number.`
          ])
        ]),
        div({ style: { marginBottom: '0.5rem' } }, [
          h(AsyncCreatableSelect, {
            value: null,
            noOptionsMessage: () => 'Enter at least 3 characters to search',
            allowCreateWhileLoading: true,
            placeholder: 'Add a tag',
            onChange: ({ value }) => this.addTag(value),
            styles: { option: base => ({ ...base, wordWrap: 'break-word' }) },
            loadOptions: this.getTagSuggestions
          })
        ]),
        div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
          _.map(tag => {
            return span({ key: tag, style: styles.tag }, [
              tag,
              linkButton({
                tooltip: 'Remove tag',
                onClick: () => this.deleteTag(tag),
                style: { marginLeft: '0.25rem' }
              }, [icon('times', { size: 18 })])
            ])
          }, tagsList),
          busy && spinner({ style: { marginTop: '0.5rem' } })
        ]),
        !_.isEmpty(authorizationDomain) && h(Fragment, [
          div({ style: styles.header }, ['Authorization Domain']),
          div({ style: { marginBottom: '0.5rem' } }, [
            'Collaborators must be a member of all of these ',
            link({
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
        div({ style: { display: 'flex' } }, [
          div({ style: Style.noWrapEllipsis  }, [bucketName]),
          linkButton({
            style: { margin: '0 0.5rem', flexShrink: 0 },
            tooltip: 'Copy bucket name',
            onClick: withErrorReporting('Error copying to clipboard', async () => {
              await clipboard.writeText(bucketName)
              this.setState({ bucketCopied: true }, () => {
                setTimeout(() => this.setState({ bucketCopied: undefined }), 1500)
              })
            })
          }, [icon(bucketCopied ? 'check' : 'copy-to-clipboard')])
        ]),
        link({
          ...Utils.newTabLinkProps,
          href: hasBucketAccess ? bucketBrowserUrl(bucketName) : undefined,
          disabled: !hasBucketAccess
        }, ['Open in browser', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })])
      ])
    ])
  }
})

export const navPaths = [
  {
    name: 'workspace-dashboard',
    path: '/workspaces/:namespace/:name',
    component: WorkspaceDashboard,
    title: ({ name }) => `${name} - Dashboard`
  }
]
