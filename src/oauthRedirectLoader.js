import ReactDOM from 'react-dom';
import { h } from 'react-hyperscript-helpers';
import RedirectFromOAuth from 'src/pages/RedirectFromOAuth';

const appRoot = document.getElementById('root');

ReactDOM.render(h(RedirectFromOAuth), appRoot);
