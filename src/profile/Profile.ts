import { CSSProperties, Fragment, ReactNode, useEffect, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import { SimpleTabBar } from 'src/components/tabBars';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import * as Utils from 'src/libs/utils';

import { ExternalIdentities } from './external-identities/ExternalIdentities';
import { NotificationSettings } from './notification-settings/NotificationSettings';
import { PersonalInfo } from './personal-info/PersonalInfo';
import { useUserProfile } from './useUserProfile';

const styles = {
  pageHeading: {
    margin: '2rem 0 1rem',
    color: colors.dark(),
    fontSize: 16,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, CSSProperties>;

export const Profile = (): ReactNode => {
  const { profile, update: updateProfile } = useUserProfile();

  const profileStatus = profile.status;
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  useEffect(() => {
    if (profileStatus === 'Ready') {
      setHasLoadedProfile(true);
    }
  }, [profileStatus]);

  const { query, name } = Nav.useRoute();
  const tab: string = query.tab || (name === 'fence-callback' ? 'externalIdentities' : 'personalInfo');

  const tabs = [
    { key: 'personalInfo', title: 'Personal Information' },
    { key: 'externalIdentities', title: 'External Identities' },
    { key: 'notificationSettings', title: 'Notification Settings' },
  ] as const;

  return h(Fragment, [
    profileStatus === 'Loading' && spinnerOverlay,
    div({ style: { flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [
      div(
        {
          style: {
            color: colors.dark(),
            fontSize: 18,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            marginLeft: '1rem',
          },
        },
        [h2({ style: styles.pageHeading }, ['Profile'])]
      ),
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
          // Wait for the profile to be loaded before showing any tabs.
          hasLoadedProfile &&
            Utils.switchCase(
              tab,
              ['personalInfo', () => h(PersonalInfo, { initialProfile: profile.state, onSave: updateProfile })],
              ['externalIdentities', () => h(ExternalIdentities, { queryParams: query })],
              ['notificationSettings', () => h(NotificationSettings)],
              [Utils.DEFAULT, () => null]
            ),
        ]
      ),
    ]),
  ]);
};
