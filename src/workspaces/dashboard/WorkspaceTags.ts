import { InfoBox, Link, Spinner } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { CSSProperties, ReactNode, useState } from 'react';
import { div, h, i, span } from 'react-hyperscript-helpers';
import { icon } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import { getEnabledBrand } from 'src/libs/brand-utils';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import * as Style from 'src/libs/style';
import { withBusyState } from 'src/libs/utils';
import { InitializedWorkspaceWrapper as Workspace } from 'src/workspaces/common/state/useWorkspace';
import { WorkspaceTagSelect } from 'src/workspaces/common/WorkspaceTagSelect';
import { RightBoxSection } from 'src/workspaces/dashboard/RightBoxSection';

const styles: Record<string, CSSProperties> = {
  authDomain: {
    padding: '0.5rem 0.25rem',
    marginBottom: '0.25rem',
    backgroundColor: colors.dark(0.15),
    ...Style.noWrapEllipsis,
  },
  tag: {
    padding: '0.25rem',
    margin: '0.15rem',
    backgroundColor: colors.dark(0.15),
    borderRadius: 10,
    overflow: 'hidden',
    wordWrap: 'break-word',
  },
};

interface WorkspaceTagsProps {
  workspace: Workspace;
  canEdit: boolean;
}

export const WorkspaceTags = (props: WorkspaceTagsProps): ReactNode => {
  const { workspace, canEdit } = props;
  const { namespace, name } = workspace.workspace;

  const initialTags: string[] = getWorkspaceTags(workspace) ?? [];

  const [busy, setBusy] = useState<boolean>(false);
  const [tagsList, setTagsList] = useState<string[]>(initialTags);

  const persistenceId = `workspaces/${namespace}/${name}/dashboard/tagsPanelOpen`;

  const addTag = _.flow(
    withErrorReporting('Error adding tag'),
    withBusyState(setBusy)
  )(async (tag) => {
    setTagsList(await Ajax().Workspaces.workspace(namespace, name).addTag(tag));
    Ajax().Metrics.captureEvent(Events.workspaceDashboardAddTag, {
      tag,
      ...extractWorkspaceDetails(workspace),
    });
  });

  const deleteTag = _.flow(
    withErrorReporting('Error removing tag'),
    withBusyState(setBusy)
  )(async (tag) => {
    setTagsList(await Ajax().Workspaces.workspace(namespace, name).deleteTag(tag));
    Ajax().Metrics.captureEvent(Events.workspaceDashboardDeleteTag, {
      tag,
      ...extractWorkspaceDetails(workspace),
    });
  });

  const brand = getEnabledBrand();

  return h(
    RightBoxSection,
    {
      title: 'Tags',
      info: span({}, [busy && h(Spinner, { size: 1, style: { marginLeft: '0.5rem' } })]),
      persistenceId,
      workspace,
    },
    [
      div({ style: { margin: '0.5rem' } }, [
        div({ style: { marginBottom: '0.5rem', fontSize: 12 } }, [
          `${brand.name} is not intended to host personally identifiable information.`,
          h(InfoBox, { style: { marginLeft: '1ch' } }, [
            `${brand.name} is not intended to host personally identifiable information. Do not use any patient identifier including name,
              social security number, or medical record number.`,
          ]),
        ]),
        canEdit &&
          div({ style: { marginBottom: '0.5rem' } }, [
            h(WorkspaceTagSelect, {
              menuShouldScrollIntoView: false,
              value: null,
              placeholder: 'Add a tag',
              'aria-label': 'Add a tag',
              onChange: ({ value }) => addTag(value),
            }),
          ]),
        div({ style: { display: 'flex', flexWrap: 'wrap', minHeight: '1.5rem' } }, [
          _.map((tag) => {
            return span({ key: tag, style: styles.tag }, [
              tag,
              canEdit &&
                h(
                  Link,
                  {
                    tooltip: 'Remove tag',
                    disabled: busy,
                    onClick: () => deleteTag(tag),
                    style: { marginLeft: '0.25rem', verticalAlign: 'middle', display: 'inline-block' },
                  },
                  [icon('times', { size: 14 })]
                ),
            ]);
          }, tagsList),
          _.isEmpty(tagsList) && i(['No tags yet']),
        ]),
      ]),
    ]
  );
};

const getWorkspaceTags = (workspace: Workspace): string[] | undefined => {
  const attributes = workspace.workspace.attributes ?? {};
  const tagsObj = attributes['tag:tags'];
  return _.get('items', tagsObj);
};
