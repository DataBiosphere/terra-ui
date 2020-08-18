import PropTypes from 'prop-types'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'


// TODO PD: visit other usage of TitleBar on data page and fix styling
const TitleBar = ({ onPrevious, title, onDismiss, titleExtras, style = {} }) => {
  return div({
    style: {
      display: 'flex', alignItems: 'flex-start', flex: 'none', ...style
    }
  }, [
    div({ style: { fontSize: 18, fontWeight: 600 } }, [title]),
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
        onClick: onDismiss
      }, [icon('times', { size: '25' })])
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
