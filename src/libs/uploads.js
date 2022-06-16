import _ from 'lodash/fp'
import { useCallback, useReducer } from 'react'
import { Ajax } from 'src/libs/ajax'
import { useCancelable } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'


const init = () => {
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

export const useUploader = () => {
  const [state, dispatch] = useReducer((state, update) => {
    switch (update.action) {
      // Calculate how many files and how many bytes we are working with
      case 'start':
        return {
          ...init(),
          active: true,
          files: update.files,
          totalFiles: update.files.length,
          totalBytes: _.reduce((total, file) => total += file.size, 0, update.files)
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
          completedFiles: Utils.append(update.file, state.completedFiles)
        }

      case 'error':
        return {
          ...state,
          errors: Utils.append(update.error, state.errors)
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

  const uploadFiles = useCallback(async ({ googleProject, bucketName, prefix, files }) => {
    const uploadCancelled = new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject())
    })

    dispatch({ action: 'start', files })
    for (const [index, file] of Utils.toIndexPairs(files)) {
      try {
        signal.throwIfAborted()

        dispatch({ action: 'startFile', file, fileNum: index })
        // If the upload request is cancelled, the withCancellation wrapper in Ajax.js swallows the
        // AbortError and returns a Promise that never resolves. Thus, this Promise.race is needed
        // to avoid hanging indefinitely while awaiting a cancelled upload request.
        await Promise.race([
          Ajax(signal).Buckets.upload(googleProject, bucketName, prefix, file),
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
  }, [signal])

  return {
    uploadState: state,
    // Only one upload can be active at a time.
    uploadFiles: state.active ? _.noop : uploadFiles,
    cancelUpload: abort
  }
}
