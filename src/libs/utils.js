export const getAuthInstance = function() {
  return window.gapi.auth2.getAuthInstance()
}

export const getUser = function() {
  return getAuthInstance().currentUser.get()
}

export const getAuthToken = function() {
  return getUser().getAuthResponse(true).access_token
}

export const makePrettyDate = function(dateString) {
  const date = new Date(dateString)

  return date.toLocaleString(navigator.language, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  })
}
