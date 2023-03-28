import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary } from 'src/components/common'
import { cloudServices } from 'src/data/gce-machines'
import { formatUSD } from 'src/libs/utils'
import { cloudProviderTypes } from 'src/libs/workspace-utils'
import { azureRuntime, getAzureDisk, getDisk, getRuntimeConfig } from 'src/pages/workspaces/workspace/analysis/_testData/testData'
import { DeleteDiskChoices } from 'src/pages/workspaces/workspace/analysis/modals/DeleteDiskChoices'
import { DeleteEnvironment } from 'src/pages/workspaces/workspace/analysis/modals/DeleteEnvironment'
import { runtimeToolLabels } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'


const renderActionButton = () => h(ButtonPrimary, {}, ['Delete'])

describe('DeleteDiskChoices', () => {
  it.each([
    { cloudService: cloudProviderTypes.GCP },
    { cloudService: cloudServices.AZURE },
  ])('Should pass through all correct values', ({ cloudService }) => {
    // Arrange
    const pdCost = formatUSD(1.01)
    const deleteDiskSelected = false
    const setDeleteDiskSelected = jest.fn()

    // Act
    render(h(DeleteDiskChoices, {
      persistentDiskCostDisplay: pdCost,
      toolLabel: 'RStudio',
      cloudService,
      deleteDiskSelected,
      setDeleteDiskSelected
    }))

    // Assert
    screen.getByText('Keep persistent disk, delete application configuration and compute profile')
    screen.getByText('/home/rstudio')
    screen.getByText(`${pdCost} per month.`)
    screen.getByText('Delete everything, including persistent disk')
  })

  it('Should be able to toggle setDeleteDiskSelected when option pressed', async () => {
    // Arrange
    const pdCost = formatUSD(1.01)
    const deleteDiskSelected = false
    const setDeleteDiskSelected = jest.fn()

    // Act
    render(h(DeleteDiskChoices, {
      persistentDiskCostDisplay: pdCost,
      toolLabel: 'RStudio',
      cloudService: cloudProviderTypes.GCP,
      deleteDiskSelected,
      setDeleteDiskSelected
    }))
    const radio1 = screen.getByLabelText('Keep persistent disk, delete application configuration and compute profile')
    const radio2 = screen.getByLabelText('Delete everything, including persistent disk')
    await userEvent.click(radio2)

    // Assert
    expect(radio1).toBeChecked()
    expect(radio2).not.toBeChecked()
    expect(setDeleteDiskSelected).toBeCalledTimes(1)
    expect(setDeleteDiskSelected).toBeCalledWith(true)
  })

  it('Should show SaveFilesHelp differently for RStudio', () => {
    // Arrange
    const pdCost = formatUSD(1.01)
    const deleteDiskSelected = false
    const setDeleteDiskSelected = jest.fn()

    // Act
    render(h(DeleteDiskChoices, {
      persistentDiskCostDisplay: pdCost,
      toolLabel: 'RStudio',
      cloudService: cloudProviderTypes.GCP,
      deleteDiskSelected,
      setDeleteDiskSelected
    }))

    // Assert
    expect(screen.getByText('move them to the workspace bucket.')
      .closest('a'))
      .toHaveAttribute('aria-label', 'RStudio save help')
  })

  it('Should show SaveFilesHelp option for JupyterLab', () => {
    // Arrange
    const pdCost = formatUSD(1.01)
    const deleteDiskSelected = false
    const setDeleteDiskSelected = jest.fn()

    // Act
    render(h(DeleteDiskChoices, {
      persistentDiskCostDisplay: pdCost,
      toolLabel: 'JupyterLab',
      cloudService: cloudProviderTypes.GCP,
      deleteDiskSelected,
      setDeleteDiskSelected
    }))

    // Assert
    expect(screen.getByText('move them to the workspace bucket.')
      .closest('a'))
      .toHaveAttribute('aria-label', 'Save file help')
  })

  it('Should show SaveFilesHelp option for Azure', () => {
    // Arrange
    const pdCost = formatUSD(1.01)
    const deleteDiskSelected = false
    const setDeleteDiskSelected = jest.fn()

    // Act
    render(h(DeleteDiskChoices, {
      persistentDiskCostDisplay: pdCost,
      toolLabel: 'JupyterLab',
      cloudService: cloudServices.AZURE,
      deleteDiskSelected,
      setDeleteDiskSelected
    }))

    // Assert
    expect(screen.getByText('move them to the workspace bucket.')
      .closest('a'))
      .toHaveAttribute('href', 'https://support.terra.bio/hc/en-us/articles/12043575737883')
  })
})

