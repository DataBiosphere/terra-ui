import _ from 'lodash/fp';
import { Fragment, useRef, useState } from 'react';
import { UnmountClosed as RCollapse } from 'react-collapse';
import { a, div, h, h1, img, span } from 'react-hyperscript-helpers';
import { Transition } from 'react-transition-group';
import AlertsIndicator from 'src/components/Alerts';
import { Clickable, FocusTrapper, IdContainer, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TextArea } from 'src/components/input';
import Modal from 'src/components/Modal';
import ProfilePicture from 'src/components/ProfilePicture';
import { SkipNavLink, SkipNavTarget } from 'src/components/skipNavLink';
import fcIconWhite from 'src/images/brands/firecloud/FireCloud-icon-white.svg';
import headerLeftHexes from 'src/images/header-left-hexes.svg';
import headerRightHexes from 'src/images/header-right-hexes.svg';
import { Ajax } from 'src/libs/ajax';
import { signIn, signOut } from 'src/libs/auth';
import { isBaseline, isBioDataCatalyst, isDatastage, isFirecloud, isTerra } from 'src/libs/brand-utils';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import { withErrorReporting } from 'src/libs/error';
import { FormLabel } from 'src/libs/forms';
import { topBarLogo, versionTag } from 'src/libs/logos';
import * as Nav from 'src/libs/nav';
import { useStore } from 'src/libs/react-utils';
import { authStore, contactUsActive } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

const styles = {
  topBar: {
    flex: 'none',
    height: Style.topBarHeight,
    display: 'flex',
    alignItems: 'center',
    borderBottom: `2px solid ${colors.primary(0.55)}`,
    zIndex: 2,
    boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)',
  },
  pageTitle: {
    color: isTerra() ? 'white' : colors.dark(),
    fontSize: 22,
    fontWeight: 500,
    textTransform: 'uppercase',
  },
  nav: {
    background: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      overflow: 'auto',
      cursor: 'pointer',
      zIndex: 2,
    },
    container: (state) => ({
      ...(state === 'entered' ? {} : { opacity: 0, transform: 'translate(-2rem)' }),
      transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
      paddingTop: Style.topBarHeight,
      width: 290,
      color: 'white',
      position: 'absolute',
      cursor: 'default',
      backgroundColor: colors.dark(0.8),
      height: '100%',
      boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)',
      zIndex: 2,
      display: 'flex',
      flexDirection: 'column',
    }),
    icon: {
      marginRight: 12,
      flex: 'none',
    },
    navSection: {
      flex: 'none',
      height: 70,
      padding: '0 28px',
      fontWeight: 600,
      borderTop: `1px solid ${colors.dark(0.55)}`,
      color: 'white',
    },
  },
};

const NavItem = ({ children, ...props }) => {
  return h(
    Clickable,
    _.merge(
      {
        style: { display: 'flex', alignItems: 'center', color: 'white', outlineOffset: -4 },
        hover: { backgroundColor: colors.dark(0.55) },
      },
      props
    ),
    [children]
  );
};

const NavSection = ({ children, ...props }) => {
  return div(
    {
      role: 'listitem',
    },
    [
      h(
        NavItem,
        _.merge(
          {
            style: styles.nav.navSection,
          },
          props
        ),
        [children]
      ),
    ]
  );
};

const DropDownSubItem = ({ children, ...props }) => {
  return div(
    {
      role: 'listitem',
    },
    [
      h(
        NavItem,
        _.merge(
          {
            style: { padding: '0 3rem', height: 40, fontWeight: 500 },
          },
          props
        ),
        [children]
      ),
    ]
  );
};

