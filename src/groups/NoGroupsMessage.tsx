import { div, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import * as Utils from 'src/libs/utils';

export const NoGroupsMessage = div({ style: { fontSize: 20, margin: '1rem 1rem 0' } }, [
  div(['Create a group to share your workspaces with others.']),
  div({ style: { marginTop: '1rem', fontSize: 16 } }, [
    h(
      Link,
      {
        ...Utils.newTabLinkProps,
        href: 'https://support.terra.bio/hc/en-us/articles/360026775691',
      },
      ['How do I use groups to manage authorization?']
    ),
  ]),
]);
