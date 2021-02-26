import _ from 'lodash/fp'
import { h, div, p, dl, dt, dd, strong } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import colors from 'src/libs/colors'
import { friendlyFileSize } from 'src/libs/uploads'


export const ProgressBar = ({ max, now }) => {
  return div({
    style: {
      display: 'flex',
      flexFlow: 'row wrap',
      width: '100%',
      height: '2rem',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      marginBottom: '0.5rem'
    }
  }, [
    div({
      style: {
        flex: '1 1 auto',
        height: '100%',
        backgroundColor: colors.light(),
        borderRadius: 5,
      },
      role: 'progressbar',
      'aria-disabled': max === 0,
      'aria-valuemin': 0,
      'aria-valuemax': max,
      'aria-valuenow': now,
    }, [
      max > 0 && now < max && div({
        style: {
          minWidth: '1rem',
          width: (now / max * 100) + '%',
          height: '100%',
          backgroundColor: colors.primary(0.75),
          borderRadius: 'inherit',
          textAlign: 'right',
          transition: 'width 0.4s ease-in-out'
        },
        className: [ 'progress-bar-striped', 'progress-bar-animated' ]
      })
    ])
  ])
}

export const UploadProgressModal = ({ status: { totalFiles, totalBytes, uploadedBytes, currentFileNum, currentFile }, abort }) => {
  return h(Modal, {
    title: 'Upload in Progress...',
    showCancel: false,
    onDismiss: abort,
    okButton: 'Abort Upload',
    danger: true
  }, [
    p({}, [
      'Uploading file ',
      strong([currentFileNum + 1, ' of ', totalFiles])
    ]),
    dl([
      dt(['Currently uploading:']),
      dd({
        style: { margin: '0.5rem 0', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }
      },[currentFile.name])
    ]),
    h(ProgressBar, {
      max: totalBytes,
      now: uploadedBytes
    }),
    p({}, [
      'Transferred ', friendlyFileSize(uploadedBytes), ' of ', friendlyFileSize(totalBytes),
      strong([(uploadedBytes / totalBytes * 100).toFixed(0), '%'])
    ]),
  ])
}