const DropDownSection = ({ titleIcon, title, isOpened, onClick, children }) => {
  return div(
    {
      role: 'group',
    },
    [
      h(
        NavItem,
        {
          onClick,
          'aria-expanded': isOpened,
          'aria-haspopup': 'menu',
          style: styles.nav.navSection,
        },
        [
          titleIcon && icon(titleIcon, { size: 24, style: styles.nav.icon }),
          title,
          div({ style: { flexGrow: 1 } }),
          icon(isOpened ? 'angle-up' : 'angle-down', { size: 18, style: { flex: 'none' } }),
        ]
      ),
      div(
        {
          style: { flex: 'none' },
        },
        [h(RCollapse, { isOpened }, [children])]
      ),
    ]
  );
};

const TopBar = ({ showMenu = true, title, href, children }) => {
  const [navShown, setNavShown] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openLibraryMenu, setOpenLibraryMenu] = useState(false);
  const [openSupportMenu, setOpenSupportMenu] = useState(false);
  const [openFirecloudModal, setOpenFirecloudModal] = useState(false);

  const authState = useStore(authStore);

  const showNav = () => {
    setNavShown(true);
    document.body.classList.add('overlayOpen');
    if (document.body.scrollHeight > window.innerHeight) {
      document.body.classList.add('overHeight');
    }
  };

  const hideNav = () => {
    setNavShown(false);
    setOpenUserMenu(false);
    setOpenLibraryMenu(false);
    setOpenSupportMenu(false);
    document.body.classList.remove('overlayOpen', 'overHeight');
  };

  const buildNav = (transitionState) => {
    const {
      isSignedIn,
      profile: { firstName = 'Loading...', lastName = '' },
    } = authState;

    return h(
      FocusTrapper,
      {
        onBreakout: () => setNavShown(false),
        role: 'navigation',
        'aria-label': 'Main menu',
        style: navShown ? styles.nav.background : undefined,
        onClick: hideNav,
      },
      [
        div(
          {
            style: styles.nav.container(transitionState),
            onClick: (e) => e.stopPropagation(),
          },
          [
            div(
              {
                role: 'list',
                style: { display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 },
              },
              [
                isSignedIn
                  ? h(
                      DropDownSection,
                      {
                        title: h(Fragment, [
                          h(ProfilePicture, { size: 32, style: { marginRight: 12, flex: 'none' } }),
                          div({ style: { ...Style.noWrapEllipsis } }, [`${firstName} ${lastName}`]),
                        ]),
                        onClick: () => setOpenUserMenu(!openUserMenu),
                        isOpened: openUserMenu,
                      },
                      [
                        h(
                          DropDownSubItem,
                          {
                            href: Nav.getLink('profile'),
                            onClick: hideNav,
                          },
                          ['Profile']
                        ),
                        h(
                          DropDownSubItem,
                          {
                            href: Nav.getLink('groups'),
                            onClick: hideNav,
                          },
                          ['Groups']
                        ),
                        h(
                          DropDownSubItem,
                          {
                            href: Nav.getLink('billing'),
                            onClick: hideNav,
                          },
                          ['Billing']
                        ),
                        h(
                          DropDownSubItem,
                          {
                            href: Nav.getLink('environments'),
                            onClick: hideNav,
                          },
                          ['Cloud Environments']
                        ),
                        h(
                          DropDownSubItem,
                          {
                            onClick: signOut,
                          },
                          ['Sign Out']
                        ),
                      ]
                    )
                  : div(
                      {
                        style: { flex: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 95 },
                        role: 'listitem',
                      },
                      [
                        h(
                          Clickable,
                          {
                            ...(isDatastage() || isBioDataCatalyst() ? { href: Nav.getLink('workspaces') } : { onClick: () => signIn(false) }),
                            style: {
                              backgroundColor: 'white',
                              fontSize: 18,
                              fontWeight: 500,
                              color: colors.accent(),
                              borderRadius: 5,
                              boxShadow: '0 2px 4px 0 rgba(0,0,0,.25)',
                              width: 250,
                              height: 56,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textTransform: 'uppercase',
                            },
                          },
                          ['Sign In']
                        ),
                      ]
                    ),
                h(
                  NavSection,
                  {
                    href: Nav.getLink('workspaces'),
                    onClick: hideNav,
                  },
                  [icon('view-cards', { size: 24, style: styles.nav.icon }), 'Workspaces']
                ),
                h(
                  DropDownSection,
                  {
                    titleIcon: 'library',
                    title: 'Library',
                    onClick: () => setOpenLibraryMenu(!openLibraryMenu),
                    isOpened: openLibraryMenu,
                  },
                  [
                    h(
                      DropDownSubItem,
                      {
                        href: Nav.getLink('library-datasets'),
                        onClick: hideNav,
                      },
                      ['Datasets']
                    ),
                    h(
                      DropDownSubItem,
                      {
                        href: Nav.getLink('library-showcase'),
                        onClick: hideNav,
                      },
                      ['Featured Workspaces']
                    ),
                    h(
                      DropDownSubItem,
                      {
                        href: Nav.getLink('library-code'),
                        onClick: hideNav,
                      },
                      ['Code & Workflows']
                    ),
                  ]
                ),
                h(
                  DropDownSection,
                  {
                    titleIcon: 'help',
                    title: 'Support',
                    onClick: () => setOpenSupportMenu(!openSupportMenu),
                    isOpened: openSupportMenu,
                  },
                  [
                    h(
                      DropDownSubItem,
                      {
                        href: window.Appcues ? undefined : 'https://support.terra.bio/hc/en-us/categories/360005881492',
                        onClick: () => {
                          hideNav();
                          window.Appcues?.show('-M3lNP6ncNr-42_78TOX');
                        },
                        ...Utils.newTabLinkProps,
                      },
                      ['Quickstart Guide']
                    ),
                    h(
                      DropDownSubItem,
                      {
                        href: 'https://support.terra.bio/',
                        onClick: hideNav,
                        ...Utils.newTabLinkProps,
                      },
                      ['Terra Support Home']
                    ),
                    isBaseline() &&
                      h(
                        DropDownSubItem,
                        {
                          href: 'https://support.terra.bio/hc/en-us/sections/360010495892-Baseline',
                          onClick: hideNav,
                          ...Utils.newTabLinkProps,
                        },
                        ['Baseline Documentation']
                      ),
                    h(
                      DropDownSubItem,
                      {
                        href: 'https://support.terra.bio/hc/en-us/sections/4408259082139-Tutorials',
                        onClick: hideNav,
                        ...Utils.newTabLinkProps,
                      },
                      ['Tutorials']
                    ),
                    h(
                      DropDownSubItem,
                      {
                        href: 'https://support.terra.bio/hc/en-us/sections/4408259363739',
                        onClick: hideNav,
                        ...Utils.newTabLinkProps,
                      },
                      ['Videos']
                    ),
                    h(
                      DropDownSubItem,
                      {
                        href: 'https://support.terra.bio/hc/en-us/community/topics/360000500452',
                        onClick: hideNav,
                        ...Utils.newTabLinkProps,
                      },
                      ['Request a Feature']
                    ),
                    h(
                      DropDownSubItem,
                      {
                        href: 'https://support.terra.bio/hc/en-us/community/topics',
                        onClick: hideNav,
                        ...Utils.newTabLinkProps,
                      },
                      ['Community Forum']
                    ),
                    isFirecloud() &&
                      h(
                        DropDownSubItem,
                        {
                          href: 'https://support.terra.bio/hc/en-us/articles/360022694271',
                          onClick: hideNav,
                          ...Utils.newTabLinkProps,
                        },
                        ["What's different in Terra"]
                      ),
                    h(
                      DropDownSubItem,
                      {
                        onClick: () => {
                          hideNav();
                          contactUsActive.set(true);
                        },
                      },
                      ['Contact Us']
                    ),
                    h(
                      DropDownSubItem,
                      {
                        href: 'https://support.terra.bio/hc/en-us/sections/4414878945819',
                        onClick: hideNav,
                        ...Utils.newTabLinkProps,
                      },
                      ['Release Notes']
                    ),
                    h(
                      DropDownSubItem,
                      {
                        href: 'https://support.terra.bio/hc/en-us/sections/4415104213787',
                        onClick: hideNav,
                        ...Utils.newTabLinkProps,
                      },
                      ['Service Notifications']
                    ),
                  ]
                ),
                isTerra() &&
                  h(
                    NavSection,
                    {
                      href: 'https://support.terra.bio/hc/en-us/articles/360041068771--COVID-19-workspaces-data-and-tools-in-Terra',
                      onClick: hideNav,
                      ...Utils.newTabLinkProps,
                    },
                    [icon('virus', { size: 24, style: styles.nav.icon }), 'COVID-19 Data & Tools']
                  ),
                isFirecloud() &&
                  h(
                    NavSection,
                    {
                      disabled: !isSignedIn,
                      tooltip: isSignedIn ? undefined : 'Please sign in',
                      onClick: () => {
                        hideNav();
                        setOpenFirecloudModal(true);
                      },
                    },
                    [div({ style: styles.nav.icon }, [img({ src: fcIconWhite, alt: '', style: { height: 20, width: 20 } })]), 'Use Classic FireCloud']
                  ),
                div({ style: { borderTop: `1px solid ${colors.dark(0.55)}` } }),
                div(
                  {
                    style: { flex: 'none', padding: 28, marginTop: 'auto' },
                  },
                  [
                    isBioDataCatalyst() &&
                      h(Fragment, [
                        h(
                          Link,
                          {
                            variant: 'light',
                            style: { display: 'block', textDecoration: 'underline', color: colors.light() },
                            href: Nav.getLink('privacy'),
                            onClick: hideNav,
                          },
                          ['Terra Privacy Policy']
                        ),
                        h(
                          Link,
                          {
                            variant: 'light',
                            href: Nav.getLink('terms-of-service'),
                            style: { display: 'block', textDecoration: 'underline', color: colors.light() },
                            onClick: hideNav,
                          },
                          ['Terra Terms of Service']
                        ),
                      ]),
                    div({ style: { color: 'white', fontSize: 10, fontWeight: 600, marginTop: '0.5rem' } }, [
                      'Built on: ',
                      h(
                        Clickable,
                        {
                          href: `https://github.com/DataBiosphere/terra-ui/commits/${process.env.VITE_APP_VERSION}`,
                          ...Utils.newTabLinkProps,
                          style: { textDecoration: 'underline', marginLeft: '0.25rem' },
                        },
                        [new Date(parseInt(process.env.VITE_APP_BUILD_TIMESTAMP, 10)).toLocaleString()]
                      ),
                    ]),
                  ]
                ),
              ]
            ),
          ]
        ),
      ]
    );
  };
  const mainRef = useRef();

  return div(
    {
      role: 'banner',
      style: { flex: 'none', display: 'flex', flexFlow: 'column nowrap' },
    },
    [
      h(SkipNavLink, { ref: mainRef }),
      h(
        Transition,
        {
          in: navShown,
          timeout: { exit: 200 },
          mountOnEnter: true,
          unmountOnExit: true,
        },
        [(transitionState) => buildNav(transitionState)]
      ),
      div(
        {
          style: {
            ...styles.topBar,
            // This div contains the primary fallback color for a11y which will be used to calculate color contrast when the background is manually hidden
            // A 1.47 intensity results in precisely a 4.5:1 ratio against the white text
            backgroundColor: isTerra() ? colors.primary(1.47) : colors.light(1),
          },
        },
        [
          div(
            {
              style: {
                background: isTerra() ? `0px url(${headerLeftHexes}) no-repeat, right url(${headerRightHexes}) no-repeat` : undefined,
                flex: '1 1 auto',
                display: 'flex',
                alignSelf: 'stretch',
                width: '100%',
                alignItems: 'center',
              },
            },
            [
              showMenu
                ? h(
                    Clickable,
                    {
                      style: { alignSelf: 'stretch', display: 'flex', alignItems: 'center', padding: '0 1rem', margin: '2px 1rem 0 2px' },
                      onClick: navShown ? hideNav : showNav,
                      'aria-expanded': navShown,
                    },
                    [
                      icon('bars', {
                        'aria-label': 'Toggle main menu',
                        'aria-hidden': false,
                        size: 36,
                        style: {
                          color: isTerra() ? 'white' : colors.accent(),
                          flex: 'none',
                          transform: navShown ? 'rotate(90deg)' : undefined,
                          transition: 'transform 0.1s ease-out',
                        },
                      }),
                    ]
                  )
                : div({ style: { width: 'calc(1rem + 1rem + 1rem + 2px + 36px)' } }), // padding (l+r) + margin (l+r) + icon size
              a(
                {
                  style: { ...styles.pageTitle, display: 'flex', alignItems: 'center' },
                  href: href || Nav.getLink('root'),
                },
                [
                  topBarLogo(),
                  div({}, [
                    div(
                      {
                        style: title ? { fontSize: '0.8rem', lineHeight: '19px' } : { fontSize: '1rem', fontWeight: 600 },
                      },
                      [versionTag('Beta')]
                    ),
                    title &&
                      h1(
                        {
                          style: { fontSize: '1em', fontWeight: 500, padding: 0, margin: 0 },
                        },
                        [title]
                      ),
                  ]),
                ]
              ),
              div({ style: { display: 'flex', flexGrow: 1 } }, [children]),
              h(AlertsIndicator, {
                style: {
                  margin: '0 1rem 0 0.5rem',
                  color: isTerra() ? 'white' : colors.dark(),
                },
              }),
              openFirecloudModal &&
                h(PreferFirecloudModal, {
                  onDismiss: () => setOpenFirecloudModal(false),
                  authState,
                }),
            ]
          ),
        ]
      ),
      h(SkipNavTarget, { ref: mainRef }),
    ]
  );
};

