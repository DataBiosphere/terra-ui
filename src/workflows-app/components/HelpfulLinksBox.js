import { div, h, h4, p } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';
import { isCovid19Method } from 'src/workflows-app/utils/method-common';

const HelpfulLinksBox = ({ method }) => {
  return div(
    { style: { backgroundColor: colors.accent(0.2), paddingTop: '0.25em', paddingBottom: '0.25em', paddingLeft: '1em', paddingRight: '1em' } },
    [
      h4('Have questions?'),
      isCovid19Method(method?.name) &&
        p([
          h(
            Link,
            { href: 'https://support.terra.bio/hc/en-us/articles/12028928980123-Covid-19-Surveillance-tutorial-guide', ...Utils.newTabLinkProps },
            ['Covid-19 Surveillance tutorial guide', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]
          ),
        ]),
      isCovid19Method(method?.name) &&
        p([
          h(Link, { href: 'https://app.terra.bio/#workspaces/azure-featured-workspaces/COVID-19-Surveillance', ...Utils.newTabLinkProps }, [
            'Covid-19 Featured Workspace',
            icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } }),
          ]),
        ]),
      p([
        h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/12029178977307-How-to-set-up-and-run-a-workflow', ...Utils.newTabLinkProps }, [
          'How to set up and run a workflow',
          icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } }),
        ]),
      ]),
    ]
  );
};

export default HelpfulLinksBox;
