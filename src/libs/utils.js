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
  const now = new Date()

  const todayOrYesterday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    (date.getDate() === now.getDate() - 1 || date.getDate() === now.getDate())

  if (todayOrYesterday) {
    return (date.getDate() === now.getDate() ? 'Today' : 'Yesterday') + ' ' +
      date.toLocaleString(navigator.language, { hour: 'numeric', minute: 'numeric' })
  } else {
    return date.toLocaleString(navigator.language, {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })
  }
}

export const workspaceAccessLevels = ['NO ACCESS', 'READER', 'WRITER', 'OWNER', 'PROJECT_OWNER']
