import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { CloudProviderIcon } from 'src/components/CloudProviderIcon'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import { InfoBox } from 'src/components/PopupTrigger'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import Events, { extractBillingDetails } from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import { isKnownCloudProvider } from 'src/libs/workspace-utils'
import { billingRoles } from 'src/pages/billing/billing-utils'
import { BillingProjectActions } from 'src/pages/billing/List/BillingProjectActions'
import { BillingProject } from 'src/pages/billing/models/BillingProject'


const styles = {
  projectListItem: (selected, hovered) => {
    const listItem = {
      ...Style.navList.itemContainer(selected),
      ...Style.navList.item(selected),
      ...(selected ? { backgroundColor: colors.dark(0.1) } : {}),
      paddingLeft: '2rem'
    }
    if (hovered) {
      return {
        ...listItem,
        ...Style.navList.itemHover(selected)
      }
    } else {
      return listItem
    }
  }
}

export interface ProjectListItemProps {
  project: BillingProject
  loadProjects: () => void
  isActive: boolean
  isCreating: boolean
  isDeleting: boolean
}

export const ProjectListItem = (props: ProjectListItemProps) => {
  const { projectName, roles, status, message, cloudPlatform } = props.project
  // Billing projects in an error status may have UNKNOWN for the cloudPlatform.
  const cloudContextIcon = isKnownCloudProvider(cloudPlatform) && span({ style: { marginRight: '0.5rem' } }, [
    h(CloudProviderIcon, { cloudProvider: cloudPlatform })
  ])

  const [hovered, setHovered] = useState<boolean>()


  const selectableProject = () => div({
    style: { ...styles.projectListItem(props.isActive, hovered) },
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false)
  }, [h(Clickable, {
    style: { color: props.isActive ? colors.accent(1.1) : colors.accent() },
    href: `${Nav.getLink('billing')}?${qs.stringify({ selectedName: projectName, type: 'project' })}`,
    onClick: () => Ajax().Metrics.captureEvent(Events.billingProjectOpenFromList, extractBillingDetails(props.project)),
    'aria-current': props.isActive ? 'location' : false
  }, [
    cloudContextIcon,
    span({ style: { wordBreak: 'break-all', verticalAlign: 'text-top' } }, [projectName])
  ]),
  isOwner && h(BillingProjectActions, { projectName: props.project.projectName, loadProjects: props.loadProjects })])

  const unselectableProject = () => {
    const isCreatingOrDeleting = props.isCreating || props.isDeleting

    const iconAndTooltip = h(Fragment, [
      isCreatingOrDeleting && h(Fragment, [
        icon('syncAlt', {
          size: 14,
          style: {
            color: props.isCreating ? colors.success() : colors.warning(),
            overflow: 'visible',
            animation: 'rotation 2s infinite linear',
            marginLeft: 'auto',
            marginRight: '0.25rem'
          }
        }),
        span({ style: { fontSize: 12, fontStyle: 'italic' } },
          [props.isCreating ? 'Creating' : 'Deleting']
        )
      ]),
      status === 'Error' && h(Fragment, [
        // @ts-ignore
        h(InfoBox, { style: { color: colors.danger(), marginLeft: '0.5rem' }, side: 'right' }, [
          div({ style: { wordWrap: 'break-word', whiteSpace: 'pre-wrap' } }, [
            message || 'Error during project creation.'
          ])
        ]),
        isOwner && h(BillingProjectActions, {
          projectName: props.project.projectName,
          loadProjects: props.loadProjects
        })
      ])
    ])

    return div({ style: { ...styles.projectListItem(props.isActive, false), color: colors.dark() } }, [
      cloudContextIcon,
      span({ style: { wordBreak: 'break-all', verticalAlign: 'text-top' } }, [projectName]), iconAndTooltip
    ])
  }

  const viewerRoles = _.intersection(roles, _.values(billingRoles))
  const isOwner = _.includes(billingRoles.owner, roles)

  return div({ role: 'listitem' }, [
    !_.isEmpty(viewerRoles) && status === 'Ready' ?
      selectableProject() :
      unselectableProject()
  ])
}
