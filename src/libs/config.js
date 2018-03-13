let loadedConfig

const loadConfig = () =>
  fetch('config.json').then(response => response.json()).then(json => loadedConfig = json)


const getRawlsUrlRoot = () => loadedConfig['rawlsUrlRoot']
const getGoogleClientId = () => loadedConfig['googleClientId']

export { loadConfig, getRawlsUrlRoot, getGoogleClientId }
