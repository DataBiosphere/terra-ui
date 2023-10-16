import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h, h2, h3, label, p, span } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { ButtonPrimary, Checkbox, IdContainer, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { InfoBox } from 'src/components/InfoBox';
import { TextInput, ValidatedInput } from 'src/components/input';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import ProfilePicture from 'src/components/ProfilePicture';
import { SimpleTabBar } from 'src/components/tabBars';
import TopBar from 'src/components/TopBar';
import { useWorkspaces } from 'src/components/workspace-utils';
import { Ajax } from 'src/libs/ajax';
import { makeSetUserProfileRequest } from 'src/libs/ajax/User';
import { refreshTerraProfile } from 'src/libs/auth';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import { withErrorReporting } from 'src/libs/error';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import allProviders from 'src/libs/providers';
import { memoWithName, useCancellation, useOnMount } from 'src/libs/react-utils';
import { authStore, getTerraUser } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { FenceAccount } from 'src/pages/profile/external-identities/FenceAccount';
import { NihAccount } from 'src/pages/profile/external-identities/NihAccount';
import { SpacedSpinner } from 'src/pages/profile/SpacedSpinner';
import validate from 'validate.js';

const styles = {
  page: {
    width: 1050,
  },
  sectionTitle: {
    margin: '2rem 0 1rem',
    color: colors.dark(),
    fontSize: 16,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  header: {
    line: {
      display: 'flex',
      alignItems: 'center',
    },

    nameLine: {
      marginLeft: '1rem',
      color: colors.dark(),
      fontSize: '150%',
    },
  },
  form: {
    line: {
      display: 'flex',
      justifyContent: 'normal',
      margin: '2rem 0',
    },
    container: {
      width: 320,
      marginRight: '1rem',
    },
    title: {
      whiteSpace: 'nowrap',
      fontSize: 16,
      marginBottom: '0.3rem',
    },
    checkboxLine: {
      margin: '0.75rem 0',
    },
    checkboxLabel: {
      marginLeft: '0.5rem',
    },
  },
  idLink: {
    container: {
      display: 'grid',
      marginBottom: '0.6rem',
      border: `1px solid ${colors.dark(0.55)}`,
      borderRadius: 4,
    },
    linkContentTop: (hasBottom) => ({
      display: 'grid',
      rowGap: '0.6rem',
      backgroundColor: colors.light(0.2),
      padding: '1.2rem',
      borderRadius: hasBottom ? '4px 4px 0 0' : 4,
    }),
    linkContentBottom: {
      padding: '1.2rem',
    },
    linkName: {
      fontSize: 18,
      fontWeight: 700,
      marginBottom: '0.6rem',
      display: 'inline',
    },
    linkDetailLabel: {
      fontWeight: 700,
      marginBottom: '0.6rem',
      marginRight: '1.2rem',
    },
  },
};

const PassportLinker = ({ queryParams: { state, code } = {}, provider, prettyName }) => {
  const signal = useCancellation();
  const [accountInfo, setAccountInfo] = useState();
  const [passport, setPassport] = useState();
  const [authUrl, setAuthUrl] = useState();

  useOnMount(() => {
    const loadAuthUrl = withErrorReporting(`Error loading ${prettyName} account link URL`, async () => {
      setAuthUrl(await Ajax(signal).User.externalAccount(provider).getAuthUrl());
    });
    const loadAccount = withErrorReporting(`Error loading ${prettyName} account`, async () => {
      setAccountInfo(await Ajax(signal).User.externalAccount(provider).get());
    });
    const loadPassport = withErrorReporting(`Error loading ${prettyName} passport`, async () => {
      setPassport(await Ajax(signal).User.externalAccount(provider).getPassport());
    });
    const linkAccount = withErrorReporting(`Error linking ${prettyName} account`, async (code, state) => {
      setAccountInfo(await Ajax().User.externalAccount(provider).linkAccount(code, state));
      loadPassport();
    });

    loadAuthUrl();

    if (Nav.getCurrentRoute().name === 'ecm-callback' && JSON.parse(atob(state)).provider === provider) {
      window.history.replaceState({}, '', `/${Nav.getLink('profile')}`);
      linkAccount(code, state);
    } else {
      loadAccount();
      loadPassport();
    }
  });

  const unlinkAccount = withErrorReporting(`Error unlinking ${prettyName} account`, async () => {
    setAccountInfo(undefined);
    await Ajax().User.externalAccount(provider).unlink();
    setAccountInfo(null);
  });

  return div({ style: styles.idLink.container }, [
    div({ style: styles.idLink.linkContentTop(false) }, [
      h3({ style: { marginTop: 0, ...styles.idLink.linkName } }, [prettyName]),
      Utils.cond(
        [accountInfo === undefined, () => h(SpacedSpinner, ['Loading account status...'])],
        [
          accountInfo === null,
          () => {
            return div([h(ButtonPrimary, { href: authUrl, ...Utils.newTabLinkProps }, [`Link your ${prettyName} account`])]);
          },
        ],
        () => {
          const { externalUserId, expirationTimestamp } = accountInfo;

          return h(Fragment, [
            div([span({ style: styles.idLink.linkDetailLabel }, ['Username:']), externalUserId]),
            div([span({ style: styles.idLink.linkDetailLabel }, ['Link Expiration:']), span([Utils.makeCompleteDate(expirationTimestamp)])]),
            div([
              h(Link, { 'aria-label': `Renew your ${prettyName} link`, href: authUrl }, ['Renew']),
              span({ style: { margin: '0 0.25rem 0' } }, [' | ']),
              h(Link, { 'aria-label': `Unlink from ${prettyName}`, onClick: unlinkAccount }, ['Unlink']),
            ]),
            !!passport && div([h(ClipboardButton, { text: passport }, ['Copy passport to clipboard'])]),
          ]);
        }
      ),
    ]),
  ]);
};

const sectionTitle = (text) => h2({ style: styles.sectionTitle }, [text]);

const ExternalIdentitiesTab = ({ queryParams }) => {
  return h(PageBox, { role: 'main', style: { flexGrow: 1 }, variant: PageBoxVariants.light }, [
    h(NihAccount, { nihToken: queryParams?.['nih-username-token'] }),
    _.map((provider) => h(FenceAccount, { key: provider.key, provider }), allProviders),
    !!getConfig().externalCredsUrlRoot && h(PassportLinker, { queryParams, provider: 'ras', prettyName: 'RAS' }),
  ]);
};

const NotificationCheckbox = ({ notificationKeys, label, setSaving, prefsData }) => {
  const notificationKeysWithValue = ({ notificationKeys, value }) => {
    return _.fromPairs(_.map((notificationKey) => [notificationKey, JSON.stringify(value)], notificationKeys));
  };

  return h(Checkbox, {
    // Thurloe defaults all notifications to being on. So if the key is not present, then we also treat that as enabled
    'aria-label': label,
    checked: !_.isMatch(notificationKeysWithValue({ notificationKeys, value: false }), prefsData),
    onChange: _.flow(
      Utils.withBusyState(setSaving),
      withErrorReporting('Error saving preferences')
    )(async (v) => {
      await Ajax().User.profile.setPreferences(notificationKeysWithValue({ notificationKeys, value: v }));
      Ajax().Metrics.captureEvent(Events.notificationToggle, { notificationKeys, enabled: v });
      await refreshTerraProfile();
    }),
  });
};

const NotificationCardHeaders = memoWithName('NotificationCardHeaders', () => {
  return div({ style: { display: 'flex', justifyContent: 'space-between', margin: '1.5rem 0 0.5rem 0', padding: '0 1rem' } }, [
    div({ style: { flex: 1 } }, [div({ style: { fontWeight: 600 } }, 'Name')]),
    div({ style: { flex: 1 } }, [div({ style: { fontWeight: 600 } }, 'Opt In')]),
  ]);
});

const NotificationCard = memoWithName('NotificationCard', ({ label, notificationKeys, setSaving, prefsData }) => {
  const notificationCardStyles = {
    field: {
      ...Style.noWrapEllipsis,
      flex: 1,
      height: '1rem',
      paddingRight: '1rem',
    },
    row: { display: 'flex', alignItems: 'center', width: '100%', padding: '1rem' },
  };

  return div({ role: 'listitem', style: { ...Style.cardList.longCardShadowless, padding: 0, flexDirection: 'column' } }, [
    div({ style: notificationCardStyles.row }, [
      div({ style: { ...notificationCardStyles.field, display: 'flex', alignItems: 'center' } }, label),
      div({ style: notificationCardStyles.field }, [h(NotificationCheckbox, { notificationKeys, label, setSaving, prefsData })]),
    ]),
  ]);
});

const NotificationSettingsTab = ({ setSaving }) => {
  const { workspaces } = useWorkspaces();
  const [prefsData] = _.over(_.pickBy)((_v, k) => _.startsWith('notifications/', k), authStore.get().profile);

  return h(PageBox, { role: 'main', style: { flexGrow: 1 }, variant: PageBoxVariants.light }, [
    div({ style: Style.cardList.toolbarContainer }, [
      h2({ style: { ...Style.elements.sectionHeader, margin: 0, textTransform: 'uppercase' } }, [
        'Account Notifications',
        h(
          InfoBox,
          { style: { marginLeft: '0.5rem' } },
          'You may receive email notifications regarding certain events in Terra. You may globally opt in or out of receiving these emails.'
        ),
      ]),
    ]),
    h(NotificationCardHeaders),
    div({ role: 'list', 'aria-label': 'notification settings for your account', style: { flexGrow: 1, width: '100%' } }, [
      h(NotificationCard, {
        setSaving,
        prefsData,
        label: 'Group Access Requested',
        notificationKeys: ['notifications/GroupAccessRequestNotification'],
      }),
      h(NotificationCard, {
        setSaving,
        prefsData,
        label: 'Workspace Access Added',
        notificationKeys: ['notifications/WorkspaceAddedNotification'],
      }),
      h(NotificationCard, {
        setSaving,
        prefsData,
        label: 'Workspace Access Removed',
        notificationKeys: ['notifications/WorkspaceRemovedNotification'],
      }),
    ]),
    div({ style: Style.cardList.toolbarContainer }, [
      h2({ style: { ...Style.elements.sectionHeader, marginTop: '2rem', textTransform: 'uppercase' } }, [
        'Submission Notifications',
        h(
          InfoBox,
          { style: { marginLeft: '0.5rem' } },
          'You may receive email notifications when a submission has succeeded, failed, or been aborted. You may opt in or out of receiving these emails for individual workspaces.'
        ),
      ]),
    ]),
    h(NotificationCardHeaders),
    div(
      { role: 'list', 'aria-label': 'notification settings for workspaces', style: { flexGrow: 1, width: '100%' } },
      _.flow(
        _.filter({ public: false }), // public workspaces are not useful to display here and clutter the list
        _.map((workspace) => {
          const label = `${workspace.workspace.namespace}/${workspace.workspace.name}`;
          return h(NotificationCard, {
            setSaving,
            prefsData,
            label,
            notificationKeys: [
              `notifications/SuccessfulSubmissionNotification/${label}`,
              `notifications/FailedSubmissionNotification/${label}`,
              `notifications/AbortedSubmissionNotification/${label}`,
            ],
          });
        })
      )(workspaces)
    ),
  ]);
};

const PersonalInfoTab = ({ setSaving }) => {
  const [profileInfo, setProfileInfo] = useState(() => _.mapValues((v) => (v === 'N/A' ? '' : v), authStore.get().profile));
  const [proxyGroup, setProxyGroup] = useState();
  const { researchArea } = profileInfo;

  const signal = useCancellation();

  // Helpers
  const assignValue = _.curry((key, value) => {
    setProfileInfo(_.set(key, value));
  });
  const line = (children) => div({ style: styles.form.line }, children);
  const checkboxLine = (children) => div({ style: styles.form.container }, children);
  const textField = (key, title, { placeholder, required } = {}) =>
    h(IdContainer, [
      (id) =>
        div({ style: styles.form.container }, [
          label({ htmlFor: id, style: styles.form.title }, [title]),
          required
            ? h(ValidatedInput, {
                inputProps: {
                  id,
                  value: profileInfo[key],
                  onChange: assignValue(key),
                  placeholder: placeholder || 'Required',
                },
                error: Utils.summarizeErrors(errors && errors[key]),
              })
            : h(TextInput, {
                id,
                value: profileInfo[key],
                onChange: assignValue(key),
                placeholder,
              }),
        ]),
    ]);
  const researchAreaCheckbox = (title) =>
    div([
      h(
        LabeledCheckbox,
        {
          checked: _.includes(title, researchArea),
          onChange: (v) => {
            const areasOfResearchList = _.isEmpty(researchArea) ? [] : _.split(',', researchArea);
            const updatedAreasOfResearchList = v ? _.concat(areasOfResearchList, [title]) : _.without([title], areasOfResearchList);
            assignValue('researchArea', _.join(',', updatedAreasOfResearchList));
          },
        },
        [span({ style: styles.form.checkboxLabel }, [title])]
      ),
    ]);
  // Lifecycle
  useOnMount(() => {
    const loadProxyGroup = async () => {
      setProxyGroup(await Ajax(signal).User.getProxyGroup(authStore.get().profile.email));
    };
    loadProxyGroup();
  });
  // Render
  const { firstName, lastName } = profileInfo;
  const required = { presence: { allowEmpty: false } };
  const errors = validate({ firstName, lastName }, { firstName: required, lastName: required });

  return h(PageBox, { role: 'main', style: { flexGrow: 1 }, variant: PageBoxVariants.light }, [
    div({ style: styles.header.line }, [
      div({ style: { position: 'relative' } }, [
        h(ProfilePicture, { size: 48 }),
        h(InfoBox, { style: { alignSelf: 'flex-end' } }, [
          'To change your profile image, visit your ',
          h(
            Link,
            {
              href: `https://myaccount.google.com?authuser=${getTerraUser().email}`,
              ...Utils.newTabLinkProps,
            },
            ['Google account page.']
          ),
        ]),
      ]),
      div({ style: styles.header.nameLine }, [`Hello again, ${firstName}`]),
    ]),
    div({ style: { display: 'flex' } }, [
      div({ style: styles.page }, [
        line([textField('firstName', 'First Name', { required: true }), textField('lastName', 'Last Name', { required: true })]),
        line([
          textField('institute', 'Organization'), // keep this key as 'institute' to be backwards compatible with existing Thurloe KVs
          textField('title', 'Title'),
          textField('department', 'Department'),
        ]),
        line([textField('programLocationCity', 'City'), textField('programLocationState', 'State'), textField('programLocationCountry', 'Country')]),
        line([
          div({ style: styles.form.container }, [
            div({ style: styles.form.title }, ['Email']),
            div({ style: { margin: '0.5rem', width: 320 } }, [profileInfo.email]),
          ]),
          textField('contactEmail', 'Contact Email for Notifications (if different)', { placeholder: profileInfo.email }),
        ]),

        line([
          div({ style: styles.form.container }, [
            div({ style: styles.form.title }, [
              span({ style: { marginRight: '0.5rem' } }, ['Proxy Group']),
              h(InfoBox, [
                'For more information about proxy groups, see the ',
                h(
                  Link,
                  {
                    href: 'https://support.terra.bio/hc/en-us/articles/360031023592',
                    ...Utils.newTabLinkProps,
                  },
                  ['user guide.']
                ),
              ]),
            ]),
            div({ style: { margin: '1rem' } }, proxyGroup || 'Loading...'),
          ]),
        ]),

        sectionTitle('What is your area of research?'),

        p('Check all that apply.'),

        div({ style: { marginBottom: '1rem', display: 'flex', justifyContent: 'normal' } }, [
          checkboxLine([
            researchAreaCheckbox('Cancer'),
            researchAreaCheckbox('Cardiovascular disease'),
            researchAreaCheckbox('Epidemiology'),
            researchAreaCheckbox('Epigenetics'),
          ]),
          checkboxLine([
            researchAreaCheckbox('Immunology'),
            researchAreaCheckbox('Infectious disease and microbiome'),
            researchAreaCheckbox('Medical and Population Genetics'),
            researchAreaCheckbox('Psychiatric disease'),
          ]),
          checkboxLine([researchAreaCheckbox('Rare Disease'), researchAreaCheckbox('Single Cell Genomics'), researchAreaCheckbox('Agricultural')]),
        ]),

        h(
          ButtonPrimary,
          {
            onClick: _.flow(
              Utils.withBusyState(setSaving),
              withErrorReporting('Error saving profile')
            )(async () => {
              await Ajax().User.profile.set(makeSetUserProfileRequest(profileInfo));
              await refreshTerraProfile();
            }),
            disabled: !!errors,
            tooltip: !!errors && 'Please fill out all required fields',
          },
          ['Save Profile']
        ),
      ]),
    ]),
  ]);
};

const Profile = ({ queryParams }) => {
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
  return h(FooterWrapper, [
    saving && spinnerOverlay,
    h(TopBar, { title: 'User Profile' }),
    div({ style: { flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { color: colors.dark(), fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', marginLeft: '1rem' } }, [
        sectionTitle('Profile'),
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
            ['personalInfo', () => h(PersonalInfoTab, { setSaving })],
            ['externalIdentities', () => h(ExternalIdentitiesTab, { queryParams })],
            ['notificationSettings', () => h(NotificationSettingsTab, { setSaving })],
            [Utils.DEFAULT, () => null]
          ),
        ]
      ),
    ]),
  ]);
};

export const navPaths = [
  {
    name: 'profile',
    path: '/profile',
    component: Profile,
    title: 'Profile',
  },
  {
    name: 'fence-callback',
    path: '/fence-callback',
    component: Profile,
    title: 'Profile',
  },
  {
    name: 'ecm-callback',
    path: '/ecm-callback',
    component: Profile,
    title: 'Profile',
  },
];
