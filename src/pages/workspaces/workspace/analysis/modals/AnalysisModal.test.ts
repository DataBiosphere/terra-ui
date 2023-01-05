import '@testing-library/jest-dom'

import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import { GoogleStorage, GoogleStorageContract } from 'src/libs/ajax/GoogleStorage'
import {
  useAnalysisFiles
} from 'src/pages/workspaces/workspace/analysis/file-utils'
import { AppTool, tools } from 'src/pages/workspaces/workspace/analysis/tool-utils'
import { asMockedFn } from 'src/testing/test-utils'

import { defaultGoogleWorkspace, galaxyDisk, galaxyRunning, getGoogleRuntime } from '../_testData/testData'
import { AnalysisModal, AnalysisModalProps } from './AnalysisModal'


const defaultModalProps: AnalysisModalProps = {
  isOpen: true,
  workspace: defaultGoogleWorkspace,
  location: 'US',
  runtimes: [],
  apps: [] as AppTool[],
  appDataDisks: [],
  persistentDisks: [],
  onDismiss: () => {},
  onError: () => {},
  onSuccess: () => {},
  openUploader: () => {},
  uploadFiles: () => {},
  //TODO: Temporary until Analyses.js implements useAnalysisFiles
  refreshAnalyses: () => {}
}

jest.mock('src/libs/ajax/GoogleStorage')

jest.mock('src/libs/notifications', () => ({
  notify: jest.fn((...args) => {
    console.debug('######################### notify')/* eslint-disable-line */
    console.debug({ method: 'notify', args: [...args] })/* eslint-disable-line */
  })
}))

jest.mock('src/pages/workspaces/workspace/analysis/file-utils', () => {
  const originalModule = jest.requireActual('src/pages/workspaces/workspace/analysis/file-utils')
  return {
    ...originalModule,
    useAnalysisFiles: jest.fn()
  }
})

const createFunc = jest.fn()


