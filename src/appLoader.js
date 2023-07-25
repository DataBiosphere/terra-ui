import 'src/style.css';

import _ from 'lodash/fp';
import { createRoot } from 'react-dom/client';
import { h } from 'react-hyperscript-helpers';
import RModal from 'react-modal';
import { initializeAuth, initializeClientId } from 'src/libs/auth';
import { isAxeEnabled } from 'src/libs/config';
import { startPollingServiceAlerts } from 'src/libs/service-alerts-polling';
import { initializeTCell } from 'src/libs/tcell';
import Main from 'src/pages/Main';

const rootElement = document.getElementById('root');

RModal.defaultStyles = { overlay: {}, content: {} };
RModal.setAppElement(rootElement);
window.SATURN_VERSION = process.env.REACT_APP_VERSION;

window._ = _;

initializeClientId().then(() => {
  const root = createRoot(rootElement);
  root.render(h(Main));

  // react-notifications-component sets up its Store in the componentDidMount method
  // of the ReactNotifications component. Use setTimeout to allow that to happen before
  // doing anything that may show a notification.
  setTimeout(() => {
    initializeAuth();
    initializeTCell();
    startPollingServiceAlerts();
  }, 0);

  if (isAxeEnabled()) {
    import('src/libs/axe-core');
  }
});
