import { action } from '@storybook/addon-actions'
import { number, text, withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { div, h } from 'react-hyperscript-helpers'
import TitleBar from 'src/components/TitleBar'


const container = titleBar => div({ style: { width: `${number('Container Width', 500)}px`, border: '1px solid black' } }, [titleBar])

storiesOf('Title Bar', module)
  .addDecorator(withKnobs)
  .add('With Title Only', () => container(h(TitleBar, { title: text('Title', 'Test') })))
  .add('With Previous Button', () => container(h(TitleBar, { title: text('Title', 'Test'), onPrevious: action('On previous clicked') })))
  .add('With Cancel Button', () => container(h(TitleBar, { title: text('Title', 'Test'), onDismiss: action('Dismiss clicked') })))
  .add('With Previous and Cancel', () => container(
    h(TitleBar, {
      title: text('Title', 'Test'),
      onPrevious: action('On previous clicked'),
      onDismiss: action('Dsimiss clicked')
    })
  ))
