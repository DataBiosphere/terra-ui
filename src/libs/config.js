let loadedConfig

export const loadConfig = () =>
  fetch('config.json').then(response => response.json()).then(json => loadedConfig = json)


export const getRawlsUrlRoot = () => loadedConfig['rawlsUrlRoot']
export const getGoogleClientId = () => loadedConfig['googleClientId']
