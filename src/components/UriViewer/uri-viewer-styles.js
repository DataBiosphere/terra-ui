import { div } from 'react-hyperscript-helpers';

const els = {
  cell: (children) => div({ style: { marginBottom: '0.5rem' } }, children),
  label: (text) => div({ style: { fontWeight: 500 } }, text),
  data: (children) => div({ style: { marginLeft: '2rem', marginTop: '0.5rem' } }, children),
};

export default els;
