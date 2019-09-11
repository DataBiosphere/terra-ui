import { configure } from '@storybook/react'
import RModal from 'react-modal'
import { loadedConfigStore } from 'src/configStore'
import 'src/style.css'


loadedConfigStore.current = true
RModal.defaultStyles = { overlay: {}, content: {} }

// automatically import all files ending in *.stories.js
const req = require.context('src', true, /\.stories\.js$/)

function loadStories() {
  req.keys().forEach(filename => req(filename))
}

configure(loadStories, module)
