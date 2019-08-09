import PropTypes from 'prop-types'
import { div, h } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'


const TitleBar = ({ onPrevious, title, onDismiss, titleExtras }) => {
  return div({
    style: {
      display: 'flex', alignItems: 'baseline', marginBottom: '1rem', flex: 'none', padding: '1.5rem'
    }
  }, [
    onPrevious && h(Clickable, {
      'aria-label': 'Back',
      onClick: onPrevious
    }, [icon('arrowLeft', { size: 17 })]),
    div({ style: { fontSize: '0.875rem', fontWeight: 600, marginLeft: onPrevious ? 'auto' : undefined } }, [title]),
    titleExtras,
    onDismiss && h(Clickable, {
      'aria-label': 'Close',
      style: { marginLeft: 'auto' },
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
