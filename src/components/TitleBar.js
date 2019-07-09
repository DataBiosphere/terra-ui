import PropTypes from 'prop-types'
import { div, h } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'


const styles = {
  title: {
    display: 'flex', alignItems: 'baseline', marginBottom: '1rem', flex: 'none', padding: '1.5rem 1.25rem'
  },
  titleAlign: hasPrevious => ({ marginLeft: hasPrevious ? 'auto' : undefined })
}

const TitleBar = props => {
  const { onPrevious, title, onDismiss, titleExtras } = props
  return div({ style: styles.title }, [
    onPrevious && h(Clickable, {
      onClick: onPrevious
    }, [icon('arrowLeft')]),
    div({ style: { fontSize: 18, fontWeight: 600, ...styles.titleAlign(onPrevious) } }, [title]),
    titleExtras,
    onDismiss && h(Clickable, {
      style: { marginLeft: 'auto' },
      onClick: onDismiss
    }, [icon('times')])
  ])
}

TitleBar.propTypes = {
  onPrevious: PropTypes.func,
  title: PropTypes.node,
  onDismiss: PropTypes.func,
  titleExtras: PropTypes.node
}

export default TitleBar
