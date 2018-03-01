const getUser = function() {
  return window.gapi.auth2.getAuthInstance().currentUser.get()
}

export { getUser }
