import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import {
  PersistentDiskSection,
  PersistentDiskType,
} from 'src/pages/workspaces/workspace/analysis/modals/compute-modal-components'
import {
  defaultAutopauseThreshold,
  defaultComputeRegion,
  defaultComputeZone,
  defaultDataprocMachineType,
  defaultDataprocMasterDiskSize,
  defaultDataprocWorkerDiskSize,
  defaultGcePersistentDiskSize,
  defaultGpuType,
  defaultNumDataprocPreemptibleWorkers,
  defaultNumDataprocWorkers,
  defaultNumGpus,
  defaultPersistentDiskType,
  getDefaultMachineType,
} from 'src/pages/workspaces/workspace/analysis/runtime-utils'
import { toolLabels } from 'src/pages/workspaces/workspace/analysis/tool-utils'


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
  updateComputeConfig,
  handleLearnMoreAboutPersistentDisk: jest.fn(),
}

const defaultPersistentDiskTypeProps = {
  diskExists: true,
  computeConfig: defaultIComputeConfig,
  updateComputeConfig,
}

jest.mock('src/libs/notifications', () => ({
  notify: jest.fn((...args) => {
    console.debug("######################### notify"); /* eslint-disable-line */
    console.debug({ method: "notify", args: [...args] }); /* eslint-disable-line */
  }),
}))

describe('compute-modal-component', () => {
  describe('PersistentDiskType', () => {
    // Passing diskExists [true,false] to PersistentDiskType
    it('should be disabled when existing PD', async () => {
      // Act
      await render(h(PersistentDiskType, defaultPersistentDiskTypeProps))
      const dType = screen.getByLabelText('Disk Type')

      // Assert
      expect(dType).toBeDisabled()
    })
    it('should not be disabled when no existing PD', async () => {
      // Act
      await render(h(PersistentDiskType, { ...defaultPersistentDiskTypeProps, diskExists: false }))

      // Assert
      const dType = screen.getByLabelText('Disk Type')

      expect(dType).not.toBeDisabled()
    })

    // Ensuring updateComputeConfig gets called with proper value on change
    it('should call updateComputeConfig with proper value on change', async () => {
      // Act
      render(h(PersistentDiskType, { ...defaultPersistentDiskTypeProps, diskExists: false }))
      const dTypeOld = screen.getByLabelText('Disk Type')
      await userEvent.click(dTypeOld)
      const dTypeNew = screen.getByText('Balanced')
      await userEvent.click(dTypeNew)

      // Assert
      expect(updateComputeConfig).toBeCalledWith('selectedPersistentDiskType')
    })
  })

  describe('PersistentDiskSection', () => {
    // click learn more about persistent disk
    it('should render learn more about persistent disks', async () => {
      //arrange
      const fakepd = jest.fn()
      // Act
      await render(
        h(PersistentDiskSection, { ...defaultPersistentDiskProps, handleLearnMoreAboutPersistentDisk: fakepd })
      )
      const link = screen.getByText(/Learn more about persistent disks/)
      await userEvent.click(link)

      // Assert
      expect(fakepd).toBeCalled()
    })

    it('should not show tooltip when no existing PD', async () => {
      // Act
      await render(h(PersistentDiskSection, { ...defaultPersistentDiskProps, diskExists: false }))
      const dType = screen.getByText('Disk Type')
      await userEvent.hover(dType)

      // Assert
      const tipText = screen.queryByText('You already have a persistent disk in this workspace. ')
      expect(tipText).toBeNull()
    })

    it('should show tooltip when existing PD', async () => {
      // Act
      await render(h(PersistentDiskSection, defaultPersistentDiskProps))
      const dType = screen.getByText('Disk Type')
      await userEvent.hover(dType)

      // Assert
      screen.getByText(/You already have a persistent disk in this workspace. /)
    })

    // Ensuring updateComputeConfig gets called with proper value on change
    it('should call updateComputeConfig with proper value on change', async () => {
      // Act
      await render(h(PersistentDiskSection, { ...defaultPersistentDiskProps, diskExists: false }))
      const dTypeOld = screen.getByLabelText('Disk Type')
      await userEvent.click(dTypeOld)
      const dTypeNew = screen.getByText('Balanced')
      await userEvent.click(dTypeNew)

      // Assert
      expect(updateComputeConfig).toBeCalledWith('selectedPersistentDiskSize')
      expect(updateComputeConfig).toBeCalledWith('selectedPersistentDiskType')
    })
  })
})
