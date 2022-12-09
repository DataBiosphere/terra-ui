import filesize from 'filesize'
import { dd, div, dl, dt } from 'react-hyperscript-helpers'
import { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'


interface FileDetailsProps {
  file: FileBrowserFile
}

export const FileDetails = (props: FileDetailsProps) => {
  const { file } = props

  return div({
    style: {
    }
  }, [
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
    ])
  ])
}
