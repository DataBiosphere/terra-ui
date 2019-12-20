import { loadedConfigStore } from 'src/configStore'


const loadApp = async () => {
  const res = await fetch('config.json')
  loadedConfigStore.current = await res.json()

  import('src/appLoader') // eslint-disable-line no-unused-expressions
}

loadApp()
