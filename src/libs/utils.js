const getAuthInstance = function() {
  return window.gapi.auth2.getAuthInstance()
}

const getUser = function() {
  return getAuthInstance().currentUser.get()
}

const getAuthToken = function() {
  return getUser().getAuthResponse(true).access_token
}

export { getUser, getAuthToken, getAuthInstance }
