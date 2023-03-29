import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import { IComputeConfig } from 'src/pages/workspaces/workspace/analysis/modal-utils'
import {
  PersistentDiskControlProps, PersistentDiskSection,
  PersistentDiskType, PersistentDiskTypeProps
} from 'src/pages/workspaces/workspace/analysis/modals/persistent-disk-controls'
import {
  defaultDataprocMasterDiskSize,
  defaultDataprocWorkerDiskSize,
  defaultGcePersistentDiskSize,
  defaultPersistentDiskType,
} from 'src/pages/workspaces/workspace/analysis/utils/disk-utils'
import {
  defaultAutopauseThreshold,
  defaultComputeRegion,
  defaultComputeZone,
  defaultDataprocMachineType,
  defaultGpuType,
  defaultNumDataprocPreemptibleWorkers,
  defaultNumDataprocWorkers,
  defaultNumGpus,
  getDefaultMachineType,
} from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils'
import { runtimeToolLabels } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'


const defaultIComputeConfig: IComputeConfig = {
  persistentDiskSize: defaultGcePersistentDiskSize,
  persistentDiskType: defaultPersistentDiskType,
  masterMachineType: getDefaultMachineType(false, runtimeToolLabels.RStudio),
  masterDiskSize: defaultDataprocMasterDiskSize,
  numberOfWorkers: defaultNumDataprocWorkers,
  numberOfPreemptibleWorkers: defaultNumDataprocPreemptibleWorkers,
  workerMachineType: defaultDataprocMachineType,
  workerDiskSize: defaultDataprocWorkerDiskSize,
  componentGatewayEnabled: true,
  gpuEnabled: false,
  hasGpu: false,
  gpuType: defaultGpuType,
  numGpus: defaultNumGpus,
  autopauseThreshold: defaultAutopauseThreshold,
  computeRegion: defaultComputeRegion,
  computeZone: defaultComputeZone,
}

const updateComputeConfigMock = jest.fn()

const defaultPersistentDiskProps: PersistentDiskControlProps = {
  persistentDiskExists: true,
  computeConfig: defaultIComputeConfig,
  updateComputeConfig: updateComputeConfigMock,
  setViewMode: jest.fn(),
  cloudPlatform: 'GCP',
  handleLearnMoreAboutPersistentDisk: jest.fn()
}

const defaultPersistentDiskTypeProps: PersistentDiskTypeProps = {
  persistentDiskExists: true,
  computeConfig: defaultIComputeConfig,
  updateComputeConfig: updateComputeConfigMock,
}

describe('compute-modal-component', () => {
  describe('PersistentDiskType', () => {
    // Passing diskExists [true,false] to PersistentDiskType
    it('should be disabled when existing PD', () => {
      // Arrange
      render(h(PersistentDiskType, defaultPersistentDiskTypeProps))

      // Act
      const dType = screen.getByLabelText('Disk Type')

      // Assert
      expect(dType).toBeDisabled()
    })
    it('should not be disabled when no existing PD', () => {
      // Arrange
      render(h(PersistentDiskType, { ...defaultPersistentDiskTypeProps, persistentDiskExists: false }))

      // Act

      // Assert
      expect(screen.getByLabelText('Disk Type')).not.toBeDisabled()
    })

    // Ensuring updateComputeConfig gets called with proper value on change
    it('should call updateComputeConfig with proper value on change', async () => {
      // Arrange
      render(h(PersistentDiskType, { ...defaultPersistentDiskTypeProps, persistentDiskExists: false }))

      // Act
      const dTypeOld = screen.getByLabelText('Disk Type')
      await userEvent.click(dTypeOld)
      const dTypeNew = screen.getByText('Balanced')
      await userEvent.click(dTypeNew)

      // Assert
      expect(updateComputeConfigMock).toBeCalledWith('persistentDiskType', { displayName: 'Balanced', label: 'pd-balanced', regionToPricesName: 'monthlyBalancedDiskPrice' })
    })
  })

  describe('PersistentDiskSection', () => {
    // click learn more about persistent disk
    it('should render learn more about persistent disks', async () => {
      // Arrange
      const setViewModeMock = jest.fn()
      render(h(PersistentDiskSection, { ...defaultPersistentDiskProps, setViewMode: setViewModeMock }))

      // Act
      const link = screen.getByText('Learn more about persistent disks and where your disk is mounted.')
      await userEvent.click(link)

      // Assert
      expect(setViewModeMock).toHaveBeenCalledWith('aboutPersistentDisk')
    })

    it('should not show tooltip when no existing PD', async () => {
      // Arrange
      render(h(PersistentDiskSection, { ...defaultPersistentDiskProps, persistentDiskExists: false }))

      // Act
      const dType = screen.getByText('Disk Type')
      await userEvent.hover(dType)

      // Assert
      const tipText = screen.queryByText('You already have a persistent disk in this workspace. ')
      expect(tipText).toBeNull()
    })

    it('should show tooltip when existing PD', async () => {
      // Arrange
      render(h(PersistentDiskSection, defaultPersistentDiskProps))

      // Act
      const dType = screen.getByText('Disk Type')
      await userEvent.hover(dType)

      // Assert
      screen.getByText(/You already have a persistent disk in this workspace. /)
    })

    // Ensuring updateComputeConfig gets called with proper value on change
    it('should call updateComputeConfig with proper value on changing type', async () => {
      // Arrange
      render(h(PersistentDiskSection, { ...defaultPersistentDiskProps, persistentDiskExists: false }))

      // Act
      const dTypeOld = screen.getByLabelText('Disk Type')
      await userEvent.click(dTypeOld)
      const dTypeNew = screen.getByText('Balanced')
      await userEvent.click(dTypeNew)

      // Assert
      expect(updateComputeConfigMock).toBeCalledWith('persistentDiskType', { displayName: 'Balanced', label: 'pd-balanced', regionToPricesName: 'monthlyBalancedDiskPrice' })
    })

    it('should call updateComputeConfig with proper value on changing size', async () => {
      // Arrange
      render(h(PersistentDiskSection, { ...defaultPersistentDiskProps, persistentDiskExists: false }))

      // Act
      const sizeInput = screen.getByLabelText('Disk Size (GB)')
      await userEvent.clear(sizeInput)
      await userEvent.type(sizeInput, '70')

      // Assert
      expect(updateComputeConfigMock).toBeCalledWith('persistentDiskSize', 70)
    })
  })
})
