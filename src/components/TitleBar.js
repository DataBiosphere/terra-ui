import PropTypes from 'prop-types'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'


const TitleBar = ({ onPrevious, title, onDismiss, titleExtras, titleSize = '0.875rem', arrowSize = '17', dismissSize = '20' }) => {
  return div({
    style: {
      display: 'flex', alignItems: 'baseline', flex: 'none', padding: '1.5rem'
    }
  }, [
    div({ style: { fontSize: titleSize, fontWeight: 600 } }, [title]),
    titleExtras,
    onPrevious && h(Link, {
      'aria-label': 'Back',
      style: { marginLeft: 'auto', marginRight: '2rem', alignSelf: 'center' },
      onClick: onPrevious
    }, [icon('arrowLeftCustom', { size: arrowSize })]),
    onDismiss && h(Link, {
      'aria-label': 'Close',
      style: { marginLeft: onPrevious ? undefined: 'auto' },
      onClick: onDismiss
    }, [icon('times', { size: dismissSize })])
  ])
}

TitleBar.propTypes = {
  onPrevious: PropTypes.func,
  title: PropTypes.node,
  onDismiss: PropTypes.func,
  titleExtras: PropTypes.node
}

export default TitleBar
