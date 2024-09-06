import _ from 'lodash/fp';
import { CSSProperties } from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
import FooterWrapper from 'src/components/FooterWrapper';
import { TopBar } from 'src/components/TopBar';
import scienceBackground from 'src/images/science-background.jpg';
import * as Nav from 'src/libs/nav';
import * as Utils from 'src/libs/utils';

import { ImportDataContainer } from './ImportData';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    flex: 'auto',
    position: 'relative',
    padding: '2rem',
  },
} as const satisfies Record<string, CSSProperties>;

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
      h(ImportDataContainer),
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
