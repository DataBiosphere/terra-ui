import { action } from '@storybook/addon-actions'
import { number, text, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h, span } from 'react-hyperscript-helpers'
import { InfoBox } from 'src/components/PopupTrigger'


const DEFAULT_INFOBOXES = 3
const DEFAULT_LINKS = 3

const InfoStory = ({ index, links }) => {
  return div({ id: 'modal-root', style: { width: `${number('Container Width', 500)}px`, margin: '2px' } }, [
    span({ style: { paddingRight: '0.25rem' } }, 'Some text next to an info circle'),
    h(InfoBox, [
      text(`Content ${index}`, `Test Content. `),
      _.times(() => h(Fragment, [
        a({
          style: { color: 'blue', textDecoration: 'underline' },
          onClick: e => {
            action(`Link in infobox ${index} clicked`)()
            e.preventDefault()
          },
          href: ''
        }, ['Link for testing a11y.']), ' '
      ]), links)
    ])
  ])
}

storiesOf('Popup', module)
  .addDecorator(withKnobs())
  .add('Info Box', () => {
    const links = number('Number of links in popup ', DEFAULT_LINKS, { range: true, min: 0, max: 20 })
    const boxes = number('Number of info boxes ', DEFAULT_INFOBOXES, { range: true, min: 0, max: 20 })
    return h(Fragment, [_.times(index => h(InfoStory, { index, links }), boxes)])
  })
