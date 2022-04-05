import 'src/outdated-browser-message'

import { loadedConfigStore } from 'src/configStore'


const loadApp = async () => {
  const res = await fetch(`${process.env.PUBLIC_URL}/config.json`)
  loadedConfigStore.current = await res.json()

  import('src/appLoader')
}

loadApp()
