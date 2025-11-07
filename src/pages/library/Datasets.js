import { Modal } from '@terra-ui-packages/components';
import { Fragment, useState } from 'react';
import { div, h, img, p } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { libraryTopMatter } from 'src/components/library-common';
import duosLogo from 'src/images/library/datasets/duos-logo.svg';
import { Metrics } from 'src/libs/ajax/Metrics';
import colors from 'src/libs/colors';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

const styles = {
  header: {
    ...Style.elements.sectionHeader,
    textTransform: 'uppercase',
  },
  content: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '2.5rem',
  },
  participant: {
    container: {
      margin: '0 4rem 5rem 0',
      width: 350,
    },
    title: {
      marginTop: '1rem',
      fontSize: 20,
      color: colors.dark(),
    },
    description: {
      marginTop: '1rem',
      minHeight: 125,
    },
    sizeText: {
      marginTop: '1rem',
      height: '1rem',
    },
  },
};

const logoBox = ({ src, alt, height }) =>
  div(
    {
      style: {
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 'none',
        height: 150,
        width: 'auto',
        border: `1px solid ${colors.dark(0.55)}`,
        borderRadius: 5,
        backgroundColor: 'white',
      },
    },
    [
      img({
        src,
        alt,
        role: 'img',
        height: height || '60%',
        width: 'auto',
      }),
    ]
  );

const Participant = ({ logo, title, shortDescription, description, sizeText, modalLogoHeight = 150, children }) => {
  const [showingModal, setShowingModal] = useState(false);

  const titleElement = div({ style: styles.participant.title }, [title]);

  return div(
    {
      style: styles.participant.container,
    },
    [
      div({ style: { display: 'flex', flexDirection: 'column' } }, [
        logoBox(logo),
        titleElement,
        div({ style: styles.participant.description }, [
          shortDescription || description,
          shortDescription &&
            h(
              Link,
              {
                style: { marginLeft: '0.5rem' },
                onClick: () => setShowingModal(true),
              },
              ['READ MORE']
            ),
        ]),
        div({ style: styles.participant.sizeText }, [sizeText]),
        div({ style: { marginTop: '1rem' } }, [children]),
      ]),
      showingModal &&
        h(
          Modal,
          {
            contentLabel: title,
            onDismiss: () => setShowingModal(false),
            width: 880,
            showCancel: false,
          },
          [img({ src: logo.src, alt: logo.alt, height: modalLogoHeight, width: 'auto' }), titleElement, description, sizeText && p([sizeText])]
        ),
    ]
  );
};

const captureBrowseDataEvent = (datasetName) => void Metrics().captureEvent(Events.datasetLibraryBrowseData, { datasetName });

const duos = () =>
  h(
    Participant,
    {
      logo: { src: duosLogo, alt: 'DUOS logo' },
      title: 'Duos Data Catalog',
      description: h(Fragment, [
        h(Link, { href: 'https://duos.org/datalibrary', ...Utils.newTabLinkProps }, 'DUOS'),
        ' - search and access an ecosystem of scientific data',
      ]),
    },
    [
      h(
        ButtonPrimary,
        {
          'aria-label': 'Browse DUOS Datasets',
          href: 'https://duos.org/datalibrary',
          onClick: () => captureBrowseDataEvent('DUOS'),
          ...Utils.newTabLinkProps,
        },
        ['Browse Data']
      ),
    ]
  );

export const Datasets = () => {
  return h(FooterWrapper, { alwaysShow: true }, [libraryTopMatter('datasets'), div({ role: 'main', style: styles.content }, [duos()])]);
};

export const navPaths = [
  {
    name: 'library-datasets',
    path: '/library/datasets',
    component: Datasets,
    public: false,
    title: 'Data Browser',
  },
  {
    name: 'library', // legacy (redirected from portal.firecloud.org/library)
    path: '/library',
    component: (props) => h(Nav.Redirector, { pathname: Nav.getPath('library-datasets', props) }),
  },
];
