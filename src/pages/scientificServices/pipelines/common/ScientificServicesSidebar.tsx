import { FocusTrap, Icon } from '@terra-ui-packages/components';
import React, { PropsWithChildren, ReactNode, useRef, useState } from 'react';
import { Transition } from 'react-transition-group';
import { AlertsIndicator } from 'src/alerts/Alerts';
import { BlockerAlerts } from 'src/alerts/BlockerAlerts';
import { RequiredUpdateAlert } from 'src/alerts/RequiredUpdateAlert';
import { signIn } from 'src/auth/auth';
import { signOut } from 'src/auth/signout/sign-out';
import { Clickable } from 'src/components/common';
import { SkipNavLink, SkipNavTarget } from 'src/components/skipNavLink';
import {
  DropDownSection,
  DropDownSubItem,
  navBackgroundStyles,
  navContainerStyles,
  navIconStyles,
  NavSection,
  pageTitleStyles,
  topBarStyle,
} from 'src/components/top-bar-common';
import colors from 'src/libs/colors';
import { topBarLogo } from 'src/libs/logos';
import * as Nav from 'src/libs/nav';
import { useStore } from 'src/libs/react-utils';
import { authStore, userStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';

interface SidebarProps extends PropsWithChildren {
  title: string;
  showMenu?: boolean;
  href?: string;
}

export const ScientificServicesSidebar = (props: SidebarProps): ReactNode => {
  const { showMenu = true, title, href, children } = props;
  const [navShown, setNavShown] = useState(false);
  const [openAccountMenu, setOpenAccountMenu] = useState(true);
  const [openJobMenu, setOpenJobMenu] = useState(true);

  const authState = useStore(authStore);
  const userState = useStore(userStore);

  const showNav = () => {
    setNavShown(true);
    document.body.classList.add('overlayOpen');
    if (document.body.scrollHeight > window.innerHeight) {
      document.body.classList.add('overHeight');
    }
  };

  const hideNav = () => {
    setNavShown(false);
    document.body.classList.remove('overlayOpen', 'overHeight');
  };

  const buildNav = (transitionState: string) => {
    const { signInStatus } = authState;
    const {
      profile: { firstName = 'Loading...', lastName = '' },
    } = userState;

    return (
      <FocusTrap
        onEscape={() => setNavShown(false)}
        role='navigation'
        aria-label='Main menu'
        style={navShown ? navBackgroundStyles : undefined}
        onClick={hideNav}
      >
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions  */}
        <div style={navContainerStyles(transitionState)} onClick={(e) => e.stopPropagation()}>
          <div role='list' style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
            {signInStatus === 'userLoaded' || signInStatus === 'authenticated' ? (
              <>
                <NavSection {...Utils.newTabLinkProps}>
                  {firstName} {lastName}
                </NavSection>
                <DropDownSection
                  titleIcon='tasks'
                  title='Jobs'
                  onClick={() => setOpenJobMenu(!openJobMenu)}
                  isOpened={openJobMenu}
                >
                  <DropDownSubItem href={Nav.getLink('pipelines-run')} onClick={hideNav}>
                    Run Job
                  </DropDownSubItem>
                  <DropDownSubItem href={Nav.getLink('pipelines-history')} onClick={hideNav}>
                    Job History
                  </DropDownSubItem>
                  <DropDownSubItem href={Nav.getLink('pipelines-about')} onClick={hideNav}>
                    About
                  </DropDownSubItem>
                </DropDownSection>
                <DropDownSection
                  titleIcon='users'
                  title='Account'
                  onClick={() => setOpenAccountMenu(!openAccountMenu)}
                  isOpened={openAccountMenu}
                >
                  <DropDownSubItem href={Nav.getLink('pipelines-profile')} onClick={hideNav}>
                    Profile
                  </DropDownSubItem>
                  <DropDownSubItem href={Nav.getLink('pipelines-quotas')} onClick={hideNav}>
                    Quotas
                  </DropDownSubItem>
                </DropDownSection>
              </>
            ) : (
              <div
                style={{
                  flex: 'none',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 95,
                }}
                role='listitem'
              >
                <Clickable
                  onClick={() => signIn(false)}
                  style={{
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
                    textTransform: 'capitalize',
                  }}
                >
                  Sign In
                </Clickable>
              </div>
            )}
            <NavSection
              href='https://broadscientificservices.zendesk.com/hc/en-us/categories/39899029682331'
              onClick={hideNav}
              {...Utils.newTabLinkProps}
            >
              <Icon icon='newspaper' size={24} style={navIconStyles} />
              Service News
            </NavSection>
            <NavSection
              href='https://broadscientificservices.zendesk.com/hc/en-us'
              onClick={hideNav}
              {...Utils.newTabLinkProps}
            >
              <Icon icon='help' size={24} style={navIconStyles} />
              Documentation
            </NavSection>
            {(signInStatus === 'userLoaded' || signInStatus === 'authenticated') && (
              <NavSection onClick={() => signOut('requested')}>
                <Icon icon='ban' size={24} style={navIconStyles} />
                Sign Out
              </NavSection>
            )}
          </div>
        </div>
      </FocusTrap>
    );
  };

  const mainRef = useRef();

  return (
    <div role='banner' style={{ flex: 'none', display: 'flex', flexFlow: 'column nowrap' }}>
      <SkipNavLink ref={mainRef} />
      <Transition in={navShown} timeout={{ exit: 200 }} mountOnEnter unmountOnExit>
        {(transitionState) => buildNav(transitionState)}
      </Transition>
      <div
        style={{
          ...topBarStyle,
          backgroundColor: colors.light(1),
        }}
      >
        <div
          style={{
            backgroundRepeat: 'no-repeat',
            flex: '1 1 auto',
            display: 'flex',
            alignSelf: 'stretch',
            width: '100%',
            alignItems: 'center',
          }}
        >
          {
            showMenu ? (
              <Clickable
                style={{
                  alignSelf: 'stretch',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 1rem',
                  margin: '2px 1rem 0 2px',
                }}
                onClick={navShown ? hideNav : showNav}
                aria-expanded={navShown}
                aria-label='Toggle main menu'
              >
                <Icon
                  icon='bars'
                  size={36}
                  style={{
                    color: 'white',
                    flex: 'none',
                    transform: navShown ? 'rotate(90deg)' : undefined,
                    transition: 'transform 0.1s ease-out',
                  }}
                />
              </Clickable>
            ) : (
              <div style={{ width: 'calc(1rem + 1rem + 1rem + 2px + 36px)' }} />
            ) // padding (l+r) + margin (l+r) + icon size
          }
          <a style={{ ...pageTitleStyles, display: 'flex', alignItems: 'center' }} href={href || Nav.getLink('root')}>
            {topBarLogo()}
            <div>{title && <h1 style={{ fontSize: '1em', fontWeight: 500, padding: 0, margin: 0 }}>{title}</h1>}</div>
          </a>
          <div style={{ display: 'flex', flexGrow: 1 }}>{children}</div>
          <AlertsIndicator
            style={{
              margin: '0 1rem 0 0.5rem',
              color: colors.dark(),
            }}
          />
        </div>
      </div>
      <RequiredUpdateAlert />
      <BlockerAlerts />
      <SkipNavTarget ref={mainRef} />
    </div>
  );
};
