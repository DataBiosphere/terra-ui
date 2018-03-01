const getUser = function() {
  return window.gapi.auth2.getAuthInstance().currentUser.get()
}

const getAuthToken = function() {
  return getUser().getAuthResponse().access_token
}

export { getUser, getAuthToken }
