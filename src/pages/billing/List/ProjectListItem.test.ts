import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { h } from 'react-hyperscript-helpers'
import { WorkspaceWrapper } from 'src/libs/workspace-utils'
import { ProjectListItem, ProjectListItemProps } from 'src/pages/billing/List/ProjectListItem'
import { BillingProject } from 'src/pages/billing/models/BillingProject'


type WorkspaceUtilsExports = typeof import('src/components/workspace-utils')
jest.mock('src/components/workspace-utils', (): WorkspaceUtilsExports => {
  return {
    ...jest.requireActual('src/components/workspace-utils'),
    useWorkspaces: jest.fn().mockReturnValue({
      workspaces: [{
        workspace: { namespace: 'aDifferentProject', name: 'testWorkspaces', workspaceId: '6771d2c8-cd58-47da-a54c-6cdafacc4175' },
        accessLevel: 'WRITER'
      }] as WorkspaceWrapper[],
      refresh: () => Promise.resolve(),
      loading: false,
    })
  }
})

// Mocking for using Nav.getLink
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getPath: jest.fn(() => '/test/'),
  getLink: jest.fn(() => '/')
}))

describe('ProjectListItem', () => {
  let billingProject: BillingProject
  let projectListItemProps: ProjectListItemProps
  let listRoot

  beforeEach(() => {
    document.body.innerHTML = ''
    listRoot = document.createElement('div')
    listRoot.setAttribute('role', 'list')

    billingProject = {
      cloudPlatform: 'GCP',
      projectName: 'testProject',
      invalidBillingAccount: false,
      roles: ['Owner'],
      status: 'Ready'
    }
    projectListItemProps = {
      project: billingProject,
      loadProjects: jest.fn(),
      isActive: true
    }
  })

  it('renders Delete button and link for active Ready Google workspace', async () => {
    // Act
    const result = render(h(ProjectListItem, projectListItemProps), { container: document.body.appendChild(listRoot) })

    // Assert
    screen.getByLabelText(`Delete billing project ${billingProject.projectName}`)
    screen.getByTitle('Google Cloud Platform')

    const linkElement = screen.getByRole('link')
    expect(linkElement).toHaveTextContent(new RegExp(billingProject.projectName))
    expect(linkElement.getAttribute('aria-current')).toBe('location')

    expect(await axe(result.container)).toHaveNoViolations()
  })

  it('renders Delete button and link for inactive Ready Azure workspace', async () => {
    // Arrange
    projectListItemProps.isActive = false
    projectListItemProps.project.cloudPlatform = 'AZURE'

    // Act
    const result = render(h(ProjectListItem, projectListItemProps), { container: document.body.appendChild(listRoot) })

    // Assert
    screen.getByLabelText(`Delete billing project ${billingProject.projectName}`)
    screen.getByTitle('Microsoft Azure')

    const linkElement = screen.getByRole('link')
    expect(linkElement).toHaveTextContent(new RegExp(billingProject.projectName))
    expect(linkElement.getAttribute('aria-current')).toBe('false')

    expect(await axe(result.container)).toHaveNoViolations()
  })

  it('does not render a cloud platform icon if platform is unknown', async () => {
    // Arrange
    projectListItemProps.isActive = false
    projectListItemProps.project.cloudPlatform = 'UNKNOWN'

    // Act
    const result = render(h(ProjectListItem, projectListItemProps), { container: document.body.appendChild(listRoot) })

    // Assert
    screen.getByLabelText(`Delete billing project ${billingProject.projectName}`)
    screen.getByRole('link')

    expect(screen.queryByTitle('Google Cloud Platform')).toBeNull()
    expect(screen.queryByTitle('Microsoft Azure')).toBeNull()

    expect(await axe(result.container)).toHaveNoViolations()
  })

  it('does not render Delete button or link for creating workspaces', async () => {
    // Arrange
    projectListItemProps.project.status = 'CreatingLandingZone'
    projectListItemProps.isActive = false

    // Act
    const result = render(h(ProjectListItem, projectListItemProps), { container: document.body.appendChild(listRoot) })

    // Assert
    screen.getByTitle('Google Cloud Platform')
    screen.getByText(billingProject.projectName)
    screen.getByText('Creating')

    expect(screen.queryByText(`Delete billing project ${billingProject.projectName}`)).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()

    expect(await axe(result.container)).toHaveNoViolations()
  })

  it('does not render Delete button or link for deleting workspaces', async () => {
    // Arrange
    projectListItemProps.project.status = 'Deleting'
    projectListItemProps.isActive = false

    // Act
    const result = render(h(ProjectListItem, projectListItemProps), { container: document.body.appendChild(listRoot) })

    // Assert
    screen.getByTitle('Google Cloud Platform')
    screen.getByText(billingProject.projectName)
    screen.getByText('Deleting')

    expect(screen.queryByText(`Delete billing project ${billingProject.projectName}`)).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()

    expect(await axe(result.container)).toHaveNoViolations()
  })

  it('renders Delete button and error message for errored billing project creation', async () => {
    // Arrange
    projectListItemProps.project.status = 'Error'
    projectListItemProps.project.message = 'Test error message'
    projectListItemProps.isActive = false

    // Act
    const result = render(h(ProjectListItem, projectListItemProps), { container: document.body.appendChild(listRoot) })

    // Assert
    screen.getByLabelText(`Delete billing project ${billingProject.projectName}`)
    screen.getByTitle('Google Cloud Platform')
    screen.getByText(billingProject.projectName)

    expect(screen.queryByRole('link')).toBeNull()

    const errorInfo = screen.getByLabelText('More info')
    await userEvent.click(errorInfo)
    screen.getByText('Test error message')

    expect(await axe(result.container)).toHaveNoViolations()
  })

  it('renders Delete button and error message for errored billing project deletion', async () => {
    // Arrange
    projectListItemProps.project.status = 'DeletionFailed'
    projectListItemProps.isActive = false

    // Act
    const result = render(h(ProjectListItem, projectListItemProps), { container: document.body.appendChild(listRoot) })

    // Assert
    screen.getByLabelText(`Delete billing project ${billingProject.projectName}`)
    screen.getByTitle('Google Cloud Platform')
    screen.getByText(billingProject.projectName)

    expect(screen.queryByRole('link')).toBeNull()

    const errorInfo = screen.getByLabelText('More info')
    await userEvent.click(errorInfo)
    screen.getByText('Error during billing project deletion.')

    expect(await axe(result.container)).toHaveNoViolations()
  })
})
