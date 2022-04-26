import PropTypes from 'prop-types'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'


const TitleBar = ({ id, onPrevious, title, onDismiss, titleExtras, style = {}, titleStyles = {}, hideCloseButton = false }) => {
  return div({
    id,
    style: {
      display: 'flex', alignItems: 'flex-start', flex: 'none', ...style
    }
  }, [
    div({ style: { fontSize: 18, fontWeight: 600, ...titleStyles } }, [title]),
    titleExtras,
    div({ style: { marginLeft: 'auto', display: 'flex', alignItems: 'center' } }, [
      onPrevious && h(Link, {
        'aria-label': 'Back',
        style: { marginLeft: '2rem' },
        onClick: onPrevious
      }, [icon('arrowLeftRegular', { size: '22' })]),
      onDismiss && h(Link, {
        'aria-label': 'Close',
        style: { marginLeft: '2rem' },
        tabIndex: hideCloseButton ? -1 : 0,
        onClick: onDismiss
      }, [icon('times', { size: '25', style: hideCloseButton ? { display: 'none' } : {} })])
    ])
  ])
}

TitleBar.propTypes = {
  onPrevious: PropTypes.func,
  title: PropTypes.node,
  onDismiss: PropTypes.func,
  titleExtras: PropTypes.node
}

export default TitleBar
