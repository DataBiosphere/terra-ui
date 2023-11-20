import 'src/libs/ajax/ajax-override-utils';
import 'src/style.css';

import _ from 'lodash/fp';
import { createRoot } from 'react-dom/client';
import { h } from 'react-hyperscript-helpers';
import RModal from 'react-modal';
import { startPollingServiceAlerts } from 'src/alerts/service-alerts-polling';
import { initializeAuth } from 'src/auth/auth';
import { initializeClientId } from 'src/auth/oidc-broker';
import { initializeSystemProperties } from 'src/auth/system-loader';
import { isAxeEnabled } from 'src/libs/config';
import { initializeTCell } from 'src/libs/tcell';
import Main from 'src/pages/Main';

const rootElement = document.getElementById('root');

RModal.defaultStyles = { overlay: {}, content: {} };

window._ = _;

initializeClientId().then(() => {
  const root = createRoot(rootElement);
  root.render(h(Main));

  // react-notifications-component sets up its Store in the componentDidMount method
  // of the ReactNotifications component. Use setTimeout to allow that to happen before
  // doing anything that may show a notification.
  setTimeout(() => {
    initializeSystemProperties();
    initializeAuth();
    initializeTCell();
    startPollingServiceAlerts();
  }, 0);

  if (isAxeEnabled()) {
    import('src/libs/axe-core');
  }
});
