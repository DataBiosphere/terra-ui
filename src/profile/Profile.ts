import _ from 'lodash/fp';
import qs from 'qs';
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

  // This coalescing is needed due to a peculiarity in the way Nav works.
  // When the user is redirected back to the app from an external oauth provider,
  // we need to grab the `state` and `code` query params from the URL.
  // Not all providers order the query params and href the same way, and this seems to break Nav.useRoute query parsing.
  const { query, name } = Nav.useRoute();
  const { state, code } = qs.parse(window.location.search, { ignoreQueryPrefix: true });
  let coalescedQuery = {};
  if (_.isEmpty(query)) {
    coalescedQuery = { state, code };
  } else {
    coalescedQuery = query;
  }
  const callbacks = ['fence-callback', 'ecm-callback', 'oauth-callback'];
  let tab: string = query.tab || (callbacks.includes(name) ? 'externalIdentities' : 'personalInfo');
  const { 'nih-username-token': nihUsernameToken } = query;
  if (nihUsernameToken !== undefined) {
    tab = 'externalIdentities';
  }

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
              ['externalIdentities', () => h(ExternalIdentities, { queryParams: coalescedQuery })],
              ['notificationSettings', () => h(NotificationSettings)],
              [Utils.DEFAULT, () => null]
            ),
        ]
      ),
    ]),
  ]);
};
