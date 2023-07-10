import _ from 'lodash/fp';
import { a, div, h } from 'react-hyperscript-helpers';
import * as Nav from 'src/libs/nav';
import { memoWithName } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { styles as gcpWorkflowStyles } from 'src/pages/workspaces/workspace/Workflows';

const styles = {
  ...gcpWorkflowStyles,
  mediumCard: {
    width: 'calc(100% - 400px)',
    height: 150,
    margin: '0 1rem 2rem 0',
    left: '400px',
  },
  shortTitle: {
    ...Style.elements.card.title,
    flex: 1,
    lineHeight: '20px',
    height: '40px',
    overflowWrap: 'break-word',
  },
  shortDescription: {
    flex: 'none',
    lineHeight: '18px',
    height: '90px',
    overflow: 'hidden',
  },
  longMethodVersion: {
    marginRight: '1rem',
    width: 90,
    ...Style.noWrapEllipsis,
  },
  longCard: {
    width: '100%',
    minWidth: 0,
    marginBottom: '1rem',
  },
  longTitle: {
    ...Style.elements.card.mediumTitle,
    ...Style.noWrapEllipsis,
    flex: '0 0 50%',
  },
  longDescription: {
    flex: 1,
    paddingRight: '1rem',
    ...Style.noWrapEllipsis,
  },
};

export const SavedWorkflows = ({ workspaceName, namespace, methodsData }) => {
  const WorkflowCard = memoWithName('WorkflowCard', ({ name, lastRun, description, source, methodId }) => {
    return div(
      {
        style: { ...styles.card, ...styles.mediumCard, cursor: 'pointer' },
      },
      [
        a({
          'aria-label': name,
          href: Nav.getLink('workspace-workflows-app-submission-config', { namespace, name: workspaceName, methodId }),
          style: styles.outerLink,
        }),
        div({ style: { paddingTop: '0.75rem', ...styles.innerContent, display: 'flex', alignItems: 'center' } }, [
          div({ style: { ...styles.longTitle, paddingRight: '1.5rem' } }, [`${name}`]),
          div({ style: { flex: 1 } }, [
            'Last run: ',
            lastRun.previously_run ? `Version ${lastRun.method_version_name} on ${Utils.makeCompleteDate(lastRun.timestamp)}` : '(Never run)',
          ]),
          div({ style: { flex: '0 0 200px' } }, ['Source: ', source]),
        ]),
        div({ style: { ...styles.innerContent, display: 'flex', alignItems: 'center' } }, [description]),
      ]
    );
  });

  const workflowCards = _.map((method) => {
    return h(WorkflowCard, {
      name: method.name,
      lastRun: method.last_run,
      description: method.description,
      source: method.source,
      methodId: method.method_id,
      key: method.name,
    });
  })(methodsData);

  return [workflowCards];
};
