import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import {
  PersistentDiskSection,
  PersistentDiskType,
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
import { toolLabels } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'


const defaultIComputeConfig = {
  selectedPersistentDiskSize: defaultGcePersistentDiskSize,
  selectedPersistentDiskType: defaultPersistentDiskType,
  masterMachineType: getDefaultMachineType(false, toolLabels.RStudio),
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

const updateComputeConfig = jest.fn()

const defaultPersistentDiskProps = {
  diskExists: true,
  computeConfig: defaultIComputeConfig,
  updateComputeConfig: () => updateComputeConfig, //we shouldn't be using curry, therefore we have to use this.
  handleLearnMoreAboutPersistentDisk: jest.fn(),
}

const defaultPersistentDiskTypeProps = {
  diskExists: true,
  computeConfig: defaultIComputeConfig,
  updateComputeConfig: () => updateComputeConfig,
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
      render(h(PersistentDiskType, { ...defaultPersistentDiskTypeProps, diskExists: false }))

      // Act

      // Assert
      expect(screen.getByLabelText('Disk Type')).not.toBeDisabled()
    })

    // Ensuring updateComputeConfig gets called with proper value on change
    it('should call updateComputeConfig with proper value on change', async () => {
      // Arrange
      render(h(PersistentDiskType, { ...defaultPersistentDiskTypeProps, diskExists: false }))

      // Act
      const dTypeOld = screen.getByLabelText('Disk Type')
      await userEvent.click(dTypeOld)
      const dTypeNew = screen.getByText('Balanced')
      await userEvent.click(dTypeNew)

      // Assert
      expect(updateComputeConfig).toBeCalledWith({ displayName: 'Balanced', label: 'pd-balanced', regionToPricesName: 'monthlyBalancedDiskPrice' })
    })
  })

  describe('PersistentDiskSection', () => {
    // click learn more about persistent disk
    it('should render learn more about persistent disks', async () => {
      // Arrange
      const fakepd = jest.fn()
      render(h(PersistentDiskSection, {
        ...defaultPersistentDiskProps,
        handleLearnMoreAboutPersistentDisk: fakepd
      }))

      // Act
      const link = screen.getByText(/Learn more about persistent disks/)
      await userEvent.click(link)

      // Assert
      expect(fakepd).toBeCalled()
    })

    it('should not show tooltip when no existing PD', async () => {
      // Arrange
      render(h(PersistentDiskSection, { ...defaultPersistentDiskProps, diskExists: false }))

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
    it('should call updateComputeConfig with proper value on change', async () => {
      // Arrange
      render(h(PersistentDiskSection, { ...defaultPersistentDiskProps, diskExists: false }))

      // Act
      const dTypeOld = screen.getByLabelText('Disk Type')
      await userEvent.click(dTypeOld)
      const dTypeNew = screen.getByText('Balanced')
      await userEvent.click(dTypeNew)

      // Assert
      expect(updateComputeConfig).toBeCalledWith({ displayName: 'Balanced', label: 'pd-balanced', regionToPricesName: 'monthlyBalancedDiskPrice' })
    })
  })
})
