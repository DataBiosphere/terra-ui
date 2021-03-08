import _ from 'lodash/fp'
import { useReducer } from 'react'
import { Ajax } from 'src/libs/ajax'


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
  return useReducer((state, update) => {
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
          completedFiles: state.completedFiles.concat([update.file])
        }

      case 'error':
        return {
          ...state,
          errors: state.errors.concat([update.error])
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
}

export const uploadFiles = async ({ namespace, bucketName, prefix, files, status, setStatus, signal }) => {
  // Only one instance of this should be running at a time, so exit out if we're not the one
  if (status.active) {
    return
  }
  setStatus({ action: 'start', files })

  let aborted = false
  const old = signal.onabort
  signal.onabort = (...args) => {
    // Pass this out of the event listener so we can stop the loop
    aborted = true
    setStatus({ action: 'abort' })

    old && old(...args)
  }

  let i = 0
  for (const file of files) {
    if (aborted) {
      return
    }

    setStatus({ action: 'startFile', file, fileNum: i++ })
    try {
      await Ajax(signal).Buckets.upload(namespace, bucketName, prefix, file)
      if (aborted) {
        return
      }
      setStatus({ action: 'finishFile', file })
    } catch (error) {
      setStatus({ action: 'error', error })
    }
  }
  setStatus({ action: 'finish' })
}

export const friendlyFileSize = bytes => {
  const bins = [
    { pow: 5, fixed: 3, text: 'PB' },
    { pow: 4, fixed: 3, text: 'TB' },
    { pow: 3, fixed: 2, text: 'GB' },
    { pow: 2, fixed: 1, text: 'MB' },
    { pow: 1, fixed: 0, text: 'KB' }
  ]
  for (const bin of bins) {
    const pow = Math.pow(1024, bin.pow)
    if (bytes > pow) {
      return `${(bytes / pow).toFixed(bin.fixed)} ${bin.text}`
    }
  }
  return `${bytes} bytes`
}
