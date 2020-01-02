import { Ajax, ajaxOverrideUtils } from 'src/libs/ajax'


const { MixPanel } = Ajax()

export const clickable = ({ text, textContains }) => {
  const base = '(//a | //*[@role="button"] | //button)'
  if (text) {
    return `${base}[normalize-space(.)="${text}" or @aria-label="${text}"]`
  } else if (textContains) {
    return `${base}[contains(normalize-space(.),"${textContains}") or contains(@aria-label,"${textContains}")]`
  }
}

export const trackEvent = ({ name, ...props }) => {
  const mixPanelEvent = {
    event: name,
    properties: { token: '', ...props }
  }
  MixPanel.track(mixPanelEvent)
  console.log(`Tracking ${name}`, mixPanelEvent)
}

export const withResponseInstrumentation = (name, eventFn) => ajaxOverrideUtils.mapJsonBody(response => {
  const props = eventFn(response)
  props && trackEvent({ name, ...props })
  return response
})

export const withRequestInstrumentation = (name, eventFn) => ajaxOverrideUtils.passThroughEffect(() => {
  const props = eventFn()
  props && trackEvent({ name, ...props })
})


