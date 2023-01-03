import filesize from 'filesize'
import { Fragment } from 'react'
import { dd, div, dl, dt, h } from 'react-hyperscript-helpers'
import { DownloadFileCommand } from 'src/components/file-browser/DownloadFileCommand'
import { DownloadFileLink } from 'src/components/file-browser/DownloadFileLink'
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'


interface FileDetailsProps {
  file: FileBrowserFile
  provider: FileBrowserProvider
}

export const FileDetails = (props: FileDetailsProps) => {
  const { file, provider } = props

  return h(Fragment, [
    dl([
      div({ style: { marginBottom: '0.5rem' } }, [
        dt({ style: { marginBottom: '0.25rem', fontWeight: 500 } }, ['Last modified']),
        dd({ style: { marginLeft: '0.5rem' } }, [new Date(file.updatedAt).toLocaleString()]),
      ]),
      div({ style: { marginBottom: '0.5rem' } }, [
        dt({ style: { marginBottom: '0.25rem', fontWeight: 500 } }, ['Created']),
        dd({ style: { marginLeft: '0.5rem' } }, [new Date(file.createdAt).toLocaleString()]),
      ]),
      div({ style: { marginBottom: '0.5rem' } }, [
        dt({ style: { marginBottom: '0.25rem', fontWeight: 500 } }, ['Size']),
        dd({ style: { marginLeft: '0.5rem' } }, [filesize(file.size)]),
      ]),
    ]),
    h(DownloadFileLink, { file, provider }),
    h(DownloadFileCommand, { file, provider }),
  ])
}