describe('DeleteEnvironment', () => {
  it.each([
    runtimeToolLabels.RStudio,
    runtimeToolLabels.Jupyter,
    runtimeToolLabels.JupyterLab,
  ])('Should properly render when provided no disk/runtime with label %s', toolLabel => {
    // Arrange
    const setDeleteDiskSelected = jest.fn()
    const setViewMode = jest.fn()

    // Act
    render(h(DeleteEnvironment, {
      id: 'not-relevant',
      deleteDiskSelected: false,
      setDeleteDiskSelected,
      setViewMode,
      renderActionButton,
      hideCloseButton: false,
      onDismiss: () => {},
      toolLabel
    }))

    // Assert
    screen.getByText('Deleting your application configuration and cloud compute profile will also')
  })
  it.each([
    { disk: getDisk(), toolLabel: runtimeToolLabels.RStudio },
    { disk: getDisk(), toolLabel: runtimeToolLabels.Jupyter },
    { disk: getAzureDisk(), toolLabel: runtimeToolLabels.JupyterLab },
  ])('Should properly render when provided no runtime but a disk', ({ disk, toolLabel }) => {
    // Arrange
    const setDeleteDiskSelected = jest.fn()
    const setViewMode = jest.fn()

    // Act
    render(h(DeleteEnvironment, {
      id: 'not-relevant',
      deleteDiskSelected: false,
      persistentDisk: disk,
      setDeleteDiskSelected,
      setViewMode,
      renderActionButton,
      hideCloseButton: false,
      onDismiss: () => {},
      toolLabel
    }))

    // Assert
    screen.getByText('If you want to permanently save some files from the disk before deleting it, you will need to create a new cloud environment to access it.')
  })
  it('Should properly render when provided Azure config', () => {
    // Arrange
    const setDeleteDiskSelected = jest.fn()
    const setViewMode = jest.fn()
    const disk = getAzureDisk()
    const runtimeConfig = azureRuntime.runtimeConfig

    // Act
    render(h(DeleteEnvironment, {
      id: 'not-relevant',
      runtimeConfig,
      persistentDisk: disk,
      deleteDiskSelected: false,
      setDeleteDiskSelected,
      setViewMode,
      renderActionButton,
      hideCloseButton: false,
      onDismiss: () => {},
      toolLabel: 'JupyterLab'
    }))

    // Assert
    screen.getByText('Delete application configuration and cloud compute profile')
    screen.getByText('Delete persistent disk')
  })
  it.each([
    runtimeToolLabels.RStudio,
    runtimeToolLabels.JupyterLab,
  ])('Should properly render when provided a GCEWithPD config with label %s', toolLabel => {
    // Arrange
    const setDeleteDiskSelected = jest.fn()
    const setViewMode = jest.fn()
    const disk = getDisk()
    const runtimeConfig = getRuntimeConfig({ persistentDiskId: disk.id })

    // Act
    render(h(DeleteEnvironment, {
      id: 'not-relevant',
      runtimeConfig,
      persistentDisk: disk,
      deleteDiskSelected: false,
      setDeleteDiskSelected,
      setViewMode,
      renderActionButton,
      hideCloseButton: false,
      onDismiss: () => {},
      toolLabel
    }))

    // Assert
    screen.getByText('Keep persistent disk, delete application configuration and compute profile')
    screen.getByText(`/home/${toolLabel === 'RStudio' ? 'rstudio' : 'jupyter'}`)
    screen.getByText('Delete everything, including persistent disk')
  })
  it('Should properly render when provided a GCE config', () => {
    // Arrange
    const setDeleteDiskSelected = jest.fn()
    const setViewMode = jest.fn()
    const disk = getDisk()
    const runtimeConfig = getRuntimeConfig()

    // Act
    render(h(DeleteEnvironment, {
      id: 'not-relevant',
      runtimeConfig,
      persistentDisk: disk,
      deleteDiskSelected: false,
      setDeleteDiskSelected,
      setViewMode,
      renderActionButton,
      hideCloseButton: false,
      onDismiss: () => {},
      toolLabel: 'RStudio'
    }))

    // Assert
    screen.getByText('Delete application configuration and cloud compute profile')
    screen.getByText('Delete persistent disk')
  })
  it.each([
    runtimeToolLabels.RStudio,
    runtimeToolLabels.JupyterLab
  ])('Should properly render when provided GCE config that had matching PDID with label %s', toolLabel => {
    // Arrange
    const setDeleteDiskSelected = jest.fn()
    const setViewMode = jest.fn()
    const disk = getDisk()
    const runtimeConfig = getRuntimeConfig({ persistentDiskId: disk.id })
    if ('persistentDiskId' in runtimeConfig) runtimeConfig.persistentDiskId = disk.id

    // Act
    render(h(DeleteEnvironment, {
      id: 'not-relevant',
      runtimeConfig,
      persistentDisk: disk,
      deleteDiskSelected: false,
      setDeleteDiskSelected,
      setViewMode,
      renderActionButton,
      hideCloseButton: false,
      onDismiss: () => {},
      toolLabel,
      computeRegion: 'us-central1'
    }))

    // Assert

    screen.getByText('You will continue to incur persistent disk cost at')
    screen.getByText(`/home/${toolLabel === 'RStudio' ? 'rstudio' : 'jupyter'}`)
    screen.getByText('$2.00 per month.')
    screen.getByText('Also deletes your application configuration and cloud compute profile.')
  })
  it('Should properly render when provided Azure config that had matching PDID', () => {
    // Arrange
    const setDeleteDiskSelected = jest.fn()
    const setViewMode = jest.fn()
    const disk = getAzureDisk()
    const runtimeConfig = azureRuntime.runtimeConfig
    //this if statement is to satisfy typescript
    if ('persistentDiskId' in runtimeConfig) runtimeConfig.persistentDiskId = disk.id

    // Act
    render(h(DeleteEnvironment, {
      id: 'not-relevant',
      runtimeConfig,
      persistentDisk: disk,
      deleteDiskSelected: false,
      setDeleteDiskSelected,
      setViewMode,
      renderActionButton,
      hideCloseButton: false,
      onDismiss: () => {},
      toolLabel: 'JupyterLab'
    }))

    // Assert

    screen.getByText('You will continue to incur persistent disk cost at')
    screen.getByText('/home/jupyter')
    screen.getByText('$3.01 per month.')
    screen.getByText('Also deletes your application configuration and cloud compute profile.')
  })
})
