import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import 'mutationobserver-shim'


configure({ adapter: new Adapter() })

jest.mock('src/libs/ajax')
jest.mock('src/libs/nav')

window.Element.prototype['insertAdjacentElement'] = () => {} // for custom icons
