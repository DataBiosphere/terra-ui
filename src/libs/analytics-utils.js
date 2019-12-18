import _ from 'lodash/fp'
import { Ajax, ajaxOverrideUtils } from 'src/libs/ajax'
import { ajaxAnalyticsStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const { MixPanel } = Ajax()

const clickable = ({ text, textContains }) => {
  const base = '(//a | //*[@role="button"] | //button)'
  if (text) {
    return `${base}[normalize-space(.)="${text}" or @aria-label="${text}"]`
  } else if (textContains) {
    return `${base}[contains(normalize-space(.),"${textContains}") or contains(@aria-label,"${textContains}")]`
  }
}

const withAjaxInstrumentation = (name, eventFn) => ajaxOverrideUtils.mapJsonBody(response => {
  const props = eventFn(response)
  props && trackEvent({ name, ...props })
  return response
})

const trackEvent = ({ name, ...props }) => {
  const mixPanelEvent = {
    event: name,
    properties: { token: '', ...props }
  }
  MixPanel.track(mixPanelEvent)
  console.log(`Tracking ${name}`, mixPanelEvent, btoa(JSON.stringify(mixPanelEvent)))
}

const instrumentation = [
  { xpath: clickable({ textContains: 'View Workspaces' }), listeners: ['click'], event: { name: 'view', foo: 'bar' } },
  { xpath: clickable({ textContains: 'notebooks' }), listeners: ['click'], event: { name: 'notebooks', foo: 'notebooks' } },
  { xpath: clickable({ textContains: 'Add User' }), listeners: ['click'], event: { name: 'add user', foo: 'add user' } }
]

ajaxAnalyticsStore.set([
  {
    fn: withAjaxInstrumentation('Share A Workspace', ({ usersUpdated }) => usersUpdated.length > 0 && { usersModified: usersUpdated.length }),
    filterFn: (url, { method }) => url.match('api/workspaces/.*acl') && method === 'PATCH'
  },
  {
    fn: withAjaxInstrumentation('Workflow Run Started', ({ request: { useCallCache }, submissionId, submissionDate }) => ({ useCallCache, submissionId, submissionDate })),
    filterFn: (url, { method }) => url.match('api/workspaces/.*submissions') && method === 'POST'
  },
  {
    fn: withAjaxInstrumentation('Notebook Run Started', () => ({ notebookRunTimeRequested: true })),
    filterFn: (url, { method }) => url.match('api/cluster/.*start') && method === 'POST'
  }
])


export const useInstrumentation = () => {
  Utils.useOnMount(() => {
    const clickHandler = e => {
      const { target } = e
      _.forEach(({ xpath, event }) => {
        const elem = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue
        elem && elem.contains(target) && trackEvent(event)
      }, instrumentation)
    }

    window.addEventListener('click', clickHandler)
    return () => window.removeEventListener('click', clickHandler)
  }, { capture: true })
}
