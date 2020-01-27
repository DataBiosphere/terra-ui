import RModal from 'react-modal'
import { loadedConfigStore } from '../src/configStore'
import '../src/style.css'


loadedConfigStore.current = true
RModal.defaultStyles = { overlay: {}, content: {} }
