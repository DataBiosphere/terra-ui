import '@testing-library/jest-dom'

import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import { GoogleStorage, GoogleStorageContract } from 'src/libs/ajax/GoogleStorage'
import { reportError } from 'src/libs/error'
import { defaultAzureWorkspace, defaultGoogleWorkspace, galaxyDisk, galaxyRunning, getGoogleRuntime, imageDocs } from 'src/pages/workspaces/workspace/analysis/_testData/testData'
import {
  AbsolutePath
} from 'src/pages/workspaces/workspace/analysis/file-utils'
import { AppTool, tools } from 'src/pages/workspaces/workspace/analysis/tool-utils'
import { getFileFromPath } from 'src/pages/workspaces/workspace/analysis/useAnalysisFiles'
import { asMockedFn } from 'src/testing/test-utils'

import { AnalysisModal, AnalysisModalProps } from './AnalysisModal'


const createFunc = jest.fn()
const defaultGcpModalProps: AnalysisModalProps = {
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
  analysisFileStore: {
    refreshFileStore: () => Promise.resolve(),
    loadedState: { state: [], status: 'Ready' },
    create: createFunc,
    pendingCreate: { status: 'Ready', state: true },
    pendingDelete: { status: 'Ready', state: true },
    deleteFile: () => Promise.resolve()
  }
}

const defaultAzureModalProps: AnalysisModalProps = {
  ...defaultGcpModalProps,
  workspace: defaultAzureWorkspace
}

jest.mock('src/libs/ajax/GoogleStorage')
jest.mock('src/libs/ajax')

jest.mock('src/libs/error', () => ({
  ...jest.requireActual('src/libs/error'),
  reportError: jest.fn(),
}))

jest.mock('src/libs/notifications', () => ({
  notify: jest.fn()
}))

type FileUtilsExports = typeof import('src/pages/workspaces/workspace/analysis/file-utils')
jest.mock('src/pages/workspaces/workspace/analysis/file-utils', (): FileUtilsExports => {
  const originalModule = jest.requireActual('src/pages/workspaces/workspace/analysis/file-utils')
  return {
    ...originalModule,
    getExtension: jest.fn()
  }
})


type AjaxContract = ReturnType<typeof Ajax>

