let loadedConfig

export const loadConfig = () =>
  fetch('config.json').then(response => response.json()).then(json => loadedConfig = json)


export const getGoogleClientId = () => loadedConfig['googleClientId']
export const getLeoUrlRoot = () => loadedConfig['leoUrlRoot']
export const getRawlsUrlRoot = () => loadedConfig['rawlsUrlRoot']
export const getSamUrlRoot = () => loadedConfig['samUrlRoot']
export const getDockstoreUrlRoot = () => loadedConfig['dockstoreUrlRoot']
