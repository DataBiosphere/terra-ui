import 'src/_stories/Timestamp'
import { action } from '@storybook/addon-actions'
import { withKnobs } from '@storybook/addon-knobs'
import { storiesOf } from '@storybook/react'
import { div, h } from 'react-hyperscript-helpers'
import { ajaxOverridesStore } from 'src/libs/state'
import { delay } from 'src/libs/utils'
import { navPaths} from 'src/pages/workspaces/workspace/notebooks/TerminalLauncher'

const clearOverrides = () => ajaxOverridesStore.set([])

const setOverrides = ({ isRegistered, ms }) => {
  ajaxOverridesStore.set([{
    filter: /api\/users\/v1\/(?!invite)/,
    fn: () => async () => {
      action('Checking if user is registered')()
      await delay(ms)
      return isRegistered ? new Response(null, { status: 200 }) : new Response(null, { status: 404 })
    }
  }, {
    filter: /users\/v1\/invite/,
    fn: () => async () => {
      action('Requesting user invite')()
      await delay(ms)
      return new Response(null, { status: 201 })
    }
  }])
}

const Notebook = () => {
  console.log(navPaths)
  const TerminalLauncher = navPaths[0].component
  return div([h(TerminalLauncher, {cluster: 'saturn-1ea608bf-1d33-441a-a524-7d5ee9ab374d', namespace: 'general-dev-billing-account', name: 'jiminy cricket'})])
}


storiesOf('Notebook Runtime', module)
  .addDecorator(withKnobs)
  .add(`CRUD notebook runtime`, () => h(Notebook))
