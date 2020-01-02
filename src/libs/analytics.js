import { clickable, trackEvent, withRequestInstrumentation, withResponseInstrumentation } from 'libs/analytics-utils'
import _ from 'lodash/fp'
import { getConfig } from 'src/libs/config'
import { ajaxAnalyticsStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const userInstrumentation = [
  { xpath: clickable({ textContains: 'View Workspaces' }), listeners: ['click'], event: { name: 'click view', foo: 'bar' } },
  { xpath: clickable({ textContains: 'notebooks' }), listeners: ['click'], page: '#workspaces', event: { name: 'click notebooks', foo: 'notebooks' } },
  { xpath: clickable({ textContains: 'Add User' }), listeners: ['click'], event: { name: 'click add user', foo: 'add user' } }
]

const ajaxInstrumentation = [
  {
    fn: withResponseInstrumentation('Share A Workspace', ({ usersUpdated }) => usersUpdated.length > 0 && { usersModified: usersUpdated.length }),
    filterFn: (url, { method } = {}) => {
      return url.match(`${getConfig().rawlsUrlRoot}/api/workspaces/.*acl`) && method === 'PATCH'
    }
  },
  {
    fn: withResponseInstrumentation('Workflow Run Started',
      ({ request: { useCallCache }, submissionId, submissionDate }) => ({ useCallCache, submissionId, submissionDate })),
    filterFn: (url, { method } = {}) => {
      return url.match(`${getConfig().rawlsUrlRoot}/api/workspaces/.*submissions`) && method === 'POST'
    }
  },
  {
    fn: withRequestInstrumentation('Data Imported',
      () => ({ imported: true })),
    filterFn: (url, { method } = {}) => {
      return url.match(`${getConfig().rawlsUrlRoot}/api/workspaces/.*/entities/batchUpsert`) &&
        method === 'POST' &&
        window.location.href.includes('import-data')
    }
  },
  {
    fn: withResponseInstrumentation('Notebook Run Started', () => ({ notebookRunTimeRequested: true })),
    filterFn: (url, { method } = {}) => {
      return url.match(`${getConfig().leoUrlRoot}/api/cluster/.*start`) && method === 'POST'
    }
  }
]

// Most of our interactions will register a click whether it is an enter key or a click
// There are a few interactions that will not register clicks on enter
export const useInstrumentation = () => {
  Utils.useOnMount(() => {
    const clickHandler = e => {
      const { target } = e
      _.forEach(({ xpath, event, page }) => {
        if (page && window.location.href.includes(page)) {
          const elem = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue
          elem && elem.contains(target) && trackEvent(event)
        }
      }, userInstrumentation)
    }

    ajaxAnalyticsStore.set(ajaxInstrumentation)
    window.addEventListener('click', clickHandler)
    return () => window.removeEventListener('click', clickHandler)
  }, { capture: true })
}
