import { Fragment, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import { SimpleTabBar } from 'src/components/tabBars';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import * as Utils from 'src/libs/utils';

import { ExternalIdentities } from './ExternalIdentities';
import { NotificationSettings } from './NotificationSettings';
import { PersonalInfo } from './PersonalInfo';

const styles = {
  pageHeading: {
    margin: '2rem 0 1rem',
    color: colors.dark(),
    fontSize: 16,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
};

export const Profile = () => {
  // State
  const [saving, setSaving] = useState();

  // Render
  const { query, name } = Nav.useRoute();
  const tab = query.tab || (name === 'fence-callback' ? 'externalIdentities' : 'personalInfo');

  const tabs = [
    { key: 'personalInfo', title: 'Personal Information' },
    { key: 'externalIdentities', title: 'External Identities' },
    { key: 'notificationSettings', title: 'Notification Settings' },
  ];

  // Render
  return h(Fragment, [
    saving && spinnerOverlay,
    div({ style: { flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { color: colors.dark(), fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', marginLeft: '1rem' } }, [
        h2({ style: styles.pageHeading }, ['Profile']),
      ]),
      h(
        SimpleTabBar,
        {
          'aria-label': 'Profile tabs',
          value: tab,
          onChange: (newTab) => {
            Nav.updateSearch({ ...query, tab: newTab });
          },
          tabs,
        },
        [
          Utils.switchCase(
            tab,
            ['personalInfo', () => h(PersonalInfo, { setSaving })],
            ['externalIdentities', () => h(ExternalIdentities, { queryParams: query })],
            ['notificationSettings', () => h(NotificationSettings)],
            [Utils.DEFAULT, () => null]
          ),
        ]
      ),
    ]),
  ]);
};