const PreferFirecloudModal = ({ onDismiss }) => {
  const [emailAgreed, setEmailAgreed] = useState(true);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    profile: { email, firstName, lastName },
  } = useStore(authStore);
  const currUrl = window.location.href;

  const returnToLegacyFC = _.flow(
    withErrorReporting('Error opting out of Terra'),
    Utils.withBusyState(setSubmitting)
  )(async () => {
    await Ajax().User.profile.preferLegacyFirecloud();
    if (emailAgreed === true || reason.length !== 0) {
      await Ajax().User.createSupportRequest({
        name: `${firstName} ${lastName}`,
        email,
        description: reason,
        subject: 'Opt out of Terra',
        type: 'survey',
        attachmentToken: '',
        emailAgreed,
        currUrl,
      });
    }
    onDismiss();
    window.location.assign(getConfig().firecloudUrlRoot);
  });

  return h(
    Modal,
    {
      onDismiss,
      title: 'Return to classic FireCloud',
      okButton: returnToLegacyFC,
    },
    [
      'Are you sure you would prefer the previous FireCloud interface?',
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            h(FormLabel, { htmlFor: id }, ['Please tell us why']),
            h(TextArea, {
              id,
              style: { height: 100, marginBottom: '0.5rem' },
              placeholder: 'Enter your reason',
              value: reason,
              onChange: setReason,
            }),
          ]),
      ]),
      h(
        LabeledCheckbox,
        {
          checked: emailAgreed,
          onChange: setEmailAgreed,
        },
        [span({ style: { marginLeft: '0.5rem' } }, ['You can follow up with me by email.'])]
      ),
      submitting && spinnerOverlay,
    ]
  );
};

export default TopBar;
