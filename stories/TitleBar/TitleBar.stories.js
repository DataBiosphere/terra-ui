import { storiesOf } from '@storybook/react'
import { div, h } from 'react-hyperscript-helpers'
import RModal from 'react-modal'
import TitleBar from 'src/components/TitleBar'


RModal.defaultStyles = { overlay: {}, content: {} }

storiesOf('Title Bar', module)
  .add('With Previous and Title', () => h(ArrowTitle))


const ArrowTitle = () => {
  return div({ id: 'modal-root' }, [
    h(TitleBar, {
      onPrevious: () => console.log('Previous'),
      title: 'Test'
    })
  ])
}


// h(TitleBar, {
//   onPrevious: async () => this.setState({ openDrawer: false }),
//   title: 'test',
//   onDismiss: async () => this.setState({ openDrawer: false })
// }),
// div({
//   style: {
//     display: 'flex', alignItems: 'baseline', marginBottom: '1rem', flex: 1, padding: '1.5rem 1.25rem', overflow: 'auto'
//   }
// }, 'Hello'),
// h(ButtonBar, {
//   onOk: () => this.setState({ openDrawer: false }), onCancel: () => this.setState({ openDrawer: false }), style: {
//     marginTop: 'auto', backgroundColor: colors.dark(0.2), padding: '1.75rem 1.25rem',
//     display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline'
//   }
// })

// Other test cases:
// 1. Various content
// 2. Title Only
// 3. Title and buttons only
// 4. Title, buttons and content
// 5. Content Only
// 6. Title and content
// 7. Scrolling content
// 8. Async Close

