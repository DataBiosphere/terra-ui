import RFavicon from 'react-favicon'
import { h } from 'react-hyperscript-helpers'
import { isBioDataCatalyst } from 'src/brand-utils'
import bioDataCatalystFavicon from 'src/images/brands/bioDataCatalyst/bioDataCatalyst-favicon.jpg'
import * as Utils from 'src/libs/utils'


const faviconPath = Utils.cond(
  [isBioDataCatalyst(), () => bioDataCatalystFavicon],
  () => `${process.env.PUBLIC_URL}/favicon.png`
)

const Favicon = () => {
  return h(RFavicon, { url: faviconPath })
}

export default Favicon
