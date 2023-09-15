import _ from 'lodash/fp';
import { div, h, img } from 'react-hyperscript-helpers';
import FooterWrapper from 'src/components/FooterWrapper';
import TopBar from 'src/components/TopBar';
import scienceBackground from 'src/images/science-background.jpg';
import * as Nav from 'src/libs/nav';
import * as Utils from 'src/libs/utils';

import { ImportData } from './ImportData';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    flex: 'auto',
    position: 'relative',
    padding: '2rem',
  },
};

// ImportData handles all the information relating to the page itself - this includes:
// * Reading from the URL
// * Loading initial Data
// * Managing the import
const ImportDataPage = () => {
  const {
    query: { format, referrer },
  } = Nav.useRoute();

  const isDataset = !_.includes(format, ['snapshot', 'tdrexport']);
  const title = Utils.cond(
    [referrer === 'data-catalog', () => 'Catalog'],
    [isDataset, () => 'Import Data'],
    [Utils.DEFAULT, () => 'Import Snapshot']
  );

  return h(FooterWrapper, [
    h(TopBar, { title }),
    div({ role: 'main', style: styles.container }, [
      img({
        src: scienceBackground,
        alt: '',
        style: { position: 'fixed', top: 0, left: 0, zIndex: -1 },
      }),
      h(ImportData),
    ]),
  ]);
};

export const navPaths = [
  {
    name: 'import-data',
    path: '/import-data',
    component: ImportDataPage,
    title: 'Import Data',
  },
];
