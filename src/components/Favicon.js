import RFavicon from 'react-favicon';
import { h } from 'react-hyperscript-helpers';
import bioDataCatalystFavicon from 'src/images/brands/bioDataCatalyst/bioDataCatalyst-favicon.jpg';
import { isBioDataCatalyst } from 'src/libs/brand-utils';
import * as Utils from 'src/libs/utils';

const faviconPath = Utils.cond([isBioDataCatalyst(), () => bioDataCatalystFavicon], () => `${process.env.PUBLIC_URL}/favicon.png`);

const Favicon = () => {
  return h(RFavicon, { url: faviconPath });
};

export default Favicon;
