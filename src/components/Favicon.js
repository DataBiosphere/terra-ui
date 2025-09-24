import RFavicon from 'react-favicon';
import { h } from 'react-hyperscript-helpers';
import bioDataCatalystFavicon from 'src/images/brands/bioDataCatalyst/bioDataCatalyst-favicon.jpg';
import { isBioDataCatalyst, isScientificServices } from 'src/libs/brand-utils';
import { DEFAULT } from 'src/libs/utils';
import * as Utils from 'src/libs/utils';

const faviconPath = Utils.cond(
  [isBioDataCatalyst(), () => bioDataCatalystFavicon],
  [isScientificServices(), () => '/scientificServicesFavicon.svg'],
  [DEFAULT, () => '/favicon.png']
);

const Favicon = () => {
  return h(RFavicon, { url: faviconPath });
};

export default Favicon;
