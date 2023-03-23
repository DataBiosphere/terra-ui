import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary } from 'src/components/common'
import { cloudServices } from 'src/data/gce-machines'
import { formatUSD } from 'src/libs/utils'
import { azureRuntime, getAzureDisk, getDisk, getJupyterRuntimeConfig } from 'src/pages/workspaces/workspace/analysis/_testData/testData'
import { DeleteDiskChoices, DeleteEnvironment } from 'src/pages/workspaces/workspace/analysis/modals/DeleteDiskChoices'


const renderActionButton = () => h(ButtonPrimary, {}, ['Delete'])

describe('compute-modal-component', () => {
  describe('DeleteDiskChoices', () => {
    it.each([
      { cloudService: cloudServices.GCE },
      { cloudService: cloudServices.AZURE },
    ])('Should pass through all correct values', ({ cloudService }) => {
      // Arrange
      const pdCost = formatUSD(1.01)
      const deleteDiskSelected = false
      const setDeleteDiskSelected = jest.fn()

      // Act
      render(h(DeleteDiskChoices, {
        persistentDiskCost: pdCost,
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
        persistentDiskCost: pdCost,
        toolLabel: 'RStudio',
        cloudService: cloudServices.GCE,
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

    it('Should show safefileshelp differently for rstudio', () => {
      // Arrange
      const pdCost = formatUSD(1.01)
      const deleteDiskSelected = false
      const setDeleteDiskSelected = jest.fn()

      // Act
      render(h(DeleteDiskChoices, {
        persistentDiskCost: pdCost,
        toolLabel: 'RStudio',
        cloudService: cloudServices.GCE,
        deleteDiskSelected,
        setDeleteDiskSelected
      }))

      // Assert
      expect(screen.getByText('move them to the workspace bucket.')
        .closest('a'))
        .toHaveAttribute('aria-label', 'RStudio save help')
    })

    it('Should show safefileshelp option for jupyter', () => {
      // Arrange
      const pdCost = formatUSD(1.01)
      const deleteDiskSelected = false
      const setDeleteDiskSelected = jest.fn()

      // Act
      render(h(DeleteDiskChoices, {
        persistentDiskCost: pdCost,
        toolLabel: 'Jupyter',
        cloudService: cloudServices.GCE,
        deleteDiskSelected,
        setDeleteDiskSelected
      }))

      // Assert
      expect(screen.getByText('move them to the workspace bucket.')
        .closest('a'))
        .toHaveAttribute('aria-label', 'Save file help')
    })

    it('Should show safefileshelp option for azure', () => {
      // Arrange
      const pdCost = formatUSD(1.01)
      const deleteDiskSelected = false
      const setDeleteDiskSelected = jest.fn()

      // Act
      render(h(DeleteDiskChoices, {
        persistentDiskCost: pdCost,
        toolLabel: 'Jupyter',
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
    it('Should properly render when provided no disk/runtime', () => {
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
        toolLabel: 'RStudio'
      }))

      // Assert
      screen.getByText('Deleting your application configuration and cloud compute profile will also')
    })
    it.each([
      { disk: getDisk() },
      { disk: getAzureDisk() },
    ])('Should properly render when provided no runtime but a disk', ({ disk }) => {
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
        toolLabel: 'RStudio'
      }))

      // Assert
      screen.getByText('If you want to permanently save some files from the disk before deleting it, you will need to create a new cloud environment to access it.')
    })
    it('Should properly render when provided azure config', () => {
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
        toolLabel: 'RStudio'
      }))

      // Assert
      screen.getByText('Delete application configuration and cloud compute profile')
      screen.getByText('Delete persistent disk')
    })
    it('Should properly render when provided a GCE config', () => {
      // Arrange
      const setDeleteDiskSelected = jest.fn()
      const setViewMode = jest.fn()
      const disk = getDisk()
      const runtimeConfig = getJupyterRuntimeConfig({ diskId: disk.id })

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

      screen.getByText('Keep persistent disk, delete application configuration and compute profile')
      screen.getByText('/home/rstudio')
      screen.getByText('Delete everything, including persistent disk')
    })
    it.each([
      { toolLabel: 'RStudio' },
      { toolLabel: 'Jupyter' }
    ])('Should properly render when provided GCE config that had matching PDID', ({ toolLabel }) => {
      // Arrange
      const setDeleteDiskSelected = jest.fn()
      const setViewMode = jest.fn()
      const disk = getDisk()
      const runtimeConfig = getJupyterRuntimeConfig({ diskId: disk.id })
      runtimeConfig.persistentDiskId = disk.id

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
      screen.getByText(`/home/${toolLabel.toLowerCase()}`)
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
        toolLabel: 'Jupyter'
      }))

      // Assert

      screen.getByText('You will continue to incur persistent disk cost at')
      screen.getByText('/home/jupyter')
      screen.getByText('$3.01 per month.')
      screen.getByText('Also deletes your application configuration and cloud compute profile.')
    })
  })
})
