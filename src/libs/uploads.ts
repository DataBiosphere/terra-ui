import { Reducer, useCallback, useReducer } from 'react'
import { useCancelable } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'


export type UploadState = {
  active: boolean
  totalFiles: number
  totalBytes: number
  uploadedBytes: number
  currentFileNum: number
  currentFile: File | null
  files: File[]
  completedFiles: File[]
  errors: unknown[]
  aborted: boolean
  done: boolean
}

const init = (): UploadState => {
  return {
    active: false,
    totalFiles: 0,
    totalBytes: 0,
    uploadedBytes: 0,
    currentFileNum: 0,
    currentFile: null,
    files: [],
    completedFiles: [],
    errors: [],
    aborted: false,
    done: false
  }
}

type UploadUpdateStart = {
  action: 'start'
  files: File[]
}

type UploadUpdateStartFile = {
  action: 'startFile'
  file: File
  fileNum: number
}

type UploadUpdateFinishFile = {
  action: 'finishFile'
  file: File
}

type UploadUpdateError = {
  action: 'error'
  error: unknown
}

type UploadUpdateAbort = {
  action: 'abort'
}

type UploadUpdateFinish = {
  action: 'finish'
}

type UploadUpdate =
  | UploadUpdateStart
  | UploadUpdateStartFile
  | UploadUpdateFinishFile
  | UploadUpdateError
  | UploadUpdateAbort
  | UploadUpdateFinish

export type UseUploaderResult = {
  uploadState: UploadState
  uploadFiles: (files: File[]) => Promise<void>
  cancelUpload: () => void
}

export const useUploader = (uploadFile: (file: File, opts: { signal: AbortSignal }) => Promise<void>): UseUploaderResult => {
  const [state, dispatch] = useReducer<Reducer<UploadState, UploadUpdate>, null>((state, update) => {
    switch (update.action) {
      // Calculate how many files and how many bytes we are working with
      case 'start':
        return {
          ...init(),
          active: true,
          files: update.files,
          totalFiles: update.files.length,
          totalBytes: update.files.reduce((total, file) => total + file.size, 0),
        }

      case 'startFile':
        return {
          ...state,
          currentFile: update.file,
          currentFileNum: update.fileNum
        }

      case 'finishFile':
        return {
          ...state,
          uploadedBytes: state.uploadedBytes + update.file.size,
          completedFiles: [...state.completedFiles, update.file]
        }

      case 'error':
        return {
          ...state,
          errors: [...state.errors, update.error]
        }

      case 'abort':
        return {
          ...state,
          active: false,
          aborted: true
        }

      case 'finish':
        return {
          ...state,
          active: false,
          done: true
        }
      default:
        return { ...state }
    }
  }, null, init)

  const { signal, abort } = useCancelable()

  const uploadFiles = useCallback(async (files: File[]) => {
    const uploadCancelled = new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject())
    })

    dispatch({ action: 'start', files })
    for (const [index, file] of Utils.toIndexPairs(files)) {
      try {
        if (signal.aborted) {
          throw signal.reason
        }

        dispatch({ action: 'startFile', file, fileNum: index })
        // If the upload request is cancelled, the withCancellation wrapper in Ajax.js swallows the
        // AbortError and returns a Promise that never resolves. Thus, this Promise.race is needed
        // to avoid hanging indefinitely while awaiting a cancelled upload request.
        await Promise.race([
          uploadFile(file, { signal }),
          uploadCancelled
        ])
        dispatch({ action: 'finishFile', file })
      } catch (error) {
        if (signal.aborted) {
          dispatch({ action: 'abort' })
          break
        } else {
          dispatch({ action: 'error', error })
        }
      }
    }
    if (!signal.aborted) {
      dispatch({ action: 'finish' })
    }

    // useCancelable will call abort when unmounted. After files are uploaded,
    // we no longer care about that method of cancellation. Catch here to
    // avoid an unhandled promise rejection.
    uploadCancelled.catch(() => {})
  }, [signal, uploadFile])

  return {
    uploadState: state,
    // Only one upload can be active at a time.
    uploadFiles: state.active ? () => { throw Error('Upload in progress') } : uploadFiles,
    cancelUpload: abort
  }
}
