import _ from 'lodash/fp';
import { useEffect, useRef, useState } from 'react';
import { aside, div, h } from 'react-hyperscript-helpers';
import { Transition } from 'react-transition-group';
import { ButtonPrimary, ButtonSecondary, Link } from 'src/components/common';
import { Ajax } from 'src/libs/ajax';
import { getEnabledBrand } from 'src/libs/brand-utils';
import { getSessionStorage } from 'src/libs/browser-storage';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { useCancellation, useStore } from 'src/libs/react-utils';
import { authStore, azureCookieReadyStore, cookieReadyStore } from 'src/libs/state';

export const cookiesAcceptedKey = 'cookiesAccepted';

const transitionStyle = {
  entering: { opacity: 0 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 },
};

const CookieWarning = () => {
  const animTime = 0.3;
  const signal = useCancellation();
  const [showWarning, setShowWarning] = useState(false);
  const { cookiesAccepted } = useStore(authStore);
  const timeout = useRef();
  const brand = getEnabledBrand();

  const acceptCookies = (acceptedCookies) => {
    authStore.update(_.set('cookiesAccepted', acceptedCookies));
  };

  useEffect(() => {
    if (cookiesAccepted === undefined) {
      timeout.current = setTimeout(() => setShowWarning(true), 3000);
    } else {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
      setShowWarning(!cookiesAccepted);
    }
  }, [cookiesAccepted]);

  const rejectCookies = async () => {
    const cookies = document.cookie.split(';');
    acceptCookies(false);
    // TODO: call azure invalidate cookie once endpoint exists, https://broadworkbench.atlassian.net/browse/IA-3498
    await Ajax(signal)
      .Runtimes.invalidateCookie()
      .catch(() => {});
    // Expire all cookies
    _.forEach((cookie) => {
      // Find an equals sign and uses it to grab the substring of the cookie that is its name
      const eqPos = cookie.indexOf('=');
      const cookieName = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }, cookies);

    cookieReadyStore.reset();
    azureCookieReadyStore.reset();
    getSessionStorage().clear();
  };

  return h(
    Transition,
    {
      in: showWarning,
      timeout: { exit: animTime * 1000 },
      mountOnEnter: true,
      unmountOnExit: true,
    },
    [
      (transitionState) =>
        aside(
          {
            'aria-label': 'Cookie consent banner',
            style: {
              display: 'block',
              width: '100%',
              position: 'fixed',
              bottom: 0,
              zIndex: 100,
              transition: `opacity ${animTime}s ease-in`,
              ...transitionStyle[transitionState],
            },
            role: 'alert',
          },
          [
            div(
              {
                style: {
                  flex: 0,
                  height: 100,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: colors.dark(0.15),
                  borderBottom: `6px solid ${colors.primary()}`,
                },
              },
              [
                div({ style: { padding: '0.9rem 2rem', height: '100%', display: 'flex', alignItems: 'center' } }, [
                  div({ style: { overflowY: 'auto', height: '100%' } }, [
                    `${brand.name} uses cookies to enable the proper functioning and security of our website,
            and to improve your experience. By clicking Agree or continuing to use our site, you consent to the use of these functional
            cookies. If you do not wish to allow use of these cookies, you may tell us that by clicking on Reject. As a result, you will be unable
            to use our site. To find out more, read our `,
                    h(Link, { style: { textDecoration: 'underline', color: colors.accent(1.1) }, href: Nav.getLink('privacy') }, ['privacy policy']),
                    '.',
                  ]),
                ]),
                div({ style: { padding: '2rem', display: 'flex' } }, [
                  h(ButtonPrimary, { onClick: () => acceptCookies(true) }, ['Agree']),
                  h(ButtonSecondary, { style: { marginLeft: '2rem', color: colors.accent(1.1) }, onClick: rejectCookies }, ['Reject']),
                ]),
              ]
            ),
          ]
        ),
    ]
  );
};

export default CookieWarning;
