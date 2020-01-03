import PropTypes from 'prop-types'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'


const TitleBar = ({ onPrevious, title, onDismiss, titleExtras }) => {
  return div({
    style: {
      display: 'flex', alignItems: 'baseline', flex: 'none', padding: '1.5rem'
    }
  }, [
    div({ style: { fontSize: '0.875rem', fontWeight: 600 } }, [title]),
    titleExtras,
    onPrevious && h(Link, {
      'aria-label': 'Back',
      style: { marginLeft: 'auto', paddingRight: '0.5rem' },
      onClick: onPrevious
    }, [icon('arrowLeft', { size: 17 })]),
    onDismiss && h(Link, {
      'aria-label': 'Close',
      style: { marginLeft: onPrevious ? undefined: 'auto' },
      onClick: onDismiss
    }, [icon('times', { size: 20 })])
  ])
}

TitleBar.propTypes = {
  onPrevious: PropTypes.func,
  title: PropTypes.node,
  onDismiss: PropTypes.func,
  titleExtras: PropTypes.node
}

export default TitleBar
