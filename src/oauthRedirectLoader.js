import { createRoot } from 'react-dom/client';
import { h } from 'react-hyperscript-helpers';
import RedirectFromOAuth from 'src/pages/RedirectFromOAuth';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(h(RedirectFromOAuth));
