import { loadedConfigStore } from 'src/configStore'


const loadApp = async () => {
  const res = await fetch('config.json')
  loadedConfigStore.current = await res.json()

  await import('src/appLoader')
}

loadApp()
