import { Spinner } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { CSSProperties, Dispatch, ReactNode, SetStateAction, useEffect, useState } from 'react';
import { div, h, i, span } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { InfoBox } from 'src/components/InfoBox';
import { WorkspaceTagSelect } from 'src/components/workspace-utils';
import { Ajax } from 'src/libs/ajax';
import { getEnabledBrand } from 'src/libs/brand-utils';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import { useLocalPref } from 'src/libs/useLocalPref';
import { withBusyState } from 'src/libs/utils';
import { InitializedWorkspaceWrapper as Workspace } from 'src/pages/workspaces/hooks/useWorkspace';
import { RightBoxSection } from 'src/pages/workspaces/workspace/Dashboard/RightBoxSection';

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
  namespace: string;
  name: string;
  workspace: Workspace;
  canEdit: boolean;
  busy: boolean;
  setBusy: Dispatch<SetStateAction<boolean>>;
}

export const WorkspaceTags = (props: WorkspaceTagsProps): ReactNode => {
  const { namespace, name, workspace, canEdit } = props;

  // State
  const [busy, setBusy] = useState<boolean>(false);
  const [tagsList, setTagsList] = useState<string[]>();

  const persistenceId = `workspaces/${namespace}/${name}/dashboard/tagsPanelOpen`;
  const [tagsPanelOpen, setTagsPanelOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useLocalPref<boolean>(
    persistenceId,
    false
  );

  const addTag = _.flow(
    withErrorReporting('Error adding tag'),
    withBusyState(setBusy)
  )(async (tag) => {
    setTagsList(await Ajax().Workspaces.workspace(namespace, name).addTag(tag));
  });

  const deleteTag = _.flow(
    withErrorReporting('Error removing tag'),
    withBusyState(setBusy)
  )(async (tag) => {
    setTagsList(await Ajax().Workspaces.workspace(namespace, name).deleteTag(tag));
  });

  const signal = useCancellation();

  // If the workspace is refreshed via wrapWorkspace, the workspace object will change, triggering this effect
  // This makes it safe to pull out of the Dashboard 'refresh',
  // since it is only called via the ref, after refreshWorkspace in wrapWorkspace
  useEffect(() => {
    const loadWsTags = withErrorReporting('Error loading workspace tags', async () => {
      setTagsList(await Ajax(signal).Workspaces.workspace(namespace, name).getTags());
    });

    if (name === workspace.workspace.name && namespace === workspace.workspace.namespace) {
      loadWsTags();
    }
  }, [workspace, namespace, name, signal]);

  // Render
  const brand = getEnabledBrand();

  return h(
    RightBoxSection,
    {
      title: 'Tags',
      info: span({}, [
        (busy || !tagsList) && tagsPanelOpen && h(Spinner, { size: 1, style: { marginLeft: '0.5rem' } }),
      ]),
      initialOpenState: tagsPanelOpen,
      onClick: () => setTagsPanelOpen(!tagsPanelOpen),
    },
    [
      div({ style: { margin: '0.5rem' } }, [
        div({ style: { marginBottom: '0.5rem', fontSize: 12 } }, [
          `${brand.name} is not intended to host personally identifiable information.`,
          h(InfoBox, { style: { marginLeft: '0.25rem' } }, [
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
          !!tagsList && _.isEmpty(tagsList) && i(['No tags yet']),
        ]),
      ]),
    ]
  );
};