describe('AnalysisModal', () => {
  beforeEach(() => {
    // Arrange
    asMockedFn(useAnalysisFiles).mockImplementation(() => ({
      refresh: () => Promise.resolve(),
      loadedState: { state: [], status: 'Ready' },
      create: createFunc,
      pendingCreate: false
    }))
  })

  it('renders correctly by default', () => {
    // Act
    render(h(AnalysisModal, defaultModalProps))
    // Assert
    screen.getByText('Select an application')
  })

  it.each([
    { app: 'Jupyter', buttonAltText: 'Create new notebook', expectedTitle: 'Create a new notebook' },
    { app: 'RStudio', buttonAltText: 'Create new R file', expectedTitle: 'Create a new R file' },
    { app: 'Galaxy', buttonAltText: 'Create new Galaxy app', expectedTitle: 'Galaxy Cloud Environment' }
  ])('renders correctly and selects $app when no apps or runtimes are present.', async ({ buttonAltText, expectedTitle }) => {
    // Arrange
    render(h(AnalysisModal, defaultModalProps))

    // Act
    const button = screen.getByAltText(buttonAltText)

    await userEvent.click(button)

    // Assert
    screen.getByText(expectedTitle)
  })

  it.each([
    { fileType: 'Python 3' },
    { fileType: 'R' },
  ])('Creates a new $fileType for Jupyter when no apps or runtimes are present and navigates to environment creation.', async ({ fileType }) => {
    // Arrange
    const createMock = jest.fn()
    const analysisMock: Partial<GoogleStorageContract['analysis']> = jest.fn(() => ({
      create: createMock
    }))
    const googleStorageMock: Partial<GoogleStorageContract> = ({
      analysis: analysisMock as GoogleStorageContract['analysis']
    })

    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)
    render(h(AnalysisModal, defaultModalProps))

    // Act
    await act(async () => {
      const button = screen.getByAltText('Create new notebook')

      await userEvent.click(button)

      const fileTypeSelect = await screen.getByLabelText('Language *')
      await userEvent.click(fileTypeSelect)

      const selectOption = await screen.findAllByText(fileType)
      await userEvent.click(selectOption[1])

      const nameInput = screen.getByLabelText('Name of the notebook *')
      await userEvent.type(nameInput, 'MyNewFile')

      const createButton = await screen.findByText('Create Analysis')
      await userEvent.click(createButton)
    })

    // Assert
    screen.getByText('Jupyter Cloud Environment')
    expect(createFunc).toHaveBeenCalled()
  })

  it('Creates a new file for Jupyter when a Jupyter runtime is present and does not navigate to cloud environment page.', async () => {
    // Arrange
    render(h(AnalysisModal, { ...defaultModalProps, runtimes: [getGoogleRuntime()] }))

    // Act
    await act(async () => {
      const button = screen.getByAltText('Create new notebook')

      await userEvent.click(button)

      const fileTypeSelect = await screen.getByLabelText('Language *')
      await userEvent.click(fileTypeSelect)

      const selectOption = await screen.findAllByText('Python 3')
      await userEvent.click(selectOption[1])

      const nameInput = screen.getByLabelText('Name of the notebook *')
      await userEvent.type(nameInput, 'MyNewFile')

      const createButton = await screen.findByText('Create Analysis')
      await userEvent.click(createButton)
    })

    // Assert
    expect(screen.queryByText('Jupyter Cloud Environment')).toBeNull()
    expect(createFunc).toHaveBeenCalled()
  })

  it.each([
    { fileType: 'R Markdown (.Rmd)' },
    { fileType: 'R Script (.R)' }
  ])('Creates a new $fileType for RStudio when no apps or runtimes are present and navigates to environment creation.', async ({ fileType }) => {
    // Arrange
    render(h(AnalysisModal, defaultModalProps))
    // Act
    await act(async () => {
      const button = screen.getByAltText('Create new R file')
      await userEvent.click(button)

      const fileTypeSelect = await screen.getByLabelText('File Type *')
      await userEvent.click(fileTypeSelect)

      const selectOption = await screen.findAllByText(fileType)
      await userEvent.click(selectOption[1])

      const nameInput = screen.getByLabelText('Name of the R file *')
      await userEvent.type(nameInput, 'MyNewFile')

      const createButton = await screen.getByText('Create Analysis')
      await userEvent.click(createButton)
    })

    // Assert
    screen.getByText('RStudio Cloud Environment')
    expect(createFunc).toHaveBeenCalled()
  })

  it('Creates a new file for RStudio when an RStudio runtime is present and does not navigate to cloud environment page.', async () => {
    // Arrange
    render(h(AnalysisModal, { ...defaultModalProps, runtimes: [getGoogleRuntime({ tool: tools.RStudio })] }))
    // Act
    await act(async () => {
      const button = screen.getByAltText('Create new R file')
      await userEvent.click(button)

      const nameInput = screen.getByLabelText('Name of the R file *')
      await userEvent.type(nameInput, 'MyNewFile')

      const createButton = await screen.getByText('Create Analysis')
      await userEvent.click(createButton)
    })

    // Assert
    expect(screen.queryByText('RStudio Cloud Environment')).toBeNull()
    expect(createFunc).toHaveBeenCalled()
  })

  it('Renders Galaxy Environment page when no runtime exists and Galaxy is selected.', async () => {
    // Arrange
    render(h(AnalysisModal, defaultModalProps))

    // Act
    await act(async () => {
      const button = screen.getByAltText('Create new Galaxy app')
      await userEvent.click(button)
    })

    screen.getByText('Galaxy Cloud Environment')
  })

  it('Renders disabled Galaxy button and tooltip when Galaxy app exists.', async () => {
    // Arrange
    render(h(AnalysisModal, { ...defaultModalProps, apps: [galaxyRunning], appDataDisks: [galaxyDisk] }))

    // Act
    const button = screen.getByAltText('Create new Galaxy app')
    await userEvent.hover(button)

    // Assert
    expect(await screen.queryAllByText('You already have a Galaxy environment').length).toBeGreaterThanOrEqual(2)
  })
})