describe('AnalysisModal', () => {
  beforeEach(() => {
    asMockedFn(Ajax).mockImplementation(() => ({
      Buckets: {
        getObjectPreview: () => Promise.resolve({ json: () => Promise.resolve(imageDocs) }),
      } as Partial<AjaxContract['Buckets']>,
      Metrics: { captureEvent: jest.fn() } as Partial<AjaxContract['Metrics']>,
    }) as Partial<AjaxContract> as AjaxContract)
  })

  it('GCP - Renders correctly by default', () => {
    // Act
    render(h(AnalysisModal, defaultGcpModalProps))
    // Assert
    screen.getByText('Select an application')
    screen.getByAltText('Create new notebook')
    screen.getByAltText('Create new R file')
    screen.getByAltText('Create new Galaxy app')
  })

  it('GCP - Successfully resets view.', async () => {
    // Arrange
    const user = userEvent.setup()
    render(h(AnalysisModal, defaultGcpModalProps))

    // Act
    const button = screen.getByAltText('Create new notebook')

    await user.click(button)
    screen.getByText('Create a new notebook')

    const backButton = screen.getByLabelText('Back')
    await user.click(backButton)

    // Assert
    screen.getByText('Select an application')
  })

  it.each([
    { app: 'Jupyter', buttonAltText: 'Create new notebook', expectedTitle: 'Create a new notebook' },
    { app: 'RStudio', buttonAltText: 'Create new R file', expectedTitle: 'Create a new R file' },
    { app: 'Galaxy', buttonAltText: 'Create new Galaxy app', expectedTitle: 'Galaxy Cloud Environment' }
  ])('GCP - Renders correctly and selects $app when no apps or runtimes are present.', async ({ buttonAltText, expectedTitle }) => {
    // Arrange
    const user = userEvent.setup()
    render(h(AnalysisModal, defaultGcpModalProps))

    // Act
    const button = screen.getByAltText(buttonAltText)

    await user.click(button)

    // Assert
    screen.getByText(expectedTitle)
  })

  it.each([
    { fileType: 'Python 3' },
    { fileType: 'R' },
  ])('GCP - Creates a new $fileType for Jupyter when no apps or runtimes are present and opens environment creation modal.', async ({ fileType }) => {
    // Arrange
    const createMock = jest.fn()
    const analysisMock: Partial<GoogleStorageContract['analysis']> = jest.fn(() => ({
      create: createMock
    }))
    const googleStorageMock: Partial<GoogleStorageContract> = ({
      analysis: analysisMock as GoogleStorageContract['analysis']
    })

    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)
    const user = userEvent.setup()
    render(h(AnalysisModal, defaultGcpModalProps))

    // Act
    const button = screen.getByAltText('Create new notebook')
    await user.click(button)

    const fileTypeSelect = await screen.getByLabelText('Language *')
    await user.click(fileTypeSelect)

    const selectOption = await screen.findAllByText(fileType)
    await user.click(selectOption[1])

    const nameInput = screen.getByLabelText('Name of the notebook *')
    await userEvent.type(nameInput, 'MyNewFile')

    const createButton = await screen.findByText('Create Analysis')
    await act(async () => {
      await user.click(createButton)
    })

    // Assert
    screen.getByText('Jupyter Cloud Environment')
    expect(createFunc).toHaveBeenCalled()
  })

  it('GCP - Creates a new file for Jupyter when a Jupyter runtime is present and does not navigate to cloud environment page.', async () => {
    // Arrange
    const user = userEvent.setup()
    render(h(AnalysisModal, { ...defaultGcpModalProps, runtimes: [getGoogleRuntime()] }))

    // Act
    const button = screen.getByAltText('Create new notebook')
    await user.click(button)

    const fileTypeSelect = await screen.getByLabelText('Language *')
    await user.click(fileTypeSelect)

    const selectOption = await screen.findAllByText('Python 3')
    await user.click(selectOption[1])

    const nameInput = screen.getByLabelText('Name of the notebook *')
    await userEvent.type(nameInput, 'MyNewFile')

    const createButton = await screen.findByText('Create Analysis')
    await act(async () => {
      await user.click(createButton)
    })

    // Assert
    expect(screen.queryByText('Jupyter Cloud Environment')).toBeNull()
    expect(createFunc).toHaveBeenCalled()
  })

  it.each([
    { fileType: 'R Markdown (.Rmd)' },
    { fileType: 'R Script (.R)' }
  ])('GCP - Creates a new $fileType for RStudio when no apps or runtimes are present and opens environment creation modal.', async ({ fileType }) => {
    // Arrange
    const user = userEvent.setup()
    render(h(AnalysisModal, defaultGcpModalProps))

    // Act
    const button = screen.getByAltText('Create new R file')
    await user.click(button)

    const fileTypeSelect = await screen.getByLabelText('File Type *')
    await user.click(fileTypeSelect)

    const selectOption = await screen.findAllByText(fileType)
    await user.click(selectOption[1])

    const nameInput = screen.getByLabelText('Name of the R file *')
    await userEvent.type(nameInput, 'MyNewFile')

    const createButton = await screen.getByText('Create Analysis')


    await act(async () => {
      await user.click(createButton)
    })

    // Assert
    screen.getByText('RStudio Cloud Environment')
    expect(createFunc).toHaveBeenCalled()
  })

  it('GCP - Creates a new file for RStudio when an RStudio runtime is present and does not navigate to cloud environment page.', async () => {
    // Arrange
    const user = userEvent.setup()
    render(h(AnalysisModal, { ...defaultGcpModalProps, runtimes: [getGoogleRuntime({ tool: tools.RStudio })] }))

    // Act
    const button = screen.getByAltText('Create new R file')
    await user.click(button)

    const nameInput = screen.getByLabelText('Name of the R file *')
    await userEvent.type(nameInput, 'MyNewFile')

    const createButton = await screen.getByText('Create Analysis')

    await act(async () => {
      await user.click(createButton)
    })

    // Assert
    expect(screen.queryByText('RStudio Cloud Environment')).toBeNull()
    expect(createFunc).toHaveBeenCalled()
  })

  it('GCP - Renders Galaxy Environment page when no runtime exists and Galaxy is selected.', async () => {
    // Arrange
    const user = userEvent.setup()
    render(h(AnalysisModal, defaultGcpModalProps))

    // Act
    await act(async () => {
      const button = screen.getByAltText('Create new Galaxy app')
      await user.click(button)
    })

    screen.getByText('Galaxy Cloud Environment')
  })

  it('GCP - Renders disabled Galaxy button and tooltip when Galaxy app exists.', async () => {
    // Arrange
    const user = userEvent.setup()
    render(h(AnalysisModal, { ...defaultGcpModalProps, apps: [galaxyRunning], appDataDisks: [galaxyDisk] }))

    // Act
    const button = screen.getByAltText('Create new Galaxy app')
    await user.hover(button)

    // Assert
    expect(await screen.queryAllByText('You already have a Galaxy environment').length).toBeGreaterThanOrEqual(2)
  })

  it('Azure - Renders correctly by default', () => {
    // Act
    render(h(AnalysisModal, defaultAzureModalProps))
    // Assert
    screen.getByText('Select an application')
    screen.getByAltText('Create new notebook')
    expect(screen.queryByAltText('Create new R file')).toBeNull()
    expect(screen.queryByAltText('Create new Galaxy app')).toBeNull()
  })

  it('Azure - Successfully resets view.', async () => {
    // Act
    const user = userEvent.setup()
    render(h(AnalysisModal, defaultAzureModalProps))

    // Act
    const button = screen.getByAltText('Create new notebook')

    await user.click(button)
    screen.getByText('Create a new notebook')

    const backButton = screen.getByLabelText('Back')
    await user.click(backButton)

    // Assert
    screen.getByText('Select an application')
  })

  it.each([
    { fileType: 'Python 3' },
    { fileType: 'R' },
  ])('Azure - Creates a new $fileType for Jupyter when no runtimes are present and opens environment creation modal.', async ({ fileType }) => {
    // Arrange
    const user = userEvent.setup()
    render(h(AnalysisModal, defaultAzureModalProps))

    // Act
    await act(async () => {
      const button = screen.getByAltText('Create new notebook')
      await user.click(button)

      const fileTypeSelect = await screen.getByLabelText('Language *')
      await user.click(fileTypeSelect)

      const selectOption = await screen.findAllByText(fileType)
      await user.click(selectOption[1])

      const nameInput = screen.getByLabelText('Name of the notebook *')
      await userEvent.type(nameInput, 'MyNewFile')

      const createButton = await screen.findByText('Create Analysis')
      await user.click(createButton)
    })

    // Assert
    screen.getByText('Azure Cloud Environment')
    expect(createFunc).toHaveBeenCalled()
  })

  it('Attempts to create a file with a name that already exists', async () => {
    // Arrange
    const fileList = [getFileFromPath('test/file1.ipynb' as AbsolutePath), getFileFromPath('test/file2.ipynb' as AbsolutePath)]
    const mockFileStore = {
      loadedState: { state: fileList, status: 'Ready' },
      refreshFileStore: () => Promise.resolve(),
      create: () => Promise.resolve(),
      pendingCreate: { status: 'Ready', state: true },
      pendingDelete: { status: 'Ready', state: true },
      deleteFile: () => Promise.resolve()
    }

    const user = userEvent.setup()
    render(h(AnalysisModal, {
      ...defaultGcpModalProps,
      analysisFileStore: mockFileStore
    }))

    // Act
    await act(async () => {
      const button = screen.getByAltText('Create new notebook')
      await user.click(button)

      const nameInput = screen.getByLabelText('Name of the notebook *')
      await userEvent.type(nameInput, fileList[0].displayName)
    })

    // Assert
    expect(await screen.queryAllByText('Analysis name already exists').length).toBeGreaterThanOrEqual(2)
  })

  it('Error on create', async () => {
    // Arrange
    const fileList = [getFileFromPath('test/file1.ipynb' as AbsolutePath)]
    const createMock = jest.fn().mockRejectedValue(new Error('MyTestError'))
    const mockFileStore = {
      loadedState: { state: fileList, status: 'Ready' },
      refreshFileStore: () => Promise.resolve(),
      create: createMock,
      pendingCreate: { status: 'Ready', state: true },
      pendingDelete: { status: 'Ready', state: true },
      deleteFile: () => Promise.resolve()
    }
    const user = userEvent.setup()

    render(h(AnalysisModal, {
      ...defaultGcpModalProps,
      analysisFileStore: mockFileStore
    }))

    // Act
    await act(async () => {
      const button = screen.getByAltText('Create new notebook')
      await user.click(button)

      const nameInput = screen.getByLabelText('Name of the notebook *')
      await userEvent.type(nameInput, 'My New Notebook')

      const createButton = await screen.findByText('Create Analysis')
      await user.click(createButton)
    })

    // Assert
    expect(createMock).toHaveBeenCalled()
    expect(reportError).toHaveBeenCalled()
  })
})
