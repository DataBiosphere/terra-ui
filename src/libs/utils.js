export const getAuthInstance = function() {
  return window.gapi.auth2.getAuthInstance()
}

export const getUser = function() {
  return getAuthInstance().currentUser.get()
}

export const getAuthToken = function() {
  return getUser().getAuthResponse(true).access_token
}
