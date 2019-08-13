import { withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import { TabBar } from 'src/components/common'


const tabs = [
  { name: 'dashboard', link: 'workspace-dashboard' },
  { name: 'data', link: 'workspace-data' },
  { name: 'notebooks', link: 'workspace-notebooks' },
  { name: 'workflows', link: 'workspace-workflows' },
  { name: 'job history', link: 'workspace-job-history' }
]

const InfoStory = ({ index, links }) => {
  return h(TabBar, { tabNames: _.map('name', tabs), getHref: () => undefined })
}


storiesOf('Tab Bar', module)
  .addDecorator(withKnobs())
  .add('Tabs', () => {
    return h(InfoStory)
  })
