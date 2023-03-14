import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { CloudProviderIcon } from 'src/components/CloudProviderIcon'
import { Clickable } from 'src/components/common'
import { spinner } from 'src/components/icons'
import { InfoBox } from 'src/components/PopupTrigger'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import Events, { extractBillingDetails } from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import { isCloudProvider } from 'src/libs/workspace-utils'
import { billingRoles } from 'src/pages/billing/Billing'
import { BillingProjectActions } from 'src/pages/billing/List/BillingProjectActions'
import { BillingProject } from 'src/pages/billing/models/BillingProject'


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

interface ProjectListItemProps {
  project: BillingProject
  loadProjects: () => void
  isActive: boolean
  isCreatingStatus: boolean
}

export const ProjectListItem = (props: ProjectListItemProps) => {
  const { projectName, roles, status, message, cloudPlatform } = props.project
  // Billing projects in an error status may have UNKNOWN for the cloudPlatform.
  const cloudContextIcon = isCloudProvider(cloudPlatform) && div({ style: { display: 'flex', marginRight: '0.5rem' } }, [
    h(CloudProviderIcon, { cloudProvider: cloudPlatform })
  ])

  const selectableProject = () => h(Clickable, {
    style: { ...styles.projectListItem(props.isActive), color: props.isActive ? colors.accent(1.1) : colors.accent() },
    href: `${Nav.getLink('billing')}?${qs.stringify({ selectedName: projectName, type: 'project' })}`,
    onClick: () => Ajax().Metrics.captureEvent(Events.billingProjectOpenFromList, extractBillingDetails(props.project)),
    hover: Style.navList.itemHover(props.isActive),
    'aria-current': props.isActive ? 'location' : false
  }, [cloudContextIcon, projectName])

  const unselectableProject = () => {
    const iconAndTooltip =
      // @ts-ignore
      props.isCreatingStatus ? spinner({ size: 16, style: { color: colors.accent(), margin: '0 1rem 0 0.5rem' } }) :
        status === 'Error' ? h(Fragment, [
          // @ts-ignore
          h(InfoBox, { style: { color: colors.danger(), margin: '0 0.5rem 0 0.5rem' }, side: 'right' }, [
            div({ style: { wordWrap: 'break-word', whiteSpace: 'pre-wrap' } }, [
              message || 'Error during project creation.'
            ])
          ]),
          //Currently, only billing projects that failed to create can have actions performed on them.
          //If that changes in the future, this should be moved elsewhere
          isOwner && h(BillingProjectActions, { projectName: props.project.projectName, loadProjects: props.loadProjects })
        ]) : undefined

    return div({ style: { ...styles.projectListItem(props.isActive), color: colors.dark() } }, [
      cloudContextIcon, projectName, iconAndTooltip
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
