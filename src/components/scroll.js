/**
 * Scrolls a scrollable region down one page, minus a buffer
 * @param element The DOM element to scroll. For this to work it should have an overflow style applied.
 * @param duration The number of milliseconds for the animation
 * @param buffer The number of pixels from the previous page to include in the next one
 */
export const scrollToNextPage = (element, duration = 400, buffer = 20) => {
  const top = element.scrollTop
  const height = element.offsetHeight

  scrollTo(element, top + height - buffer, duration)
}

/**
 * Borrowed from https://gist.github.com/andjosh/6764939
 * @param element The DOM element to scroll. For this to work it should have an overflow style applied.
 * @param to The position to scroll to
 * @param duration The number of milliseconds for the animation
 */
export const scrollTo = (element, to, duration) => {
  const start = element.scrollTop
  const change = to - start
  let currentTime = 0
  const increment = 20

  const animateScroll = () => {
    currentTime += increment
    element.scrollTop = easeInOutQuad(currentTime, start, change, duration)
    if (currentTime < duration) {
      setTimeout(animateScroll, increment)
    }
  }
  animateScroll()
}

//t = current time
//b = start value
//c = change in value
//d = duration
const easeInOutQuad = (t, b, c, d) => {
  t /= d / 2
  if (t < 1) return c / 2 * t * t + b
  t--
  return -c / 2 * (t * (t - 2) - 1) + b
}
