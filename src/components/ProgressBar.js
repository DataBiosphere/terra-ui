import { dd, div, dl, dt, h, p, strong } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import colors from 'src/libs/colors'
import { friendlyFileSize } from 'src/libs/uploads'


export const ProgressBar = ({ max, now }) => {
  return div({
    style: {
      display: 'flex',
      flexFlow: 'row wrap',
      width: '100%',
      height: '1rem',
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
        borderRadius: 5
      },
      role: 'progressbar',
      'aria-disabled': max === 0,
      'aria-valuemin': 0,
      'aria-valuemax': max,
      'aria-valuenow': now
    }, [
      max > 0 && now < max && div({
        style: {
          minWidth: '1rem',
          width: `${(now / max * 100)}%`,
          height: '100%',
          backgroundColor: colors.primary(0.75),
          borderRadius: 'inherit',
          textAlign: 'right',
          transition: 'width 0.4s ease-in-out',
          // From react-bootstrap, creates a barbershop texture
          backgroundImage: 'linear-gradient(45deg,hsla(0,0%,100%,.15) 25%,transparent 0,transparent 50%,hsla(0,0%,100%,.15) 0,hsla(0,0%,100%,.15) 75%,transparent 0,transparent)',
          backgroundSize: '1rem 1rem',
          animation: 'progress-bar-stripes 1s linear infinite'
        }
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
    p({
      'aria-live': 'polite',
      'aria-atomic': true
    }, [
      'Uploading file ',
      strong([currentFileNum + 1, ' of ', totalFiles])
    ]),
    currentFile && dl([
      dt(['Currently uploading:']),
      dd({
        style: { margin: '0.4rem 0 1rem 0', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }
      }, [currentFile.name])
    ]),
    currentFile && dl([
      dt(['Size:']),
      dd({
        style: { margin: '0.4rem 0 1rem 0', fontWeight: 600 }
      }, [friendlyFileSize(currentFile.size)])
    ]),
    h(ProgressBar, {
      max: totalBytes,
      now: uploadedBytes
    }),
    p({}, [
      'Transferred ',
      strong([friendlyFileSize(uploadedBytes)]),
      ' of ',
      strong([friendlyFileSize(totalBytes)]),
      ' ',
      strong(['(', (uploadedBytes / totalBytes * 100).toFixed(0), '%)'])
    ])
  ])
}
